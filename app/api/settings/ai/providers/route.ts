/**
 * AI Providers API (Admin Only)
 * GET: Fetch AI provider configuration
 * PUT: Update AI provider configuration
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

    // Fetch AI provider config from account_settings
    const { data: settings, error } = await supabase
      .from('account_settings')
      .select('ai_provider_config')
      .eq('account_id', userData.account_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }

    return NextResponse.json({
      config: settings?.ai_provider_config || {
        providers: [],
        fallback_enabled: true,
        cost_limit_monthly: null,
        cache_enabled: true,
      },
    })
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

    const config = await request.json()

    // Upsert AI provider config
    const { error } = await supabase
      .from('account_settings')
      .upsert({
        account_id: userData.account_id,
        ai_provider_config: config,
        updated_at: new Date().toISOString(),
      })
      .eq('account_id', userData.account_id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
