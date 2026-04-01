import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowRight } from "lucide-react"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU",
  jadu: "Junior ADU",
  addition: "Addition",
  remodel: "Remodel",
  new_construction: "New Construction",
  conversion: "Conversion",
}

function cleanAddress(address: string): string {
  return address.replace(/, USA$/, "")
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("homeowner_projects")
    .select("id, address, project_type, lot_size_sqft, ai_cost_estimate_low, ai_cost_estimate_high, created_at, status")
    .eq("status", "posted_to_marketplace")
    .order("created_at", { ascending: false })

  // Get bid counts
  const projectIds = (projects ?? []).map((p) => p.id)
  let bidCounts: Record<string, number> = {}
  if (projectIds.length > 0) {
    const { data: bids } = await supabase
      .from("bids")
      .select("homeowner_project_id")
      .in("homeowner_project_id", projectIds)

    if (bids) {
      for (const b of bids) {
        bidCounts[b.homeowner_project_id] =
          (bidCounts[b.homeowner_project_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse Palo Alto residential projects looking for professionals.
        </p>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16">
          <p className="text-lg font-semibold">No projects posted yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — homeowners are submitting projects daily.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/marketplace/${project.id}`}
              className="group rounded-lg border border-border bg-card p-5 transition-all duration-150 hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                      {PROJECT_TYPE_LABELS[project.project_type] ??
                        project.project_type}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>
                  <h3 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cleanAddress(project.address)}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {project.lot_size_sqft && (
                      <span>
                        ~{project.lot_size_sqft.toLocaleString()} SF lot
                      </span>
                    )}
                    {project.ai_cost_estimate_low &&
                      project.ai_cost_estimate_high && (
                        <span>
                          $
                          {project.ai_cost_estimate_low.toLocaleString()}–$
                          {project.ai_cost_estimate_high.toLocaleString()}{" "}
                          estimated
                        </span>
                      )}
                    <span>{timeAgo(project.created_at)}</span>
                    <span>
                      {bidCounts[project.id] ?? 0} bid
                      {(bidCounts[project.id] ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
