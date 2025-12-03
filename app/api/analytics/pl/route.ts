import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/pl
 * Get Profit & Loss report
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

    // Only owner/admin can view P&L
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Owner/Admin access required' },
        { status: 403 }
      )
    }

    // Build date filter
    let dateFilter = {}
    if (startDate) {
      dateFilter = { ...dateFilter, gte: startDate }
    }
    if (endDate) {
      dateFilter = { ...dateFilter, lte: endDate }
    }

    // Get revenue (from completed jobs)
    let revenueQuery = supabase
      .from('jobs')
      .select('total_amount')
      .eq('account_id', userData.account_id)
      .eq('status', 'paid')

    if (startDate) {
      revenueQuery = revenueQuery.gte('created_at', startDate)
    }
    if (endDate) {
      revenueQuery = revenueQuery.lte('created_at', endDate)
    }

    const { data: revenueJobs } = await revenueQuery

    const totalRevenue = revenueJobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0

    // Get costs (from parts usage - simplified)
    const { data: partsUsage } = await supabase
      .from('part_usage_history')
      .select('quantity_used, part:parts(unit_cost)')
      .eq('account_id', userData.account_id)

    if (startDate) {
      // Filter by used_at if available
    }

    const totalCosts = partsUsage?.reduce((sum, usage: any) => {
      const cost = (usage.part?.unit_cost || 0) * usage.quantity_used
      return sum + cost
    }, 0) || 0

    // Calculate profit
    const grossProfit = totalRevenue - totalCosts
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    return NextResponse.json({
      period: {
        start: startDate || null,
        end: endDate || null,
      },
      revenue: {
        total: totalRevenue,
        breakdown: {
          jobs: revenueJobs?.length || 0,
        },
      },
      costs: {
        total: totalCosts,
        breakdown: {
          parts: partsUsage?.length || 0,
        },
      },
      profit: {
        gross: grossProfit,
        margin: profitMargin,
      },
    })
  } catch (error: unknown) {
    console.error('Error generating P&L report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

