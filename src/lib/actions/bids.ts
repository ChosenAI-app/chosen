"use server"

import { createClient } from "@/lib/supabase/server"
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

  // Check for duplicate bid
  const { data: existing } = await supabase
    .from("bids")
    .select("id")
    .eq("homeowner_project_id", projectId)
    .eq("bidder_id", user.id)
    .maybeSingle()

  if (existing) return { error: "You have already submitted a bid on this project" }

  // Verify project is on marketplace
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

  const { data: bid } = await supabase
    .from("bids")
    .select("id, homeowner_project_id")
    .eq("id", bidId)
    .maybeSingle()

  if (!bid) return { error: "Bid not found" }

  // Verify ownership
  const { data: project } = await supabase
    .from("homeowner_projects")
    .select("homeowner_id")
    .eq("id", bid.homeowner_project_id)
    .maybeSingle()

  if (!project || project.homeowner_id !== user.id) {
    return { error: "Not authorized" }
  }

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

  // Update project status
  await supabase
    .from("homeowner_projects")
    .update({ status: "contractor_selected" })
    .eq("id", bid.homeowner_project_id)

  revalidatePath("/homeowner/projects/[id]/bids", "page")
  revalidatePath(`/marketplace/${bid.homeowner_project_id}`)
  return { error: null }
}
