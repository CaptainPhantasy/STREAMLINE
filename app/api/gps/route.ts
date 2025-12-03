import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withSecurity } from '@/lib/security/api-middleware'
import { gpsSchemas } from '@/lib/security/validation-schemas'

async function handleGPSLog(request: NextRequest, context: any) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  // Get user's account
  const { data: userData } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', context.user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()
  const validation = gpsSchemas.log.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validation.error.errors.map(e => e.message).join(', ')
      },
      { status: 400 }
    )
  }

  const { jobId, latitude, longitude, accuracy, eventType, metadata } = validation.data

  // Additional validation: ensure coordinates are within reasonable bounds
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Coordinates out of valid range' }, { status: 400 })
  }

  // If jobId is provided, verify user has access to it
  if (jobId) {
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('account_id', userData.account_id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
    }
  }

  // Insert GPS log
  const { data: log, error } = await supabase
    .from('gps_logs')
    .insert({
      account_id: userData.account_id,
      user_id: context.user.id,
      job_id: jobId || null,
      latitude,
      longitude,
      accuracy,
      event_type: eventType,
      metadata,
    })
    .select()
    .single()

  if (error) {
    console.error('GPS log insertion error:', error)
    return NextResponse.json({ error: 'Failed to log GPS data' }, { status: 500 })
  }

  // If this is an arrival, update job start location
  if (eventType === 'arrival' && jobId) {
    await supabase
      .from('jobs')
      .update({
        start_location_lat: latitude,
        start_location_lng: longitude,
        status: 'in_progress',
      })
      .eq('id', jobId)
  }

  // If this is a departure, update job complete location
  if (eventType === 'departure' && jobId) {
    await supabase
      .from('jobs')
      .update({
        complete_location_lat: latitude,
        complete_location_lng: longitude,
      })
      .eq('id', jobId)
  }

  // Log GPS data for audit (privacy-conscious - only metadata)
  console.log(`GPS Logged - User: ${context.user.id}, Account: ${userData.account_id}, Event: ${eventType}, Job: ${jobId || 'None'}`)

  return NextResponse.json({ success: true, log })
}

async function handleGPSQuery(request: NextRequest, context: any) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  // Get user's account for access control
  const { data: userData } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', context.user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const userId = searchParams.get('userId')

  // Validate query parameters
  const validation = gpsSchemas.query.safeParse({
    jobId: jobId || undefined,
    userId: userId || undefined
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: validation.error.errors.map(e => e.message).join(', ')
      },
      { status: 400 }
    )
  }

  let query = supabase
    .from('gps_logs')
    .select('*')
    .eq('account_id', userData.account_id) // Ensure users can only see their own account's data
    .order('created_at', { ascending: false })
    .limit(100) // Prevent excessive data retrieval

  // Apply filters
  if (jobId) {
    query = query.eq('job_id', jobId)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error('GPS query error:', error)
    return NextResponse.json({ error: 'Failed to retrieve GPS data' }, { status: 500 })
  }

  return NextResponse.json({ logs })
}

export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    handleGPSLog,
    {
      requireAuth: true,
      rateLimit: 'strict', // GPS logging should be rate limited
      validation: gpsSchemas.log,
      allowedMethods: ['POST'],
      enableCORS: true
    }
  )
}

export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    handleGPSQuery,
    {
      requireAuth: true,
      rateLimit: 'default',
      allowedMethods: ['GET'],
      enableCORS: true
    }
  )
}

