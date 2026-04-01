// ATTOM Property Data API — industry standard for US property data
export async function fetchATTOMParcelData(address: string) {
  const attomKey = process.env.ATTOM_API_KEY
  if (!attomKey) {
    console.error("[ATTOM] ATTOM_API_KEY not set")
    return null
  }

  try {
    const cleanAddress = address
      .replace(/, USA$/, "")
      .replace(/, United States$/, "")
      .trim()
    const parts = cleanAddress.split(",")
    const address1 = parts[0]?.trim()

    const city = parts[1]?.trim()
    const stateZip = parts[2]?.trim() ?? ""
    const state = stateZip.split(" ")[0]
    const address2 =
      city && state
        ? `${city}, ${state}`
        : parts.slice(1).join(",").trim()

    console.log("[ATTOM] address1:", address1, "address2:", address2)

    if (!address1 || !address2) {
      console.error("[ATTOM] Could not parse address:", address)
      return null
    }

    const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`
    console.log("[ATTOM] Querying:", url)

    const res = await fetch(url, {
      headers: {
        apikey: attomKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    })

    console.log("[ATTOM] HTTP status:", res.status)

    if (!res.ok) {
      const text = await res.text()
      console.error("[ATTOM] Error response:", text)
      return null
    }

    const json = await res.json()
    console.log("[ATTOM] Raw response:", JSON.stringify(json, null, 2))

    const property = json.property?.[0]
    if (!property) {
      console.log("[ATTOM] No property found for address")
      return null
    }

    const lotSizeSqft = property.lot?.lotsize2
      ? Math.round(Number(property.lot.lotsize2))
      : property.lot?.lotsize1
        ? Math.round(Number(property.lot.lotsize1) * 43560)
        : null

    const yearBuilt = property.summary?.yearbuilt
      ? parseInt(property.summary.yearbuilt)
      : null

    const existingSqft = property.building?.size?.bldgsize
      ? parseInt(property.building.size.bldgsize)
      : property.building?.size?.grosssize
        ? parseInt(property.building.size.grosssize)
        : property.building?.size?.livingsize
          ? parseInt(property.building.size.livingsize)
          : null

    const zoning = property.summary?.propclass ?? null
    const zoningDescription = property.summary?.proptype ?? null
    const apn = property.identifier?.apn ?? null

    console.log("[ATTOM] Extracted:", {
      apn,
      lotSizeSqft,
      yearBuilt,
      existingSqft,
      zoning,
      zoningDescription,
    })

    return {
      apn,
      lotSizeSqft,
      yearBuilt,
      existingSqft,
      zoning,
      zoningDescription,
      parcelGeometry: null,
    }
  } catch (err) {
    console.error("[ATTOM] Error:", err)
    return null
  }
}
