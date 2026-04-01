import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU / JADU",
  addition: "Residential Addition",
  remodel: "Interior Remodel",
};

type TeamMemberWithProject = {
  project_id: string;
  projects: Project;
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect homeowners to their dashboard
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user!.id)
    .maybeSingle();

  if (userProfile?.user_type === "homeowner") {
    redirect("/homeowner/dashboard");
  }

  const [ownedResult, memberResult] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("project_id, projects!inner(*)")
      .eq("user_id", user!.id)
      .eq("invite_status", "accepted"),
  ]);

  const memberProjects = (
    (memberResult.data ?? []) as unknown as TeamMemberWithProject[]
  ).map((tm) => tm.projects);

  const seen = new Set<string>();
  const allProjects = [
    ...((ownedResult.data ?? []) as Project[]),
    ...memberProjects,
  ]
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // Fetch permit counts for all projects in one query
  const projectIds = allProjects.map((p) => p.id);
  let permitsByProject: Record<string, { total: number; completed: number }> = {};

  if (projectIds.length > 0) {
    const { data: allPermits } = await supabase
      .from("project_permits")
      .select("project_id, status")
      .in("project_id", projectIds);

    if (allPermits) {
      for (const permit of allPermits) {
        if (!permitsByProject[permit.project_id]) {
          permitsByProject[permit.project_id] = { total: 0, completed: 0 };
        }
        permitsByProject[permit.project_id].total++;
        if (permit.status === "issued" || permit.status === "approved") {
          permitsByProject[permit.project_id].completed++;
        }
      }
    }
  }

  // Fetch document count
  let totalDocs = 0;
  if (projectIds.length > 0) {
    const { count } = await supabase
      .from("project_documents")
      .select("*", { count: "exact", head: true })
      .in("project_id", projectIds);
    totalDocs = count ?? 0;
  }

  // Calculate stats
  const totalProjects = allProjects.length;
  const permitsInProgress = Object.values(permitsByProject).reduce(
    (sum, p) => sum + (p.total - p.completed),
    0
  );

  const { data: dashProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();

  const firstName =
    dashProfile?.full_name?.trim().split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your active projects
        </p>
      </div>

      {/* Stats row */}
      {allProjects.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-3xl font-bold text-primary">{totalProjects}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Projects
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-3xl font-bold text-primary">{permitsInProgress}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Permits in Progress
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-3xl font-bold text-primary">{totalDocs}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Documents Uploaded
            </p>
          </div>
        </div>
      )}

      {/* Projects */}
      {allProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-border bg-card py-20">
          <Building2 className="size-12 text-muted-foreground/40" strokeWidth={1} />
          <p className="mt-4 font-semibold text-foreground">No projects yet</p>
          <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
            Create your first project to generate a complete permit workflow
          </p>
          <Button
            asChild
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150"
          >
            <Link href="/projects/new">Create Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => {
            const permits = permitsByProject[project.id] ?? { total: 0, completed: 0 };
            const progressPct = permits.total > 0
              ? Math.round((permits.completed / permits.total) * 100)
              : 0;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="group rounded-md border border-border bg-card p-5 transition-all duration-150 hover:scale-[1.01] hover:border-primary/30">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground leading-tight">
                      {project.address}
                    </p>
                    <span className="shrink-0 rounded-sm bg-secondary px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-secondary-foreground">
                      {PROJECT_TYPE_LABELS[project.project_type] ?? project.project_type}
                    </span>
                  </div>

                  {/* Permit progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {permits.completed} of {permits.total} permits
                      </span>
                      <span className="text-xs text-muted-foreground">{progressPct}%</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(project.created_at)}
                    </span>
                    {project.user_id !== user!.id && (
                      <span className="status-stamp bg-blue-950 text-blue-300">
                        Invited
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
