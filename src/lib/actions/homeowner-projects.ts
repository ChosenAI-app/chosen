"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { normalizeZip } from "@/lib/utils/jurisdiction"
import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { PALO_ALTO_SCOPE_SYSTEM_PROMPT } from "@/lib/ai/project-scope"

const VALID_PROJECT_TYPES = [
  "adu_detached",
  "adu_attached",
  "jadu",
  "addition",
  "remodel",
  "new_construction",
  "conversion",
] as const

// Santa Clara County public ArcGIS parcel API — free, no key required
async function fetchSCCParcelData(lat: number, lng: number) {
  try {
    const params = new URLSearchParams({
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: "true",
      f: "json",
    })

    const url = `https://gis.sccgov.org/arcgis/rest/services/Planning/Parcels/MapServer/0/query?${params}`
    console.log("[SCC ArcGIS] Querying parcel at:", lat, lng)

    const res = await fetch(url, {
      headers: { "User-Agent": "ChosenAI/1.0 (chosenai.com)" },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.error("[SCC ArcGIS] HTTP error:", res.status)
      return null
    }

    const json = await res.json()
    console.log(
      "[SCC ArcGIS] Response features:",
      json.features?.length ?? 0
    )

    const feature = json.features?.[0]
    if (!feature) {
      console.log("[SCC ArcGIS] No parcel found at coordinates")
      return null
    }

    const attrs = feature.attributes
    console.log("[SCC ArcGIS] Attributes:", JSON.stringify(attrs, null, 2))

    const rings = feature.geometry?.rings?.[0]

    // Convert ArcGIS ring coords to GeoJSON Polygon
    let parcelGeometry = null
    if (rings && rings.length > 0) {
      parcelGeometry = {
        type: "Polygon",
        coordinates: [rings.map(([x, y]: number[]) => [x, y])],
      }
    }

    // Try multiple possible field names — SCC ArcGIS field names vary by layer
    const lotAcres = parseFloat(
      attrs.LotSizeAcres ?? attrs.LotAcres ?? attrs.LOTACRES ?? attrs.LOT_ACRES ?? "0"
    )
    const lotSqft =
      attrs.LotSizeSqFt ?? attrs.LOTSIZESQFT ?? attrs.LOT_SIZE ?? attrs.LotSize
    const yrBuilt =
      attrs.YearBuilt ?? attrs.YEARBUILT ?? attrs.YEAR_BUILT ?? attrs.YrBuilt
    const totalSqft =
      attrs.TotalBldgSqFt ?? attrs.TotalSqFt ?? attrs.ImprovSqFt ??
      attrs.TOTALSQFT ?? attrs.BldgSqFt1stFlr
    const zoningCode =
      attrs.ZoningCode ?? attrs.ZONINGCODE ?? attrs.Zoning ?? attrs.ZONING
    const landUse =
      attrs.LandUseCode ?? attrs.LandUseDescription ?? attrs.LANDUSE ??
      attrs.LandUse ?? attrs.UseCode
    const apn =
      attrs.APN ?? attrs.APN_DASH ?? attrs.PARCELID ?? attrs.ParcelNumber

    return {
      apn: apn ?? null,
      lotSizeSqft: lotSqft
        ? Math.round(Number(lotSqft))
        : lotAcres > 0
          ? Math.round(lotAcres * 43560)
          : null,
      yearBuilt: yrBuilt ? parseInt(String(yrBuilt)) : null,
      existingSqft: totalSqft ? parseInt(String(totalSqft)) : null,
      zoning: zoningCode ?? null,
      zoningDescription: landUse ?? null,
      parcelGeometry,
    }
  } catch (err) {
    console.error("[SCC ArcGIS] Error:", err)
    return null
  }
}

export async function createHomeownerProject(formData: FormData): Promise<{
  data: { id: string } | null
  error: string | null
}> {
  const address = (formData.get("address") as string | null)?.trim()
  const rawZip = formData.get("zip_code") as string | null
  const projectType = formData.get("project_type") as string | null
  const description =
    (formData.get("description") as string | null)?.trim() || null

  const formLat = formData.get("lat") as string | null
  const formLng = formData.get("lng") as string | null

  const fireWestOf280 = formData.get("fire_west_of_280") === "yes"
  const fireSprinklersExist = formData.get("fire_sprinklers_exist") === "yes"
  const hasEarthwork = formData.get("has_earthwork") === "yes"

  if (!address) {
    return { data: null, error: "Street address is required." }
  }

  // Zip code is optional — extracted from Google Places when available
  const normalizedZip = rawZip ? normalizeZip(rawZip) : ""

  if (
    !projectType ||
    !VALID_PROJECT_TYPES.includes(
      projectType as (typeof VALID_PROJECT_TYPES)[number]
    )
  ) {
    return { data: null, error: "Please select a valid project type." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "You must be logged in." }
  }

  // Look up jurisdiction (only if we have a zip code)
  let jurisdiction: { id: string } | null = null
  if (normalizedZip) {
    const { data } = await supabase
      .from("jurisdictions")
      .select("id")
      .contains("zip_codes", [normalizedZip])
      .maybeSingle()
    jurisdiction = data
  }

  // Get parcel data from Santa Clara County ArcGIS using Google Places lat/lng
  let regridParcelId: string | null = null
  let lotSizeSqft: number | null = null
  let existingSqft: number | null = null
  let yearBuilt: number | null = null
  let zoning: string | null = null
  let zoningDescription: string | null = null
  let parcelGeometry: unknown | null = null
  let mapLat: number | null = formLat ? parseFloat(formLat) : null
  let mapLng: number | null = formLng ? parseFloat(formLng) : null

  if (isNaN(mapLat as number)) mapLat = null
  if (isNaN(mapLng as number)) mapLng = null

  if (mapLat && mapLng) {
    const parcelData = await fetchSCCParcelData(mapLat, mapLng)
    if (parcelData) {
      regridParcelId = parcelData.apn
      lotSizeSqft = parcelData.lotSizeSqft
      existingSqft = parcelData.existingSqft
      yearBuilt = parcelData.yearBuilt
      zoning = parcelData.zoning
      zoningDescription = parcelData.zoningDescription
      parcelGeometry = parcelData.parcelGeometry
      console.log("[SCC ArcGIS] Parcel data:", {
        apn: regridParcelId,
        lotSizeSqft,
        yearBuilt,
        zoning,
        existingSqft,
      })
    }
  } else {
    console.log("[SCC ArcGIS] No coordinates from Places — skipping parcel lookup")
  }

  console.log("[coords] mapLat:", mapLat, "mapLng:", mapLng)

  // Insert homeowner project
  let projectId: string

  try {
    const { data: project, error: projectError } = await supabase
      .from("homeowner_projects")
      .insert({
        homeowner_id: user.id,
        address,
        zip_code: normalizedZip || "94301",
        jurisdiction_id: jurisdiction?.id ?? null,
        project_type: projectType,
        description,
        fire_west_of_280: fireWestOf280,
        fire_sprinklers_exist: fireSprinklersExist,
        has_earthwork: hasEarthwork,
        regrid_parcel_id: regridParcelId,
        lot_size_sqft: lotSizeSqft,
        existing_sqft: existingSqft,
        year_built: yearBuilt,
        zoning,
        zoning_description: zoningDescription,
        parcel_geometry: parcelGeometry,
        map_lat: mapLat,
        map_lng: mapLng,
        status: "ai_processing",
      })
      .select("id")
      .single()

    if (projectError || !project) {
      return {
        data: null,
        error: projectError?.message ?? "Failed to create project.",
      }
    }

    projectId = project.id
  } catch {
    return { data: null, error: "Failed to create project." }
  }

  // Verify the row is readable before redirecting (prevents 404 race condition)
  let verified = false
  for (let i = 0; i < 3; i++) {
    const { data: check } = await supabase
      .from("homeowner_projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle()
    if (check?.id) {
      verified = true
      break
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  if (!verified) return { data: null, error: "Failed to create project." }

  generateAIScope(projectId).catch(console.error)

  redirect(`/homeowner/projects/${projectId}/explore`)
}

export async function generateAIScope(projectId: string): Promise<void> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not set")
    }

    const supabase = await createClient()

    const { data: project, error: fetchError } = await supabase
      .from("homeowner_projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (fetchError) {
      console.error("[generateAIScope] Failed to fetch project:", fetchError)
      return
    }

    if (!project) {
      console.error("[generateAIScope] No project found for id:", projectId)
      return
    }

    console.log("[generateAIScope] Generating scope for:", {
      id: projectId,
      address: project.address,
      project_type: project.project_type,
      lot_size_sqft: project.lot_size_sqft,
      zoning: project.zoning,
    })

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
        adu_max_sqft: z.number().optional(),
      }),
      system: PALO_ALTO_SCOPE_SYSTEM_PROMPT,
      prompt: `Address: ${project.address}. Type: ${project.project_type}. Lot: ${project.lot_size_sqft ?? "unknown"} SF. Zoning: ${project.zoning ?? "unknown"}. Year built: ${project.year_built ?? "unknown"}. West of 280: ${project.fire_west_of_280}. Sprinklers: ${project.fire_sprinklers_exist}. Earthwork: ${project.has_earthwork}.`,
    })

    console.log("[generateAIScope] AI response received:", {
      scope_summary_length: object.scope_summary.length,
      permit_count: object.permit_checklist.length,
      cost_low: object.cost_estimate_low,
      cost_high: object.cost_estimate_high,
    })

    // ai_permit_checklist is jsonb — pass the array directly (not stringified)
    const { error: updateError } = await supabase
      .from("homeowner_projects")
      .update({
        ai_scope_summary: object.scope_summary,
        ai_permit_checklist: object.permit_checklist,
        ai_cost_estimate_low: object.cost_estimate_low,
        ai_cost_estimate_high: object.cost_estimate_high,
        ai_timeline_weeks_low: object.timeline_weeks_low,
        ai_timeline_weeks_high: object.timeline_weeks_high,
        ai_feasibility_notes: object.feasibility_notes,
        ai_generated_at: new Date().toISOString(),
        status: "scope_ready",
      })
      .eq("id", projectId)

    if (updateError) {
      console.error("[generateAIScope] Supabase UPDATE failed:", updateError)
      return
    }

    console.log("[generateAIScope] Successfully updated project", projectId, "to scope_ready")
  } catch (err) {
    console.error("[generateAIScope] Fatal error:", err)
    // If AI fails, revert to draft so user can retry
    try {
      const supabase = await createClient()
      await supabase
        .from("homeowner_projects")
        .update({ status: "draft" })
        .eq("id", projectId)
    } catch (revertErr) {
      console.error("[generateAIScope] Failed to revert status to draft:", revertErr)
    }
  }
}

export async function deleteHomeownerProject(
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: project } = await supabase
    .from("homeowner_projects")
    .select("id, homeowner_id")
    .eq("id", projectId)
    .eq("homeowner_id", user.id)
    .maybeSingle()

  if (!project) return { error: "Project not found or not authorized" }

  const { error } = await supabase
    .from("homeowner_projects")
    .delete()
    .eq("id", projectId)
    .eq("homeowner_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/homeowner/dashboard")
  return { error: null }
}
