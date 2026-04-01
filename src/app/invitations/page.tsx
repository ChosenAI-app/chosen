import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { GlobalNav } from "@/components/shared/GlobalNav"
import { InvitationActions } from "@/components/invitations/InvitationActions"
import { StatusBadge } from "@/components/ui/status-badge"
import { MapPin, User } from "lucide-react"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU",
  addition: "Addition",
  remodel: "Remodel",
}

const ROLE_LABELS: Record<string, string> = {
  contractor: "General Contractor",
  co_owner: "Co-Owner",
  architect: "Architect",
  engineer: "Engineer",
  inspector: "Inspector",
  client: "Client",
}

export default async function InvitationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .maybeSingle()

  // Find all invitations for this user's email
  const { data: invitations } = await supabase
    .from("team_members")
    .select("id, project_id, role, invite_status, invited_at")
    .eq("invited_email", user.email!)
    .order("invited_at", { ascending: false })

  // Fetch project details via admin (RLS blocks non-owners from reading projects)
  const admin = createAdminClient()
  const projectIds = [
    ...new Set((invitations ?? []).map((i) => i.project_id)),
  ]
  let projectMap: Record<
    string,
    { address: string; project_type: string; user_id: string }
  > = {}
  if (projectIds.length > 0) {
    const { data: projects } = await admin
      .from("projects")
      .select("id, address, project_type, user_id")
      .in("id", projectIds)
    if (projects) {
      for (const p of projects) {
        projectMap[p.id] = p
      }
    }
  }

  // Fetch inviter names
  const inviterIds = [
    ...new Set(Object.values(projectMap).map((p) => p.user_id)),
  ]
  let inviterNames: Record<string, string> = {}
  if (inviterIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", inviterIds)
    if (profiles) {
      for (const p of profiles) {
        inviterNames[p.id] = p.full_name ?? "A contractor"
      }
    }
  }

  const pending =
    invitations?.filter((i) => i.invite_status === "pending") ?? []
  const past =
    invitations?.filter((i) => i.invite_status !== "pending") ?? []

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalNav user={user} profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review project collaboration invitations sent to {user.email}
          </p>
        </div>

        {pending.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pending ({pending.length})
            </h2>
            {pending.map((invite) => {
              const proj = projectMap[invite.project_id]
              const inviterName =
                inviterNames[proj?.user_id] ?? "A contractor"
              return (
                <div
                  key={invite.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-primary" />
                        <p className="font-semibold">
                          {proj?.address?.replace(/, USA$/, "") ??
                            "Unknown address"}
                        </p>
                      </div>
                      <p className="ml-6 text-sm text-muted-foreground">
                        {PROJECT_TYPE_LABELS[proj?.project_type ?? ""] ??
                          proj?.project_type}
                      </p>
                      <div className="ml-6 mt-1 flex items-center gap-2">
                        <User className="size-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Invited by {inviterName} · as{" "}
                          <span className="font-medium text-foreground">
                            {ROLE_LABELS[invite.role] ?? invite.role}
                          </span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status="pending" />
                  </div>

                  <InvitationActions
                    inviteId={invite.id}
                    projectId={invite.project_id}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No pending invitations.
            </p>
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-10 flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Past ({past.length})
            </h2>
            {past.map((invite) => {
              const proj = projectMap[invite.project_id]
              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4 opacity-60"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {proj?.address?.replace(/, USA$/, "") ?? "Unknown"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ROLE_LABELS[invite.role] ?? invite.role}
                    </p>
                  </div>
                  <StatusBadge status={invite.invite_status} />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
