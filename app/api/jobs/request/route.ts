import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Get user's account_id and role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only techs can create job requests
    if (user.role !== 'tech') {
      return NextResponse.json({ error: 'Forbidden: Only technicians can create job requests' }, { status: 403 })
    }

    const body = await request.json()
    const { contactId, description, scheduledStart, scheduledEnd, needsOfficeCall, notes } = body

    if (!contactId || !description) {
      return NextResponse.json({ error: 'Contact ID and description are required' }, { status: 400 })
    }

    // Create job with request_status = 'pending'
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        account_id: user.account_id,
        contact_id: contactId,
        description,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        status: 'lead',
        request_status: 'pending',
        notes: needsOfficeCall ? 'Needs office to call customer' : (notes || null),
        tech_assigned_id: session.user.id, // Tech who requested it
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job request:', jobError)
      return NextResponse.json({ error: 'Failed to create job request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

