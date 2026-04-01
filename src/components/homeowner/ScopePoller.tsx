"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function ScopePoller({ projectId }: { projectId: string }) {
  const router = useRouter()
  const hasRefreshed = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (hasRefreshed.current) return

    intervalRef.current = setInterval(async () => {
      if (hasRefreshed.current) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      try {
        const res = await fetch(
          `/api/homeowner/project-status?id=${projectId}`
        )
        if (!res.ok) return
        const { status } = await res.json()

        if (status === "scope_ready" || status === "cancelled") {
          if (intervalRef.current) clearInterval(intervalRef.current)
          hasRefreshed.current = true
          await new Promise((r) => setTimeout(r, 500))
          router.refresh()
        }
      } catch {
        // Keep polling on network error
      }
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [projectId, router])

  return (
    <div className="flex min-h-[500px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card/50 p-8 text-center">
      <div className="size-4 animate-pulse rounded-full bg-primary" />
      <p className="mt-6 text-lg font-semibold">
        Our AI is analyzing your property...
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This takes about 30 seconds. The page will update automatically.
      </p>
      <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            animation: "progress 25s ease-in-out forwards",
          }}
        />
      </div>
      <style>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 95% }
        }
      `}</style>
    </div>
  )
}
