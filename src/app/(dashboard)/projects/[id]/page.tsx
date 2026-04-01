import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { PermitStatusSelect } from "@/components/permits/PermitStatusSelect";
import { DeleteProjectButton } from "@/components/permits/DeleteProjectButton";
import { InviteRoleButton } from "@/components/permits/InviteRoleButton";
import {
  getUserRole,
  canManageTeam,
  canDeleteProject,
  canUpdatePermitStatus,
  canViewTeam,
} from "@/lib/utils/permissions";
import { FileText, ClipboardList, ArrowRight } from "lucide-react";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU / JADU",
  addition: "Residential Addition",
  remodel: "Interior Remodel",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Try as project owner first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let project: any = null;

  const { data: ownedProject } = await supabase
    .from("projects")
    .select("*, jurisdictions(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedProject) {
    project = ownedProject;
  } else {
    // Check if user is an accepted team member
    const { data: membership } = await supabase
      .from("team_members")
      .select("role, invite_status")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .eq("invite_status", "accepted")
      .maybeSingle();

    console.log("[project page] membership check:", {
      projectId: id,
      userId: user.id,
      membership,
    });

    if (membership) {
      const admin = createAdminClient();
      const { data: teamProject, error: teamProjectError } = await admin
        .from("projects")
        .select("*, jurisdictions(name)")
        .eq("id", id)
        .maybeSingle();

      console.log("[project page] admin fetch:", {
        found: !!teamProject,
        error: teamProjectError?.message,
      });

      if (teamProject) {
        project = teamProject;
      }
    }
  }

  if (!project) {
    notFound();
  }

  const role = await getUserRole(user.id, id, supabase);
  if (!role) {
    notFound();
  }

  const userCanManageTeam = canManageTeam(role);
  const userCanDelete = canDeleteProject(role);
  const userCanUpdateStatus = canUpdatePermitStatus(role);
  const userCanViewTeam = canViewTeam(role);

  const { data: permits } = await supabase
    .from("project_permits")
    .select("*, permit_types(name, description)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  // Fetch team members
  const admin = createAdminClient();
  const { data: teamMembersRaw } = await admin
    .from("team_members")
    .select("id, role, invite_status, invited_email, user_id")
    .eq("project_id", id);

  // Fetch profiles for team members
  const teamUserIds = (teamMembersRaw ?? [])
    .map((m) => m.user_id)
    .filter(Boolean) as string[];
  let teamProfiles: Record<string, string> = {};
  if (teamUserIds.length > 0) {
    const { data: profileData } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", teamUserIds);
    if (profileData) {
      for (const p of profileData) {
        teamProfiles[p.id] = p.full_name ?? "";
      }
    }
  }

  // Fetch owner profile
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", project.user_id)
    .maybeSingle();

  const jurisdictionName =
    (project as Record<string, unknown>).jurisdictions &&
    typeof (project as Record<string, unknown>).jurisdictions === "object" &&
    (project as Record<string, unknown>).jurisdictions !== null
      ? ((project as Record<string, unknown>).jurisdictions as { name: string }).name
      : "Unknown";

  return (
    <div className="flex flex-col gap-6">
      {/* Client read-only notice */}
      {role === "client" && (
        <div className="rounded-md border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          You have been added as a client on this project. You can view project
          status, permits, and documents here.
        </div>
      )}

      {/* Page header */}
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          &larr; Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {project.address}
        </h1>
        <span className="mt-1 inline-block rounded-sm bg-secondary px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-secondary-foreground">
          {PROJECT_TYPE_LABELS[project.project_type] ?? project.project_type}
        </span>
      </div>

      {/* 2-column layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column — permits + links */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Permits section */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Permits
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            {permits && permits.length > 0 ? (
              <div className="flex flex-col">
                {permits.map((permit) => {
                  const permitType = permit.permit_types as {
                    name: string;
                    description: string | null;
                  } | null;

                  return (
                    <div
                      key={permit.id}
                      className="flex items-center justify-between border-b border-border/50 py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {permitType?.name ?? "Unknown Permit"}
                        </p>
                        {permitType?.description && (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {permitType.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 shrink-0">
                        {userCanUpdateStatus ? (
                          <PermitStatusSelect
                            projectPermitId={permit.id}
                            projectId={id}
                            currentStatus={permit.status}
                          />
                        ) : (
                          <StatusBadge status={permit.status} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No permits generated for this project.
              </p>
            )}
          </section>

          {/* Navigation links */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/projects/${id}/documents`}
              className="group flex items-center justify-between rounded-md border border-border bg-card px-5 py-4 transition-all duration-150 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <span className="font-medium">Manage Documents</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={`/projects/${id}/inspections`}
              className="group flex items-center justify-between rounded-md border border-border bg-card px-5 py-4 transition-all duration-150 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="size-4 text-muted-foreground" />
                <span className="font-medium">View Inspection Sequence</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Right column — metadata + team */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:col-span-5 lg:self-start">
          {/* Project Info */}
          <div className="rounded-md border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Project Info
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Jurisdiction</p>
                <p className="mt-0.5 text-sm font-medium">{jurisdictionName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zip Code</p>
                <p className="mt-0.5 text-sm font-medium">{project.zip_code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-0.5 text-sm font-medium">
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              {(() => {
                let scopeSummary: string | null = null
                let originalDescription: string | null = null
                try {
                  const parsed = JSON.parse(project.scope_description ?? "{}")
                  if (parsed.ai_scope) {
                    scopeSummary = parsed.ai_scope.scope_summary ?? null
                    originalDescription = parsed.original_description ?? null
                  } else {
                    originalDescription = project.scope_description
                  }
                } catch {
                  originalDescription = project.scope_description
                }

                return (
                  <>
                    {scopeSummary && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          AI Scope
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {scopeSummary}
                        </p>
                        <Link
                          href={`/projects/${id}/explore`}
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                          View full analysis →
                        </Link>
                      </div>
                    )}
                    {!scopeSummary && originalDescription && (
                      <div>
                        <p className="text-xs text-muted-foreground">Scope</p>
                        <p className="mt-0.5 text-sm text-foreground">
                          {originalDescription}
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Project Team */}
          {userCanViewTeam && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Project Team
              </h2>
              {[
                { slotRole: "contractor", label: "General Contractor", desc: "Leads construction" },
                { slotRole: "architect", label: "Architect", desc: "Plans and drawings" },
                { slotRole: "engineer", label: "Engineer", desc: "Structural / MEP" },
                { slotRole: "inspector", label: "Inspector", desc: "Code compliance" },
                { slotRole: "client", label: "Client / Homeowner", desc: "Project owner" },
              ].map(({ slotRole, label, desc }) => {
                const member = teamMembersRaw?.find((m) => m.role === slotRole);
                const isProjectOwner = slotRole === "contractor" && project.user_id === user.id;
                const memberName = member?.user_id
                  ? teamProfiles[member.user_id] || member.invited_email
                  : member?.invited_email;

                return (
                  <div
                    key={slotRole}
                    className="flex items-center justify-between border-b border-border/50 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${
                          member || isProjectOwner
                            ? "border border-primary/30 bg-primary/20 text-primary"
                            : "border border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {isProjectOwner
                          ? (ownerProfile?.full_name?.charAt(0) ?? "C")
                          : member
                            ? (memberName?.charAt(0)?.toUpperCase() ?? slotRole.charAt(0).toUpperCase())
                            : slotRole.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {isProjectOwner
                            ? (ownerProfile?.full_name ?? "You")
                            : member
                              ? memberName
                              : label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isProjectOwner ? "Project Owner" : member ? label : desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isProjectOwner && (
                        <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          You
                        </span>
                      )}
                      {!isProjectOwner && member && (
                        <span
                          className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            member.invite_status === "accepted"
                              ? "bg-green-950 text-green-400"
                              : "bg-yellow-950 text-yellow-400"
                          }`}
                        >
                          {member.invite_status === "accepted" ? "Active" : "Invited"}
                        </span>
                      )}
                      {!isProjectOwner && !member && userCanManageTeam && (
                        <InviteRoleButton
                          projectId={id}
                          role={slotRole}
                          label={label}
                        />
                      )}
                      {!isProjectOwner && !member && !userCanManageTeam && (
                        <span className="text-xs italic text-muted-foreground">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete */}
          {userCanDelete && (
            <div className="pt-2">
              <DeleteProjectButton projectId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
