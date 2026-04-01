"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const STEPS = [
  "Fetching parcel data...",
  "Analyzing zoning regulations...",
  "Checking Palo Alto permit requirements...",
  "Calculating project feasibility...",
  "Generating permit checklist...",
  "Estimating costs and timeline...",
  "Finalizing your project scope...",
]

export function ScopePoller({ projectId }: { projectId: string }) {
  const router = useRouter()
  const hasRefreshed = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [dots, setDots] = useState(0)
  const [step, setStep] = useState(0)

  // Animate through steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, 3500)
    return () => clearInterval(stepInterval)
  }, [])

  // Animate dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d + 1) % 4)
    }, 400)
    return () => clearInterval(dotInterval)
  }, [])

  // Polling logic
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
        // Keep polling
      }
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [projectId, router])

  const progress = Math.min(((step + 1) / STEPS.length) * 90, 90)

  return (
    <div className="relative flex min-h-[500px] w-full flex-col items-center justify-center pt-8 overflow-hidden rounded-lg border border-border bg-card">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

      {/* Pulsing rings */}
      <div className="relative mb-16">
        <div
          className="absolute inset-0 -m-8 animate-ping rounded-full border border-primary/20"
          style={{ animationDuration: "2s" }}
        />
        <div className="absolute inset-0 -m-5 rounded-full border border-primary/15" />
        <div className="absolute inset-0 -m-12 rounded-full border border-primary/10" />
        <div className="relative flex size-10 items-center justify-center rounded-full border border-primary/40 bg-primary/20">
          <div className="size-4 animate-pulse rounded-full bg-primary" />
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-xl font-bold tracking-tight">
        Analyzing your property
        <span className="text-primary">{"".padEnd(dots, ".")}</span>
      </h2>

      {/* Current step */}
      <p className="mt-3 h-5 text-sm font-medium text-primary/80 transition-all duration-500">
        {STEPS[step]}
      </p>

      {/* Progress bar with glow */}
      <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="mt-4 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= step ? "w-4 bg-primary" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Bottom note */}
      <p className="mt-8 text-xs text-muted-foreground">
        This takes about 30 seconds · The page updates automatically
      </p>
    </div>
  )
}
