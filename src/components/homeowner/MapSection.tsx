"use client"

import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"

const ProjectExploreMap = dynamic(
  () => import("@/components/homeowner/ProjectExploreMap"),
  { ssr: false }
)

interface MapSectionProps {
  lat: number | null
  lng: number | null
  parcelGeometry: unknown | null
  apiKey: string
  isProcessing: boolean
}

export function MapSection({
  lat,
  lng,
  parcelGeometry,
  apiKey,
  isProcessing,
}: MapSectionProps) {
  const hasCoords = lat !== null && lng !== null

  if (hasCoords && !isProcessing) {
    return (
      <ProjectExploreMap
        lat={lat}
        lng={lng}
        parcelGeometry={parcelGeometry}
        apiKey={apiKey}
      />
    )
  }

  return (
    <div className="flex min-h-[500px] w-full items-center justify-center border-2 border-dashed border-primary/30 bg-card/50 rounded-lg">
      <div className="text-center">
        <MapPin className="mx-auto size-10 text-primary/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {isProcessing
            ? "Map loading after AI analysis..."
            : "3D map unavailable — no coordinates for this address"}
        </p>
        {hasCoords && (
          <p className="mt-1 text-xs text-muted-foreground/60">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  )
}
