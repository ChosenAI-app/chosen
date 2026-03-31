"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserRole, canUpdatePermitStatus } from "@/lib/utils/permissions";

const VALID_STATUSES = [
  "not_started",
  "submitted",
  "in_review",
  "corrections",
  "approved",
  "issued",
] as const;

export async function updatePermitStatus(
  projectPermitId: string,
  newStatus: string,
  projectId: string
): Promise<{ error: string | null }> {
  // a. Validate status
  if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
    return { error: "Invalid status." };
  }

  // b. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // c. Verify permit exists and user has permission
  const { data: permit } = await supabase
    .from("project_permits")
    .select("project_id")
    .eq("id", projectPermitId)
    .maybeSingle();

  if (!permit) {
    return { error: "Permit not found." };
  }

  const role = await getUserRole(user.id, permit.project_id, supabase);
  if (!role || !canUpdatePermitStatus(role)) {
    return { error: "Not authorized to update permit status." };
  }

  // d. Update status
  const { error: updateError } = await supabase
    .from("project_permits")
    .update({ status: newStatus })
    .eq("id", projectPermitId);

  if (updateError) {
    return { error: updateError.message };
  }

  // e. Revalidate
  revalidatePath("/projects/[id]", "page");

  // f. Return
  return { error: null };
}
