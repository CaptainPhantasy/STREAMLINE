/**
 * Travel Time Utilities
 * Helper functions for calculating travel time between locations
 */

export interface TravelTimeResult {
  distance_meters: number
  distance_text: string
  duration_seconds: number
  duration_text: string
  duration_in_traffic_seconds?: number
  duration_in_traffic_text?: string
}

export interface Location {
  latitude: number
  longitude: number
}

/**
 * Calculate travel time between two locations
 */
export async function calculateTravelTime(
  origin: Location,
  destination: Location,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<TravelTimeResult> {
  const response = await fetch('/api/schedule/travel-time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin_lat: origin.latitude,
      origin_lng: origin.longitude,
      destination_lat: destination.latitude,
      destination_lng: destination.longitude,
      mode,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to calculate travel time')
  }

  return await response.json()
}

/**
 * Calculate travel time between multiple locations (route optimization)
 */
export async function calculateRouteTravelTime(
  locations: Location[],
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<Array<{ from: number; to: number; result: TravelTimeResult }>> {
  const results: Array<{ from: number; to: number; result: TravelTimeResult }> = []

  for (let i = 0; i < locations.length - 1; i++) {
    try {
      const result = await calculateTravelTime(locations[i], locations[i + 1], mode)
      results.push({
        from: i,
        to: i + 1,
        result,
      })
    } catch (error) {
      console.error(`Error calculating travel time from ${i} to ${i + 1}:`, error)
    }
  }

  return results
}

