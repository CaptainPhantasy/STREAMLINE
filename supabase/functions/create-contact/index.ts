import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface CreateContactRequest {
  accountId: string
  email: string
  phone?: string
  firstName: string
  lastName?: string
  address?: string
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: CreateContactRequest = await req.json()
    const { accountId, email, phone, firstName, lastName, address } = body

    if (!accountId || !email || !firstName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, email, firstName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .eq('account_id', accountId)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ 
          error: 'Contact with this email already exists',
          contact: existing
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        account_id: accountId,
        email,
        phone: phone || null,
        first_name: firstName,
        last_name: lastName || null,
        address: address || null,
      })
      .select()
      .single()

    if (contactError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create contact', details: contactError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Audit log
    await supabase.from('crmai_audit').insert({
      account_id: accountId,
      action: 'contact_created',
      entity_type: 'contact',
      entity_id: contact.id,
      new_values: { email, first_name: firstName },
    })

    return new Response(
      JSON.stringify({ success: true, contact }),
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

