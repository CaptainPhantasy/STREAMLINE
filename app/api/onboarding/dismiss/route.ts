/**
 * Dismiss Onboarding API Route
 *
 * POST - Dismiss/skip onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

/**
 * POST /api/onboarding/dismiss
 * Dismiss user's onboarding (skip)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    // Ensure user can only dismiss their own onboarding
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get user's account_id
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('user_onboarding_status')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let data: any = null

    if (existing) {
      // Update existing record with dismissed_at timestamp
      const { data: updated, error } = await supabase
        .from('user_onboarding_status')
        .update({
          dismissed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to dismiss onboarding' }, { status: 500 })
      }
      data = updated
    } else {
      // Create new record with dismissed status
      const { data: created, error } = await supabase
        .from('user_onboarding_status')
        .insert({
          user_id: userId,
          account_id: userData.account_id,
          current_step: 0,
          steps_completed: [],
          dismissed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Database error creating onboarding status:', error)
        return NextResponse.json({ error: 'Failed to dismiss onboarding' }, { status: 500 })
      }
      data = created
    }

    return NextResponse.json({ success: true, status: data })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
