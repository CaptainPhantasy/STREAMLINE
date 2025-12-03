import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's account and verify owner role
  const { data: userData } = await supabase
    .from('users')
    .select('account_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Date calculations
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // Today's jobs and revenue
  const { data: todayJobs } = await supabase
    .from('jobs')
    .select('id, status, total_amount')
    .eq('account_id', userData.account_id)
    .gte('scheduled_start', today.toISOString())
    .lt('scheduled_start', tomorrow.toISOString())

  const jobsToday = todayJobs?.length || 0
  const jobsCompleted = todayJobs?.filter(j => j.status === 'completed').length || 0
  const todayRevenue = todayJobs
    ?.filter(j => j.status === 'completed' || j.status === 'paid')
    .reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0

  // Week revenue
  const { data: weekJobs } = await supabase
    .from('jobs')
    .select('total_amount')
    .eq('account_id', userData.account_id)
    .in('status', ['completed', 'paid'])
    .gte('scheduled_start', weekStart.toISOString())

  const weekRevenue = weekJobs?.reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0

  // Month revenue
  const { data: monthJobs } = await supabase
    .from('jobs')
    .select('total_amount')
    .eq('account_id', userData.account_id)
    .in('status', ['completed', 'paid'])
    .gte('scheduled_start', monthStart.toISOString())

  const monthRevenue = monthJobs?.reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0

  // Ratings
  const { data: ratings } = await supabase
    .from('job_gates')
    .select('satisfaction_rating')
    .eq('stage_name', 'satisfaction')
    .not('satisfaction_rating', 'is', null)
    .gte('created_at', monthStart.toISOString())

  const avgRating = ratings && ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.satisfaction_rating || 0), 0) / ratings.length
    : 0
  const reviewsCollected = ratings?.length || 0

  // Tech status
  const { data: techs } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      jobs:jobs!jobs_tech_assigned_id_fkey (
        id,
        status,
        description
      )
    `)
    .eq('account_id', userData.account_id)
    .eq('role', 'tech')

  // Get latest GPS for each tech
  const techStatuses = await Promise.all(
    (techs || []).map(async (tech) => {
      const { data: lastGps } = await supabase
        .from('gps_logs')
        .select('latitude, longitude, created_at')
        .eq('user_id', tech.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const activeJob = (tech.jobs as any[])?.find(j => 
        j.status === 'in_progress' || j.status === 'en_route'
      )

      let status: 'on_job' | 'en_route' | 'idle' | 'offline' = 'offline'
      if (activeJob?.status === 'in_progress') status = 'on_job'
      else if (activeJob?.status === 'en_route') status = 'en_route'
      else if (lastGps && new Date(lastGps.created_at) > new Date(Date.now() - 30 * 60 * 1000)) {
        status = 'idle'
      }

      return {
        id: tech.id,
        name: tech.full_name || 'Unknown',
        status,
        currentJob: activeJob?.description,
        lastLocation: lastGps ? {
          lat: lastGps.latitude,
          lng: lastGps.longitude,
          updatedAt: lastGps.created_at,
        } : undefined,
      }
    })
  )

  const techsActive = techStatuses.filter(t => t.status !== 'offline').length
  const techsTotal = techStatuses.length

  // Alerts
  const alerts: Array<{ id: string; type: string; message: string; severity: 'info' | 'warning' | 'critical' }> = []

  // Check for pending escalations
  const { data: pendingEscalations } = await supabase
    .from('job_gates')
    .select('id')
    .eq('requires_exception', true)
    .eq('status', 'pending')

  if (pendingEscalations && pendingEscalations.length > 0) {
    alerts.push({
      id: 'escalations',
      type: 'escalation',
      message: `${pendingEscalations.length} customer escalation(s) pending`,
      severity: 'critical',
    })
  }

  // Check for overdue jobs
  const { data: overdueJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('account_id', userData.account_id)
    .eq('status', 'scheduled')
    .lt('scheduled_start', today.toISOString())

  if (overdueJobs && overdueJobs.length > 0) {
    alerts.push({
      id: 'overdue',
      type: 'schedule',
      message: `${overdueJobs.length} overdue job(s) need attention`,
      severity: 'warning',
    })
  }

  return NextResponse.json({
    stats: {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      jobsToday,
      jobsCompleted,
      avgRating,
      reviewsCollected,
      techsActive,
      techsTotal,
      alerts,
    },
    techs: techStatuses,
  })
}

