/**
 * Toggle Automation Rule API (Admin Only)
 * PUT: Enable/disable automation rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled } = await request.json()

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to toggle rule' }, { status: 500 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
