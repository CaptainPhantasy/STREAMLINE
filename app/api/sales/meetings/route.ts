import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createCalendarEvent } from '@/lib/calendar/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales/meetings
 * Get scheduled meetings
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get sales interactions that are meetings
    let query = supabase
      .from('sales_interactions')
      .select('*, contact:contacts(id, first_name, last_name, email)')
      .eq('account_id', userData.account_id)
      .eq('interaction_type', 'meeting')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    query = query.order('created_at', { ascending: false })

    const { data: meetings, error: meetingsError } = await query

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      return NextResponse.json(
        { error: 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ meetings: meetings || [] })
  } catch (error: unknown) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales/meetings
 * Book a new meeting
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
    const { contact_id, subject, notes, scheduled_time, duration_minutes, location } = body

    if (!contact_id || !scheduled_time) {
      return NextResponse.json(
        { error: 'contact_id and scheduled_time are required' },
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

    // Verify contact belongs to account
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('account_id, email, first_name, last_name')
      .eq('id', contact_id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate end time
    const startTime = new Date(scheduled_time)
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + (duration_minutes || 30))

    // Create sales interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('sales_interactions')
      .insert({
        contact_id: contact_id,
        account_id: userData.account_id,
        interaction_type: 'meeting',
        subject: subject || `Meeting with ${contact.first_name} ${contact.last_name}`,
        notes: notes || null,
        next_follow_up: scheduled_time,
        created_by: user.id,
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Error creating interaction:', interactionError)
      return NextResponse.json(
        { error: 'Failed to create meeting' },
        { status: 500 }
      )
    }

    // Create calendar event
    try {
      await createCalendarEvent(
        userData.account_id,
        {
          title: subject || `Meeting with ${contact.first_name} ${contact.last_name}`,
          description: notes || '',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location: location || '',
          contactId: contact_id,
        },
        user.id
      )
    } catch (calendarError) {
      console.warn('Failed to create calendar event:', calendarError)
      // Continue even if calendar creation fails
    }

    return NextResponse.json({ meeting: interaction }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error booking meeting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

