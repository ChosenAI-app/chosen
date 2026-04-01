"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function submitBid(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Block homeowners from bidding
  const { data: bidderProfile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle()

  if (!bidderProfile?.user_type || bidderProfile.user_type === "homeowner") {
    return {
      error:
        "Homeowners cannot submit bids. Post your project to receive bids from contractors.",
    }
  }

  const projectId = formData.get("projectId") as string
  const bidderRole = formData.get("bidder_role") as string
  const quoteAmount = parseInt(formData.get("quote_amount") as string)
  const timelineWeeks = parseInt(formData.get("timeline_weeks") as string)
  const coverLetter = formData.get("cover_letter") as string

  if (!projectId || !bidderRole || !quoteAmount) {
    return { error: "Missing required fields" }
  }

  const { data: existing } = await supabase
    .from("bids")
    .select("id")
    .eq("homeowner_project_id", projectId)
    .eq("bidder_id", user.id)
    .maybeSingle()

  if (existing)
    return { error: "You have already submitted a bid on this project" }

  const { data: project } = await supabase
    .from("homeowner_projects")
    .select("id, status, homeowner_id")
    .eq("id", projectId)
    .eq("status", "posted_to_marketplace")
    .maybeSingle()

  if (!project) return { error: "Project not found or not accepting bids" }
  if (project.homeowner_id === user.id)
    return { error: "You cannot bid on your own project" }

  const { error } = await supabase.from("bids").insert({
    homeowner_project_id: projectId,
    bidder_id: user.id,
    bidder_role: bidderRole,
    quote_amount: quoteAmount,
    timeline_weeks: isNaN(timelineWeeks) ? null : timelineWeeks,
    cover_letter: coverLetter || null,
    status: "pending",
  })

  if (error) return { error: error.message }

  revalidatePath(`/marketplace/${projectId}`)
  revalidatePath("/homeowner/projects/[id]/bids", "page")
  return { error: null }
}

export async function acceptBid(
  bidId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Get the bid + homeowner project
  const { data: bid } = await supabase
    .from("bids")
    .select("*")
    .eq("id", bidId)
    .maybeSingle()

  if (!bid) return { error: "Bid not found" }

  const { data: homeownerProject } = await supabase
    .from("homeowner_projects")
    .select("*")
    .eq("id", bid.homeowner_project_id)
    .maybeSingle()

  if (!homeownerProject) return { error: "Project not found" }
  if (homeownerProject.homeowner_id !== user.id)
    return { error: "Not authorized" }

  // Reject all other bids
  await supabase
    .from("bids")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("homeowner_project_id", bid.homeowner_project_id)
    .neq("id", bidId)

  // Accept this bid
  await supabase
    .from("bids")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", bidId)

  // Find jurisdiction
  const { data: jurisdiction } = await supabase
    .from("jurisdictions")
    .select("id")
    .eq("city", "Palo Alto")
    .maybeSingle()

  // Map project type
  const typeMap: Record<string, string> = {
    adu_detached: "adu_detached",
    adu_attached: "adu_attached",
    jadu: "adu_attached",
    addition: "addition",
    remodel: "remodel",
    new_construction: "remodel",
    conversion: "remodel",
  }
  const contractorType =
    typeMap[homeownerProject.project_type] ?? "remodel"

  // Create contractor project
  const admin = createAdminClient()
  const { data: newProject, error: projectError } = await admin
    .from("projects")
    .insert({
      user_id: bid.bidder_id,
      address: homeownerProject.address,
      city: "Palo Alto",
      zip_code: homeownerProject.zip_code,
      project_type: contractorType,
      scope_description: homeownerProject.ai_scope_summary,
      jurisdiction_id: jurisdiction?.id ?? homeownerProject.jurisdiction_id,
      lot_size_sqft: homeownerProject.lot_size_sqft,
      year_built: homeownerProject.year_built,
      zoning: homeownerProject.zoning,
      zoning_description: homeownerProject.zoning_description,
      map_lat: homeownerProject.map_lat,
      map_lng: homeownerProject.map_lng,
      apn: homeownerProject.regrid_parcel_id,
    })
    .select()
    .single()

  if (projectError || !newProject) {
    return {
      error:
        "Failed to create contractor project: " + projectError?.message,
    }
  }

  // Generate permit rows
  if (jurisdiction?.id) {
    const { data: permitTypes } = await admin
      .from("permit_types")
      .select("id")
      .eq("jurisdiction_id", jurisdiction.id)
      .contains("required_for", [contractorType])

    if (permitTypes && permitTypes.length > 0) {
      await admin.from("project_permits").insert(
        permitTypes.map((pt) => ({
          project_id: newProject.id,
          permit_type_id: pt.id,
          status: "not_started",
        }))
      )
    }
  }

  // Add homeowner as client team member (auto-accepted)
  await admin.from("team_members").insert({
    project_id: newProject.id,
    user_id: user.id,
    role: "client",
    invited_email: user.email ?? "",
    invite_status: "accepted",
  })

  // Link homeowner project to contractor project
  await supabase
    .from("homeowner_projects")
    .update({
      status: "contractor_selected",
      contractor_project_id: newProject.id,
    })
    .eq("id", bid.homeowner_project_id)

  // Send email to winning contractor
  try {
    const { data: userList } = await admin.auth.admin.listUsers()
    const contractor = userList.users.find((u) => u.id === bid.bidder_id)

    if (contractor?.email) {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const addr = homeownerProject.address?.replace(/, USA$/, "") ?? "a project"
      await resend.emails.send({
        from: "Chosen <notifications@chosenai.com>",
        to: contractor.email,
        subject: `Your bid was accepted — ${addr}`,
        text: `Your bid on the ${homeownerProject.project_type?.replace(/_/g, " ")} project at ${addr} was accepted.\n\nView and manage the project:\nhttps://chosenai.com/projects/${newProject.id}\n\n— The Chosen Team`,
      })
    }
  } catch (emailErr) {
    console.error("[acceptBid] email failed:", emailErr)
  }

  revalidatePath("/homeowner/projects/[id]/bids", "page")
  revalidatePath(`/marketplace/${bid.homeowner_project_id}`)
  revalidatePath("/dashboard")
  return { error: null }
}
