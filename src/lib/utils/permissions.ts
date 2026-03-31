import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ProjectRole =
  | "contractor"
  | "co_owner"
  | "architect"
  | "engineer"
  | "inspector"
  | "client";

export const ROLE_LABELS: Record<ProjectRole, string> = {
  contractor: "Contractor (Owner)",
  co_owner: "Co-Owner / Project Manager",
  architect: "Architect",
  engineer: "Engineer",
  inspector: "Inspector",
  client: "Client (Homeowner)",
};

export const INVITABLE_ROLES: ProjectRole[] = [
  "co_owner",
  "architect",
  "engineer",
  "inspector",
  "client",
];

export function canManageTeam(role: ProjectRole): boolean {
  return ["contractor", "co_owner"].includes(role);
}

export function canDeleteProject(role: ProjectRole): boolean {
  return role === "contractor";
}

export function canUploadDocuments(role: ProjectRole): boolean {
  return ["contractor", "co_owner", "architect", "engineer"].includes(role);
}

export function canDeleteDocuments(role: ProjectRole): boolean {
  return ["contractor", "co_owner", "architect"].includes(role);
}

export function canUpdatePermitStatus(role: ProjectRole): boolean {
  return ["contractor", "co_owner", "architect", "engineer"].includes(role);
}

export function canViewInspections(_role: ProjectRole): boolean {
  return true;
}

export function canViewDocuments(_role: ProjectRole): boolean {
  return true;
}

export function canViewTeam(role: ProjectRole): boolean {
  return ["contractor", "co_owner", "architect", "engineer"].includes(role);
}

export async function getUserRole(
  userId: string,
  projectId: string,
  supabase: SupabaseClient
): Promise<ProjectRole | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;
  if (project.user_id === userId) return "contractor";

  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("invite_status", "accepted")
    .maybeSingle();

  return (member?.role as ProjectRole) ?? null;
}
