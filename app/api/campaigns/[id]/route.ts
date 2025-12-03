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

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*, email_template:email_templates(*)')
      .eq('id', params.id)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get stats
    const { count: sentCount } = await supabase
      .from('campaign_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', params.id)
      .not('sent_at', 'is', null)

    const { count: openedCount } = await supabase
      .from('campaign_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', params.id)
      .not('opened_at', 'is', null)

    const { count: clickedCount } = await supabase
      .from('campaign_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', params.id)
      .not('clicked_at', 'is', null)

    return NextResponse.json({
      campaign: {
        ...campaign,
        stats: {
          sent: sentCount || 0,
          opened: openedCount || 0,
          clicked: clickedCount || 0,
        },
      },
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/campaigns/[id]:', error)
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

    const body = await request.json()
    const {
      name,
      campaignType,
      status,
      targetSegment,
      scheduledStart,
      scheduledEnd,
      emailTemplateId,
    } = body

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (campaignType !== undefined) updateData.campaign_type = campaignType
    if (status !== undefined) updateData.status = status
    if (targetSegment !== undefined) updateData.target_segment = targetSegment
    if (scheduledStart !== undefined) updateData.scheduled_start = scheduledStart
    if (scheduledEnd !== undefined) updateData.scheduled_end = scheduledEnd
    if (emailTemplateId !== undefined) updateData.email_template_id = emailTemplateId

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, campaign })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/campaigns/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', params.id)
      .eq('account_id', user.account_id)

    if (error) {
      console.error('Error deleting campaign:', error)
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in DELETE /api/campaigns/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

