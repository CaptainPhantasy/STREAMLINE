import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
            } catch { }
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get this week's date range
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    // Execute efficient count and sum queries in parallel
    const [
      { count: totalJobs },
      { count: todayJobs },
      { count: completedJobs },
      { count: totalContacts },
      { count: newContactsThisMonth },
      { data: outstandingInvoices },
      { data: revenueStats } // New: Fetch pre-aggregated revenue stats via RPC or optimized query
    ] = await Promise.all([
      // 1. Total Jobs
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('account_id', user.account_id),

      // 2. Today's Jobs
      supabase.from('jobs').select('*', { count: 'exact', head: true })
        .eq('account_id', user.account_id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),

      // 3. Completed Jobs
      supabase.from('jobs').select('*', { count: 'exact', head: true })
        .eq('account_id', user.account_id)
        .eq('status', 'completed'),

      // 4. Total Contacts
      supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('account_id', user.account_id),

      // 5. New Contacts This Month
      supabase.from('contacts').select('*', { count: 'exact', head: true })
        .eq('account_id', user.account_id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString()),

      // 6. Outstanding Invoices (Sum) - still fetching rows but only necessary columns
      supabase.from('invoices').select('total_amount')
        .eq('account_id', user.account_id)
        .in('status', ['sent', 'overdue']),

      // 7. Revenue Stats - Optimized to fetch only necessary payment records for summation
      // Note: Ideally this would be a Postgres function (RPC), but for now we select only amount/created_at
      supabase.from('payments')
        .select('amount, created_at')
        .eq('account_id', user.account_id)
        .eq('status', 'completed')
    ])

    // Calculate revenue in memory (much faster now that we aren't blocking on other huge queries)
    // For a true fix, we should create a DB view or RPC, but this is a massive improvement over the previous waterfall.
    const payments = revenueStats || []

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    const todayRevenue = payments
      .filter(p => {
        const d = new Date(p.created_at)
        return d >= today && d < tomorrow
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const weekRevenue = payments
      .filter(p => {
        const d = new Date(p.created_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const monthRevenue = payments
      .filter(p => {
        const d = new Date(p.created_at)
        return d >= monthStart && d < monthEnd
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const outstandingAmount = outstandingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

    return NextResponse.json({
      jobs: {
        total: totalJobs || 0,
        today: todayJobs || 0,
        completed: completedJobs || 0,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
      },
      contacts: {
        total: totalContacts || 0,
        newThisMonth: newContactsThisMonth || 0,
      },
      invoices: {
        outstanding: outstandingInvoices?.length || 0,
        outstandingAmount,
      },
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/analytics/dashboard:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

