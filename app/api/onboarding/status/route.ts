/**
 * Onboarding Status API Routes
 *
 * GET - Get user's onboarding status
 * PUT - Update user's onboarding status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/status
 * Get onboarding status for a user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use authenticated user's ID if not provided (or validate ownership)
    const targetUserId = userId || user.id

    // Ensure user can only access their own onboarding status (unless admin/owner)
    if (targetUserId !== user.id) {
      // Check if user is admin/owner
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || !['owner', 'admin'].includes(userData.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get onboarding status
    const { data: status, error } = await supabase
      .from('user_onboarding_status')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ status: status || null })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/onboarding/status
 * Update onboarding status
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, current_step, steps_completed } = body

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only update their own status
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's role for the record
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('user_onboarding_status')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result

    if (existing) {
      // Update existing record
      const updates: any = {}
      if (current_step !== undefined) updates.current_step = current_step
      if (steps_completed !== undefined) updates.steps_completed = steps_completed

      const { data, error } = await supabase
        .from('user_onboarding_status')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      }

      result = data
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_onboarding_status')
        .insert({
          user_id: userId,
          role: userData.role,
          current_step: current_step || 0,
          steps_completed: steps_completed || [],
        })
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({ status: result })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
