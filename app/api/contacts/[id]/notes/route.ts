import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

/**
 * GET /api/contacts/[id]/notes
 * Get all notes for a contact (from all conversations)
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    let supabase: any

    if (authHeader?.startsWith('Bearer ')) {
      const { createClient } = await import('@supabase/supabase-js')
      const token = authHeader.substring(7)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
    } else {
      const cookieStore = await cookies()
      supabase = createServerClient(
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
    }

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify contact belongs to account
    const { data: contact } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Get all conversations for this contact
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', params.id)
      .eq('account_id', user.account_id)

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ notes: [], total: 0 })
    }

    const conversationIds = conversations.map((c: any) => c.id)

    // Get notes from all conversations for this contact
    const { data: notes, error } = await supabase
      .from('messages')
      .select('id, body_text, created_at, sender_id, sender_type, conversation_id')
      .in('conversation_id', conversationIds)
      .eq('is_internal_note', true)
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({
      notes: (notes || []).map((note: any) => ({
        id: note.id,
        content: note.body_text,
        created_at: note.created_at,
        conversation_id: note.conversation_id,
      })),
      total: notes?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/contacts/[id]/notes
 * Create a new note for a contact
 * Creates a note in the most recent conversation, or creates a new conversation if none exists
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    let supabase: any

    if (authHeader?.startsWith('Bearer ')) {
      const { createClient } = await import('@supabase/supabase-js')
      const token = authHeader.substring(7)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
    } else {
      const cookieStore = await cookies()
      supabase = createServerClient(
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
    }

    const body = await request.json()
    const { content, conversationId } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Missing required field: content' 
      }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify contact belongs to account
    const { data: contact } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    let targetConversationId = conversationId

    // If no conversation ID provided, find or create one
    if (!targetConversationId) {
      // Find most recent conversation for this contact
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', params.id)
        .eq('account_id', user.account_id)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single()

      if (existingConversation) {
        targetConversationId = existingConversation.id
      } else {
        // Create a new conversation for notes
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            account_id: user.account_id,
            contact_id: params.id,
            subject: 'Notes',
            channel: 'internal',
            status: 'open',
          })
          .select()
          .single()

        if (convError || !newConversation) {
          console.error('Error creating conversation:', convError)
          return NextResponse.json({ 
            error: 'Failed to create conversation for note' 
          }, { status: 500 })
        }

        targetConversationId = newConversation.id
      }
    } else {
      // Verify conversation belongs to account and contact
      const { data: conv } = await supabase
        .from('conversations')
        .select('account_id, contact_id')
        .eq('id', targetConversationId)
        .eq('account_id', user.account_id)
        .eq('contact_id', params.id)
        .single()

      if (!conv) {
        return NextResponse.json({ 
          error: 'Conversation not found or does not belong to this contact' 
        }, { status: 404 })
      }
    }

    // Create note as a message with is_internal_note = true
    const { data: note, error } = await supabase
      .from('messages')
      .insert({
        account_id: user.account_id,
        conversation_id: targetConversationId,
        direction: 'outbound',
        sender_type: 'user',
        sender_id: auth.user.id,
        body_text: content.trim(),
        is_internal_note: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return NextResponse.json({ 
        error: 'Failed to create note', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      note: {
        id: note.id,
        content: note.body_text,
        created_at: note.created_at,
        conversation_id: targetConversationId,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

