import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

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
      .select('role, account_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get rules for this account
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('account_id', currentUser.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching rules:', error)
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: rules || [] })
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
    const { name, triggerType, triggerConditions, actionType, actionConfig, isActive } = body

    if (!name || !triggerType || !actionType) {
      return NextResponse.json({ error: 'Name, trigger type, and action type are required' }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        name,
        trigger: triggerType,
        trigger_config: triggerConditions || {},
        action: actionType,
        action_config: actionConfig || {},
        is_active: isActive !== false,
        account_id: currentUser.account_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating rule:', error)
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

