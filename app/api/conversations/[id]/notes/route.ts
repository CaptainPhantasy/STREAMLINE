import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

/**
 * GET /api/conversations/[id]/notes
 * Get all notes for a conversation
 * Notes are messages with is_internal_note = true
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

    // Verify conversation belongs to account
    const { data: conversation } = await supabase
      .from('conversations')
      .select('account_id')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get notes (messages with is_internal_note = true)
    const { data: notes, error } = await supabase
      .from('messages')
      .select('id, body_text, created_at, sender_id, sender_type')
      .eq('conversation_id', params.id)
      .eq('is_internal_note', true)
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({
      notes: notes || [],
      total: notes?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/conversations/[id]/notes
 * Create a new note for a conversation
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
    const { content } = body

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

    // Verify conversation belongs to account
    const { data: conversation } = await supabase
      .from('conversations')
      .select('account_id')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Create note as a message with is_internal_note = true
    const { data: note, error } = await supabase
      .from('messages')
      .insert({
        account_id: user.account_id,
        conversation_id: params.id,
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
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

