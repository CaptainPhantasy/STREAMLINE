import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types for Resend Webhook Payload
// See: https://resend.com/docs/dashboard/webhooks/event-types
interface ResendEmail {
  id: string
  from: string
  to: string[]
  created_at: string
  subject: string
  html: string
  text: string
  headers: Record<string, string>
  attachments: any[]
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Resend sends a wrapper event. We need to check structure.
    // Assuming direct email object or event wrapper. 
    // Usually Resend webhooks might be event based, but for "Forwarding" it might be different.
    // Let's assume standard Resend Inbound Webhook payload structure.
    console.log('Received payload:', JSON.stringify(payload))

    const email = payload as ResendEmail

    // Initialize Supabase Client with Service Role Key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Identify Account based on "To" address
    // For pilot: help@317plumber.com -> "317 Plumber"
    // We need to match the email domain or specific address to an account.
    // We'll search accounts table for matching inbound_email_domain or just grab the first one for pilot simplicity if needed.
    
    const toAddress = email.to[0] // Simple assumption for now
    // Extract domain or check specific mapping
    
    // Find account
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1) 
      // In a real multi-tenant app, we'd query by inbound_email_domain or specific email mapping.
      // .eq('inbound_email_domain', '...')
    
    if (accountError || !accounts || accounts.length === 0) {
      throw new Error('No account found for incoming email')
    }
    const accountId = accounts[0].id

    // 2. Identify Contact based on "From" address
    const fromParts = email.from.match(/<(.+)>/)
    const fromEmail = fromParts ? fromParts[1] : email.from
    // Also parse name if available "Name <email>"
    let fromName = ''
    const nameMatch = email.from.match(/^([^<]+)/)
    if (nameMatch) fromName = nameMatch[1].trim().replace(/"/g, '')

    let contactId: string

    const { data: existingContact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', fromEmail)
      .eq('account_id', accountId)
      .single()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      // Create new contact
      const { data: newContact, error: createContactError } = await supabase
        .from('contacts')
        .insert({
          account_id: accountId,
          email: fromEmail,
          first_name: fromName, // Simple name split could be better
          // last_name: ... 
        })
        .select('id')
        .single()
      
      if (createContactError) throw createContactError
      contactId = newContact.id
    }

    // 3. Threading: Check In-Reply-To header
    const inReplyTo = email.headers['In-Reply-To']
    let conversationId: string | null = null

    if (inReplyTo) {
      // Try to find the original message
      const { data: originalMessage } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('message_id', inReplyTo)
        .single()
      
      if (originalMessage) {
        conversationId = originalMessage.conversation_id
      }
    }

    // If no thread found, create new conversation
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          subject: email.subject,
          status: 'open',
          channel: 'email'
        })
        .select('id')
        .single()

      if (convError) throw convError
      conversationId = newConv.id
    }

    // 4. Insert Message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        account_id: accountId,
        conversation_id: conversationId,
        direction: 'inbound',
        sender_type: 'contact',
        sender_id: null, // It's a contact
        subject: email.subject,
        body_text: email.text,
        body_html: email.html,
        attachments: email.attachments,
        message_id: email.headers['Message-ID'],
        in_reply_to: inReplyTo
      })

    if (messageError) throw messageError

    // 5. Update Conversation timestamp & snippet (optional if handled by trigger, but let's do simple update)
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open' // Re-open if it was closed
      })
      .eq('id', conversationId)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error('Error processing inbound email:', err)
    // Always return 200 to prevent Resend from retrying indefinitely on logic errors
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }
})
