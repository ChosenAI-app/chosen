import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PermitStatusSelect } from "@/components/permits/PermitStatusSelect";
import { DeleteProjectButton } from "@/components/permits/DeleteProjectButton";
import { InviteTeamMemberForm } from "@/components/team/InviteTeamMemberForm";
import { TeamMemberList } from "@/components/team/TeamMemberList";
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

  const { data: project } = await supabase
    .from("projects")
    .select("*, jurisdictions(name)")
    .eq("id", id)
    .maybeSingle();

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

  const jurisdictionName =
    (project as Record<string, unknown>).jurisdictions &&
    typeof (project as Record<string, unknown>).jurisdictions === "object" &&
    (project as Record<string, unknown>).jurisdictions !== null
      ? ((project as Record<string, unknown>).jurisdictions as { name: string }).name
      : "Unknown";

  return (
    <div className="flex flex-col gap-6">
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

          {/* Team */}
          {userCanViewTeam && (
            <div className="rounded-md border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Team
              </h3>
              <div className="mt-4 flex flex-col gap-4">
                {userCanManageTeam && <InviteTeamMemberForm projectId={id} />}
                <TeamMemberList
                  projectId={id}
                  currentUserId={user.id}
                  canManage={userCanManageTeam}
                />
              </div>
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
