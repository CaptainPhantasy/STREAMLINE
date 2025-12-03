import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createCalendarEvent, listCalendarEvents } from '@/lib/calendar/service'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // Get user's account ID
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const events = await listCalendarEvents(
      user.account_id,
      startDate,
      endDate,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, location, contactId, jobId, conversationId } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Get user's account ID
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const result = await createCalendarEvent(
      user.account_id,
      {
        title,
        description,
        startTime,
        endTime,
        location,
        contactId,
        jobId,
        conversationId,
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      event: result,
    })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}

