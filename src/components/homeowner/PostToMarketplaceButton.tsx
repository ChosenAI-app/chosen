"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { postToMarketplace } from "@/lib/actions/homeowner-projects"
import { Button } from "@/components/ui/button"
import { Loader2, Users } from "lucide-react"

export function PostToMarketplaceButton({
  projectId,
}: {
  projectId: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handlePost() {
    startTransition(async () => {
      const result = await postToMarketplace(projectId)
      if (!result.error) {
        router.refresh()
      }
    })
  }

  return (
    <Button
      onClick={handlePost}
      disabled={isPending}
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          Posting...
        </>
      ) : (
        <>
          <Users className="mr-1.5 size-3.5" />
          Post to Marketplace
        </>
      )}
    </Button>
  )
}
