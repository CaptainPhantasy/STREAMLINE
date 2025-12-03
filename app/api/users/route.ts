import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { getSupabaseAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get query params for role filtering
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    // Build query
    let query = supabase
      .from('users')
      .select('id, account_id, full_name, role, avatar_url')
      .eq('account_id', user.account_id)

    // Apply role filter if provided
    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, fullName, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!role || !['owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 })
    }

    // Use admin client to create user
    const adminClient = getSupabaseAdmin()

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        account_id: currentUser.account_id,
        full_name: fullName || null,
        role: role,
      })
      .select()
      .single()

    if (userError) {
      // Rollback: delete auth user if user record creation fails
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      console.error('Error creating user record:', userError)
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
