import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { openedAt, clickedAt } = body

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
    if (openedAt !== undefined) {
      updateData.opened_at = openedAt === true ? new Date().toISOString() : openedAt
    }
    if (clickedAt !== undefined) {
      updateData.clicked_at = clickedAt === true ? new Date().toISOString() : clickedAt
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: recipient, error } = await supabase
      .from('campaign_recipients')
      .update(updateData)
      .eq('campaign_id', params.id)
      .eq('contact_id', params.contactId)
      .select('*, contact:contacts(*)')
      .single()

    if (error || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Update campaign stats
    if (openedAt) {
      await supabase.rpc('increment', {
        table_name: 'campaigns',
        column_name: 'opened_count',
        id: params.id,
      })
    }
    if (clickedAt) {
      await supabase.rpc('increment', {
        table_name: 'campaigns',
        column_name: 'clicked_count',
        id: params.id,
      })
    }

    return NextResponse.json({ success: true, recipient })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/campaigns/[id]/recipients/[contactId]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

