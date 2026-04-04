"use client"

import { useState } from "react"
import { HardHat, User } from "lucide-react"

export function ApplicantTypeSelector({
  projectId,
}: {
  projectId: string
}) {
  const [selected, setSelected] = useState<
    "contractor" | "owner_builder" | null
  >(null)

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Who will be pulling this permit?
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        This determines how the application is filed with the city.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSelected("contractor")}
          className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
            selected === "contractor"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          }`}
        >
          <HardHat
            className={`size-6 ${selected === "contractor" ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-sm font-semibold">Licensed Contractor</span>
          <span className="text-xs text-muted-foreground">Recommended</span>
        </button>

        <button
          onClick={() => setSelected("owner_builder")}
          className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
            selected === "owner_builder"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          }`}
        >
          <User
            className={`size-6 ${selected === "owner_builder" ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-sm font-semibold">Owner-Builder</span>
          <span className="text-xs text-muted-foreground">
            Filing yourself
          </span>
        </button>
      </div>

      {selected === "contractor" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Your contractor&apos;s license number will be included. If no
          contractor is selected yet, you can still submit and add it later.
        </p>
      )}

      {selected === "owner_builder" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Under California law (Sec. 7044), property owners can apply for
          their own permits without a contractor&apos;s license.
        </p>
      )}
    </div>
  )
}
