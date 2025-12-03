import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { listCalendarEvents } from '@/lib/calendar/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/calendar/conflicts
 * Check for calendar conflicts with a proposed event time
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { start_time, end_time } = body

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'start_time and end_time are required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get calendar events for the time range
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)
    
    // Expand range to check for nearby conflicts
    const checkStart = new Date(startDate)
    checkStart.setHours(checkStart.getHours() - 1)
    const checkEnd = new Date(endDate)
    checkEnd.setHours(checkEnd.getHours() + 1)

    const events = await listCalendarEvents(
      userData.account_id,
      checkStart.toISOString(),
      checkEnd.toISOString(),
      user.id
    )

    // Check for overlapping events
    const conflicts = events.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      // Check if times overlap
      return (
        (startDate < eventEnd && endDate > eventStart) ||
        (eventStart < endDate && eventEnd > startDate)
      )
    })

    return NextResponse.json({
      has_conflicts: conflicts.length > 0,
      conflicts: conflicts.map((event) => ({
        title: event.title,
        start_time: event.startTime,
        end_time: event.endTime,
        location: event.location,
      })),
    })
  } catch (error: unknown) {
    console.error('Error checking calendar conflicts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

