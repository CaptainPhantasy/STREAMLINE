/**
 * Automation Rules API (Admin Only)
 * GET: Fetch all automation rules
 * POST: Create new automation rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch automation rules
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: rules || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description, trigger, action, enabled } = await request.json()

    if (!name || !trigger || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create automation rule
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        account_id: user.account_id,
        name,
        description,
        trigger,
        action,
        enabled: enabled ?? true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
    }

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
