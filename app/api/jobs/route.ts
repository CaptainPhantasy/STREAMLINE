import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Bearer token if available, otherwise use cookies
    const authHeader = request.headers.get('authorization')
    let supabase: any

    if (authHeader?.startsWith('Bearer ')) {
      const { createClient } = await import('@supabase/supabase-js')
      const token = authHeader.substring(7)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
    } else {
      const cookieStore = await cookies()
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
              } catch { }
            },
          },
        }
      )
    }

    const body = await request.json()
    const { conversationId, contactId, description, scheduledStart, scheduledEnd, techAssignedId } = body

    if (!contactId || !description) {
      return NextResponse.json({
        error: 'Missing required fields: contactId, description'
      }, { status: 400 })
    }

    // Get account_id from contact
    const { data: contact } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', contactId)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Call Edge Function for business logic
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-job`
    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: contact.account_id,
        contactId,
        conversationId,
        description,
        scheduledStart,
        scheduledEnd,
        techAssignedId,
      }),
    })

    const edgeData = await edgeResponse.json()

    if (!edgeResponse.ok) {
      return NextResponse.json(edgeData, { status: edgeResponse.status })
    }

    return NextResponse.json(edgeData, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    console.log('NEXT_PUBLIC_SUPABASE_URL in GET /api/jobs:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Create Authenticated Client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
            } catch { }
          },
        },
      }
    )

    // 3. Get User's Account ID and Role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', auth.user.id)
      .single()

    if (!user?.account_id) {
      return NextResponse.json({ error: 'User has no account assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const techId = searchParams.get('techId')
    const contactId = searchParams.get('contactId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 4. Query Jobs (Filtered by Account ID via RLS)
    let query = supabase
      .from('jobs')
      .select('*, contact:contacts(*), tech:users!tech_assigned_id(*)', { count: 'exact' })
      .eq('account_id', user.account_id) // Explicitly filter by account_id for safety
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // SECURITY: If user is a tech, only show jobs assigned to them
    if (user.role === 'tech') {
      query = query.eq('tech_assigned_id', auth.user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }
    if (techId) {
      query = query.eq('tech_assigned_id', techId)
    }
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
