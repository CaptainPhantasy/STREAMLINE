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
    const status = searchParams.get('status')

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

    // Refresh materialized view if needed (or use direct query)
    // For now, query directly from jobs table
    let query = supabase
      .from('jobs')
      .select('status, total_amount, created_at')
      .eq('account_id', user.account_id)

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching job analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Calculate analytics
    const totalJobs = jobs?.length || 0
    const totalRevenue = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0
    const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0
    const completedCount = jobs?.filter((j) => j.status === 'completed').length || 0
    const paidCount = jobs?.filter((j) => j.status === 'paid').length || 0

    // Group by status
    const statusBreakdown = jobs?.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Group by date
    const dateBreakdown = jobs?.reduce((acc, job) => {
      const date = new Date(job.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      totalJobs,
      totalRevenue,
      avgJobValue: Math.round(avgJobValue),
      completedCount,
      paidCount,
      statusBreakdown,
      dateBreakdown,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/analytics/jobs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

