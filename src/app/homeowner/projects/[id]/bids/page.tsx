import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import { AcceptBidButton } from "@/components/homeowner/AcceptBidButton"
import { ArrowLeft, Star } from "lucide-react"
import type { HomeownerProject } from "@/lib/types"

const USER_TYPE_LABELS: Record<string, string> = {
  contractor: "Contractor",
  architect: "Architect",
  engineer: "Engineer",
  inspector: "Inspector",
}

export default async function BidsPage({
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

  const { data: bids } = await supabase
    .from("bids")
    .select("*")
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: false })

  // Get bidder profiles
  const bidderIds = (bids ?? []).map((b) => b.bidder_id)
  let profiles: Record<string, { full_name: string | null; company_name: string | null; user_type: string | null; license_number: string | null; avg_rating: number | null; total_reviews: number | null }> = {}
  if (bidderIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, user_type, license_number, avg_rating, total_reviews")
      .in("id", bidderIds)
    if (profileData) {
      for (const p of profileData) {
        profiles[p.id] = p
      }
    }
  }

  const hasAccepted = (bids ?? []).some((b) => b.status === "accepted")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/homeowner/projects/${id}/explore`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 inline size-3" />
          Back to project
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Bids Received</h1>
          <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {(bids ?? []).length}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {hp.address.replace(/, USA$/, "")}
        </p>
      </div>

      {hasAccepted && (
        <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-4">
          <p className="text-sm font-semibold text-green-300">
            Contractor selected — your project is moving forward.
          </p>
        </div>
      )}

      {(!bids || bids.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16">
          <p className="text-lg font-semibold">No bids yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your project has been posted — contractors will submit bids when
            they find it.
          </p>
          <Link
            href={`/homeowner/projects/${id}/explore`}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to project →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bids.map((bid) => {
            const p = profiles[bid.bidder_id]
            return (
              <div
                key={bid.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {p?.full_name ?? "Unknown"}
                      </span>
                      {p?.company_name && (
                        <span className="text-xs text-muted-foreground">
                          · {p.company_name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {USER_TYPE_LABELS[p?.user_type ?? ""] ??
                          p?.user_type ?? "Professional"}
                      </span>
                      {p?.license_number && (
                        <span className="text-[10px] text-green-400">
                          License #{p.license_number} ✓
                        </span>
                      )}
                      {p?.avg_rating && (
                        <span className="flex items-center gap-0.5 text-xs">
                          <Star className="size-3 fill-primary text-primary" />
                          {Number(p.avg_rating).toFixed(1)}
                          <span className="text-muted-foreground">
                            ({p.total_reviews ?? 0})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={bid.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Quote</p>
                    <p className="text-xl font-bold text-primary">
                      ${bid.quote_amount?.toLocaleString()}
                    </p>
                  </div>
                  {bid.timeline_weeks && (
                    <div>
                      <p className="text-xs text-muted-foreground">Timeline</p>
                      <p className="text-sm font-medium">
                        {bid.timeline_weeks} weeks
                      </p>
                    </div>
                  )}
                </div>

                {bid.cover_letter && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {bid.cover_letter}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/marketplace/profile/${bid.bidder_id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View Profile →
                  </Link>
                  {bid.status === "pending" && !hasAccepted && (
                    <AcceptBidButton bidId={bid.id} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
