import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const body = await request.json()
    const { contactId, subject, channel } = body

    if (!contactId) {
      return NextResponse.json({ error: 'Missing required field: contactId' }, { status: 400 })
    }

    // Get contact to get account_id
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check if conversation already exists for this contact
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('account_id', contact.account_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        conversation: existing,
        existing: true
      })
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        account_id: contact.account_id,
        contact_id: contactId,
        subject: subject || null,
        channel: channel || 'email',
        status: 'open',
      })
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      conversation,
      existing: false
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Bearer token if available, otherwise use cookies
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

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's account_id for RLS
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (userError) {
      console.error('Supabase error fetching user:', userError)
      // 406 errors from Supabase usually mean RLS or format issue
      if (userError.code === 'PGRST116' || userError.message?.includes('406')) {
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let query = supabase
      .from('conversations')
      .select('*, contact:contacts(*)', { count: 'exact' })
      .eq('account_id', user.account_id)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: conversations, error, count } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({
      conversations: conversations || [],
      total: count || 0,
      limit,
      offset
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

