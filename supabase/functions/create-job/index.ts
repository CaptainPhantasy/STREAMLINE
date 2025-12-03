import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface CreateJobRequest {
  accountId: string
  contactId: string
  conversationId?: string
  description: string
  scheduledStart?: string
  scheduledEnd?: string
  techAssignedId?: string
  status?: string
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: CreateJobRequest = await req.json()
    const { accountId, contactId, conversationId, description, scheduledStart, scheduledEnd, techAssignedId, status = 'lead' } = body

    if (!accountId || !contactId || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, contactId, description' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify contact belongs to account
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', contactId)
      .eq('account_id', accountId)
      .single()

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contact not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create conversation if not provided
    let finalConversationId = conversationId
    if (!finalConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          subject: description.substring(0, 100),
          status: 'open',
          channel: 'manual',
        })
        .select()
        .single()

      if (convError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation', details: convError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
      finalConversationId = newConv.id
    }

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        account_id: accountId,
        conversation_id: finalConversationId,
        contact_id: contactId,
        description,
        status,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        tech_assigned_id: techAssignedId || null,
      })
      .select()
      .single()

    if (jobError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create job', details: jobError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Audit log
    await supabase.from('crmai_audit').insert({
      account_id: accountId,
      action: 'job_created',
      entity_type: 'job',
      entity_id: job.id,
      new_values: { status: job.status, description: job.description },
    })

    return new Response(
      JSON.stringify({ success: true, job }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

