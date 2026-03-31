"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ScopePoller({ projectId }: { projectId: string }) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/homeowner/project-status?id=${projectId}`
        )
        if (!res.ok) return
        const data = await res.json()
        if (data.status === "scope_ready" || data.status === "cancelled") {
          clearInterval(interval)
          router.refresh()
        }
      } catch (err) {
        console.error("[ScopePoller] fetch error:", err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [projectId, router])

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
      <div className="flex flex-col items-center py-6">
        {/* Pulsing amber dot */}
        <div className="relative flex items-center justify-center">
          <div className="absolute size-10 animate-ping rounded-full bg-primary/20" />
          <div className="size-4 rounded-full bg-primary" />
        </div>

        <p className="mt-6 font-semibold text-foreground">
          Our AI is analyzing your property...
        </p>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          This takes about 30 seconds. The page will update automatically.
        </p>

        {/* Visual progress bar — pure CSS animation, not tied to actual progress */}
        <div className="mt-6 h-1 w-full max-w-xs overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary/50"
            style={{
              animation: "scopeProgress 30s ease-out forwards",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scopeProgress {
          from {
            width: 0%;
          }
          to {
            width: 95%;
          }
        }
      `}</style>
    </div>
  )
}
