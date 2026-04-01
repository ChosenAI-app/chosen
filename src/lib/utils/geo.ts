// Highway 280 waypoints through Palo Alto (lat, lng pairs NW to SE)
const HWY_280_WAYPOINTS: [number, number][] = [
  [37.481, -122.204],
  [37.46, -122.189],
  [37.435, -122.175],
  [37.42, -122.162],
  [37.395, -122.145],
  [37.37, -122.12],
]

export function isWestOf280(lat: number, lng: number): boolean {
  for (let i = 0; i < HWY_280_WAYPOINTS.length - 1; i++) {
    const [lat1, lng1] = HWY_280_WAYPOINTS[i]
    const [lat2, lng2] = HWY_280_WAYPOINTS[i + 1]

    if (lat >= lat2 && lat <= lat1) {
      const t = (lat - lat2) / (lat1 - lat2)
      const hwy280Lng = lng2 + t * (lng1 - lng2)
      const isWest = lng < hwy280Lng
      console.log(
        `[280 check] Property lng: ${lng}, 280 lng at lat ${lat}: ${hwy280Lng.toFixed(4)}, west: ${isWest}`
      )
      return isWest
    }
  }

  console.log(
    `[280 check] Lat ${lat} outside Palo Alto range — defaulting to not west of 280`
  )
  return false
}
