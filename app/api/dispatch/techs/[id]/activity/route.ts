import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/dispatch/techs/[id]/activity
 *
 * Fetches recent GPS activity logs for a specific technician.
 * Returns the last N GPS logs (default: 20) ordered by most recent first.
 *
 * Query Parameters:
 * - limit: number (default: 20, max: 100) - Number of logs to return
 * - jobId: string (optional) - Filter logs by specific job
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Validates tech belongs to same account
 *
 * Response format:
 * {
 *   activity: Array<{
 *     id: string
 *     latitude: number
 *     longitude: number
 *     accuracy: number
 *     timestamp: string
 *     eventType: 'arrival' | 'departure' | 'checkpoint' | 'auto'
 *     jobId?: string
 *     metadata?: Record<string, any>
 *   }>
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: techId } = await params

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
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const jobId = searchParams.get('jobId')

  try {
    // Verify tech belongs to same account
    const { data: techUser, error: techError } = await supabase
      .from('users')
      .select('id, account_id, full_name')
      .eq('id', techId)
      .single()

    if (techError || !techUser) {
      return NextResponse.json({ error: 'Tech not found' }, { status: 404 })
    }

    if (techUser.account_id !== userData.account_id) {
      return NextResponse.json({
        error: 'Forbidden: Tech belongs to different account'
      }, { status: 403 })
    }

    // Build query for GPS logs
    let query = supabase
      .from('gps_logs')
      .select('id, latitude, longitude, accuracy, event_type, job_id, metadata, created_at')
      .eq('user_id', techId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by job if specified
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data: gpsLogs, error: logsError } = await query

    if (logsError) throw logsError

    if (!gpsLogs || gpsLogs.length === 0) {
      return NextResponse.json({
        activity: [],
        meta: {
          techId,
          techName: techUser.full_name,
          count: 0,
          limit
        }
      })
    }

    // Transform data to match expected format
    const activity = gpsLogs.map(log => ({
      id: log.id,
      latitude: parseFloat(log.latitude),
      longitude: parseFloat(log.longitude),
      accuracy: log.accuracy ? parseFloat(log.accuracy) : 0,
      timestamp: log.created_at,
      eventType: log.event_type as 'arrival' | 'departure' | 'checkpoint' | 'auto',
      jobId: log.job_id || undefined,
      metadata: log.metadata || undefined
    }))

    return NextResponse.json({
      activity,
      meta: {
        techId,
        techName: techUser.full_name,
        count: activity.length,
        limit,
        filteredByJob: jobId || undefined
      }
    })

  } catch (error) {
    console.error('Error fetching tech activity:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch tech activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
