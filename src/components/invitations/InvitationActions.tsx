"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { acceptInvitation, declineInvitation } from "@/lib/actions/team"

export function InvitationActions({
  inviteId,
  projectId,
}: {
  inviteId: string
  projectId: string
}) {
  const [acceptPending, startAccept] = useTransition()
  const [declinePending, startDecline] = useTransition()
  const [done, setDone] = useState<"accepted" | "declined" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (done === "declined") {
    return (
      <p className="text-sm italic text-muted-foreground">
        Invitation declined.
      </p>
    )
  }

  function handleAccept() {
    setError(null)
    startAccept(async () => {
      const result = await acceptInvitation(inviteId, projectId)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(`/projects/${projectId}`)
      }
    })
  }

  function handleDecline() {
    setError(null)
    startDecline(async () => {
      const result = await declineInvitation(inviteId)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone("declined")
        setTimeout(() => router.refresh(), 300)
      }
    })
  }

  return (
    <div>
      <div className="flex gap-3">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleAccept}
          disabled={acceptPending || declinePending}
        >
          {acceptPending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <CheckCircle className="mr-1.5 size-3.5" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecline}
          disabled={acceptPending || declinePending}
        >
          {declinePending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <XCircle className="mr-1.5 size-3.5" />
          )}
          Decline
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
