import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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

    const body = await request.json()
    const { name, triggerType, triggerConditions, actionType, actionConfig, isActive } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (triggerType !== undefined) updateData.trigger = triggerType
    if (triggerConditions !== undefined) updateData.trigger_config = triggerConditions
    if (actionType !== undefined) updateData.action = actionType
    if (actionConfig !== undefined) updateData.action_config = actionConfig
    if (isActive !== undefined) updateData.is_active = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !rule) {
      console.error('Error updating rule:', error)
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

