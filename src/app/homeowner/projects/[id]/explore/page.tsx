import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  MapPin,
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from "lucide-react"
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

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: project } = await supabase
    .from("homeowner_projects")
    .select("*")
    .eq("id", id)
    .eq("homeowner_id", user.id)
    .maybeSingle()

  if (!project) {
    notFound()
  }

  const hp = project as HomeownerProject
  const isProcessing = hp.status === "ai_processing"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/homeowner/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          <ArrowLeft className="mr-1 inline size-3" />
          Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {hp.address}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-sm bg-secondary px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-secondary-foreground">
            {PROJECT_TYPE_LABELS[hp.project_type] ?? hp.project_type}
          </span>
          <StatusBadge status={hp.status} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left — map placeholder */}
        <div className="lg:col-span-7">
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-card/50">
            <div className="text-center">
              <MapPin className="mx-auto size-10 text-primary/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                3D Map — Phase 3
              </p>
              {hp.map_lat && hp.map_lng && (
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {Number(hp.map_lat).toFixed(5)},{" "}
                  {Number(hp.map_lng).toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Property data */}
          {(hp.lot_size_sqft || hp.zoning || hp.year_built) && (
            <div className="mt-4 rounded-md border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Property Data
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {hp.lot_size_sqft && (
                  <div>
                    <p className="text-xs text-muted-foreground">Lot Size</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {hp.lot_size_sqft.toLocaleString()} SF
                    </p>
                  </div>
                )}
                {hp.existing_sqft && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Existing Structure
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {hp.existing_sqft.toLocaleString()} SF
                    </p>
                  </div>
                )}
                {hp.year_built && (
                  <div>
                    <p className="text-xs text-muted-foreground">Year Built</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {hp.year_built}
                    </p>
                  </div>
                )}
                {hp.zoning && (
                  <div>
                    <p className="text-xs text-muted-foreground">Zoning</p>
                    <p className="mt-0.5 text-sm font-medium">{hp.zoning}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — AI Scope Panel */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {isProcessing ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-col items-center py-8">
                <div className="size-10 animate-pulse rounded-full bg-primary/20" />
                <p className="mt-4 font-semibold">
                  Analyzing your property...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI is generating your project scope, permits, and cost
                  estimates. This usually takes under 60 seconds.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Refresh the page to check for updates.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Scope summary */}
              {hp.ai_scope_summary && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <FileCheck className="size-3.5" />
                    AI Project Scope
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {hp.ai_scope_summary}
                  </p>
                </div>
              )}

              {/* Cost + Timeline */}
              {(hp.ai_cost_estimate_low || hp.ai_timeline_weeks_low) && (
                <div className="grid grid-cols-2 gap-4">
                  {hp.ai_cost_estimate_low && hp.ai_cost_estimate_high && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DollarSign className="size-3" />
                        Estimated Cost
                      </div>
                      <p className="mt-1 text-lg font-bold text-primary">
                        ${hp.ai_cost_estimate_low.toLocaleString()}–$
                        {hp.ai_cost_estimate_high.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {hp.ai_timeline_weeks_low && hp.ai_timeline_weeks_high && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        Timeline
                      </div>
                      <p className="mt-1 text-lg font-bold text-primary">
                        {hp.ai_timeline_weeks_low}–
                        {hp.ai_timeline_weeks_high} weeks
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Permit checklist */}
              {hp.ai_permit_checklist && hp.ai_permit_checklist.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Required Permits
                  </h3>
                  <div className="mt-3 flex flex-col">
                    {hp.ai_permit_checklist.map((permit, i) => (
                      <div
                        key={i}
                        className="flex gap-3 border-b border-border/50 py-2.5 last:border-b-0"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{permit.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {permit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feasibility notes */}
              {hp.ai_feasibility_notes && (
                <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-5">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-yellow-400">
                    <AlertTriangle className="size-3.5" />
                    Feasibility Notes
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-yellow-200/80">
                    {hp.ai_feasibility_notes}
                  </p>
                </div>
              )}

              {/* Draft fallback */}
              {hp.status === "draft" && !hp.ai_scope_summary && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <p className="text-sm text-muted-foreground">
                    AI scope generation failed. You can retry by creating a new
                    project.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
