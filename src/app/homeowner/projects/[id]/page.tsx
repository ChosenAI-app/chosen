import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { HomeownerTeamSection } from "@/components/homeowner/HomeownerTeamSection"
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

export default async function HomeownerProjectPage({
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

  const hp = project as HomeownerProject
  const isPosted = hp.status === "posted_to_marketplace"
  const isContractorSelected = hp.status === "contractor_selected"

  // Get bids on this project
  const { data: bids } = await supabase
    .from("bids")
    .select("*")
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: false })

  // Get bidder profiles
  const bidderIds = (bids ?? []).map((b) => b.bidder_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bidderProfiles: Record<string, any> = {}
  if (bidderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, user_type")
      .in("id", bidderIds)
    if (profiles) {
      for (const p of profiles) {
        bidderProfiles[p.id] = p
      }
    }
  }

  // Attach profiles to bids
  const bidsWithProfiles = (bids ?? []).map((b) => ({
    ...b,
    profiles: bidderProfiles[b.bidder_id] ?? null,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
          {hp.address?.replace(/, USA$/, "")}
        </h1>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
            {PROJECT_TYPE_LABELS[hp.project_type] ?? hp.project_type}
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

      {/* Property data */}
      {(hp.lot_size_sqft || hp.zoning || hp.year_built) && (
        <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-4">
          {hp.lot_size_sqft && (
            <div>
              <p className="text-xs text-muted-foreground">Lot Size</p>
              <p className="text-sm font-medium">
                {hp.lot_size_sqft.toLocaleString()} SF
              </p>
            </div>
          )}
          {hp.year_built && (
            <div>
              <p className="text-xs text-muted-foreground">Year Built</p>
              <p className="text-sm font-medium">{hp.year_built}</p>
            </div>
          )}
          {hp.zoning_description && (
            <div>
              <p className="text-xs text-muted-foreground">Property Type</p>
              <p className="text-sm font-medium">{hp.zoning_description}</p>
            </div>
          )}
          {hp.regrid_parcel_id && (
            <div>
              <p className="text-xs text-muted-foreground">APN</p>
              <p className="font-mono text-sm font-medium">
                {hp.regrid_parcel_id}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contractor selected banner */}
      {isContractorSelected && hp.contractor_project_id && (
        <div className="flex items-center justify-between rounded-lg border border-green-900/50 bg-green-950/20 p-4">
          <div>
            <p className="font-semibold text-green-400">
              Contractor selected
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your project is now being managed. You have read-only access to
              the project dashboard.
            </p>
          </div>
          <Link
            href={`/projects/${hp.contractor_project_id}`}
            className="ml-4 shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View Project Dashboard →
          </Link>
        </div>
      )}

      {/* Team / Bid section */}
      <HomeownerTeamSection
        projectId={hp.id}
        bids={bidsWithProfiles}
        isPosted={isPosted}
        isContractorSelected={isContractorSelected}
      />
    </div>
  )
}
