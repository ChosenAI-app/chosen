"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any
  }
}

interface ProjectExploreMapProps {
  lat: number
  lng: number
  parcelGeometry: unknown | null
  apiKey: string
}

export default function ProjectExploreMap({
  lat,
  lng,
  parcelGeometry,
  apiKey,
}: ProjectExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    let retries = 0
    const MAX_RETRIES = 20
    let timeout: NodeJS.Timeout | null = null

    function tryInit() {
      if (typeof window === "undefined" || !window.Cesium) {
        retries++
        if (retries < MAX_RETRIES) {
          timeout = setTimeout(tryInit, 500)
        } else {
          console.error("[CesiumJS] Failed to load after retries")
        }
        return
      }
      initCesium()
    }

    function initCesium() {
      if (!containerRef.current || viewerRef.current) return

      try {
        const Cesium = window.Cesium
        Cesium.RequestScheduler.requestsByServer["tile.googleapis.com:443"] = 18

        const viewer = new Cesium.Viewer(containerRef.current, {
          imageryProvider: false,
          baseLayerPicker: false,
          geocoder: false,
          globe: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          requestRenderMode: true,
          infoBox: false,
          selectionIndicator: false,
        })

        viewerRef.current = viewer

        Cesium.createGooglePhotorealistic3DTileset({ key: apiKey })
          .then((tileset: unknown) => {
            viewer.scene.primitives.add(tileset)

            // Stage 1 fly-in
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lng, lat, 400),
              orientation: {
                heading: 0.0,
                pitch: Cesium.Math.toRadians(-30),
                roll: 0.0,
              },
              duration: 2.5,
              complete: () => {
                // Stage 2 fly-in
                viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(lng, lat, 150),
                  orientation: {
                    heading: 0.0,
                    pitch: Cesium.Math.toRadians(-60),
                    roll: 0.0,
                  },
                  duration: 2.0,
                })
              },
            })

            // Draw parcel polygon if available
            if (parcelGeometry) {
              try {
                const geom = parcelGeometry as {
                  type: string
                  coordinates: number[][][]
                }
                if (geom.type === "Polygon" && geom.coordinates?.[0]) {
                  const flatCoords = geom.coordinates[0].flatMap(
                    ([pLng, pLat]: number[]) => [pLng, pLat]
                  )
                  viewer.entities.add({
                    polygon: {
                      hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                      material: new Cesium.ColorMaterialProperty(
                        Cesium.Color.fromCssColorString("#F59E0B").withAlpha(
                          0.25
                        )
                      ),
                      outline: true,
                      outlineColor:
                        Cesium.Color.fromCssColorString("#F59E0B"),
                      outlineWidth: 3,
                      height: 1,
                    },
                  })
                }
              } catch (e) {
                console.error("[CesiumJS] Parcel polygon error:", e)
              }
            }
          })
          .catch((err: unknown) =>
            console.error("[CesiumJS] 3D Tiles failed:", err)
          )
      } catch (err) {
        console.error("[CesiumJS] Viewer init failed:", err)
      }
    }

    tryInit()

    return () => {
      if (timeout) clearTimeout(timeout)
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy()
        } catch {
          // ignore destroy errors
        }
        viewerRef.current = null
      }
    }
  }, [lat, lng, parcelGeometry, apiKey])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "500px" }}
    />
  )
}
