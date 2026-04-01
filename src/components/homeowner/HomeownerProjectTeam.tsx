"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { postToMarketplace } from "@/lib/actions/homeowner-projects"
import { acceptBid } from "@/lib/actions/bids"
import { inviteHomeownerTeamMember } from "@/lib/actions/team"
import {
  Globe,
  Mail,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  Star,
} from "lucide-react"

const ROLES = [
  {
    role: "contractor",
    label: "General Contractor",
    description: "Leads all construction work",
  },
  {
    role: "architect",
    label: "Architect",
    description: "Design, drawings, and permitting",
  },
  {
    role: "engineer",
    label: "Structural Engineer",
    description: "Foundation and structural systems",
  },
  {
    role: "inspector",
    label: "Inspector",
    description: "Code compliance review",
    noMarketplace: true,
  },
  {
    role: "client",
    label: "Co-Owner / Spouse",
    description: "Additional project owner",
    noMarketplace: true,
  },
]

export function HomeownerProjectTeam({
  project,
  bids,
  isPosted,
  isContractorSelected,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bids: any[]
  isPosted: boolean
  isContractorSelected: boolean
}) {
  const router = useRouter()
  const [postPending, startPost] = useTransition()
  const [expandedRole, setExpandedRole] = useState<string | null>(
    "contractor"
  )
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [invitePending, setInvitePending] = useState<Record<string, boolean>>(
    {}
  )
  const [inviteSuccess, setInviteSuccess] = useState<Record<string, boolean>>(
    {}
  )
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({})
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bidsByRole: Record<string, any[]> = {}
  for (const bid of bids) {
    const r = bid.bidder_role ?? "contractor"
    if (!bidsByRole[r]) bidsByRole[r] = []
    bidsByRole[r].push(bid)
  }

  function handlePost() {
    startPost(async () => {
      await postToMarketplace(project.id)
      router.refresh()
    })
  }

  async function handleInvite(role: string) {
    const email = emails[role]?.trim()
    if (!email) return
    setInvitePending((p) => ({ ...p, [role]: true }))
    setInviteErrors((e) => ({ ...e, [role]: "" }))
    const formData = new FormData()
    formData.set("email", email)
    formData.set("role", role)
    formData.set("projectId", project.id)
    const result = await inviteHomeownerTeamMember(formData)
    setInvitePending((p) => ({ ...p, [role]: false }))
    if (result?.error) {
      setInviteErrors((e) => ({ ...e, [role]: result.error! }))
    } else {
      setInviteSuccess((s) => ({ ...s, [role]: true }))
      setEmails((em) => ({ ...em, [role]: "" }))
    }
  }

  async function handleAcceptBid(bidId: string) {
    setAcceptingBid(bidId)
    await acceptBid(bidId)
    setAcceptingBid(null)
    router.refresh()
  }

  const totalPending = bids.filter((b) => b.status === "pending").length

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Build Your Team
          </h2>
          {totalPending > 0 && (
            <p className="mt-0.5 text-xs text-primary">
              {totalPending} bid{totalPending > 1 ? "s" : ""} waiting for
              review
            </p>
          )}
        </div>
        {!isContractorSelected && (
          <div>
            {isPosted ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Globe className="size-3" />
                Live on marketplace
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={handlePost}
                disabled={postPending}
              >
                {postPending ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Globe className="mr-1 size-3" />
                )}
                Post to Marketplace
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-border/50">
        {ROLES.map(({ role, label, description, noMarketplace }) => {
          const roleBids = bidsByRole[role] ?? []
          const accepted = roleBids.find((b) => b.status === "accepted")
          const pending = roleBids.filter((b) => b.status === "pending")
          const isExpanded = expandedRole === role

          return (
            <div key={role}>
              <button
                className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-muted/30"
                onClick={() =>
                  !isContractorSelected &&
                  setExpandedRole(isExpanded ? null : role)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      accepted
                        ? "border border-green-900 bg-green-950 text-green-400"
                        : pending.length > 0
                          ? "border border-primary/30 bg-primary/10 text-primary"
                          : "border border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {accepted
                      ? (accepted.profile?.full_name
                          ?.charAt(0)
                          ?.toUpperCase() ?? "✓")
                      : role.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium leading-tight">
                      {accepted
                        ? (accepted.profile?.full_name ?? label)
                        : label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {accepted
                        ? (accepted.profile?.company_name ?? label)
                        : description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {accepted && (
                    <span className="rounded-sm bg-green-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                      Selected
                    </span>
                  )}
                  {!accepted && pending.length > 0 && (
                    <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {pending.length} bid{pending.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {!accepted &&
                    pending.length === 0 &&
                    !isContractorSelected && (
                      <span className="text-xs text-muted-foreground">
                        Open
                      </span>
                    )}
                  {!isContractorSelected &&
                    !accepted &&
                    (isExpanded ? (
                      <ChevronUp className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    ))}
                </div>
              </button>

              {isExpanded && !isContractorSelected && !accepted && (
                <div className="flex flex-col gap-3 bg-muted/10 px-5 pb-4">
                  {pending.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Bids Received
                      </p>
                      {pending.map((bid) => (
                        <div
                          key={bid.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">
                                {bid.profile?.full_name ?? "Professional"}
                              </p>
                              {bid.profile?.avg_rating > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-400">
                                  <Star className="size-2.5 fill-amber-400" />
                                  {Number(bid.profile.avg_rating).toFixed(1)}
                                </span>
                              )}
                            </div>
                            {bid.profile?.company_name && (
                              <p className="text-xs text-muted-foreground">
                                {bid.profile.company_name}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-3">
                              <span className="flex items-center gap-1 text-sm font-bold text-primary">
                                <DollarSign className="size-3" />
                                {bid.quote_amount?.toLocaleString()}
                              </span>
                              {bid.timeline_weeks && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3" />
                                  {bid.timeline_weeks} weeks
                                </span>
                              )}
                            </div>
                            {bid.cover_letter && (
                              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                                {bid.cover_letter}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="h-7 shrink-0 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                            disabled={acceptingBid === bid.id}
                            onClick={() => handleAcceptBid(bid.id)}
                          >
                            {acceptingBid === bid.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Accept"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!noMarketplace && (
                    <div className="rounded-md border border-border/60 bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="size-3.5 text-primary" />
                          <span className="text-sm font-medium">
                            Post to Marketplace
                          </span>
                          <span className="text-xs text-muted-foreground">
                            — get competitive bids
                          </span>
                        </div>
                        {isPosted ? (
                          <span className="text-xs text-primary">Live</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={handlePost}
                            disabled={postPending}
                          >
                            {postPending ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Post"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-border/60 bg-card p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Invite someone you know
                      </span>
                    </div>
                    {inviteSuccess[role] ? (
                      <p className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="size-3" />
                        Invitation sent
                      </p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            value={emails[role] ?? ""}
                            onChange={(e) =>
                              setEmails((em) => ({
                                ...em,
                                [role]: e.target.value,
                              }))
                            }
                            placeholder={`${label.toLowerCase()}@example.com`}
                            className="h-8 flex-1 text-xs"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleInvite(role)
                            }
                          />
                          <Button
                            size="sm"
                            className="h-8 bg-primary text-xs text-primary-foreground"
                            onClick={() => handleInvite(role)}
                            disabled={
                              invitePending[role] || !emails[role]?.trim()
                            }
                          >
                            {invitePending[role] ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Invite"
                            )}
                          </Button>
                        </div>
                        {inviteErrors[role] && (
                          <p className="mt-1 text-xs text-destructive">
                            {inviteErrors[role]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
