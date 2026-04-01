import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU",
  jadu: "Junior ADU",
  addition: "Addition",
  remodel: "Remodel",
  new_construction: "New Construction",
  conversion: "Conversion",
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just posted"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("homeowner_projects")
    .select(
      "id, address, project_type, lot_size_sqft, year_built, ai_cost_estimate_low, ai_cost_estimate_high, created_at, status"
    )
    .eq("status", "posted_to_marketplace")
    .order("created_at", { ascending: false })

  // Get bid counts
  const projectIds = (projects ?? []).map((p) => p.id)
  const bidCounts: Record<string, number> = {}
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

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16">
          <p className="text-lg font-semibold">No projects posted yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — homeowners are submitting projects daily.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/marketplace/${project.id}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]"
            >
              {/* Amber gradient bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

              {/* Map placeholder */}
              <div className="relative flex h-32 items-center justify-center overflow-hidden bg-[#0a0d14]">
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="absolute left-8 top-4 h-6 w-10 rounded-sm bg-zinc-700/60" />
                <div className="absolute left-20 top-3 h-9 w-7 rounded-sm bg-zinc-700/40" />
                <div className="absolute right-10 top-5 h-5 w-12 rounded-sm bg-zinc-700/50" />
                <div className="absolute bottom-6 left-12 h-7 w-8 rounded-sm bg-zinc-700/40" />
                <div className="absolute bottom-4 right-16 h-6 w-10 rounded-sm bg-zinc-700/50" />
                <div className="relative">
                  <div className="absolute inset-0 -m-6 animate-pulse rounded-full border border-primary/20" />
                  <div className="size-3 rounded-full bg-primary shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                </div>
                <div className="absolute right-2 top-2 rounded border border-border/50 bg-black/70 px-2 py-0.5 backdrop-blur-sm">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                    {PROJECT_TYPE_LABELS[project.project_type] ??
                      project.project_type}
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <h3 className="text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                  {project.address?.replace(/, USA$/, "")}
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {project.lot_size_sqft && (
                    <div className="rounded bg-muted/50 px-2 py-1.5">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        Lot Size
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">
                        {project.lot_size_sqft.toLocaleString()} SF
                      </p>
                    </div>
                  )}
                  {project.year_built && (
                    <div className="rounded bg-muted/50 px-2 py-1.5">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        Year Built
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">
                        {project.year_built}
                      </p>
                    </div>
                  )}
                </div>

                {project.ai_cost_estimate_low &&
                  project.ai_cost_estimate_high && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Est. Budget
                      </span>
                      <span className="text-sm font-bold text-primary">
                        $
                        {Math.round(project.ai_cost_estimate_low / 1000)}
                        k–$
                        {Math.round(project.ai_cost_estimate_high / 1000)}k
                      </span>
                    </div>
                  )}

                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-xs text-muted-foreground">
                    {bidCounts[project.id] ?? 0} bid
                    {(bidCounts[project.id] ?? 0) !== 1 ? "s" : ""} so far
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(project.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
