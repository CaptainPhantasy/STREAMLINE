import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/geofencing
 * Create or check geofence for job location
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
    const { job_id, latitude, longitude, radius_meters = 100 } = body

    if (!job_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'job_id, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify job belongs to account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create or update geofence
    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .upsert(
        {
          job_id,
          account_id: userData.account_id,
          center_latitude: latitude,
          center_longitude: longitude,
          radius_meters,
          is_active: true,
        },
        { onConflict: 'job_id' }
      )
      .select()
      .single()

    if (geofenceError) {
      console.error('Error creating geofence:', geofenceError)
      return NextResponse.json(
        { error: 'Failed to create geofence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ geofence }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating geofence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/geofencing
 * Check if location is within geofence
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const job_id = searchParams.get('job_id')
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')

    if (!job_id || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'job_id, lat, and lng are required' },
        { status: 400 }
      )
    }

    // Get geofence for job
    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .select('*')
      .eq('job_id', job_id)
      .eq('is_active', true)
      .single()

    if (geofenceError || !geofence) {
      return NextResponse.json({
        within_geofence: false,
        reason: 'No active geofence found for this job',
      })
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      geofence.center_latitude,
      geofence.center_longitude
    )

    const withinGeofence = distance <= geofence.radius_meters

    return NextResponse.json({
      within_geofence: withinGeofence,
      distance_meters: distance,
      geofence_radius: geofence.radius_meters,
      geofence_center: {
        lat: geofence.center_latitude,
        lng: geofence.center_longitude,
      },
    })
  } catch (error: unknown) {
    console.error('Error checking geofence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

