"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function ContractorScopePoller({
  projectId,
}: {
  projectId: string
}) {
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
          `/api/contractor/project-status?id=${projectId}`
        )
        if (!res.ok) return
        const { hasScope } = await res.json()
        if (hasScope) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          hasRefreshed.current = true
          await new Promise((r) => setTimeout(r, 500))
          router.refresh()
        }
      } catch {
        // Keep polling
      }
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [projectId, router])

  return null
}
