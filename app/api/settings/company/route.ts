/**
 * Company Settings API (Owner/Admin Only)
 * GET: Fetch company settings
 * PUT: Update company settings
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

    // Check admin access and get account_id
    const { data: userData } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch company settings from account_settings
    const { data: settings, error } = await supabase
      .from('account_settings')
      .select('company_settings')
      .eq('account_id', userData.account_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ settings: settings?.company_settings || {} })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access and get account_id
    const { data: userData } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await request.json()

    // Upsert company settings
    const { error } = await supabase
      .from('account_settings')
      .upsert({
        account_id: userData.account_id,
        company_settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq('account_id', userData.account_id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
