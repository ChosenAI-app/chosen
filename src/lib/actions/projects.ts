"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { normalizeZip } from "@/lib/utils/jurisdiction"
import { isWestOf280 } from "@/lib/utils/geo"

const VALID_PROJECT_TYPES = [
  "adu_detached",
  "adu_attached",
  "addition",
  "remodel",
] as const

export async function createProject(
  formData: FormData
): Promise<{ error: string | null }> {
  const address = (formData.get("address") as string | null)?.trim()
  const rawZip = formData.get("zip_code") as string | null
  const projectType = formData.get("project_type") as string | null
  const scopeDescription =
    (formData.get("scope_description") as string | null)?.trim() || null

  const formLat = formData.get("lat") as string | null
  const formLng = formData.get("lng") as string | null

  const fireSprinklersExist = formData.get("fireSprinklersExist") === "yes"
  const hasEarthwork = formData.get("hasEarthwork") === "yes"

  if (!address) {
    return { error: "Street address is required." }
  }

  const normalizedZip = rawZip ? normalizeZip(rawZip) : ""

  if (
    !projectType ||
    !VALID_PROJECT_TYPES.includes(
      projectType as (typeof VALID_PROJECT_TYPES)[number]
    )
  ) {
    return { error: "Please select a valid project type." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a project." }
  }

  // Look up jurisdiction
  let jurisdictionId: string | null = null
  if (normalizedZip) {
    const { data: jurisdiction } = await supabase
      .from("jurisdictions")
      .select("id")
      .contains("zip_codes", [normalizedZip])
      .maybeSingle()
    jurisdictionId = jurisdiction?.id ?? null
  }

  if (!jurisdictionId) {
    // Try default Palo Alto jurisdiction
    const { data: paJurisdiction } = await supabase
      .from("jurisdictions")
      .select("id")
      .eq("city", "Palo Alto")
      .maybeSingle()
    jurisdictionId = paJurisdiction?.id ?? null
  }

  if (!jurisdictionId) {
    return { error: "Could not find jurisdiction." }
  }

  // Auto-detect west of 280
  const lat = formLat ? parseFloat(formLat) : null
  const lng = formLng ? parseFloat(formLng) : null
  const fireWestOf280 =
    lat && lng && !isNaN(lat) && !isNaN(lng)
      ? isWestOf280(lat, lng)
      : false

  // Insert project
  let projectId: string

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        address: address.replace(/, USA$/, ""),
        city: "Palo Alto",
        zip_code: normalizedZip || "94301",
        project_type: projectType,
        scope_description: scopeDescription,
        jurisdiction_id: jurisdictionId,
      })
      .select("id")
      .single()

    if (projectError || !project) {
      return { error: projectError?.message ?? "Failed to create project." }
    }

    projectId = project.id
  } catch {
    return { error: "Failed to create project." }
  }

  // Generate permit workflow
  try {
    const { data: permitTypes } = await supabase
      .from("permit_types")
      .select("id, name")
      .eq("jurisdiction_id", jurisdictionId)
      .contains("required_for", [projectType])
      .order("display_order", { ascending: true })

    const filteredPermitTypes = (permitTypes ?? []).filter((pt) => {
      if (pt.name === "Palo Alto Fire Department Review") {
        return fireWestOf280 || fireSprinklersExist
      }
      if (pt.name === "Grading and Drainage Plan") {
        return hasEarthwork
      }
      return true
    })

    if (filteredPermitTypes.length > 0) {
      await supabase.from("project_permits").insert(
        filteredPermitTypes.map((pt) => ({
          project_id: projectId,
          permit_type_id: pt.id,
          status: "not_started" as const,
        }))
      )
    }
  } catch {
    return { error: "Failed to generate permits." }
  }

  redirect("/projects/" + projectId)
}
