import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { HomeownerProjectTeam } from "@/components/homeowner/HomeownerProjectTeam"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU",
  jadu: "Junior ADU",
  addition: "Addition",
  remodel: "Remodel",
  new_construction: "New Construction",
  conversion: "Conversion",
}

export default async function HomeownerProjectDashboard({
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
    .from("homeowner_projects")
    .select("*")
    .eq("id", id)
    .eq("homeowner_id", user.id)
    .maybeSingle()

  if (!project) notFound()

  // Get bids with bidder profiles
  const { data: bids } = await supabase
    .from("bids")
    .select(
      "id, bidder_id, bidder_role, quote_amount, timeline_weeks, cover_letter, status, created_at"
    )
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: false })

  const bidderIds = [...new Set(bids?.map((b) => b.bidder_id) ?? [])]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bidderProfiles: any[] = []
  if (bidderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, full_name, company_name, user_type, avg_rating, total_reviews"
      )
      .in("id", bidderIds)
    bidderProfiles = profiles ?? []
  }

  const bidsWithProfiles = (bids ?? []).map((bid) => ({
    ...bid,
    profile: bidderProfiles.find((p) => p.id === bid.bidder_id) ?? null,
  }))

  const isPosted = project.status === "posted_to_marketplace"
  const isContractorSelected = project.status === "contractor_selected"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/homeowner/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to projects
        </Link>
        <Link
          href={`/homeowner/projects/${id}/explore`}
          className="text-xs text-primary hover:underline"
        >
          View AI analysis →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {project.address?.replace(/, USA$/, "")}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
            {PROJECT_TYPE_LABELS[project.project_type] ?? project.project_type}
          </span>
          {isContractorSelected && (
            <span className="rounded-sm bg-green-950 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-green-400">
              Contractor Selected
            </span>
          )}
          {isPosted && !isContractorSelected && (
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-primary">
              On Marketplace
            </span>
          )}
        </div>
      </div>

      {(project.lot_size_sqft || project.zoning || project.year_built) && (
        <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-4">
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
          {project.zoning_description && (
            <div>
              <p className="text-xs text-muted-foreground">Property Type</p>
              <p className="text-sm font-medium">{project.zoning_description}</p>
            </div>
          )}
          {project.regrid_parcel_id && (
            <div>
              <p className="text-xs text-muted-foreground">APN</p>
              <p className="font-mono text-sm">{project.regrid_parcel_id}</p>
            </div>
          )}
        </div>
      )}

      {isContractorSelected && project.contractor_project_id && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-green-900/50 bg-green-950/20 p-4">
          <div>
            <p className="font-semibold text-green-400">
              Contractor selected
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your project is underway. You have read-only access to track
              progress.
            </p>
          </div>
          <Link
            href={`/projects/${project.contractor_project_id}`}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Track Project →
          </Link>
        </div>
      )}

      <HomeownerProjectTeam
        project={project}
        bids={bidsWithProfiles}
        isPosted={isPosted}
        isContractorSelected={isContractorSelected}
      />
    </div>
  )
}
