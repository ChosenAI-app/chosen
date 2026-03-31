"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { normalizeZip, isPaloAltoZip } from "@/lib/utils/jurisdiction";

const VALID_PROJECT_TYPES = [
  "adu_detached",
  "adu_attached",
  "addition",
  "remodel",
] as const;

export async function createProject(
  formData: FormData
): Promise<{ error: string | null }> {
  // a. Extract and validate fields
  const address = (formData.get("address") as string | null)?.trim();
  const rawZip = formData.get("zip_code") as string | null;
  const projectType = formData.get("project_type") as string | null;
  const scopeDescription =
    (formData.get("scope_description") as string | null)?.trim() || null;

  // Intake answers for conditional permits
  const fireWestOf280 = formData.get("fireWestOf280") === "yes";
  const fireSprinklersExist = formData.get("fireSprinklersExist") === "yes";
  const hasEarthwork = formData.get("hasEarthwork") === "yes";

  if (!address) {
    return { error: "Street address is required." };
  }

  if (!rawZip) {
    return { error: "Zip code is required." };
  }

  const normalizedZip = normalizeZip(rawZip);

  if (!isPaloAltoZip(normalizedZip)) {
    return { error: "Chosen currently supports Palo Alto only (94301, 94303, 94304, 94306)." };
  }

  if (
    !projectType ||
    !VALID_PROJECT_TYPES.includes(projectType as (typeof VALID_PROJECT_TYPES)[number])
  ) {
    return { error: "Please select a valid project type." };
  }

  // b. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a project." };
  }

  // c. Look up jurisdiction
  let jurisdictionId: string;

  try {
    const { data: jurisdiction, error: jurisdictionError } = await supabase
      .from("jurisdictions")
      .select("id")
      .contains("zip_codes", [normalizedZip])
      .single();

    if (jurisdictionError || !jurisdiction) {
      return { error: "Unsupported zip code." };
    }

    jurisdictionId = jurisdiction.id;
  } catch {
    return { error: "Failed to look up jurisdiction." };
  }

  // d. Insert project
  let projectId: string;

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        address,
        city: "Palo Alto",
        zip_code: normalizedZip,
        project_type: projectType,
        scope_description: scopeDescription,
        jurisdiction_id: jurisdictionId,
      })
      .select("id")
      .single();

    if (projectError || !project) {
      return { error: projectError?.message ?? "Failed to create project." };
    }

    projectId = project.id;
  } catch {
    return { error: "Failed to create project." };
  }

  // e. Query permit types for this jurisdiction and project type
  // f. Bulk insert project_permits
  try {
    const { data: permitTypes, error: permitTypesError } = await supabase
      .from("permit_types")
      .select("id, name")
      .eq("jurisdiction_id", jurisdictionId)
      .contains("required_for", [projectType])
      .order("display_order", { ascending: true });

    if (permitTypesError) {
      return { error: "Failed to load permit types." };
    }

    // Filter conditional permits based on intake answers
    const filteredPermitTypes = (permitTypes ?? []).filter((pt) => {
      if (pt.name === "Palo Alto Fire Department Review") {
        return fireWestOf280 || fireSprinklersExist;
      }
      if (pt.name === "Grading and Drainage Plan") {
        return hasEarthwork;
      }
      return true;
    });

    if (filteredPermitTypes.length > 0) {
      const { error: permitsError } = await supabase
        .from("project_permits")
        .insert(
          filteredPermitTypes.map((pt) => ({
            project_id: projectId,
            permit_type_id: pt.id,
            status: "not_started" as const,
          }))
        );

      if (permitsError) {
        return { error: "Failed to create permit workflow." };
      }
    }
  } catch {
    return { error: "Failed to generate permits." };
  }

  // g. Redirect outside try/catch
  redirect("/projects/" + projectId);
}
