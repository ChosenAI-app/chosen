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

  useEffect(() => {
    let destroyed = false

    async function loadCesiumAndInit() {
      // If Cesium already loaded (e.g. navigating back to page)
      if (window.Cesium) {
        initViewer()
        return
      }

      // Inject CSS
      if (!document.querySelector('link[href*="cesiumjs"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href =
          "https://ajax.googleapis.com/ajax/libs/cesiumjs/1.124/Build/Cesium/Widgets/widgets.css"
        document.head.appendChild(link)
      }

      // Inject JS script tag
      await new Promise<void>((resolve, reject) => {
        if (window.Cesium) {
          resolve()
          return
        }

        const existing = document.querySelector('script[src*="cesiumjs"]')
        if (existing) {
          // Script tag exists but Cesium not ready yet — poll
          let polls = 0
          const poll = setInterval(() => {
            polls++
            if (window.Cesium) {
              clearInterval(poll)
              resolve()
            }
            if (polls > 60) {
              clearInterval(poll)
              reject(new Error("Cesium poll timeout"))
            }
          }, 500)
          return
        }

        const script = document.createElement("script")
        script.src =
          "https://ajax.googleapis.com/ajax/libs/cesiumjs/1.124/Build/Cesium/Cesium.js"
        script.async = true
        script.onload = () => resolve()
        script.onerror = () =>
          reject(new Error("CesiumJS script failed to load"))
        document.head.appendChild(script)
      })

      if (!destroyed) initViewer()
    }

    function initViewer() {
      if (
        !containerRef.current ||
        viewerRef.current ||
        !window.Cesium ||
        destroyed
      )
        return

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
            if (destroyed) return
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
                if (destroyed) return
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

    loadCesiumAndInit().catch((err) =>
      console.error("[CesiumJS] Load error:", err)
    )

    return () => {
      destroyed = true
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
