import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, avatar_url, account_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch stats for this tech
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // Get completed jobs count
  const { data: completedJobs } = await supabase
    .from('jobs')
    .select('id, total_amount')
    .eq('tech_assigned_id', user.id)
    .eq('status', 'completed')
    .gte('scheduled_start', monthStart.toISOString())

  const jobsCompleted = completedJobs?.length || 0

  // Calculate average rating from satisfaction gates
  const { data: ratings } = await supabase
    .from('job_gates')
    .select(`
      satisfaction_rating,
      job:jobs!inner (
        tech_assigned_id
      )
    `)
    .eq('stage_name', 'satisfaction')
    .not('satisfaction_rating', 'is', null)
    .gte('created_at', monthStart.toISOString())

  const techRatings = ratings?.filter((r: any) =>
    r.job?.tech_assigned_id === user.id
  ) || []

  const avgRating = techRatings.length > 0
    ? techRatings.reduce((sum: number, r: any) => sum + (r.satisfaction_rating || 0), 0) / techRatings.length
    : 0

  // Calculate on-time rate
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('id, scheduled_start, scheduled_end, status')
    .eq('tech_assigned_id', user.id)
    .in('status', ['completed', 'paid'])
    .gte('scheduled_start', monthStart.toISOString())

  // Get completion times from job_gates
  const onTimeJobs = await Promise.all(
    (allJobs || []).map(async (job) => {
      const { data: completionGate } = await supabase
        .from('job_gates')
        .select('created_at')
        .eq('job_id', job.id)
        .eq('stage_name', 'completion')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!completionGate || !job.scheduled_end) return null

      const completedAt = new Date(completionGate.created_at)
      const scheduledEnd = new Date(job.scheduled_end)

      // Consider on-time if completed within 30 minutes of scheduled end
      const onTime = completedAt <= new Date(scheduledEnd.getTime() + 30 * 60 * 1000)
      return onTime ? 1 : 0
    })
  )

  const validOnTimeChecks = onTimeJobs.filter(x => x !== null) as number[]
  const onTimeRate = validOnTimeChecks.length > 0
    ? (validOnTimeChecks.reduce((sum, val) => sum + val, 0) / validOnTimeChecks.length) * 100
    : 95 // Default if no data

  return NextResponse.json({
    user: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      avatarUrl: profile.avatar_url,
    },
    stats: {
      jobsCompleted,
      avgRating: Math.round(avgRating * 10) / 10,
      onTimeRate: Math.round(onTimeRate),
    }
  })
}
