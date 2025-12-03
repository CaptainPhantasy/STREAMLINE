/**
 * Navigation Utilities for Dispatch Map
 *
 * Provides utilities for generating Google Maps navigation URLs
 * and managing route previews.
 */

export interface NavigationWaypoint {
  lat: number
  lng: number
  label?: string
}

/**
 * Generate Google Maps navigation URL for a single destination
 * Opens Google Maps with turn-by-turn directions
 *
 * On mobile: Opens native Google Maps app
 * On desktop: Opens Google Maps in browser
 *
 * @param lat - Destination latitude
 * @param lng - Destination longitude
 * @returns Google Maps URL
 */
export function getNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/**
 * Generate Google Maps navigation URL with origin and destination
 *
 * @param originLat - Starting latitude
 * @param originLng - Starting longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @returns Google Maps URL
 */
export function getRouteUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`
}

/**
 * Generate Google Maps URL for multi-stop route
 * Useful for techs with multiple jobs
 *
 * @param waypoints - Array of waypoints (origin, stops, destination)
 * @returns Google Maps URL
 */
export function getMultiStopRouteUrl(waypoints: NavigationWaypoint[]): string {
  if (waypoints.length < 2) {
    throw new Error('Multi-stop route requires at least 2 waypoints')
  }

  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const stops = waypoints.slice(1, -1)

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`

  if (stops.length > 0) {
    const waypointsParam = stops.map(w => `${w.lat},${w.lng}`).join('|')
    url += `&waypoints=${waypointsParam}`
  }

  url += '&travelmode=driving'

  return url
}

/**
 * Open navigation in new tab/window
 *
 * @param url - Google Maps URL
 */
export function openNavigation(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Navigate to a location (single destination)
 *
 * @param lat - Latitude
 * @param lng - Longitude
 */
export function navigateToLocation(lat: number, lng: number): void {
  const url = getNavigationUrl(lat, lng)
  openNavigation(url)
}

/**
 * Navigate to a route (origin to destination)
 *
 * @param originLat - Starting latitude
 * @param originLng - Starting longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 */
export function navigateToRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): void {
  const url = getRouteUrl(originLat, originLng, destLat, destLng)
  openNavigation(url)
}

/**
 * Navigate multi-stop route
 *
 * @param waypoints - Array of waypoints
 */
export function navigateMultiStop(waypoints: NavigationWaypoint[]): void {
  const url = getMultiStopRouteUrl(waypoints)
  openNavigation(url)
}

/**
 * Estimate ETA in minutes based on distance
 *
 * @param distanceInMiles - Distance in miles
 * @param avgSpeedMph - Average speed (default: 30 mph for city driving)
 * @returns Estimated time in minutes
 */
export function estimateETA(distanceInMiles: number, avgSpeedMph: number = 30): number {
  return Math.ceil((distanceInMiles / avgSpeedMph) * 60)
}

/**
 * Format distance for display
 *
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.2 mi" or "450 ft")
 */
export function formatDistance(meters: number): string {
  const miles = meters / 1609.34

  if (miles < 0.1) {
    const feet = meters * 3.28084
    return `${Math.round(feet)} ft`
  }

  return `${miles.toFixed(1)} mi`
}

/**
 * Format ETA for display
 *
 * @param minutes - ETA in minutes
 * @returns Formatted string (e.g., "15 min" or "1h 30m")
 */
export function formatETA(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}
