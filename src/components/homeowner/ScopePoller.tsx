"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const STEPS = [
  { label: "Fetching parcel data", detail: "Querying ATTOM property records...", pct: 8 },
  { label: "Reading zoning records", detail: "Santa Clara County R-1 overlay...", pct: 20 },
  { label: "Checking permit triggers", detail: "Fire review, earthwork, sprinklers...", pct: 35 },
  { label: "Mapping inspection sequence", detail: "15-step Palo Alto workflow...", pct: 50 },
  { label: "Calculating fee schedule", detail: "PAUSD, impact fees, connection costs...", pct: 63 },
  { label: "Estimating construction costs", detail: "Bay Area 2026 market rates...", pct: 76 },
  { label: "Running feasibility check", detail: "Setbacks, lot coverage, ADU limits...", pct: 88 },
  { label: "Finalizing your scope", detail: "Writing project brief...", pct: 96 },
]

export function ScopePoller({ projectId }: { projectId: string }) {
  const router = useRouter()
  const hasRefreshed = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const step = setInterval(() => {
      setStepIndex((i) => {
        const next = Math.min(i + 1, STEPS.length - 1)
        setProgress(STEPS[next].pct)
        return next
      })
    }, 3200)
    return () => clearInterval(step)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (hasRefreshed.current) return
    intervalRef.current = setInterval(async () => {
      if (hasRefreshed.current) {
        clearInterval(intervalRef.current!)
        return
      }
      try {
        const res = await fetch(`/api/homeowner/project-status?id=${projectId}`)
        if (!res.ok) return
        const { status } = await res.json()
        if (status === "scope_ready" || status === "cancelled") {
          clearInterval(intervalRef.current!)
          hasRefreshed.current = true
          await new Promise((r) => setTimeout(r, 400))
          router.refresh()
        }
      } catch {
        // keep polling
      }
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [projectId, router])

  const currentStep = STEPS[stepIndex]

  return (
    <div className="relative flex min-h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-[#0a0d14]">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mb-10 flex items-center justify-center" style={{ marginTop: "-20px" }}>
        <div className="absolute size-40 rounded-full border border-primary/10" style={{ animation: "scopeSpin 12s linear infinite" }} />
        <div className="absolute size-28 rounded-full border border-primary/20" style={{ animation: "scopeSpin 8s linear infinite reverse" }} />
        <div className="absolute size-20 animate-pulse rounded-full border border-primary/30" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <div key={i} className="absolute size-1 rounded-full bg-primary/40" style={{ transform: `rotate(${deg}deg) translateY(-78px)` }} />
        ))}
        <div className="relative flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <div className="size-5 animate-pulse rounded-full bg-primary shadow-[0_0_16px_rgba(245,158,11,0.6)]" />
        </div>
      </div>

      <p className="text-xl font-bold tracking-tight">
        Analyzing your property
        <span className="animate-pulse text-primary">.</span>
      </p>

      <div className="mt-4 flex h-10 flex-col items-center gap-1">
        <p className="text-sm font-medium text-primary/90 transition-all duration-500">{currentStep.label}</p>
        <p className="text-xs text-muted-foreground transition-all duration-500">{currentStep.detail}</p>
      </div>

      <div className="mt-6 h-[3px] w-72 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%`, boxShadow: "0 0 8px rgba(245,158,11,0.7), 0 0 2px rgba(245,158,11,1)" }}
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{ width: i === stepIndex ? "16px" : "6px", height: "6px", background: i <= stepIndex ? "hsl(var(--primary))" : "hsl(var(--border))" }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-black/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-1.5 animate-pulse rounded-full bg-green-400" />
            <p className="font-mono text-[10px] text-green-400/80">chosen-ai · palo-alto-engine · {elapsed}s elapsed</p>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">{currentStep.pct}% complete</p>
        </div>
      </div>

      <style>{`
        @keyframes scopeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
