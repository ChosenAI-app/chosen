import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getStatusVariant, getStatusLabel } from "@/lib/utils/status";

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
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.address}
          </h1>
          <Badge variant="secondary">
            {PROJECT_TYPE_LABELS[project.project_type] ?? project.project_type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {jurisdictionName} &middot; {project.zip_code}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Permits</h2>
        {permits && permits.length > 0 ? (
          <div className="flex flex-col gap-2">
            {permits.map((permit) => {
              const permitType = permit.permit_types as {
                name: string;
                description: string | null;
              } | null;

              return (
                <div
                  key={permit.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {permitType?.name ?? "Unknown Permit"}
                    </p>
                    {permitType?.description && (
                      <p className="text-xs text-muted-foreground">
                        {permitType.description}
                      </p>
                    )}
                  </div>
                  {userCanUpdateStatus ? (
                    <PermitStatusSelect
                      projectPermitId={permit.id}
                      projectId={id}
                      currentStatus={permit.status}
                    />
                  ) : (
                    <Badge variant={getStatusVariant(permit.status)}>
                      {getStatusLabel(permit.status)}
                    </Badge>
                  )}
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

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Documents</h2>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/projects/${id}/documents`}>Manage Documents &rarr;</Link>
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Inspections</h2>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/projects/${id}/inspections`}>
            View Inspection Sequence &rarr;
          </Link>
        </Button>
      </section>

      {userCanViewTeam && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Team</h2>
          {userCanManageTeam && <InviteTeamMemberForm projectId={id} />}
          <TeamMemberList
            projectId={id}
            currentUserId={user.id}
            canManage={userCanManageTeam}
          />
        </section>
      )}

      {userCanDelete && (
        <div className="mt-8 border-t pt-6">
          <DeleteProjectButton projectId={id} />
        </div>
      )}
    </div>
  );
}
