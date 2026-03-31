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
    if (!containerRef.current) return

    // Wait for CesiumJS to load from CDN
    if (!window.Cesium) {
      const checkInterval = setInterval(() => {
        if (window.Cesium) {
          clearInterval(checkInterval)
          initViewer()
        }
      }, 200)
      return () => clearInterval(checkInterval)
    }

    initViewer()

    function initViewer() {
      if (!containerRef.current || viewerRef.current) return

      const Cesium = window.Cesium

      // Enable simultaneous tile requests
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

      // Add Google Photorealistic 3D Tiles
      Cesium.createGooglePhotorealistic3DTileset({ key: apiKey })
        .then((tileset: unknown) => viewer.scene.primitives.add(tileset))
        .catch((err: unknown) =>
          console.error("[CesiumJS] 3D Tiles error:", err)
        )

      // Fly-in animation — two stages
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, 400),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-30),
          roll: 0.0,
        },
        duration: 2.5,
      })

      setTimeout(() => {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat, 150),
          orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-60),
            roll: 0.0,
          },
          duration: 2.0,
        })
      }, 2500)

      // Draw amber parcel polygon if parcelGeometry exists
      if (parcelGeometry) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const geo = parcelGeometry as any
          if (geo.type === "Polygon" && geo.coordinates?.[0]) {
            const flatCoords: number[] = []
            for (const point of geo.coordinates[0]) {
              flatCoords.push(point[0], point[1])
            }
            viewer.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                material: new Cesium.ColorMaterialProperty(
                  Cesium.Color.fromCssColorString("#F59E0B").withAlpha(0.25)
                ),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString("#F59E0B"),
                outlineWidth: 3,
                height: 1,
              },
            })
          }
        } catch (err) {
          console.error("[CesiumJS] Parcel polygon error:", err)
        }
      }
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
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
