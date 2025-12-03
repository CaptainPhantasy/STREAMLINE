/**
 * Notification Preferences API
 * GET: Fetch notification preferences
 * PUT: Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferences } from '@/lib/types/settings'

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  sms_enabled: false,
  push_enabled: true,
  notification_types: {
    job_assigned: true,
    job_completed: true,
    invoice_overdue: true,
    new_message: true,
    tech_offline: true,
    estimate_accepted: true,
    estimate_rejected: true,
    meeting_reminder: true,
  },
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch notification preferences (stored in user's settings JSONB column)
    const { data: userData, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({
      preferences: userData?.notification_preferences || DEFAULT_PREFERENCES,
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

    const preferences: NotificationPreferences = await request.json()

    // Update notification preferences
    const { error } = await supabase
      .from('users')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
