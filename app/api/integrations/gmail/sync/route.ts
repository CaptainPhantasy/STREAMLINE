import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { syncGmailEmails, parseGmailMessage } from '@/lib/gmail/sync'
import { extractContactInfo } from '@/lib/gmail/contact-extractor'
import { decrypt } from '@/lib/gmail/encryption'
import type { GmailSyncResponse } from '@/lib/types/gmail'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request): Promise<NextResponse<GmailSyncResponse>> {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({
        success: false,
        stats: {
          messagesProcessed: 0,
          contactsCreated: 0,
          contactsUpdated: 0,
          conversationsCreated: 0,
          messagesCreated: 0,
        },
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Parse JSON with fallback for empty body
    let body: any = {}
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (jsonError) {
      console.error('Failed to parse JSON body:', jsonError)
      body = {}
    }

    const {
      syncFrom, // ISO date string
      maxMessages = 100,
      labelIds = ['INBOX', 'SENT'],
    } = body

    // Get user's account
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

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({
        success: false,
        stats: {
          messagesProcessed: 0,
          contactsCreated: 0,
          contactsUpdated: 0,
          conversationsCreated: 0,
          messagesCreated: 0,
        },
        error: 'User not found'
      }, { status: 404 })
    }

    // Get Gmail provider for this account
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: providers } = await serviceSupabase
      .from('email_providers')
      .select('*')
      .eq('account_id', user.account_id)
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .limit(1)

    if (!providers || providers.length === 0) {
      return NextResponse.json({
        success: false,
        stats: {
          messagesProcessed: 0,
          contactsCreated: 0,
          contactsUpdated: 0,
          conversationsCreated: 0,
          messagesCreated: 0,
        },
        error: 'Gmail not connected. Please connect your Gmail Workspace first.'
      }, { status: 400 })
    }

    const provider = providers[0]

    // Decrypt tokens
    let accessToken: string
    let refreshToken: string
    try {
      accessToken = decrypt(provider.access_token_encrypted)
      refreshToken = decrypt(provider.refresh_token_encrypted)
    } catch (decryptError) {
      console.error('Failed to decrypt tokens:', decryptError)
      return NextResponse.json({
        success: false,
        stats: {
          messagesProcessed: 0,
          contactsCreated: 0,
          contactsUpdated: 0,
          conversationsCreated: 0,
          messagesCreated: 0,
        },
        error: 'Failed to decrypt Gmail credentials. Please reconnect your Gmail account.'
      }, { status: 400 })
    }

    // Sync emails
    const syncFromDate = syncFrom ? new Date(syncFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days

    let messages: any[] = []
    try {
      messages = await syncGmailEmails(accessToken, refreshToken, user.account_id, {
        syncFrom: syncFromDate,
        maxMessages,
        labelIds,
      })
    } catch (syncError) {
      console.error('Gmail API sync error:', syncError)
      // Return success with 0 messages instead of failing
      return NextResponse.json({
        success: true,
        stats: {
          messagesProcessed: 0,
          contactsCreated: 0,
          contactsUpdated: 0,
          conversationsCreated: 0,
          messagesCreated: 0,
        },
        message: 'Gmail sync unavailable or credentials expired'
      })
    }

    // Process each message
    const stats = {
      messagesProcessed: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      conversationsCreated: 0,
      messagesCreated: 0,
    }

    for (const message of messages) {
      const parsed = parseGmailMessage(message)
      
      // Extract contact information
      const extractedContacts = extractContactInfo(parsed)

      // Create or update contacts
      for (const contactInfo of extractedContacts) {
        if (!contactInfo.email) continue

        // Check if contact exists
        const { data: existingContact } = await serviceSupabase
          .from('contacts')
          .select('id')
          .eq('account_id', user.account_id)
          .eq('email', contactInfo.email)
          .single()

        if (existingContact) {
          // Update existing contact with new information
          const updates: any = {}
          if (contactInfo.firstName && !existingContact.first_name) {
            updates.first_name = contactInfo.firstName
          }
          if (contactInfo.lastName && !existingContact.last_name) {
            updates.last_name = contactInfo.lastName
          }
          if (contactInfo.phone) {
            updates.phone = contactInfo.phone
          }
          if (contactInfo.address) {
            updates.address = contactInfo.address
          }

          if (Object.keys(updates).length > 0) {
            await serviceSupabase
              .from('contacts')
              .update(updates)
              .eq('id', existingContact.id)
            stats.contactsUpdated++
          }
        } else {
          // Create new contact
          await serviceSupabase
            .from('contacts')
            .insert({
              account_id: user.account_id,
              email: contactInfo.email,
              first_name: contactInfo.firstName,
              last_name: contactInfo.lastName,
              phone: contactInfo.phone,
              address: contactInfo.address,
            })
          stats.contactsCreated++
        }
      }

      // Get or create contact for the "from" email
      let contactId: string | null = null
      if (parsed.from.email) {
        const { data: contact } = await serviceSupabase
          .from('contacts')
          .select('id')
          .eq('account_id', user.account_id)
          .eq('email', parsed.from.email)
          .single()

        if (contact) {
          contactId = contact.id
        }
      }

      // Create or get conversation
      let conversationId: string | null = null

      // Check if conversation exists by thread ID or subject
      if (parsed.threadId) {
        const { data: existingConv } = await serviceSupabase
          .from('conversations')
          .select('id')
          .eq('account_id', user.account_id)
          .eq('contact_id', contactId)
          .eq('subject', parsed.subject || '')
          .single()

        if (existingConv) {
          conversationId = existingConv.id
        }
      }

      if (!conversationId && contactId) {
        // Create new conversation
        const { data: newConv } = await serviceSupabase
          .from('conversations')
          .insert({
            account_id: user.account_id,
            contact_id: contactId,
            subject: parsed.subject,
            channel: 'email',
            last_message_at: parsed.date.toISOString(),
          })
          .select()
          .single()

        if (newConv) {
          conversationId = newConv.id
          stats.conversationsCreated++
        }
      }

      // Create message record
      if (conversationId) {
        await serviceSupabase
          .from('messages')
          .insert({
            account_id: user.account_id,
            conversation_id: conversationId,
            direction: parsed.from.email === provider.provider_email ? 'outbound' : 'inbound',
            sender_type: parsed.from.email === provider.provider_email ? 'user' : 'contact',
            sender_id: parsed.from.email === provider.provider_email ? session.user.id : null,
            subject: parsed.subject,
            body_text: parsed.bodyText,
            body_html: parsed.bodyHtml,
            message_id: parsed.messageId,
            in_reply_to: parsed.inReplyTo,
          })
        stats.messagesCreated++
      }

      stats.messagesProcessed++
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error: unknown) {
    console.error('Error syncing Gmail:', error)
    return NextResponse.json({
      success: false,
      stats: {
        messagesProcessed: 0,
        contactsCreated: 0,
        contactsUpdated: 0,
        conversationsCreated: 0,
        messagesCreated: 0,
      },
      error: error instanceof Error ? error.message : 'Failed to sync emails'
    }, { status: 500 })
  }
}

