import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Simple in-memory cache for notifications to prevent spam
const notificationCache = new Map<string, { data: any; timestamp: number }>()
const NOTIFICATION_CACHE_TTL = 5000 // 5 seconds cache

function getCacheKey(userId: string, params: string): string {
  return `notifications:${userId}:${params}`
}

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Create cache key based on parameters
    const cacheKey = getCacheKey(session.user.id, `isRead=${isRead}&type=${type}&limit=${limit}&offset=${offset}`)
    
    // Check cache first
    const cached = notificationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < NOTIFICATION_CACHE_TTL) {
      console.log(`[Notifications] Cache hit for ${cacheKey}`)
      return NextResponse.json(cached.data)
    }
    
    console.log(`[Notifications] Cache miss for ${cacheKey}, fetching from database`)

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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true')
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    const responseData = {
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
      limit,
      offset,
    }

    // Cache the response
    notificationCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    return NextResponse.json(responseData)
  } catch (error: unknown) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (only admins can create notifications for others)
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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', session.user.id)
      .single()

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, title, message, entityType, entityId, actionUrl, metadata } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      )
    }

    // Verify target user belongs to same account
    const { data: targetUser } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (!targetUser || targetUser.account_id !== user.account_id) {
      return NextResponse.json({ error: 'User not found or different account' }, { status: 404 })
    }

    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        account_id: user.account_id,
        user_id: userId,
        type,
        title,
        message,
        entity_type: entityType || null,
        entity_id: entityId || null,
        action_url: actionUrl || null,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating notification:', createError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

