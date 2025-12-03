import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get user's account_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
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

    const { data: tags, error } = await supabase
      .from('contact_tags')
      .select('*')
      .eq('account_id', user.account_id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching contact tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags: tags || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/contact-tags:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
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
    const { name, color, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    const { data: tag, error: createError } = await supabase
      .from('contact_tags')
      .insert({
        account_id: user.account_id,
        name,
        color: color || null,
        description: description || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating contact tag:', createError)
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tag }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/contact-tags:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

