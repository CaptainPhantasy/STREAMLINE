import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * POST /api/schedule/conflicts
 * Check for scheduling conflicts before assigning a resource
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
    const { resource_id, job_id, scheduled_start, scheduled_end } = body

    if (!resource_id || !job_id || !scheduled_start || !scheduled_end) {
      return NextResponse.json(
        { error: 'resource_id, job_id, scheduled_start, and scheduled_end are required' },
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

    // Use service role to check conflicts
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: conflicts, error: conflictError } = await supabaseAdmin.rpc(
      'check_scheduling_conflicts',
      {
        p_resource_id: resource_id,
        p_job_id: job_id,
        p_job_start: scheduled_start,
        p_job_end: scheduled_end,
      }
    )

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { error: 'Failed to check conflicts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      has_conflicts: conflicts && conflicts.length > 0,
      conflicts: conflicts || [],
    })
  } catch (error: unknown) {
    console.error('Error checking conflicts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

