import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { listCalendarEvents } from '@/lib/calendar/service'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate } = body

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

    // Sync events from calendar provider
    let events: any[] = []

    try {
      events = await listCalendarEvents(
        user.account_id,
        startDate,
        endDate,
        session.user.id
      )
    } catch (calendarError) {
      console.error('Calendar provider sync failed:', calendarError)
      // Return success with 0 synced instead of failing
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'Calendar provider not configured or unavailable'
      })
    }

    // Store/update events in database
    let syncedCount = 0
    for (const event of events) {
      try {
        // Check if event already exists
        const { data: existing } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('account_id', user.account_id)
          .eq('start_time', event.startTime)
          .eq('title', event.title)
          .maybeSingle()

        if (!existing) {
          // Create new event
          await supabase.from('calendar_events').insert({
            account_id: user.account_id,
            provider: 'google', // TODO: Detect provider
            provider_event_id: event.id || `sync_${Date.now()}_${Math.random()}`,
            title: event.title,
            description: event.description,
            start_time: event.startTime,
            end_time: event.endTime,
            location: event.location,
            contact_id: event.contactId || null,
            job_id: event.jobId || null,
            conversation_id: event.conversationId || null,
          })
          syncedCount++
        }
      } catch (eventError) {
        console.error('Failed to sync event:', event.title, eventError)
        // Continue with next event
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
    })
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}

