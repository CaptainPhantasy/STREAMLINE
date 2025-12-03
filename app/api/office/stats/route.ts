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

  // Get user's account
  const { data: userData } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch today's jobs
  const { data: todayJobs } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('account_id', userData.account_id)
    .gte('scheduled_start', today.toISOString())
    .lt('scheduled_start', tomorrow.toISOString())

  const jobsToday = todayJobs?.length || 0
  const jobsCompleted = todayJobs?.filter(j => j.status === 'completed').length || 0

  // Fetch today's escalations
  const { data: escalations } = await supabase
    .from('job_gates')
    .select('satisfaction_rating')
    .eq('requires_exception', true)
    .gte('created_at', today.toISOString())

  const escalationsToday = escalations?.length || 0

  // Calculate average rating from recent gates
  const { data: ratings } = await supabase
    .from('job_gates')
    .select('satisfaction_rating')
    .eq('stage_name', 'satisfaction')
    .not('satisfaction_rating', 'is', null)
    .gte('created_at', today.toISOString())

  const avgRating = ratings && ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.satisfaction_rating || 0), 0) / ratings.length
    : 0

  return NextResponse.json({
    jobsToday,
    jobsCompleted,
    escalationsToday,
    avgRating,
  })
}

