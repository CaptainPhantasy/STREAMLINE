import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tech/time-clock
 * Clock in/out endpoint for tech users
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, jobId, notes } = body

    // Validate type
    const validTypes = ['clock_in', 'clock_out', 'break_start', 'break_end']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid clock type' },
        { status: 400 }
      )
    }

    // Get GPS location from headers (if sent from client)
    const latitude = request.headers.get('x-gps-lat')
    const longitude = request.headers.get('x-gps-lng')

    // Insert time clock entry
    const { data: entry, error: insertError } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        job_id: jobId || null,
        type,
        timestamp: new Date().toISOString(),
        location: latitude && longitude ? {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
        } : null,
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create time entry:', insertError)
      return NextResponse.json(
        { error: 'Failed to create time entry' },
        { status: 500 }
      )
    }

    // Calculate today's hours
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data: todayEntries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', startOfDay.toISOString())
      .order('timestamp', { ascending: true })

    // Calculate total hours worked today
    let totalHours = 0
    let clockInTime: Date | null = null

    for (const timeEntry of todayEntries || []) {
      if (timeEntry.type === 'clock_in') {
        clockInTime = new Date(timeEntry.timestamp)
      } else if (timeEntry.type === 'clock_out' && clockInTime) {
        const clockOutTime = new Date(timeEntry.timestamp)
        const hours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
        totalHours += hours
        clockInTime = null
      }
    }

    // Determine current status
    let currentStatus: 'clocked_out' | 'clocked_in' | 'on_break' = 'clocked_out'
    if (type === 'clock_in') currentStatus = 'clocked_in'
    else if (type === 'break_start') currentStatus = 'on_break'
    else if (type === 'break_end') currentStatus = 'clocked_in'
    else if (type === 'clock_out') currentStatus = 'clocked_out'

    return NextResponse.json({
      entry,
      todayHours: totalHours,
      status: currentStatus,
    })
  } catch (error) {
    console.error('Time clock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tech/time-clock
 * Get time clock status and today's hours
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    // Get today's time entries
    const { data: todayEntries, error: fetchError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', startOfDay.toISOString())
      .order('timestamp', { ascending: true })

    if (fetchError) {
      console.error('Failed to fetch time entries:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch time entries' },
        { status: 500 }
      )
    }

    // Calculate hours and determine status
    let totalHours = 0
    let clockInTime: Date | null = null
    let currentStatus: 'clocked_out' | 'clocked_in' | 'on_break' = 'clocked_out'
    let lastEntry = todayEntries[todayEntries.length - 1] || null

    for (const entry of todayEntries) {
      if (entry.type === 'clock_in') {
        clockInTime = new Date(entry.timestamp)
        currentStatus = 'clocked_in'
      } else if (entry.type === 'clock_out' && clockInTime) {
        const clockOutTime = new Date(entry.timestamp)
        const hours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
        totalHours += hours
        clockInTime = null
        currentStatus = 'clocked_out'
      } else if (entry.type === 'break_start') {
        currentStatus = 'on_break'
      } else if (entry.type === 'break_end') {
        currentStatus = 'clocked_in'
      }
    }

    // If still clocked in, add current session time
    if (clockInTime) {
      const now = new Date()
      const hours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
      totalHours += hours
    }

    return NextResponse.json({
      currentStatus,
      lastEntry,
      todayHours: totalHours,
      entries: todayEntries,
    })
  } catch (error) {
    console.error('Time clock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
