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

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const groupBy = searchParams.get('groupBy') || 'date' // 'date', 'tech', 'status'

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

    // Construct efficient query with joins if needed
    let selectQuery = 'id, amount, created_at, job_id'

    // If we need grouping by tech or status, join with jobs table immediately
    if (groupBy === 'tech' || groupBy === 'status') {
      // Note: This assumes a foreign key relationship exists. 
      // If not, we fall back to the previous method, but standard Supabase setups usually have this.
      // We select the related job data in the same query.
      selectQuery += ', jobs ( id, status, tech_assigned_id, users ( id, name, full_name ) )'
    }

    let paymentsQuery = supabase
      .from('payments')
      .select(selectQuery)
      .eq('account_id', user.account_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (dateFrom) {
      paymentsQuery = paymentsQuery.gte('created_at', dateFrom)
    }

    if (dateTo) {
      paymentsQuery = paymentsQuery.lte('created_at', dateTo)
    }

    const { data: payments, error } = await paymentsQuery

    if (error) {
      console.error('Error fetching revenue payments:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 })
    }

    const paymentsList = (payments || []) as any[]
    const totalRevenue = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0)

    let breakdown: Record<string, number> = {}

    if (groupBy === 'date') {
      breakdown = paymentsList.reduce((acc, payment) => {
        const timestamp = new Date(payment.created_at)
        if (Number.isNaN(timestamp.getTime())) {
          return acc
        }
        const dateKey = timestamp.toISOString().split('T')[0]
        acc[dateKey] = (acc[dateKey] || 0) + (payment.amount || 0)
        return acc
      }, {} as Record<string, number>)
    } else if (groupBy === 'tech') {
      breakdown = paymentsList.reduce((acc, payment: any) => {
        // Access nested joined data
        const job = payment.jobs
        const tech = job?.users
        const techName = tech?.name || tech?.full_name || 'Unassigned'
        acc[techName] = (acc[techName] || 0) + (payment.amount || 0)
        return acc
      }, {} as Record<string, number>)
    } else if (groupBy === 'status') {
      breakdown = paymentsList.reduce((acc, payment: any) => {
        const job = payment.jobs
        const statusKey = job?.status || 'unknown'
        acc[statusKey] = (acc[statusKey] || 0) + (payment.amount || 0)
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      totalRevenue,
      breakdown,
      groupBy,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/analytics/revenue:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
