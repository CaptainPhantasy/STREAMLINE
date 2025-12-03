import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const { data: callLog, error } = await supabase
      .from('call_logs')
      .select('*, contact:contacts(*), job:jobs(*), user:users!call_logs_user_id_fkey(*)')
      .eq('id', params.id)
      .single()

    if (error || !callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 })
    }

    return NextResponse.json({ callLog })
  } catch (error: unknown) {
    console.error('Error in GET /api/call-logs/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notes, transcription, status, endedAt, durationSeconds } = body

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

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (notes !== undefined) updateData.notes = notes
    if (transcription !== undefined) updateData.transcription = transcription
    if (status !== undefined) updateData.status = status
    if (endedAt !== undefined) updateData.ended_at = endedAt
    if (durationSeconds !== undefined) updateData.duration_seconds = durationSeconds

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: callLog, error } = await supabase
      .from('call_logs')
      .update(updateData)
      .eq('id', params.id)
      .select('*, contact:contacts(*), job:jobs(*), user:users!call_logs_user_id_fkey(*)')
      .single()

    if (error || !callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, callLog })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/call-logs/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

