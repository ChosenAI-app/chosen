"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { normalizeZip } from "@/lib/utils/jurisdiction"
import { isWestOf280 } from "@/lib/utils/geo"
import { fetchATTOMParcelData } from "@/lib/utils/attom"
import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { buildContractorScopeSystem } from "@/lib/ai/project-scope"

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

  // Coordinates from Places
  const mapLat = formLat ? parseFloat(formLat) : null
  const mapLng = formLng ? parseFloat(formLng) : null

  // Auto-detect west of 280
  const fireWestOf280 =
    mapLat && mapLng && !isNaN(mapLat) && !isNaN(mapLng)
      ? isWestOf280(mapLat, mapLng)
      : false

  // ATTOM parcel lookup
  let lotSizeSqft: number | null = null
  let yearBuilt: number | null = null
  let zoning: string | null = null
  let zoningDescription: string | null = null
  let apn: string | null = null

  const parcelData = await fetchATTOMParcelData(address)
  if (parcelData) {
    lotSizeSqft = parcelData.lotSizeSqft
    yearBuilt = parcelData.yearBuilt
    zoning = parcelData.zoning
    zoningDescription = parcelData.zoningDescription
    apn = parcelData.apn
  }

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
        lot_size_sqft: lotSizeSqft,
        year_built: yearBuilt,
        zoning,
        zoning_description: zoningDescription,
        map_lat: mapLat,
        map_lng: mapLng,
        apn,
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

  // Fire-and-forget AI scope generation
  generateContractorScope(projectId).catch(console.error)

  redirect(`/projects/${projectId}/explore`)
}

async function generateContractorScope(projectId: string): Promise<void> {
  try {
    if (!process.env.ANTHROPIC_API_KEY)
      throw new Error("ANTHROPIC_API_KEY not set")

    const supabase = await createClient()
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error || !project) {
      console.error("[generateContractorScope] Project not found:", error)
      return
    }

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: z.object({
        scope_summary: z.string(),
        permit_checklist: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            required: z.boolean(),
          })
        ),
        cost_estimate_low: z.number(),
        cost_estimate_high: z.number(),
        timeline_weeks_low: z.number(),
        timeline_weeks_high: z.number(),
        feasibility_notes: z.string(),
        key_risks: z.string(),
        recommended_team: z.string(),
      }),
      system: buildContractorScopeSystem(),
      prompt: `Project at ${project.address}. Type: ${project.project_type}. Lot: ${project.lot_size_sqft ?? "unknown"} SF. Zoning: ${project.zoning ?? "unknown"}. Year built: ${project.year_built ?? "unknown"}.`,
    })

    // Preserve the user's original description
    const originalDescription = (() => {
      try {
        const p = JSON.parse(project.scope_description ?? "{}")
        return p.original_description ?? project.scope_description
      } catch {
        return project.scope_description
      }
    })()

    await supabase
      .from("projects")
      .update({
        scope_description: JSON.stringify({
          ai_scope: object,
          original_description: originalDescription,
        }),
      })
      .eq("id", projectId)

    console.log("[generateContractorScope] Done for project:", projectId)
  } catch (err) {
    console.error("[generateContractorScope] Error:", err)
  }
}
