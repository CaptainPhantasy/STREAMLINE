/**
 * Complete Onboarding API Route
 *
 * POST - Mark onboarding as complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding/complete
 * Mark user's onboarding as complete
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId } = body

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only complete their own onboarding
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update record with completed_at timestamp
    const { data, error } = await supabase
      .from('user_onboarding_status')
      .update({
        completed_at: new Date().toISOString(),
        dismissed_at: null, // Clear dismissed flag if set
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
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
