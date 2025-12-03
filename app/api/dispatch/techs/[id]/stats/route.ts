import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateDistance } from '@/lib/gps/tracker'

/**
 * GET /api/dispatch/techs/[id]/stats
 *
 * Fetches daily performance statistics for a specific technician.
 * Includes job counts, completion rates, distance traveled, and hours worked.
 *
 * Query Parameters:
 * - date: string (optional, YYYY-MM-DD) - Date to fetch stats for (default: today)
 * - range: 'today' | 'week' | 'month' (optional) - Time range for stats
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Validates tech belongs to same account
 *
 * Response format:
 * {
 *   stats: {
 *     jobsCompletedToday: number
 *     jobsInProgress: number
 *     jobsScheduled: number
 *     averageJobTimeMinutes: number
 *     totalDistanceTraveledMiles: number
 *     hoursWorkedToday: number
 *     efficiency: number  // 0-100 percentage
 *   }
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
  const dateParam = searchParams.get('date')
  const range = searchParams.get('range') || 'today'

  // Calculate date range
  const now = new Date()
  let startDate: Date
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  if (dateParam) {
    const targetDate = new Date(dateParam)
    startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)
    endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)
  } else if (range === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // Today
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  }

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

    // Fetch jobs for the time period
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, status, scheduled_start, scheduled_end, created_at')
      .eq('tech_assigned_id', techId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (jobsError) throw jobsError

    // Calculate job statistics
    const completedJobs = jobs?.filter(j => j.status === 'completed') || []
    const inProgressJobs = jobs?.filter(j => j.status === 'in_progress') || []
    const scheduledJobs = jobs?.filter(j => j.status === 'scheduled') || []

    // Calculate average job time for completed jobs
    let totalJobMinutes = 0
    let jobsWithTime = 0

    completedJobs.forEach(job => {
      if (job.scheduled_start && job.scheduled_end) {
        const startTime = new Date(job.scheduled_start).getTime()
        const endTime = new Date(job.scheduled_end).getTime()
        const durationMinutes = (endTime - startTime) / (1000 * 60)

        if (durationMinutes > 0 && durationMinutes < 1440) { // Sanity check: less than 24 hours
          totalJobMinutes += durationMinutes
          jobsWithTime++
        }
      }
    })

    const averageJobTimeMinutes = jobsWithTime > 0
      ? Math.round(totalJobMinutes / jobsWithTime)
      : 0

    // Fetch GPS logs for distance calculation
    const { data: gpsLogs, error: gpsError } = await supabase
      .from('gps_logs')
      .select('latitude, longitude, created_at')
      .eq('user_id', techId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (gpsError) throw gpsError

    // Calculate total distance traveled
    let totalDistanceMeters = 0
    if (gpsLogs && gpsLogs.length > 1) {
      for (let i = 1; i < gpsLogs.length; i++) {
        const prev = gpsLogs[i - 1]
        const curr = gpsLogs[i]

        const distance = calculateDistance(
          parseFloat(prev.latitude),
          parseFloat(prev.longitude),
          parseFloat(curr.latitude),
          parseFloat(curr.longitude)
        )

        // Only add if distance is reasonable (< 10km between points)
        // This filters out GPS jumps/errors
        if (distance < 10000) {
          totalDistanceMeters += distance
        }
      }
    }

    const totalDistanceMiles = totalDistanceMeters / 1609.34 // Convert meters to miles

    // Calculate hours worked (from first to last GPS log)
    let hoursWorked = 0
    if (gpsLogs && gpsLogs.length > 0) {
      const firstLog = new Date(gpsLogs[0].created_at).getTime()
      const lastLog = new Date(gpsLogs[gpsLogs.length - 1].created_at).getTime()
      hoursWorked = (lastLog - firstLog) / (1000 * 60 * 60)
    }

    // Calculate efficiency (jobs completed / jobs assigned * 100)
    const totalJobs = jobs?.length || 0
    const efficiency = totalJobs > 0
      ? Math.round((completedJobs.length / totalJobs) * 100)
      : 0

    return NextResponse.json({
      stats: {
        jobsCompletedToday: completedJobs.length,
        jobsInProgress: inProgressJobs.length,
        jobsScheduled: scheduledJobs.length,
        averageJobTimeMinutes,
        totalDistanceTraveledMiles: Math.round(totalDistanceMiles * 10) / 10, // Round to 1 decimal
        hoursWorkedToday: Math.round(hoursWorked * 10) / 10, // Round to 1 decimal
        efficiency
      },
      meta: {
        techId,
        techName: techUser.full_name,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        gpsLogsCount: gpsLogs?.length || 0
      }
    })

  } catch (error) {
    console.error('Error fetching tech stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch tech stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
