import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Job State Machine - Valid transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  'lead': ['scheduled', 'closed'],
  'scheduled': ['en_route', 'in_progress', 'closed'],
  'en_route': ['in_progress', 'scheduled'],
  'in_progress': ['completed', 'en_route'],
  'completed': ['invoiced', 'closed'],
  'invoiced': ['paid', 'completed'],
  'paid': ['closed'],
  'closed': [], // Terminal state
}

interface UpdateJobStatusRequest {
  accountId: string
  jobId: string
  newStatus: string
  userId?: string
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: UpdateJobStatusRequest = await req.json()
    const { accountId, jobId, newStatus, userId } = body

    if (!accountId || !jobId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, jobId, newStatus' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get current job
    const { data: currentJob, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('account_id', accountId)
      .single()

    if (jobError || !currentJob) {
      return new Response(
        JSON.stringify({ error: 'Job not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const currentStatus = currentJob.status || 'lead'

    // Validate state transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []
    if (!allowedTransitions.includes(newStatus)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          allowedTransitions 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update job', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Audit log
    await supabase.from('crmai_audit').insert({
      account_id: accountId,
      user_id: userId,
      action: 'job_status_updated',
      entity_type: 'job',
      entity_id: jobId,
      old_values: { status: currentStatus },
      new_values: { status: newStatus },
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        job: updatedJob,
        transition: { from: currentStatus, to: newStatus }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

