import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, MapPin } from "lucide-react"
import type { HomeownerProject } from "@/lib/types"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU",
  jadu: "Junior ADU",
  addition: "Addition",
  remodel: "Remodel",
  new_construction: "New Construction",
  conversion: "Conversion",
}

export default async function HomeownerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there"

  const { data: projects } = await supabase
    .from("homeowner_projects")
    .select("*")
    .eq("homeowner_id", user.id)
    .order("created_at", { ascending: false })

  const typedProjects = (projects ?? []) as HomeownerProject[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your residential construction projects.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/start">
            <Plus className="mr-1.5 size-3.5" />
            New Project
          </Link>
        </Button>
      </div>

      {typedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16">
          <MapPin className="size-10 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start by entering your address to get an AI-powered project plan.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/start">
              Start Your Project
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {typedProjects.map((project) => (
            <Link
              key={project.id}
              href={`/homeowner/projects/${project.id}/explore`}
              className="group rounded-lg border border-border bg-card p-5 transition-all duration-150 hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                    {project.address}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-sm bg-secondary px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-secondary-foreground">
                      {PROJECT_TYPE_LABELS[project.project_type] ??
                        project.project_type}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {project.ai_cost_estimate_low &&
                      project.ai_cost_estimate_high && (
                        <span>
                          Est. $
                          {project.ai_cost_estimate_low.toLocaleString()}–$
                          {project.ai_cost_estimate_high.toLocaleString()}
                        </span>
                      )}
                    <span>
                      {new Date(project.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
