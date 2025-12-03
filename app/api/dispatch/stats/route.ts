import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateDistance } from '@/lib/gps/tracker'

/**
 * GET /api/dispatch/stats
 *
 * Fetches comprehensive statistics for the dispatch dashboard.
 * Includes KPIs, charts data, and team performance metrics.
 *
 * Query Parameters:
 * - timeRange: 'today' | 'week' | 'month' (default: 'today')
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Filters by account_id
 *
 * Response format:
 * {
 *   kpis: {
 *     avgJobsPerTech: number
 *     avgJobsPerTechTrend: 'up' | 'down' | 'stable'
 *     avgResponseTimeMinutes: number
 *     utilizationRate: number  // 0-100 percentage
 *     coverageRadiusMiles: number
 *   },
 *   charts: {
 *     jobsByStatus: { [status: string]: number }
 *     techActivityTimeline: Array<{ hour: string, active: number }>
 *     distanceTraveled: Array<{ techName: string, miles: number }>
 *     completionRates: Array<{ techName: string, rate: number, completed: number, assigned: number }>
 *   }
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
  const timeRange = searchParams.get('timeRange') || 'today'

  // Calculate date range
  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  if (timeRange === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (timeRange === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // Today
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  }

  // Calculate previous period for trend comparison
  const periodDuration = endDate.getTime() - startDate.getTime()
  const prevStartDate = new Date(startDate.getTime() - periodDuration)
  const prevEndDate = new Date(startDate.getTime())

  try {
    // Fetch all techs in account
    const { data: techs, error: techsError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('account_id', userData.account_id)
      .in('role', ['tech', 'sales'])

    if (techsError) throw techsError

    const techIds = techs?.map(t => t.id) || []
    const techCount = techIds.length

    // Fetch all jobs in time range
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, status, tech_assigned_id, scheduled_start, scheduled_end, created_at')
      .eq('account_id', userData.account_id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (jobsError) throw jobsError

    // Fetch previous period jobs for trend
    const { data: prevJobs } = await supabase
      .from('jobs')
      .select('id, status, tech_assigned_id')
      .eq('account_id', userData.account_id)
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString())

    // Calculate KPIs
    const completedJobs = jobs?.filter(j => j.status === 'completed') || []
    const prevCompletedJobs = prevJobs?.filter(j => j.status === 'completed') || []

    const avgJobsPerTech = techCount > 0 ? completedJobs.length / techCount : 0
    const prevAvgJobsPerTech = techCount > 0 ? prevCompletedJobs.length / techCount : 0

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (avgJobsPerTech > prevAvgJobsPerTech * 1.05) trend = 'up'
    else if (avgJobsPerTech < prevAvgJobsPerTech * 0.95) trend = 'down'

    // Calculate average response time (time from scheduled to en_route)
    let totalResponseMinutes = 0
    let responseCount = 0

    jobs?.forEach(job => {
      if (job.scheduled_start && job.status === 'en_route') {
        const scheduledTime = new Date(job.scheduled_start).getTime()
        const now = Date.now()
        const responseTime = (now - scheduledTime) / (1000 * 60)
        if (responseTime > 0 && responseTime < 1440) { // Less than 24 hours
          totalResponseMinutes += responseTime
          responseCount++
        }
      }
    })

    const avgResponseTimeMinutes = responseCount > 0
      ? Math.round(totalResponseMinutes / responseCount)
      : 0

    // Calculate utilization rate
    const { data: activeTechs } = await supabase
      .from('jobs')
      .select('tech_assigned_id')
      .eq('account_id', userData.account_id)
      .in('status', ['en_route', 'in_progress'])

    const activeTechCount = new Set(activeTechs?.map(j => j.tech_assigned_id).filter(Boolean)).size
    const utilizationRate = techCount > 0
      ? Math.round((activeTechCount / techCount) * 100)
      : 0

    // Calculate coverage radius (max distance from center)
    let coverageRadiusMiles = 0
    const { data: recentGps } = await supabase
      .from('gps_logs')
      .select('latitude, longitude, user_id')
      .in('user_id', techIds)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })

    if (recentGps && recentGps.length > 1) {
      // Calculate center point (average of all positions)
      const centerLat = recentGps.reduce((sum, gps) => sum + parseFloat(gps.latitude), 0) / recentGps.length
      const centerLng = recentGps.reduce((sum, gps) => sum + parseFloat(gps.longitude), 0) / recentGps.length

      // Find max distance from center
      let maxDistance = 0
      recentGps.forEach(gps => {
        const distance = calculateDistance(
          centerLat,
          centerLng,
          parseFloat(gps.latitude),
          parseFloat(gps.longitude)
        )
        if (distance > maxDistance) maxDistance = distance
      })

      coverageRadiusMiles = maxDistance / 1609.34 // Convert to miles
    }

    // Jobs by status chart
    const jobsByStatus = {
      unassigned: jobs?.filter(j => !j.tech_assigned_id).length || 0,
      scheduled: jobs?.filter(j => j.status === 'scheduled').length || 0,
      en_route: jobs?.filter(j => j.status === 'en_route').length || 0,
      in_progress: jobs?.filter(j => j.status === 'in_progress').length || 0,
      completed: completedJobs.length
    }

    // Tech activity timeline (hourly) - BATCH QUERY
    const techActivityTimeline: Array<{ hour: string; active: number }> = []
    
    // Get all GPS logs for the time range in one query
    const { data: activityGpsLogs } = await supabase
      .from('gps_logs')
      .select('user_id, created_at')
      .in('user_id', techIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    // Process logs in memory (much faster than 24 DB queries)
    const hourlyActivity = new Map<string, Set<string>>()
    
    activityGpsLogs?.forEach(log => {
      const hour = new Date(log.created_at).toTimeString().substring(0, 5)
      if (!hourlyActivity.has(hour)) {
        hourlyActivity.set(hour, new Set())
      }
      hourlyActivity.get(hour)!.add(log.user_id)
    })

    // Build timeline from processed data
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(startDate.getTime() + i * 60 * 60 * 1000)
      const hour = hourStart.toTimeString().substring(0, 5)
      techActivityTimeline.push({
        hour,
        active: hourlyActivity.get(hour)?.size || 0
      })
    }

    // Distance traveled per tech - BATCH QUERY
    const distanceTraveled: Array<{ techName: string; miles: number }> = []
    
    // Get all GPS logs for all techs in one query
    const { data: distanceGpsLogs } = await supabase
      .from('gps_logs')
      .select('user_id, latitude, longitude, created_at')
      .in('user_id', techIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    // Process by tech in memory
    const techDistances = new Map<string, number>()
    const techNameMap = new Map<string, string>()
    
    // Build name map for quick lookup
    techs?.forEach(tech => {
      techNameMap.set(tech.id, tech.full_name || 'Unknown')
    })

    // Calculate distances per tech
    const techGpsMap = new Map<string, any[]>()
    distanceGpsLogs?.forEach(log => {
      if (!techGpsMap.has(log.user_id)) {
        techGpsMap.set(log.user_id, [])
      }
      techGpsMap.get(log.user_id)!.push(log)
    })

    techGpsMap.forEach((gpsLogs, techId) => {
      let totalDistance = 0
      if (gpsLogs.length > 1) {
        for (let i = 1; i < gpsLogs.length; i++) {
          const prev = gpsLogs[i - 1]
          const curr = gpsLogs[i]
          const distance = calculateDistance(
            parseFloat(prev.latitude),
            parseFloat(prev.longitude),
            parseFloat(curr.latitude),
            parseFloat(curr.longitude)
          )
          if (distance < 10000) totalDistance += distance // Filter GPS jumps
        }
      }
      
      const miles = Math.round((totalDistance / 1609.34) * 10) / 10
      distanceTraveled.push({
        techName: techNameMap.get(techId) || 'Unknown',
        miles
      })
    })

    // Sort by distance and take top 10
    distanceTraveled.sort((a, b) => b.miles - a.miles)
    const topDistanceTraveled = distanceTraveled.slice(0, 10)

    // Completion rates per tech
    const completionRates: Array<{
      techName: string
      rate: number
      completed: number
      assigned: number
    }> = []

    for (const tech of techs || []) {
      const techJobs = jobs?.filter(j => j.tech_assigned_id === tech.id) || []
      const techCompleted = techJobs.filter(j => j.status === 'completed')

      const rate = techJobs.length > 0
        ? Math.round((techCompleted.length / techJobs.length) * 100)
        : 0

      completionRates.push({
        techName: tech.full_name || 'Unknown',
        rate,
        completed: techCompleted.length,
        assigned: techJobs.length
      })
    }

    // Sort by rate descending
    completionRates.sort((a, b) => b.rate - a.rate)

    return NextResponse.json({
      kpis: {
        avgJobsPerTech: Math.round(avgJobsPerTech * 10) / 10,
        avgJobsPerTechTrend: trend,
        avgResponseTimeMinutes,
        utilizationRate,
        coverageRadiusMiles: Math.round(coverageRadiusMiles * 10) / 10
      },
      charts: {
        jobsByStatus,
        techActivityTimeline,
        distanceTraveled: topDistanceTraveled,
        completionRates
      },
      meta: {
        timeRange,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        techCount,
        totalJobs: jobs?.length || 0
      }
    })

  } catch (error) {
    console.error('Error fetching dispatch stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch dispatch stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
