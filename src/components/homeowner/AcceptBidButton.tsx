"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { acceptBid } from "@/lib/actions/bids"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

export function AcceptBidButton({ bidId }: { bidId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptBid(bidId)
      if (!result.error) {
        router.refresh()
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Accept Bid
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Accept this bid?</AlertDialogTitle>
          <AlertDialogDescription>
            This will accept this bid and reject all others. The contractor will
            be notified and your project status will update to &quot;Contractor
            Selected&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAccept}
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Bid"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
