import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chosen — Permit OS for Residential Construction",
  description: "The permit workflow platform for residential construction contractors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://ajax.googleapis.com/ajax/libs/cesiumjs/1.124/Build/Cesium/Widgets/widgets.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {/* CesiumJS from CDN — NOT npm (avoids 50MB bundle) */}
        <Script
          src="https://ajax.googleapis.com/ajax/libs/cesiumjs/1.124/Build/Cesium/Cesium.js"
          strategy="beforeInteractive"
        />
        {/* Google Maps for Places Autocomplete */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
