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
    let isDestroyed = false
    let pollInterval: NodeJS.Timeout | null = null
    let pollCount = 0
    const MAX_POLLS = 120

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
          requestRenderMode: false,
          infoBox: false,
          selectionIndicator: false,
        })

        viewerRef.current = viewer

        Cesium.createGooglePhotorealistic3DTileset({ key: apiKey })
          .then((tileset: unknown) => {
            if (isDestroyed || !viewerRef.current) return
            viewer.scene.primitives.add(tileset)

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

            // Wait for tiles to stream in before flying
            setTimeout(() => {
              if (isDestroyed || !viewerRef.current) return

              // Set initial camera position instantly
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lng, lat, 400),
                orientation: {
                  heading: Cesium.Math.toRadians(45),
                  pitch: Cesium.Math.toRadians(-15),
                  roll: 0.0,
                },
                duration: 0.1,
              })

              // Cinematic fly-in to close 3D oblique view
              setTimeout(() => {
                if (isDestroyed || !viewerRef.current) return
                viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(lng, lat, 180),
                  orientation: {
                    heading: Cesium.Math.toRadians(330),
                    pitch: Cesium.Math.toRadians(-40),
                    roll: 0.0,
                  },
                  duration: 3.0,
                  easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
                })
              }, 300)
            }, 2000)
          })
          .catch((err: unknown) =>
            console.error("[CesiumJS] 3D Tiles error:", err)
          )
      } catch (err) {
        console.error("[CesiumJS] Viewer init error:", err)
        initializedRef.current = false
      }
    }

    // If Cesium already loaded
    if (window.Cesium) {
      initViewer()
    } else {
      // Listen for the onLoad event from CesiumScriptLoader
      function onCesiumLoaded() {
        if (pollInterval) clearInterval(pollInterval)
        initViewer()
      }
      window.addEventListener("cesium-loaded", onCesiumLoaded)

      // Poll as fallback
      pollInterval = setInterval(() => {
        pollCount++
        if (window.Cesium) {
          clearInterval(pollInterval!)
          window.removeEventListener("cesium-loaded", onCesiumLoaded)
          initViewer()
        } else if (pollCount >= MAX_POLLS) {
          clearInterval(pollInterval!)
          window.removeEventListener("cesium-loaded", onCesiumLoaded)
          console.error("[CesiumJS] Timed out waiting for script.")
        }
      }, 500)
    }

    return () => {
      isDestroyed = true
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
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    />
  )
}
