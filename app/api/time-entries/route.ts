import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, entryId, action } = body

    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, action' },
        { status: 400 }
      )
    }

    if (action !== 'clock_in' && action !== 'clock_out') {
      return NextResponse.json(
        { error: 'Action must be "clock_in" or "clock_out"' },
        { status: 400 }
      )
    }

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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get account_id from job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (action === 'clock_in') {
      // Check if there's an active entry (clocked in but not clocked out)
      const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', session.user.id)
        .is('clock_out_at', null)
        .single()

      if (activeEntry) {
        return NextResponse.json(
          { error: 'Already clocked in. Please clock out first.' },
          { status: 400 }
        )
      }

      // Create new time entry
      const { data: entry, error } = await supabase
        .from('time_entries')
        .insert({
          account_id: job.account_id,
          job_id: jobId,
          user_id: session.user.id,
          clock_in_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating time entry:', error)
        return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 })
      }

      return NextResponse.json({ entry })
    } else {
      // clock_out
      if (!entryId) {
        return NextResponse.json(
          { error: 'Missing required field: entryId' },
          { status: 400 }
        )
      }

      // Get the entry
      const { data: entry, error: entryError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', session.user.id)
        .single()

      if (entryError || !entry) {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
      }

      if (entry.clock_out_at) {
        return NextResponse.json(
          { error: 'Already clocked out' },
          { status: 400 }
        )
      }

      // Calculate duration
      const clockIn = new Date(entry.clock_in_at).getTime()
      const clockOut = Date.now()
      const durationMinutes = Math.floor((clockOut - clockIn) / 60000)

      // Update entry
      const { data: updatedEntry, error } = await supabase
        .from('time_entries')
        .update({
          clock_out_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) {
        console.error('Error updating time entry:', error)
        return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 })
      }

      return NextResponse.json({ entry: updatedEntry })
    }
  } catch (error: unknown) {
    console.error('Error in POST /api/time-entries:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 })
    }

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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('job_id', jobId)
      .order('clock_in_at', { ascending: false })

    if (error) {
      console.error('Error fetching time entries:', error)
      return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 })
    }

    return NextResponse.json({ entries: entries || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/time-entries:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

