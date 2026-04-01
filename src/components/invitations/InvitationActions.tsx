"use client"

import { useTransition } from "react"
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
  const router = useRouter()

  function handleAccept() {
    startAccept(async () => {
      const result = await acceptInvitation(inviteId, projectId)
      if (result?.error) {
        alert(result.error)
      } else {
        router.push(`/projects/${projectId}`)
      }
    })
  }

  function handleDecline() {
    startDecline(async () => {
      await declineInvitation(inviteId)
      router.refresh()
    })
  }

  return (
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
  )
}
