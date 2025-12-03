import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface AssignTechRequest {
  accountId: string
  jobId: string
  techAssignedId: string
  userId?: string
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: AssignTechRequest = await req.json()
    const { accountId, jobId, techAssignedId, userId } = body

    if (!accountId || !jobId || !techAssignedId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, jobId, techAssignedId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify job belongs to account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('tech_assigned_id')
      .eq('id', jobId)
      .eq('account_id', accountId)
      .single()

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify tech exists and is in same account
    const { data: tech, error: techError } = await supabase
      .from('users')
      .select('id, role, account_id')
      .eq('id', techAssignedId)
      .eq('account_id', accountId)
      .single()

    if (techError || !tech) {
      return new Response(
        JSON.stringify({ error: 'Technician not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (tech.role !== 'tech') {
      return new Response(
        JSON.stringify({ error: 'User is not a technician' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ tech_assigned_id: techAssignedId })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to assign technician', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Audit log
    await supabase.from('crmai_audit').insert({
      account_id: accountId,
      user_id: userId,
      action: 'tech_assigned',
      entity_type: 'job',
      entity_id: jobId,
      old_values: { tech_assigned_id: job.tech_assigned_id },
      new_values: { tech_assigned_id: techAssignedId },
    })

    return new Response(
      JSON.stringify({ success: true, job: updatedJob }),
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

