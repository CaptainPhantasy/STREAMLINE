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

    const { data: recipients, error } = await supabase
      .from('campaign_recipients')
      .select('*, contact:contacts(*)')
      .eq('campaign_id', params.id)
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaign recipients:', error)
      return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 })
    }

    return NextResponse.json({ recipients: recipients || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/campaigns/[id]/recipients:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
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

    const { data: user } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', session.user.id)
      .single()

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Verify campaign exists
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('account_id')
      .eq('id', params.id)
      .single()

    if (!campaign || campaign.account_id !== user.account_id) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const body = await request.json()
    const { contactIds } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid contactIds array' },
        { status: 400 }
      )
    }

    // Verify all contacts belong to account
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('account_id', user.account_id)
      .in('id', contactIds)

    if (!contacts || contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts not found or belong to different account' },
        { status: 404 }
      )
    }

    // Create recipient records
    const recipients = contactIds.map((contactId: string) => ({
      campaign_id: params.id,
      contact_id: contactId,
    }))

    const { data: created, error: createError } = await supabase
      .from('campaign_recipients')
      .upsert(recipients, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })
      .select('*, contact:contacts(*)')

    if (createError) {
      console.error('Error adding recipients:', createError)
      return NextResponse.json({ error: 'Failed to add recipients' }, { status: 500 })
    }

    return NextResponse.json({ success: true, recipients: created || [] }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/campaigns/[id]/recipients:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

