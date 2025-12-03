import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const today = searchParams.get('today')

    let query = supabase
      .from('meetings')
      .select(`
        *,
        contact:contacts(id, name, email)
      `)
      .order('scheduled_at', { ascending: true })

    if (today === 'true') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      query = query
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
    }

    const { data: meetings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedMeetings = meetings?.map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title,
      contactId: meeting.contact_id,
      contactName: meeting.contact?.name || 'Unknown',
      location: meeting.location,
      scheduledAt: meeting.scheduled_at,
      meetingType: meeting.meeting_type || 'in_person'
    }))

    return NextResponse.json({ meetings: formattedMeetings })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        title: body.title,
        contact_id: body.contactId,
        location: body.location,
        scheduled_at: body.scheduledAt,
        meeting_type: body.meetingType,
        notes: body.notes,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
