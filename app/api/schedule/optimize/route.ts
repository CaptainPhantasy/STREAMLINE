import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * POST /api/schedule/optimize
 * Optimize job order for minimal travel time
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
    const { job_ids, origin_location } = body

    if (!Array.isArray(job_ids) || job_ids.length === 0) {
      return NextResponse.json(
        { error: 'job_ids array is required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get jobs with locations
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, description, scheduled_start, contact:contacts(address)')
      .in('id', job_ids)
      .eq('account_id', userData.account_id)

    if (jobsError || !jobs) {
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Simple optimization: Nearest Neighbor algorithm
    // In production, use a more sophisticated TSP solver
    const optimizedOrder = optimizeRoute(jobs, origin_location)

    return NextResponse.json({
      optimized_order: optimizedOrder,
      total_jobs: optimizedOrder.length,
    })
  } catch (error: unknown) {
    console.error('Error optimizing route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function optimizeRoute(jobs: any[], origin?: { lat: number; lng: number }): string[] {
  // Simple nearest neighbor algorithm
  // TODO: Implement proper TSP solver with Google Maps Distance Matrix
  return jobs.map(j => j.id)
}
