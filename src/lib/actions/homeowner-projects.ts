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

// ATTOM Property Data API — industry standard for US property data
async function fetchATTOMParcelData(address: string) {
  const attomKey = process.env.ATTOM_API_KEY
  if (!attomKey) {
    console.error("[ATTOM] ATTOM_API_KEY not set")
    return null
  }

  try {
    // Google Places gives "101 Alma St, Palo Alto, CA 94301, USA"
    // ATTOM wants address1="101 Alma St" address2="Palo Alto, CA"
    const cleanAddress = address
      .replace(/, USA$/, "")
      .replace(/, United States$/, "")
      .trim()
    const parts = cleanAddress.split(",")
    const address1 = parts[0]?.trim() // "101 Alma St"

    // Build address2 as "City, State" only — no zip code
    // parts[1] = " Palo Alto", parts[2] = " CA 94301"
    const city = parts[1]?.trim() // "Palo Alto"
    const stateZip = parts[2]?.trim() ?? "" // "CA 94301"
    const state = stateZip.split(" ")[0] // "CA"
    const address2 =
      city && state
        ? `${city}, ${state}`
        : parts.slice(1).join(",").trim()

    console.log("[ATTOM] address1:", address1, "address2:", address2)

    if (!address1 || !address2) {
      console.error("[ATTOM] Could not parse address:", address)
      return null
    }

    const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`
    console.log("[ATTOM] Querying:", url)

    const res = await fetch(url, {
      headers: {
        apikey: attomKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    })

    console.log("[ATTOM] HTTP status:", res.status)

    if (!res.ok) {
      const text = await res.text()
      console.error("[ATTOM] Error response:", text)
      return null
    }

    const json = await res.json()
    console.log("[ATTOM] Raw response:", JSON.stringify(json, null, 2))

    const property = json.property?.[0]
    if (!property) {
      console.log("[ATTOM] No property found for address")
      return null
    }

    // lot.lotsize2 = sq ft, lot.lotsize1 = acres
    const lotSizeSqft = property.lot?.lotsize2
      ? Math.round(Number(property.lot.lotsize2))
      : property.lot?.lotsize1
        ? Math.round(Number(property.lot.lotsize1) * 43560)
        : null

    const yearBuilt = property.summary?.yearbuilt
      ? parseInt(property.summary.yearbuilt)
      : null

    const existingSqft = property.building?.size?.bldgsize
      ? parseInt(property.building.size.bldgsize)
      : property.building?.size?.grosssize
        ? parseInt(property.building.size.grosssize)
        : property.building?.size?.livingsize
          ? parseInt(property.building.size.livingsize)
          : null

    const zoning = property.summary?.propclass ?? null
    const zoningDescription = property.summary?.proptype ?? null
    const apn = property.identifier?.apn ?? null

    console.log("[ATTOM] Extracted:", {
      apn,
      lotSizeSqft,
      yearBuilt,
      existingSqft,
      zoning,
      zoningDescription,
    })

    return {
      apn,
      lotSizeSqft,
      yearBuilt,
      existingSqft,
      zoning,
      zoningDescription,
      parcelGeometry: null,
    }
  } catch (err) {
    console.error("[ATTOM] Error:", err)
    return null
  }
}

// Highway 280 waypoints through Palo Alto (lat, lng pairs NW to SE)
const HWY_280_WAYPOINTS: [number, number][] = [
  [37.481, -122.204],
  [37.46, -122.189],
  [37.435, -122.175],
  [37.42, -122.162],
  [37.395, -122.145],
  [37.37, -122.12],
]

function isWestOf280(lat: number, lng: number): boolean {
  for (let i = 0; i < HWY_280_WAYPOINTS.length - 1; i++) {
    const [lat1, lng1] = HWY_280_WAYPOINTS[i]
    const [lat2, lng2] = HWY_280_WAYPOINTS[i + 1]

    if (lat >= lat2 && lat <= lat1) {
      const t = (lat - lat2) / (lat1 - lat2)
      const hwy280Lng = lng2 + t * (lng1 - lng2)
      const isWest = lng < hwy280Lng
      console.log(
        `[280 check] Property lng: ${lng}, 280 lng at lat ${lat}: ${hwy280Lng.toFixed(4)}, west: ${isWest}`
      )
      return isWest
    }
  }

  console.log(
    `[280 check] Lat ${lat} outside Palo Alto range — defaulting to not west of 280`
  )
  return false
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

  // Get parcel data from ATTOM using address
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

  const parcelData = await fetchATTOMParcelData(address)
  if (parcelData) {
    regridParcelId = parcelData.apn
    lotSizeSqft = parcelData.lotSizeSqft
    existingSqft = parcelData.existingSqft
    yearBuilt = parcelData.yearBuilt
    zoning = parcelData.zoning
    zoningDescription = parcelData.zoningDescription
    parcelGeometry = parcelData.parcelGeometry
  }

  // Auto-detect west of 280 from coordinates
  const fireWestOf280 =
    mapLat && mapLng ? isWestOf280(mapLat, mapLng) : false
  console.log("[280 check] Auto-detected fire_west_of_280:", fireWestOf280)

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
