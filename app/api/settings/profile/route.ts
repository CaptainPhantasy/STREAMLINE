/**
 * Profile Settings API
 * GET: Fetch user profile settings
 * PUT: Update user profile settings
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

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('full_name, email, phone, timezone, language, avatar_url, bio')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        full_name: profile?.full_name || '',
        email: profile?.email || user.email || '',
        phone: profile?.phone || null,
        timezone: profile?.timezone || 'America/New_York',
        language: profile?.language || 'en',
        avatar_url: profile?.avatar_url || null,
        bio: profile?.bio || null,
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

    const body = await request.json()
    const { full_name, phone, timezone, language } = body

    // Validate required fields
    if (!full_name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    // Update profile
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name,
        phone: phone || null,
        timezone: timezone || 'America/New_York',
        language: language || 'en',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
