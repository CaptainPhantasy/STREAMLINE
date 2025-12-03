import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/team-metrics
 * Get team performance metrics
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
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only owner/admin can view team metrics
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Owner/Admin access required' },
        { status: 403 }
      )
    }

    // Get all techs
    const { data: techs } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('account_id', userData.account_id)
      .in('role', ['tech', 'dispatcher'])

    // Get jobs per tech
    let jobsQuery = supabase
      .from('jobs')
      .select('tech_assigned_id, status, total_amount, created_at')
      .eq('account_id', userData.account_id)
      .not('tech_assigned_id', 'is', null)

    if (startDate) {
      jobsQuery = jobsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      jobsQuery = jobsQuery.lte('created_at', endDate)
    }

    const { data: jobs } = await jobsQuery

    // Calculate metrics per tech
    const techMetrics = techs?.map((tech) => {
      const techJobs = jobs?.filter((j) => j.tech_assigned_id === tech.id) || []
      const completed = techJobs.filter((j) => j.status === 'completed' || j.status === 'paid')
      const revenue = completed.reduce((sum, j) => sum + (j.total_amount || 0), 0)

      return {
        user_id: tech.id,
        full_name: tech.full_name,
        role: tech.role,
        total_jobs: techJobs.length,
        completed_jobs: completed.length,
        completion_rate: techJobs.length > 0 ? (completed.length / techJobs.length) * 100 : 0,
        revenue: revenue,
        average_job_value: completed.length > 0 ? revenue / completed.length : 0,
      }
    }) || []

    // Overall team metrics
    const totalJobs = jobs?.length || 0
    const completedJobs = jobs?.filter((j) => j.status === 'completed' || j.status === 'paid').length || 0
    const totalRevenue = jobs?.reduce((sum, j) => {
      if (j.status === 'completed' || j.status === 'paid') {
        return sum + (j.total_amount || 0)
      }
      return sum
    }, 0) || 0

    return NextResponse.json({
      period: {
        start: startDate || null,
        end: endDate || null,
      },
      team: {
        total_members: techs?.length || 0,
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        completion_rate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        total_revenue: totalRevenue,
        average_revenue_per_job: completedJobs > 0 ? totalRevenue / completedJobs : 0,
      },
      members: techMetrics,
    })
  } catch (error: unknown) {
    console.error('Error generating team metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

