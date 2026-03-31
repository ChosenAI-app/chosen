import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {user?.email}
      </h1>

      {allProjects.length === 0 ? (
        <p className="mt-2 text-muted-foreground">
          No projects yet.{" "}
          <Link
            href="/projects/new"
            className="text-foreground underline underline-offset-4"
          >
            Create your first project.
          </Link>
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent>
                  <p className="font-medium">{project.address}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">
                        {PROJECT_TYPE_LABELS[project.project_type] ??
                          project.project_type}
                      </Badge>
                      {project.user_id !== user!.id && (
                        <Badge variant="outline" className="text-xs">
                          Invited
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
