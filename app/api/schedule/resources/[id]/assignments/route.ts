import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * POST /api/schedule/resources/[id]/assignments
 * Assign a resource to a job with conflict checking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const resourceId = params.id
    const body = await request.json()
    const { job_id, notes } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
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

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, account_id, scheduled_start, scheduled_end')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for conflicts using service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (job.scheduled_start && job.scheduled_end) {
      const { data: conflicts, error: conflictError } = await supabaseAdmin.rpc(
        'check_scheduling_conflicts',
        {
          p_resource_id: resourceId,
          p_job_id: job_id,
          p_job_start: job.scheduled_start,
          p_job_end: job.scheduled_end,
        }
      )

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError)
      } else if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Scheduling conflict detected',
            conflicts: conflicts,
          },
          { status: 409 }
        )
      }
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('resource_assignments')
      .select('id')
      .eq('resource_id', resourceId)
      .eq('job_id', job_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Resource already assigned to this job' },
        { status: 400 }
      )
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('resource_assignments')
      .insert({
        resource_id: resourceId,
        job_id: job_id,
        account_id: userData.account_id,
        assigned_by: user.id,
        notes: notes || null,
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to assign resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error assigning resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

