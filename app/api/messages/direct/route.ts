import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/direct
 * Get all direct message conversations for the current user
 */
export async function GET(request: NextRequest) {
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
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort_by') || 'date'
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const search = searchParams.get('search') || ''

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all unique conversation partners
    const { data: sentMessages } = await supabase
      .from('direct_messages')
      .select('recipient_id')
      .eq('sender_id', user.id)
      .eq('account_id', userData.account_id)

    const { data: receivedMessages } = await supabase
      .from('direct_messages')
      .select('sender_id')
      .eq('recipient_id', user.id)
      .eq('account_id', userData.account_id)

    // Get unique user IDs
    const conversationPartners = new Set<string>()
    sentMessages?.forEach(m => conversationPartners.add(m.recipient_id))
    receivedMessages?.forEach(m => conversationPartners.add(m.sender_id))

    // Build conversations
    const conversations = await Promise.all(
      Array.from(conversationPartners).map(async (partnerId) => {
        // Get other user info
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, role')
          .eq('id', partnerId)
          .single()

        // Get last message
        const { data: lastMessages } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
          .eq('account_id', userData.account_id)
          .order('created_at', { ascending: false })
          .limit(1)

        const lastMessage = lastMessages?.[0] || null

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', partnerId)
          .eq('recipient_id', user.id)
          .eq('account_id', userData.account_id)
          .eq('is_read', false)

        return {
          other_user: otherUser || {
            id: partnerId,
            full_name: null,
            avatar_url: null,
            role: null,
          },
          last_message: lastMessage,
          unread_count: unreadCount || 0,
          messages: [],
        }
      })
    )

    // Filter by unread only if requested
    let filteredConversations = unreadOnly
      ? conversations.filter(c => c.unread_count > 0)
      : conversations

    // Filter by search if provided
    if (search) {
      filteredConversations = filteredConversations.filter(c =>
        c.other_user.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort conversations
    if (sortBy === 'unread') {
      filteredConversations.sort((a, b) => b.unread_count - a.unread_count)
    } else if (sortBy === 'sender') {
      filteredConversations.sort((a, b) =>
        (a.other_user.full_name || '').localeCompare(b.other_user.full_name || '')
      )
    } else {
      // Sort by date (last message)
      filteredConversations.sort((a, b) => {
        const aDate = a.last_message?.created_at || '0'
        const bDate = b.last_message?.created_at || '0'
        return bDate.localeCompare(aDate)
      })
    }

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

    return NextResponse.json({
      conversations: filteredConversations,
      total_unread: totalUnread,
    })
  } catch (error: unknown) {
    console.error('Error fetching direct messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages/direct
 * Send a new direct message
 */
export async function POST(request: NextRequest) {
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
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, content } = body

    if (!recipient_id || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'recipient_id and content are required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify recipient is in same account
    const { data: recipient } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', recipient_id)
      .single()

    if (!recipient || recipient.account_id !== userData.account_id) {
      return NextResponse.json(
        { error: 'Recipient not found or not in same account' },
        { status: 404 }
      )
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipient_id,
        account_id: userData.account_id,
        content: content.trim(),
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Get sender info for response
    const { data: sender } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      message: {
        ...message,
        sender: sender || null,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error sending direct message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

