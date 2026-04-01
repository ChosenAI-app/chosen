import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import { MapSection } from "@/components/homeowner/MapSection"
import { ContractorChatWindow } from "@/components/contractor/ContractorChatWindow"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronRight,
} from "lucide-react"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU / JADU",
  addition: "Residential Addition",
  remodel: "Remodel",
}

export default async function ContractorExplorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!project) notFound()

  // Parse AI scope from scope_description if it's JSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let aiScope: any = null
  try {
    const parsed = JSON.parse(project.scope_description ?? "{}")
    if (parsed.ai_scope) aiScope = parsed.ai_scope
  } catch {
    // Not JSON — original text description
  }

  const hasMapCoords = project.map_lat !== null && project.map_lng !== null
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to projects
        </Link>
        <Button
          asChild
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href={`/projects/${id}`}>
            Continue to Dashboard
            <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {project.address?.replace(/, USA$/, "")}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
            {PROJECT_TYPE_LABELS[project.project_type] ?? project.project_type}
          </span>
          {aiScope ? (
            <StatusBadge status="scope_ready" />
          ) : (
            <StatusBadge status="ai_processing" />
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left — 3D map + chat */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="relative h-[500px] overflow-hidden rounded-lg border border-border">
            <MapSection
              lat={hasMapCoords ? Number(project.map_lat) : null}
              lng={hasMapCoords ? Number(project.map_lng) : null}
              parcelGeometry={null}
              apiKey={apiKey}
              isProcessing={false}
            />
          </div>

          {/* Property data strip */}
          {(project.lot_size_sqft ||
            project.zoning ||
            project.year_built ||
            project.apn) && (
            <div className="rounded-md border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Parcel Data
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {project.apn && (
                  <div>
                    <p className="text-xs text-muted-foreground">APN</p>
                    <p className="font-mono text-sm font-medium">
                      {project.apn}
                    </p>
                  </div>
                )}
                {project.lot_size_sqft && (
                  <div>
                    <p className="text-xs text-muted-foreground">Lot Size</p>
                    <p className="text-sm font-medium">
                      {project.lot_size_sqft.toLocaleString()} SF
                    </p>
                  </div>
                )}
                {project.year_built && (
                  <div>
                    <p className="text-xs text-muted-foreground">Year Built</p>
                    <p className="text-sm font-medium">{project.year_built}</p>
                  </div>
                )}
                {project.zoning && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Property Type
                    </p>
                    <p className="text-sm font-medium">
                      {project.zoning_description ?? project.zoning}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <ContractorChatWindow projectId={project.id} />
        </div>

        {/* Right — Scope panel */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {aiScope ? (
            <>
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Project Brief
                </h2>
                <p className="text-sm leading-relaxed text-foreground">
                  {aiScope.scope_summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="size-3.5" />
                    Estimated Cost
                  </div>
                  <p className="text-xl font-bold text-primary">
                    ${(aiScope.cost_estimate_low / 1000).toFixed(0)}k–$
                    {(aiScope.cost_estimate_high / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    Timeline
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {aiScope.timeline_weeks_low}–{aiScope.timeline_weeks_high}{" "}
                    weeks
                  </p>
                </div>
              </div>

              {aiScope.permit_checklist?.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Required Permits
                  </h3>
                  <div className="flex flex-col gap-2">
                    {aiScope.permit_checklist.map(
                      (
                        permit: {
                          name: string
                          description: string
                          required: boolean
                        },
                        i: number
                      ) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className={`mt-0.5 size-4 shrink-0 ${permit.required ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <div>
                            <p className="text-sm font-medium">{permit.name}</p>
                            {permit.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {permit.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {aiScope.key_risks && (
                <div className="rounded-lg border border-amber-900/30 bg-amber-950/20 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                      Key Risks
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-amber-200/80">
                    {aiScope.key_risks}
                  </p>
                </div>
              )}

              {aiScope.recommended_team && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Recommended Team
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {aiScope.recommended_team}
                  </p>
                </div>
              )}

              {aiScope.feasibility_notes && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Feasibility Notes
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {aiScope.feasibility_notes}
                  </p>
                </div>
              )}

              <Button
                asChild
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href={`/projects/${id}`}>
                  Continue to Project Dashboard
                  <ChevronRight className="ml-2 size-4" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20">
                <div className="size-3 animate-pulse rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-semibold">Generating project brief...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI is analyzing permits, costs, and feasibility. This takes
                  about 30 seconds.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                You can proceed to the dashboard now or wait for the full
                analysis.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/projects/${id}`}>Skip to Dashboard →</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
