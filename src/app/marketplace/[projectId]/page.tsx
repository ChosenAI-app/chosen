import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import { BidForm } from "@/components/marketplace/BidForm"
import {
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowLeft,
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

export default async function MarketplaceProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
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
    .eq("id", projectId)
    .eq("status", "posted_to_marketplace")
    .maybeSingle()

  if (!project) {
    notFound()
  }

  const hp = project as HomeownerProject

  // Check if user already has a bid
  const { data: existingBid } = await supabase
    .from("bids")
    .select("*")
    .eq("homeowner_project_id", projectId)
    .eq("bidder_id", user.id)
    .maybeSingle()

  // Get user profile for pre-filling bid form
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle()

  const isOwner = hp.homeowner_id === user.id
  const showFullAddress = !!existingBid || isOwner

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/marketplace"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 inline size-3" />
          Back to marketplace
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {showFullAddress
            ? hp.address.replace(/, USA$/, "")
            : "Street withheld until bid submitted"}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
            {PROJECT_TYPE_LABELS[hp.project_type] ?? hp.project_type}
          </span>
          <StatusBadge status={hp.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left — Project details */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* Property data */}
          {(hp.lot_size_sqft || hp.zoning || hp.year_built) && (
            <div className="rounded-md border border-border bg-card p-4">
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
                    <p className="text-xs text-muted-foreground">Structure</p>
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

          {hp.ai_scope_summary && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <FileCheck className="size-3.5" />
                Project Scope
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {hp.ai_scope_summary}
              </p>
            </div>
          )}

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
                    {hp.ai_timeline_weeks_low}–{hp.ai_timeline_weeks_high} weeks
                  </p>
                </div>
              )}
            </div>
          )}

          {hp.ai_permit_checklist && hp.ai_permit_checklist.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Required Permits
              </h3>
              <div className="mt-3 flex flex-col">
                {(hp.ai_permit_checklist as { name: string; description: string }[]).map(
                  (permit, i) => (
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
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Bid form */}
        <div className="lg:col-span-5">
          {isOwner ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                This is your project. View bids on your{" "}
                <Link
                  href={`/homeowner/projects/${projectId}/bids`}
                  className="text-primary underline"
                >
                  bids page
                </Link>
                .
              </p>
            </div>
          ) : existingBid ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your Bid
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quote</span>
                  <span className="text-lg font-bold text-primary">
                    ${existingBid.quote_amount?.toLocaleString()}
                  </span>
                </div>
                {existingBid.timeline_weeks && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Timeline
                    </span>
                    <span className="text-sm font-medium">
                      {existingBid.timeline_weeks} weeks
                    </span>
                  </div>
                )}
                <div className="mt-2">
                  <StatusBadge status={existingBid.status} />
                </div>
                {existingBid.cover_letter && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {existingBid.cover_letter}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <BidForm
              projectId={projectId}
              userType={profile?.user_type ?? "contractor"}
            />
          )}
        </div>
      </div>
    </div>
  )
}
