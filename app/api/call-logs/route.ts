import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const jobId = searchParams.get('jobId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let query = supabase
      .from('call_logs')
      .select('*, contact:contacts(*), job:jobs(*), user:users!call_logs_user_id_fkey(*)', {
        count: 'exact',
      })
      .eq('account_id', user.account_id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }

    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('started_at', dateTo)
    }

    const { data: callLogs, error, count } = await query

    if (error) {
      console.error('Error fetching call logs:', error)
      return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 })
    }

    return NextResponse.json({
      callLogs: callLogs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/call-logs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      contactId,
      jobId,
      direction,
      phoneNumber,
      durationSeconds,
      status,
      recordingUrl,
      transcription,
      notes,
      startedAt,
      endedAt,
    } = body

    if (!direction || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: direction, phoneNumber' },
        { status: 400 }
      )
    }

    if (!['inbound', 'outbound'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction. Must be inbound or outbound' }, { status: 400 })
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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify contact/job belong to account if provided
    if (contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('account_id')
        .eq('id', contactId)
        .single()

      if (!contact || contact.account_id !== user.account_id) {
        return NextResponse.json({ error: 'Contact not found or different account' }, { status: 404 })
      }
    }

    if (jobId) {
      const { data: job } = await supabase
        .from('jobs')
        .select('account_id')
        .eq('id', jobId)
        .single()

      if (!job || job.account_id !== user.account_id) {
        return NextResponse.json({ error: 'Job not found or different account' }, { status: 404 })
      }
    }

    const { data: callLog, error: createError } = await supabase
      .from('call_logs')
      .insert({
        account_id: user.account_id,
        user_id: session.user.id,
        contact_id: contactId || null,
        job_id: jobId || null,
        direction,
        phone_number: phoneNumber,
        duration_seconds: durationSeconds || null,
        status: status || 'initiated',
        recording_url: recordingUrl || null,
        transcription: transcription || null,
        notes: notes || null,
        started_at: startedAt || new Date().toISOString(),
        ended_at: endedAt || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating call log:', createError)
      return NextResponse.json({ error: 'Failed to create call log' }, { status: 500 })
    }

    return NextResponse.json({ success: true, callLog }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/call-logs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

