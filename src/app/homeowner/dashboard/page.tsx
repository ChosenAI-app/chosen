import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { DeleteHomeownerProjectButton } from "@/components/homeowner/DeleteHomeownerProjectButton"
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

  // Fetch contractor projects where this homeowner is an accepted team member
  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("role, project_id")
    .eq("user_id", user.id)
    .eq("invite_status", "accepted")

  const contractorProjectIds = teamMemberships?.map((t) => t.project_id) ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let invitedProjects: any[] = []
  if (contractorProjectIds.length > 0) {
    const admin = createAdminClient()
    const { data } = await admin
      .from("projects")
      .select("*")
      .in("id", contractorProjectIds)
      .order("created_at", { ascending: false })
    invitedProjects = data ?? []
  }

  const CONTRACTOR_PROJECT_TYPE_LABELS: Record<string, string> = {
    adu_detached: "Detached ADU",
    adu_attached: "Attached ADU",
    addition: "Addition",
    remodel: "Remodel",
  }

  const ROLE_LABELS: Record<string, string> = {
    co_owner: "Co-Owner",
    architect: "Architect",
    engineer: "Engineer",
    inspector: "Inspector",
    client: "Client",
    contractor: "Contractor",
  }

  return (
    <div className="flex flex-col gap-8">
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
            <div
              key={project.id}
              className="rounded-lg border border-border bg-card p-5 transition-all duration-150 hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/homeowner/projects/${project.id}/explore`}
                  className="group min-w-0 flex-1"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                    {project.address.replace(/, USA$/, "")}
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
                </Link>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  <DeleteHomeownerProjectButton projectId={project.id} />
                  <Link href={`/homeowner/projects/${project.id}/explore`}>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 hover:translate-x-0.5 hover:text-primary" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contractor projects this homeowner has been invited to */}
      {invitedProjects.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Projects I&apos;m On
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Contractor projects you&apos;ve been invited to collaborate on.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {invitedProjects.map((project) => {
              const myRole = teamMemberships?.find(
                (t) => t.project_id === project.id
              )?.role
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-all duration-150 hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                      {project.address?.replace(/, USA$/, "") ??
                        "Unknown address"}
                    </p>
                    <span className="shrink-0 rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      {ROLE_LABELS[myRole ?? ""] ?? myRole}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {CONTRACTOR_PROJECT_TYPE_LABELS[project.project_type] ??
                      project.project_type}
                  </p>
                  {(project.lot_size_sqft || project.year_built) && (
                    <p className="text-xs text-muted-foreground">
                      {project.lot_size_sqft
                        ? `${project.lot_size_sqft.toLocaleString()} SF`
                        : ""}
                      {project.lot_size_sqft && project.year_built ? " · " : ""}
                      {project.year_built ? `Built ${project.year_built}` : ""}
                    </p>
                  )}
                  <span className="mt-auto text-xs font-medium text-primary">
                    View project →
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
