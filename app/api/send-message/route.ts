import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
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
            } catch {
              // Ignore
            }
          },
        },
      }
    )
    
    // 1. Validate Session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, message, subject } = body

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 2. Fetch Conversation & Contact details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const contactEmail = conversation.contact?.email
    if (!contactEmail) {
      return NextResponse.json({ error: 'Contact has no email' }, { status: 400 })
    }

    // 3. Find last message for threading (In-Reply-To)
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('message_id')
      .eq('conversation_id', conversationId)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const inReplyTo = lastMessage?.message_id

    // 4. Send Email via unified email service (Resend or Gmail)
    const emailResult = await sendEmail({
      to: contactEmail,
      subject: subject || conversation.subject || 'Response from CRM-AI PRO',
      text: message,
      inReplyTo: inReplyTo || undefined,
      references: inReplyTo || undefined,
      accountId: conversation.account_id,
      userId: session.user.id,
    })

    if (!emailResult.success) {
      console.error('Email Error:', emailResult.error)
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // 5. Insert Message into DB
    const { data: newMessage, error: dbError } = await supabase
      .from('messages')
      .insert({
        account_id: conversation.account_id,
        conversation_id: conversationId,
        direction: 'outbound',
        sender_type: 'user',
        sender_id: session.user.id,
        subject: subject,
        body_text: message,
        message_id: emailResult.messageId,
        in_reply_to: inReplyTo
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB Insert Error:', dbError)
      // Email was sent but DB failed... strictly speaking we should retry DB insert or log critical error
      return NextResponse.json({ error: 'Email sent but failed to save message' }, { status: 500 })
    }

    // 6. Update Conversation Timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), status: 'open' })
      .eq('id', conversationId)

    return NextResponse.json({ success: true, message: newMessage })

  } catch (error) {
    console.error('Unexpected Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

