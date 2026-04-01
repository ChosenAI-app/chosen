import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Star } from "lucide-react"

const USER_TYPE_LABELS: Record<string, string> = {
  contractor: "General Contractor",
  architect: "Architect",
  engineer: "Engineer",
  inspector: "Inspector",
  homeowner: "Homeowner",
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (!profile) notFound()

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?"

  // Count accepted projects
  const { count: projectCount } = await supabase
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("bidder_id", userId)
    .eq("status", "accepted")

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile.full_name ?? "Unknown"}</h1>
            {profile.company_name && (
              <p className="text-sm text-muted-foreground">
                {profile.company_name}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                {USER_TYPE_LABELS[profile.user_type] ?? profile.user_type}
              </span>
              {profile.license_number && (
                <span className="rounded-sm bg-green-950 px-2 py-0.5 text-[0.65rem] font-semibold text-green-300">
                  License #{profile.license_number} ✓
                </span>
              )}
            </div>
            {profile.avg_rating && (
              <div className="mt-2 flex items-center gap-1">
                <Star className="size-3.5 fill-primary text-primary" />
                <span className="text-sm font-medium">
                  {Number(profile.avg_rating).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({profile.total_reviews ?? 0} reviews)
                </span>
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              About
            </h3>
            <p className="mt-2 text-sm text-foreground">{profile.bio}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Completed Projects</p>
            <p className="mt-0.5 text-lg font-bold text-primary">
              {projectCount ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="mt-0.5 text-sm font-medium">
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {profile.website_url && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">Website</p>
            <p className="mt-0.5 text-sm text-primary">{profile.website_url}</p>
          </div>
        )}
      </div>
    </div>
  )
}
