"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface FlaggedField {
  field_name: string
  label: string
  reason: string
  input_type: "text" | "number" | "boolean" | "select"
  options?: string[]
}

export async function generateFormFills(
  projectId: string
): Promise<{ error: string | null }> {
  try {
    console.log("[generateFormFills] called for project:", projectId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: project, error: projectError } = await supabase
      .from("homeowner_projects")
      .select("*")
      .eq("id", projectId)
      .eq("homeowner_id", user.id)
      .maybeSingle()

    if (projectError) {
      console.error("[generateFormFills] Project query error:", projectError)
      return { error: projectError.message }
    }
    if (!project) return { error: "Project not found" }

    console.log("[generateFormFills] Project loaded:", {
      id: project.id,
      type: project.project_type,
      address: project.address,
    })

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()

    // Use optional chaining / defaults for all fields (some columns may not exist)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = project as any
    const address = (p.address ?? "").replace(/, USA$/, "")
    const zipCode = p.zip_code ?? "94301"
    const ownerName = profile?.full_name ?? ""
    const ownerPhone = profile?.phone ?? null
    const lotSqft = p.lot_size_sqft ?? null
    const yearBuilt = p.year_built ?? null
    const apn = p.regrid_parcel_id ?? null
    const hasSprinklers = p.fire_sprinklers_exist ?? false
    const separatelyMetered = p.separately_metered ?? false

    // Cost estimate — try AI scope first, then defaults
    let estimatedCost = 300000
    if (p.ai_cost_estimate_low && p.ai_cost_estimate_high) {
      estimatedCost = Math.round(
        (p.ai_cost_estimate_low + p.ai_cost_estimate_high) / 2
      )
    }

    const sb407Exempt = yearBuilt !== null && yearBuilt > 1994

    // ============================================================
    // FORM 1: Building Permit Application
    // ============================================================
    const buildingFilled: Record<string, string | boolean | null> = {
      owner_name: ownerName || null,
      owner_address: address.split(",")[0]?.trim() ?? null,
      owner_city: "Palo Alto",
      owner_state: "CA",
      owner_zip: zipCode,
      owner_phone: ownerPhone,
      owner_email: user.email ?? null,
      project_address: address,
      parcel_number: apn,
      zoning: p.zoning_description ?? p.zoning ?? "R-1",
      description_of_work: buildDescription(p),
      estimated_valuation: `$${estimatedCost.toLocaleString()}`,
      new_construction_sqft: p.adu_sqft ? String(p.adu_sqft) : null,
      include_electrical: true,
      include_plumbing: true,
      include_mechanical: true,
      include_solar: true,
      include_evcs: true,
      include_fire_sprinkler: !hasSprinklers,
      lot_size_sqft: lotSqft ? String(lotSqft) : null,
      year_built: yearBuilt ? String(yearBuilt) : null,
    }

    const buildingFlagged: FlaggedField[] = [
      ...(!ownerName
        ? [
            {
              field_name: "owner_name",
              label: "Property Owner Full Name",
              reason: "Required — update in your profile settings",
              input_type: "text" as const,
            },
          ]
        : []),
      ...(!ownerPhone
        ? [
            {
              field_name: "owner_phone",
              label: "Property Owner Phone Number",
              reason: "Required for permit correspondence",
              input_type: "text" as const,
            },
          ]
        : []),
      ...(!apn
        ? [
            {
              field_name: "parcel_number",
              label: "Assessor Parcel Number (APN)",
              reason:
                "Look up at sccassessor.org or your property tax bill",
              input_type: "text" as const,
            },
          ]
        : []),
      {
        field_name: "existing_building_sqft",
        label: "Existing Building Square Footage",
        reason: "Total living area of the main house",
        input_type: "number" as const,
      },
    ]

    // ============================================================
    // FORM 2: Utility Service Application
    // ============================================================
    const utilityFilled: Record<string, string | boolean | null> = {
      service_address: address,
      owner_name: ownerName || null,
      owner_phone: ownerPhone,
      project_type: "New ADU",
      separately_metered: separatelyMetered,
      meter_type: separatelyMetered
        ? "Dual meter panel"
        : "Shared meter (existing)",
      ev_charging: true,
    }

    const utilityFlagged: FlaggedField[] = [
      {
        field_name: "paloalto_utilities_account",
        label: "Palo Alto Utilities Account Number",
        reason: "Find on your monthly utility bill",
        input_type: "text" as const,
      },
      ...(separatelyMetered
        ? [
            {
              field_name: "new_meter_amperage",
              label: "New Meter Size (amps)",
              reason: "Confirm with your electrician",
              input_type: "select" as const,
              options: ["100A", "200A", "400A"],
            },
          ]
        : []),
    ]

    // ============================================================
    // FORM 3: SB-407 Plumbing Certification
    // ============================================================
    const sb407Filled: Record<string, string | boolean | null> = {
      property_address: address,
      owner_name: ownerName || null,
      year_built: yearBuilt ? String(yearBuilt) : null,
      auto_exempt: sb407Exempt,
      exemption_reason: sb407Exempt
        ? `Built ${yearBuilt} (after 1994) — auto-exempt`
        : null,
    }

    const sb407Flagged: FlaggedField[] = sb407Exempt
      ? []
      : [
          {
            field_name: "toilets_gpf",
            label: "Toilet flush rate (gallons per flush)",
            reason: "Must be 1.28 gpf or less",
            input_type: "select" as const,
            options: [
              "1.28 gpf or less ✓",
              "1.6 gpf — needs replacement",
              "3.5 gpf — needs replacement",
            ],
          },
          {
            field_name: "showerheads_gpm",
            label: "Showerhead flow rate (gallons per minute)",
            reason: "Must be 1.8 gpm or less",
            input_type: "select" as const,
            options: [
              "1.8 gpm or less ✓",
              "2.0 gpm — needs replacement",
              "2.5 gpm — needs replacement",
            ],
          },
        ]

    // ============================================================
    // FORM 4: Fire Department Checklist
    // ============================================================
    const fireFilled: Record<string, string | boolean | null> = {
      property_address: address,
      project_type: "New Detached ADU",
      existing_sprinklers: hasSprinklers,
      new_sprinklers_required: !hasSprinklers,
      smoke_detectors: true,
      co_detectors: true,
    }

    const fireFlagged: FlaggedField[] = [
      {
        field_name: "distance_adu_to_street",
        label: "Distance from ADU to nearest street (feet)",
        reason: "Requires physical measurement on your property",
        input_type: "number" as const,
      },
      {
        field_name: "distance_adu_to_main_house",
        label: "Distance from ADU to main house (feet)",
        reason: "Determines fire separation requirements",
        input_type: "number" as const,
      },
    ]

    // ============================================================
    // UPSERT all forms
    // ============================================================
    const forms = [
      {
        form_key: "building_permit",
        form_name: "Building Permit Application",
        filled_fields: buildingFilled,
        flagged_fields: buildingFlagged,
      },
      {
        form_key: "utility_service",
        form_name: "Utility Service Application (CPAU)",
        filled_fields: utilityFilled,
        flagged_fields: utilityFlagged,
      },
      {
        form_key: "sb407_plumbing",
        form_name: sb407Exempt
          ? "SB-407 Plumbing — AUTO-EXEMPT"
          : "SB-407 Plumbing Certification",
        filled_fields: sb407Filled,
        flagged_fields: sb407Flagged,
      },
      {
        form_key: "fire_checklist",
        form_name: "Fire Department Checklist",
        filled_fields: fireFilled,
        flagged_fields: fireFlagged,
      },
    ]

    for (const form of forms) {
      const needsReview =
        (form.flagged_fields as FlaggedField[]).length > 0
      const { error } = await supabase.from("permit_form_fills").upsert(
        {
          homeowner_project_id: projectId,
          form_key: form.form_key,
          form_name: form.form_name,
          status: needsReview ? "needs_review" : "approved",
          filled_fields: form.filled_fields,
          flagged_fields: form.flagged_fields,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "homeowner_project_id,form_key" }
      )

      if (error) {
        console.error(
          "[generateFormFills] upsert error for",
          form.form_key,
          error
        )
        return {
          error: `Failed to save ${form.form_name}: ${error.message}`,
        }
      }
    }

    console.log(
      "[generateFormFills] Successfully generated",
      forms.length,
      "forms"
    )
    revalidatePath(`/homeowner/projects/${projectId}/permits`)
    return { error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[generateFormFills] Uncaught error:", err)
    return { error: `Failed to generate forms: ${msg}` }
  }
}

export async function updateFlaggedField(
  formFillId: string,
  fieldName: string,
  value: string | boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: fill } = await supabase
      .from("permit_form_fills")
      .select("*")
      .eq("id", formFillId)
      .maybeSingle()

    if (!fill) return { error: "Form not found" }

    const currentFlagged = (fill.flagged_fields as FlaggedField[]) ?? []
    const currentFilled =
      (fill.filled_fields as Record<string, unknown>) ?? {}

    const updatedFlagged = currentFlagged.filter(
      (f) => f.field_name !== fieldName
    )
    const updatedFilled = { ...currentFilled, [fieldName]: value }

    const { error } = await supabase
      .from("permit_form_fills")
      .update({
        filled_fields: updatedFilled,
        flagged_fields: updatedFlagged,
        status:
          updatedFlagged.length === 0 ? "approved" : "needs_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", formFillId)

    if (error) return { error: error.message }

    revalidatePath(
      `/homeowner/projects/${fill.homeowner_project_id}/permits`
    )
    return { error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[updateFlaggedField] Error:", err)
    return { error: msg }
  }
}

export async function approveFormFill(
  formFillId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { error } = await supabase
      .from("permit_form_fills")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", formFillId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[approveFormFill] Error:", err)
    return { error: msg }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDescription(project: any): string {
  const typeMap: Record<string, string> = {
    adu_detached: "new detached ADU",
    adu_attached: "new attached ADU",
    jadu: "junior ADU (JADU)",
    addition: "residential addition",
    remodel: "residential remodel",
  }
  const type = typeMap[project.project_type] ?? project.project_type
  let desc = `Construction of a ${type}`
  if (project.adu_sqft) desc += `, approximately ${project.adu_sqft} SF`
  if (project.lot_size_sqft)
    desc += `. Lot: ${project.lot_size_sqft.toLocaleString()} SF`
  if (project.year_built) desc += `. Built ${project.year_built}`
  desc += ". All-electric per Title 24."
  return desc
}
