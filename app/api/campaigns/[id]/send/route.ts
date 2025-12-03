import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, email_template:email_templates(*)')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.email_template_id || !campaign.email_template) {
      return NextResponse.json({ error: 'Campaign has no email template' }, { status: 400 })
    }

    // Get recipients based on target segment
    // For now, this is a placeholder - actual implementation would query contacts based on segment
    // This would typically use the target_segment JSONB field to filter contacts
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select('contact_id')
      .eq('campaign_id', params.id)
      .is('sent_at', null)

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'active' })
      .eq('id', params.id)

    // Mark recipients as sent (actual email sending would happen via background job)
    const sentAt = new Date().toISOString()
    await supabase
      .from('campaign_recipients')
      .update({ sent_at: sentAt })
      .eq('campaign_id', params.id)
      .is('sent_at', null)

    // Update sent count
    await supabase
      .from('campaigns')
      .update({ sent_count: recipients.length })
      .eq('id', params.id)

    return NextResponse.json({
      success: true,
      message: `Campaign queued for ${recipients.length} recipients`,
      recipientsCount: recipients.length,
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/campaigns/[id]/send:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

