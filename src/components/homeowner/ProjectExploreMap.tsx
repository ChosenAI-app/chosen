"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any
  }
}

interface Props {
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    let pollCount = 0
    const MAX_POLLS = 120 // 60 seconds at 500ms

    function initViewer() {
      if (initializedRef.current) return
      if (!containerRef.current || !window.Cesium) return
      initializedRef.current = true

      const Cesium = window.Cesium

      try {
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

            // Draw amber parcel polygon
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
                      hierarchy:
                        Cesium.Cartesian3.fromDegreesArray(flatCoords),
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
                console.error("[CesiumJS] Polygon error:", e)
              }
            }
          })
          .catch((err: unknown) =>
            console.error("[CesiumJS] 3D Tiles error:", err)
          )
      } catch (err) {
        console.error("[CesiumJS] Viewer init error:", err)
        initializedRef.current = false
      }
    }

    // If Cesium already loaded before this component mounted
    if (window.Cesium) {
      initViewer()
      return () => {
        if (pollInterval) clearInterval(pollInterval)
        if (viewerRef.current) {
          try {
            viewerRef.current.destroy()
          } catch {
            // ignore
          }
          viewerRef.current = null
        }
        initializedRef.current = false
      }
    }

    // Listen for the onLoad event from the Script tag
    function onCesiumLoaded() {
      if (pollInterval) clearInterval(pollInterval)
      initViewer()
    }
    window.addEventListener("cesium-loaded", onCesiumLoaded)

    // Also poll as fallback
    pollInterval = setInterval(() => {
      pollCount++
      if (window.Cesium) {
        clearInterval(pollInterval!)
        window.removeEventListener("cesium-loaded", onCesiumLoaded)
        initViewer()
      } else if (pollCount >= MAX_POLLS) {
        clearInterval(pollInterval!)
        window.removeEventListener("cesium-loaded", onCesiumLoaded)
        console.error(
          "[CesiumJS] Timed out waiting for script. Check network tab."
        )
      }
    }, 500)

    return () => {
      window.removeEventListener("cesium-loaded", onCesiumLoaded)
      if (pollInterval) clearInterval(pollInterval)
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy()
        } catch {
          // ignore
        }
        viewerRef.current = null
      }
      initializedRef.current = false
    }
  }, [lat, lng, parcelGeometry, apiKey])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "500px" }}
    />
  )
}
