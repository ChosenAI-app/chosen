"use client"

import Script from "next/script"

export function CesiumScriptLoader() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Widgets/widgets.css"
      />
      <Script
        id="cesiumjs"
        src="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Cesium.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[CesiumJS] Loaded successfully from official CDN")
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("cesium-loaded"))
          }
        }}
        onError={() => {
          console.error("[CesiumJS] Script failed to load from CDN")
        }}
      />
    </>
  )
}
