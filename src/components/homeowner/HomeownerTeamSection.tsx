"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { postToMarketplace } from "@/lib/actions/homeowner-projects"
import { acceptBid } from "@/lib/actions/bids"
import {
  Globe,
  Mail,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const ROLES = [
  {
    role: "contractor",
    label: "General Contractor",
    description: "Leads all construction work",
    hasMarketplace: true,
  },
  {
    role: "architect",
    label: "Architect",
    description: "Design and permit drawings",
    hasMarketplace: true,
  },
  {
    role: "engineer",
    label: "Structural Engineer",
    description: "Foundation and structural work",
    hasMarketplace: true,
  },
  {
    role: "inspector",
    label: "Inspector",
    description: "Code compliance review",
    hasMarketplace: false,
  },
  {
    role: "client",
    label: "Co-Owner / Spouse",
    description: "Additional project owner",
    hasMarketplace: false,
  },
]

export function HomeownerTeamSection({
  projectId,
  bids,
  isPosted,
  isContractorSelected,
}: {
  projectId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bids: any[]
  isPosted: boolean
  isContractorSelected: boolean
}) {
  const router = useRouter()
  const [postPending, startPost] = useTransition()
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  function handlePostToMarketplace() {
    startPost(async () => {
      await postToMarketplace(projectId)
      router.refresh()
    })
  }

  // Group bids by role
  const bidsByRole: Record<string, typeof bids> = {}
  for (const bid of bids) {
    const role = bid.bidder_role ?? "contractor"
    if (!bidsByRole[role]) bidsByRole[role] = []
    bidsByRole[role].push(bid)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Build Your Team
        </h2>
        {!isPosted && !isContractorSelected && (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePostToMarketplace}
            disabled={postPending}
            className="text-xs"
          >
            {postPending ? (
              <Loader2 className="mr-1.5 size-3 animate-spin" />
            ) : (
              <Globe className="mr-1.5 size-3" />
            )}
            Post to marketplace
          </Button>
        )}
        {isPosted && !isContractorSelected && (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Globe className="size-3" />
            Listed on marketplace
          </span>
        )}
      </div>

      <div className="flex flex-col divide-y divide-border/50">
        {ROLES.map(({ role, label, description, hasMarketplace }) => {
          const roleBids = bidsByRole[role] ?? []
          const acceptedBid = roleBids.find((b) => b.status === "accepted")
          const pendingBids = roleBids.filter((b) => b.status === "pending")
          const isExpanded = expandedRole === role

          return (
            <div key={role} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${
                      acceptedBid
                        ? "border border-green-900 bg-green-950 text-green-400"
                        : "border border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {acceptedBid
                      ? (acceptedBid.profiles?.full_name?.charAt(0) ??
                          role.charAt(0).toUpperCase())
                      : role.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {acceptedBid
                        ? (acceptedBid.profiles?.full_name ?? "Accepted")
                        : label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {acceptedBid
                        ? (acceptedBid.profiles?.company_name ?? label)
                        : description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {acceptedBid && (
                    <span className="rounded-sm bg-green-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                      Selected
                    </span>
                  )}
                  {!acceptedBid && pendingBids.length > 0 && (
                    <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {pendingBids.length} bid
                      {pendingBids.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {!isContractorSelected && !acceptedBid && (
                    <button
                      onClick={() =>
                        setExpandedRole(isExpanded ? null : role)
                      }
                      className="flex items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && !isContractorSelected && !acceptedBid && (
                <div className="ml-12 mt-4 flex flex-col gap-3">
                  {hasMarketplace && (
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="size-3.5 text-primary" />
                          <span className="text-sm font-medium">
                            Marketplace
                          </span>
                        </div>
                        {isPosted ? (
                          <span className="text-xs text-primary">
                            {pendingBids.length > 0
                              ? `${pendingBids.length} bid${pendingBids.length > 1 ? "s" : ""}`
                              : "Waiting for bids..."}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={handlePostToMarketplace}
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
                      {pendingBids.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {pendingBids.map((bid) => (
                            <BidCard
                              key={bid.id}
                              bid={bid}
                              onAccept={() => router.refresh()}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <DirectInviteSection
                    projectId={projectId}
                    role={role}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BidCard({
  bid,
  onAccept,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bid: any
  onAccept: () => void
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-start justify-between gap-3 rounded border border-border/50 bg-card p-3">
      <div>
        <p className="text-sm font-medium">
          {bid.profiles?.full_name ?? "Professional"}
        </p>
        {bid.profiles?.company_name && (
          <p className="text-xs text-muted-foreground">
            {bid.profiles.company_name}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3">
          <span className="text-sm font-bold text-primary">
            ${bid.quote_amount?.toLocaleString()}
          </span>
          {bid.timeline_weeks && (
            <span className="text-xs text-muted-foreground">
              {bid.timeline_weeks} weeks
            </span>
          )}
        </div>
        {bid.cover_letter && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {bid.cover_letter}
          </p>
        )}
      </div>
      <Button
        size="sm"
        className="h-7 shrink-0 bg-primary text-xs text-primary-foreground"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await acceptBid(bid.id)
            onAccept()
          })
        }}
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : "Accept"}
      </Button>
    </div>
  )
}

function DirectInviteSection({
  projectId,
  role,
}: {
  projectId: string
  role: string
}) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite() {
    if (!email.trim()) return
    setPending(true)
    setError(null)
    try {
      const { inviteHomeownerTeamMember } = await import(
        "@/lib/actions/team"
      )
      const formData = new FormData()
      formData.set("email", email.trim())
      formData.set("role", role)
      formData.set("projectId", projectId)
      const result = await inviteHomeownerTeamMember(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setEmail("")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Mail className="size-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">Invite directly by email</span>
      </div>
      {success ? (
        <p className="flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 className="size-3" />
          Invitation sent
        </p>
      ) : (
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contractor@example.com"
            className="h-7 flex-1 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <Button
            size="sm"
            className="h-7 bg-primary text-xs text-primary-foreground"
            onClick={handleInvite}
            disabled={pending || !email.trim()}
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : "Send"}
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
