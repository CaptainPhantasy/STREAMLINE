import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/schedule/travel-time
 * Calculate travel time between job locations
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { origin_lat, origin_lng, destination_lat, destination_lng, mode = 'driving' } = body

    if (
      origin_lat === undefined ||
      origin_lng === undefined ||
      destination_lat === undefined ||
      destination_lng === undefined
    ) {
      return NextResponse.json(
        { error: 'Origin and destination coordinates are required' },
        { status: 400 }
      )
    }

    // Use Google Maps Distance Matrix API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.append('origins', `${origin_lat},${origin_lng}`)
    url.searchParams.append('destinations', `${destination_lat},${destination_lng}`)
    url.searchParams.append('mode', mode)
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data)
      return NextResponse.json(
        { error: 'Failed to calculate travel time' },
        { status: 500 }
      )
    }

    const element = data.rows[0]?.elements[0]
    if (!element || element.status !== 'OK') {
      return NextResponse.json(
        { error: 'Could not calculate route' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      distance_meters: element.distance.value,
      distance_text: element.distance.text,
      duration_seconds: element.duration.value,
      duration_text: element.duration.text,
      duration_in_traffic_seconds: element.duration_in_traffic?.value,
      duration_in_traffic_text: element.duration_in_traffic?.text,
    })
  } catch (error: unknown) {
    console.error('Error calculating travel time:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

