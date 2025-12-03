import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/dispatch/historical-gps
 *
 * Fetches historical GPS logs for playback and analysis.
 * Supports downsampling for large time ranges to optimize performance.
 *
 * Query Parameters:
 * - startTime: string (ISO timestamp) - Start of time range (required)
 * - endTime: string (ISO timestamp) - End of time range (required)
 * - userIds: string (comma-separated) - Filter by specific techs (optional)
 * - downsample: boolean - Enable downsampling (default: true)
 * - interval: number - Minutes between samples when downsampling (default: 5)
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Filters by account_id
 *
 * Downsampling: For time ranges > 1 hour, returns one GPS point every N minutes
 * to reduce payload size while maintaining route visibility.
 *
 * Response format:
 * {
 *   logs: Array<{
 *     userId: string
 *     userName: string
 *     latitude: number
 *     longitude: number
 *     timestamp: string
 *     accuracy: number
 *     eventType: string
 *     jobId?: string
 *   }>
 * }
 */
export async function GET(request: Request) {
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

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and account
  const { data: userData } = await supabase
    .from('users')
    .select('role, account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user has dispatcher permissions
  if (!['owner', 'admin', 'dispatcher'].includes(userData.role || '')) {
    return NextResponse.json({
      error: 'Forbidden: dispatcher, admin, or owner role required'
    }, { status: 403 })
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const startTimeParam = searchParams.get('startTime')
  const endTimeParam = searchParams.get('endTime')
  const userIdsParam = searchParams.get('userIds')
  const downsample = searchParams.get('downsample') !== 'false'
  const interval = parseInt(searchParams.get('interval') || '5') // Minutes

  // Validate required parameters
  if (!startTimeParam || !endTimeParam) {
    return NextResponse.json({
      error: 'Missing required parameters',
      details: 'startTime and endTime are required'
    }, { status: 400 })
  }

  let startTime: Date
  let endTime: Date

  try {
    startTime = new Date(startTimeParam)
    endTime = new Date(endTimeParam)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid date format')
    }

    if (startTime >= endTime) {
      return NextResponse.json({
        error: 'Invalid time range',
        details: 'startTime must be before endTime'
      }, { status: 400 })
    }

    // Limit time range to 7 days
    const maxDuration = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    if (endTime.getTime() - startTime.getTime() > maxDuration) {
      return NextResponse.json({
        error: 'Time range too large',
        details: 'Maximum time range is 7 days'
      }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid time format',
      details: 'Use ISO 8601 format (e.g., 2025-11-27T10:00:00Z)'
    }, { status: 400 })
  }

  // Parse user IDs filter
  let userIds: string[] | undefined
  if (userIdsParam) {
    userIds = userIdsParam.split(',').map(id => id.trim()).filter(Boolean)
  }

  try {
    // Get all techs for this account (or filtered techs)
    let techQuery = supabase
      .from('users')
      .select('id, full_name, role')
      .eq('account_id', userData.account_id)
      .in('role', ['tech', 'sales'])

    if (userIds && userIds.length > 0) {
      techQuery = techQuery.in('id', userIds)
    }

    const { data: techs, error: techsError } = await techQuery

    if (techsError) throw techsError

    if (!techs || techs.length === 0) {
      return NextResponse.json({
        logs: [],
        meta: {
          count: 0,
          downsampled: false,
          techsCount: 0
        }
      })
    }

    const techIds = techs.map(t => t.id)
    const techMap = new Map(techs.map(t => [t.id, t.full_name || 'Unknown']))

    // Calculate time range duration
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Decide if downsampling is needed
    const shouldDownsample = downsample && durationHours > 1

    let gpsLogs: any[] = []

    if (shouldDownsample) {
      // Downsampling strategy: Get one GPS point per interval
      // We'll fetch all logs and downsample in memory for simplicity
      // For production, consider doing this at database level with window functions

      const { data: allLogs, error: logsError } = await supabase
        .from('gps_logs')
        .select('user_id, latitude, longitude, accuracy, event_type, job_id, created_at')
        .in('user_id', techIds)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: true })

      if (logsError) throw logsError

      // Downsample: Group by user and time buckets
      const intervalMs = interval * 60 * 1000
      const bucketedLogs = new Map<string, any>() // key: `${userId}_${bucketIndex}`

      allLogs?.forEach(log => {
        const logTime = new Date(log.created_at).getTime()
        const bucketIndex = Math.floor((logTime - startTime.getTime()) / intervalMs)
        const bucketKey = `${log.user_id}_${bucketIndex}`

        // Keep the first log in each bucket (or use middle/last depending on preference)
        if (!bucketedLogs.has(bucketKey)) {
          bucketedLogs.set(bucketKey, log)
        }
      })

      gpsLogs = Array.from(bucketedLogs.values())
    } else {
      // No downsampling - fetch all logs
      const { data: allLogs, error: logsError } = await supabase
        .from('gps_logs')
        .select('user_id, latitude, longitude, accuracy, event_type, job_id, created_at')
        .in('user_id', techIds)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: true })
        .limit(10000) // Safety limit

      if (logsError) throw logsError

      gpsLogs = allLogs || []
    }

    // Transform data
    const transformedLogs = gpsLogs.map(log => ({
      userId: log.user_id,
      userName: techMap.get(log.user_id) || 'Unknown',
      latitude: parseFloat(log.latitude),
      longitude: parseFloat(log.longitude),
      accuracy: log.accuracy ? parseFloat(log.accuracy) : 0,
      timestamp: log.created_at,
      eventType: log.event_type,
      jobId: log.job_id || undefined
    }))

    // Sort by timestamp
    transformedLogs.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json({
      logs: transformedLogs,
      meta: {
        count: transformedLogs.length,
        downsampled: shouldDownsample,
        downsampleInterval: shouldDownsample ? interval : undefined,
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          durationHours: Math.round(durationHours * 10) / 10
        },
        techsCount: techs.length,
        techNames: techs.map(t => t.full_name)
      }
    })

  } catch (error) {
    console.error('Error fetching historical GPS:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch historical GPS data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
