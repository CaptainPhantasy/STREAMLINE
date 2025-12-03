import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/customer-retention
 * Get customer retention metrics
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
    const period = searchParams.get('period') || '30' // days

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only owner/admin can view retention metrics
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Owner/Admin access required' },
        { status: 403 }
      )
    }

    const daysAgo = parseInt(period)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    // Get all customers with jobs
    const { data: customers } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, created_at')
      .eq('account_id', userData.account_id)

    // Get jobs per customer
    const { data: jobs } = await supabase
      .from('jobs')
      .select('contact_id, created_at, status')
      .eq('account_id', userData.account_id)
      .not('contact_id', 'is', null)

    // Calculate retention metrics
    const customerMetrics = customers?.map((customer) => {
      const customerJobs = jobs?.filter((j) => j.contact_id === customer.id) || []
      const recentJobs = customerJobs.filter(
        (j) => new Date(j.created_at) >= cutoffDate
      )
      const isActive = recentJobs.length > 0

      return {
        contact_id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        total_jobs: customerJobs.length,
        recent_jobs: recentJobs.length,
        is_active: isActive,
        last_job_date: customerJobs.length > 0
          ? customerJobs.sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].created_at
          : null,
      }
    }) || []

    const activeCustomers = customerMetrics.filter((c) => c.is_active).length
    const totalCustomers = customerMetrics.length
    const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0

    // Calculate churn (customers with no recent activity)
    const churnedCustomers = customerMetrics.filter(
      (c) => !c.is_active && c.total_jobs > 0
    ).length

    return NextResponse.json({
      period_days: daysAgo,
      overall: {
        total_customers: totalCustomers,
        active_customers: activeCustomers,
        retention_rate: retentionRate,
        churned_customers: churnedCustomers,
        churn_rate: totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0,
      },
      customers: customerMetrics,
    })
  } catch (error: unknown) {
    console.error('Error generating retention metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

