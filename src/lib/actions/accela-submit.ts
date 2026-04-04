"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import {
  createPartialRecord,
  updateCustomForms,
  uploadDocuments,
  finalizeRecord,
  type AccelaProjectData,
} from "@/lib/accela/client"
import { generatePermitPDFPackage } from "@/lib/accela/pdf-generator"

const CERT_TEXT = "I certify that I have read and understand the instructions that accompany this application and that the statements made as part of this application are true, complete, and correct and that no material information has been omitted. By checking the box below, I understand and agree that I am electronically signing and filing this application."

export async function submitToAccela(
  projectId: string,
  certificationConfirmed: boolean
): Promise<{
  error: string | null
  submissionId?: string
  permitNumber?: string
}> {
  if (!certificationConfirmed) {
    return { error: "You must certify the application before submitting." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: project } = await supabase
    .from("homeowner_projects")
    .select("*")
    .eq("id", projectId)
    .eq("homeowner_id", user.id)
    .maybeSingle()

  if (!project) return { error: "Project not found" }

  // Fetch homeowner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle()

  const nameParts = (profile?.full_name ?? "Unknown").split(" ")
  const firstName = nameParts[0] ?? "Unknown"
  const lastName = nameParts.slice(1).join(" ") || "Unknown"

  // Build description from AI scope
  let description = `Construction project at ${project.address?.replace(/, USA$/, "")}.`
  if (project.ai_scope_summary) {
    description = project.ai_scope_summary
  }

  // Estimate valuation from AI cost estimates
  let valuation = 200000
  if (project.ai_cost_estimate_low && project.ai_cost_estimate_high) {
    valuation = Math.round(
      (project.ai_cost_estimate_low + project.ai_cost_estimate_high) / 2
    )
  }

  // Create submission record
  const admin = createAdminClient()
  const { data: submission, error: submissionError } = await admin
    .from("accela_submissions")
    .insert({
      homeowner_project_id: projectId,
      status: "pending",
      certified_by_user_id: user.id,
      certified_at: new Date().toISOString(),
      certification_text: CERT_TEXT,
    })
    .select()
    .single()

  if (submissionError || !submission) {
    return { error: "Failed to create submission record" }
  }

  // ============================================================
  // SANDBOX MODE — when Accela credentials are not configured
  // ============================================================
  if (!process.env.ACCELA_APP_ID || !process.env.ACCELA_APP_SECRET) {
    console.log("[Accela Submit] No credentials — running in sandbox mode")
    const sandboxPermit = `SANDBOX-${Date.now()}`

    await admin
      .from("accela_submissions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        accela_custom_id: sandboxPermit,
        accela_record_id: `sandbox-${Date.now()}`,
      })
      .eq("id", submission.id)

    await supabase
      .from("homeowner_projects")
      .update({
        accela_submission_id: submission.id,
        accela_record_number: sandboxPermit,
      })
      .eq("id", projectId)

    revalidatePath(`/homeowner/projects/${projectId}`)
    return {
      error: null,
      submissionId: submission.id,
      permitNumber: sandboxPermit,
    }
  }

  // ============================================================
  // REAL ACCELA SUBMISSION
  // ============================================================
  const accelaData: AccelaProjectData = {
    projectType: project.project_type,
    address: project.address,
    zipCode: project.zip_code ?? "94301",
    description,
    estimatedValuation: valuation,
    aduSqft: project.adu_sqft,
    lotSizeSqft: project.lot_size_sqft,
    yearBuilt: project.year_built,
    apn: project.regrid_parcel_id,
    separatelyMetered: project.separately_metered ?? false,
    fireWestOf280: project.fire_west_of_280 ?? false,
    hasSprinklers: project.fire_sprinklers_exist ?? false,
    hasEarthwork: project.has_earthwork ?? false,
    ownerFirstName: firstName,
    ownerLastName: lastName,
    ownerEmail: user.email!,
    ownerPhone: profile?.phone ?? null,
    ownerAddressLine1: project.address.split(",")[0],
    ownerCity: "Palo Alto",
    ownerState: "CA",
    ownerZip: project.zip_code ?? "94301",
  }

  try {
    // Step 1: Create partial record
    console.log("[Accela Submit] Step 1: Creating partial record...")
    const { recordId, customId, trackingId } =
      await createPartialRecord(accelaData)

    await admin
      .from("accela_submissions")
      .update({
        status: "draft_created",
        accela_record_id: recordId,
        accela_custom_id: customId,
        accela_tracking_id: trackingId,
      })
      .eq("id", submission.id)

    // Step 2: Update custom forms
    console.log("[Accela Submit] Step 2: Updating custom forms...")
    await updateCustomForms(recordId, accelaData)
    await admin
      .from("accela_submissions")
      .update({ status: "forms_filled" })
      .eq("id", submission.id)

    // Step 3: Generate and upload PDF
    console.log("[Accela Submit] Step 3: Generating PDF...")
    const pdfBuffer = await generatePermitPDFPackage(
      [
        {
          formName: "Building Permit Application",
          fields: {
            address: project.address,
            project_type: project.project_type,
            lot_size: project.lot_size_sqft
              ? `${project.lot_size_sqft} SF`
              : "",
            year_built: project.year_built ? String(project.year_built) : "",
            estimated_cost: `$${valuation.toLocaleString()}`,
            owner_name: profile?.full_name ?? "",
          },
        },
      ],
      project.address.replace(/, USA$/, ""),
      profile?.full_name ?? user.email!
    )

    const fileName = `C1_${project.address.split(",")[0].replace(/\s+/g, "")}_APPLY.pdf`
    await uploadDocuments(recordId, pdfBuffer, fileName)
    await admin
      .from("accela_submissions")
      .update({ status: "documents_uploaded" })
      .eq("id", submission.id)

    // Step 4: Finalize
    console.log("[Accela Submit] Step 4: Finalizing...")
    const { customId: finalCustomId } = await finalizeRecord(recordId)

    await admin
      .from("accela_submissions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        accela_custom_id: finalCustomId || customId,
      })
      .eq("id", submission.id)

    await supabase
      .from("homeowner_projects")
      .update({
        accela_submission_id: submission.id,
        accela_record_number: finalCustomId || customId,
      })
      .eq("id", projectId)

    revalidatePath(`/homeowner/projects/${projectId}`)
    return {
      error: null,
      submissionId: submission.id,
      permitNumber: finalCustomId || customId,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("[Accela Submit] Detailed error:", err)
    console.error("[Accela Submit] Stack:", err instanceof Error ? err.stack : "no stack")

    await admin
      .from("accela_submissions")
      .update({
        status: "error",
        last_error: errorMsg,
        retry_count: (submission.retry_count ?? 0) + 1,
      })
      .eq("id", submission.id)

    return { error: `Submission failed: ${errorMsg}` }
  }
}
