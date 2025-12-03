import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/analytics/scenario-modeling
 * Run scenario modeling (what-if analysis)
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
    const { scenario_type, parameters } = body

    if (!scenario_type) {
      return NextResponse.json(
        { error: 'scenario_type is required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only owner/admin can run scenarios
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Owner/Admin access required' },
        { status: 403 }
      )
    }

    // Get baseline data
    const { data: baselineJobs } = await supabase
      .from('jobs')
      .select('total_amount, status, created_at')
      .eq('account_id', userData.account_id)
      .eq('status', 'paid')

    const baselineRevenue = baselineJobs?.reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0
    const baselineJobsCount = baselineJobs?.length || 0

    // Run scenario based on type
    let scenarioResult: any = {}

    switch (scenario_type) {
      case 'price_increase': {
        const increasePercent = parameters?.increase_percent || 0
        const projectedRevenue = baselineRevenue * (1 + increasePercent / 100)
        scenarioResult = {
          scenario_type: 'price_increase',
          baseline: {
            revenue: baselineRevenue,
            jobs: baselineJobsCount,
          },
          projected: {
            revenue: projectedRevenue,
            jobs: baselineJobsCount, // Assume same volume
            revenue_increase: projectedRevenue - baselineRevenue,
          },
          assumptions: {
            price_increase_percent: increasePercent,
            volume_unchanged: true,
          },
        }
        break
      }

      case 'volume_increase': {
        const volumeIncreasePercent = parameters?.volume_increase_percent || 0
        const avgJobValue = baselineJobsCount > 0 ? baselineRevenue / baselineJobsCount : 0
        const projectedJobs = baselineJobsCount * (1 + volumeIncreasePercent / 100)
        const projectedRevenue = projectedJobs * avgJobValue

        scenarioResult = {
          scenario_type: 'volume_increase',
          baseline: {
            revenue: baselineRevenue,
            jobs: baselineJobsCount,
            avg_job_value: avgJobValue,
          },
          projected: {
            revenue: projectedRevenue,
            jobs: projectedJobs,
            revenue_increase: projectedRevenue - baselineRevenue,
          },
          assumptions: {
            volume_increase_percent: volumeIncreasePercent,
            avg_job_value_unchanged: true,
          },
        }
        break
      }

      case 'efficiency_improvement': {
        const efficiencyGain = parameters?.efficiency_gain_percent || 0
        const currentJobsPerPeriod = baselineJobsCount
        const projectedJobs = currentJobsPerPeriod * (1 + efficiencyGain / 100)
        const avgJobValue = baselineJobsCount > 0 ? baselineRevenue / baselineJobsCount : 0
        const projectedRevenue = projectedJobs * avgJobValue

        scenarioResult = {
          scenario_type: 'efficiency_improvement',
          baseline: {
            revenue: baselineRevenue,
            jobs: baselineJobsCount,
          },
          projected: {
            revenue: projectedRevenue,
            jobs: projectedJobs,
            revenue_increase: projectedRevenue - baselineRevenue,
          },
          assumptions: {
            efficiency_gain_percent: efficiencyGain,
            avg_job_value_unchanged: true,
          },
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown scenario type: ${scenario_type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      scenario: scenarioResult,
      generated_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Error running scenario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

