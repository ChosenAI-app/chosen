"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { acceptBid } from "@/lib/actions/bids"
import { Loader2, CheckCircle } from "lucide-react"

export function BidAcceptButton({ bidId }: { bidId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const result = await acceptBid(bidId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleAccept}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <CheckCircle className="mr-1.5 size-3.5" />
        )}
        Accept Bid
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
