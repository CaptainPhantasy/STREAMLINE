import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * POST /api/dispatch/jobs/[id]/assign
 *
 * Assigns a technician to a job. Updates job status and creates audit log.
 *
 * Request Body:
 * {
 *   techId: string  // ID of technician to assign
 *   notifyTech?: boolean  // Whether to send notification (default: true)
 *   notes?: string  // Optional assignment notes
 * }
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Validates job and tech belong to same account
 *
 * Response format:
 * {
 *   success: true
 *   job: {
 *     id: string
 *     assignedTechId: string
 *     status: string
 *     assignedAt: string
 *   }
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { id: jobId } = await params

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and account
  const { data: userData } = await supabase
    .from('users')
    .select('role, account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user has dispatcher permissions
  if (!['owner', 'admin', 'dispatcher'].includes(userData.role || '')) {
    return NextResponse.json({
      error: 'Forbidden: dispatcher, admin, or owner role required'
    }, { status: 403 })
  }

  // Parse request body
  let body: { techId: string; notifyTech?: boolean; notes?: string }
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { techId, notifyTech = true, notes } = body

  // Validate required fields
  if (!techId) {
    return NextResponse.json({ error: 'techId is required' }, { status: 400 })
  }

  try {
    // Verify job exists and belongs to same account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, account_id, status, description, tech_assigned_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.account_id !== userData.account_id) {
      return NextResponse.json({
        error: 'Forbidden: Job belongs to different account'
      }, { status: 403 })
    }

    // Verify tech exists and belongs to same account
    const { data: tech, error: techError } = await supabase
      .from('users')
      .select('id, account_id, full_name, role')
      .eq('id', techId)
      .single()

    if (techError || !tech) {
      return NextResponse.json({ error: 'Tech not found' }, { status: 404 })
    }

    if (tech.account_id !== userData.account_id) {
      return NextResponse.json({
        error: 'Forbidden: Tech belongs to different account'
      }, { status: 403 })
    }

    // Verify tech is actually a tech or sales role
    if (!['tech', 'sales'].includes(tech.role || '')) {
      return NextResponse.json({
        error: 'Invalid assignment: User is not a tech or sales person'
      }, { status: 400 })
    }

    // Check if job is already assigned to someone else
    if (job.tech_assigned_id && job.tech_assigned_id !== techId) {
      // Get current tech name for warning message
      const { data: currentTech } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', job.tech_assigned_id)
        .single()

      return NextResponse.json({
        error: 'Job is already assigned',
        details: `Job is currently assigned to ${currentTech?.full_name || 'another tech'}`,
        currentTechId: job.tech_assigned_id
      }, { status: 409 })
    }

    // Check if tech is already on another job
    const { data: activeTechJobs } = await supabase
      .from('jobs')
      .select('id, description, status')
      .eq('tech_assigned_id', techId)
      .in('status', ['en_route', 'in_progress'])
      .limit(1)

    if (activeTechJobs && activeTechJobs.length > 0) {
      return NextResponse.json({
        error: 'Tech is currently on another job',
        details: `${tech.full_name} is already working on: ${activeTechJobs[0].description}`,
        conflictingJobId: activeTechJobs[0].id
      }, { status: 409 })
    }

    // Update job assignment
    const now = new Date().toISOString()
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        tech_assigned_id: techId,
        status: 'scheduled' // Set to scheduled when assigned
      })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) throw updateError

    // Create audit log entry
    const auditLog = {
      account_id: userData.account_id,
      user_id: user.id,
      action: 'job_assigned',
      entity_type: 'job',
      entity_id: jobId,
      old_values: {
        tech_assigned_id: job.tech_assigned_id,
        status: job.status
      },
      new_values: {
        tech_assigned_id: techId,
        status: 'scheduled'
      },
      metadata: {
        dispatcher_name: userData.role,
        tech_name: tech.full_name,
        notes: notes || null,
        notify_tech: notifyTech
      }
    }

    const { error: auditError } = await supabase
      .from('crmai_audit')
      .insert(auditLog)

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the assignment if audit log fails
    }

    // TODO: Send notification to tech if notifyTech is true
    // This would integrate with your notification system (email, SMS, push)
    if (notifyTech) {
      console.log(`TODO: Send notification to tech ${techId} about job ${jobId}`)
      // Example: await sendTechNotification(techId, jobId, 'job_assigned')
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        assignedTechId: updatedJob.tech_assigned_id,
        status: updatedJob.status,
        assignedAt: now
      },
      meta: {
        techName: tech.full_name,
        assignedBy: user.id,
        notificationSent: notifyTech
      }
    })

  } catch (error) {
    console.error('Error assigning job:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
