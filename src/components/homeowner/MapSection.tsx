"use client"

import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"

const ProjectExploreMap = dynamic(
  () => import("@/components/homeowner/ProjectExploreMap"),
  { ssr: false }
)

// Palo Alto city center fallback
const PALO_ALTO_LAT = 37.4419
const PALO_ALTO_LNG = -122.143

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
  const hasExactCoords = lat !== null && lng !== null
  const useFallback = !hasExactCoords && !isProcessing

  if (isProcessing) {
    return (
      <div className="flex min-h-[500px] w-full items-center justify-center border-2 border-dashed border-primary/30 bg-card/50 rounded-lg">
        <div className="text-center">
          <MapPin className="mx-auto size-10 text-primary/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Map loading after AI analysis...
          </p>
        </div>
      </div>
    )
  }

  // Use exact coords or fallback to Palo Alto center
  const mapLat = hasExactCoords ? lat : PALO_ALTO_LAT
  const mapLng = hasExactCoords ? lng : PALO_ALTO_LNG

  return (
    <div className="relative h-full w-full">
      <ProjectExploreMap
        lat={mapLat}
        lng={mapLng}
        parcelGeometry={hasExactCoords ? parcelGeometry : null}
        apiKey={apiKey}
      />
      {useFallback && (
        <div className="absolute top-3 left-3 right-3 z-10 rounded-md bg-primary/90 px-3 py-2 text-center text-xs font-medium text-primary-foreground">
          Showing Palo Alto area — submit with a full address for your specific
          property
        </div>
      )}
    </div>
  )
}
