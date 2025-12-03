/**
 * Email Analytics API
 *
 * Provides email performance metrics:
 * - Delivery rates
 * - Open rates
 * - Click rates
 * - Bounce rates
 * - Time-based analytics
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { resendService } from '@/lib/email/resend-service'
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const templateId = searchParams.get('templateId')

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

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: 30 days ago
    const end = endDate ? new Date(endDate) : new Date()

    // Get basic analytics
    const analytics = await resendService.getAnalytics(user.account_id, start, end)

    // Get detailed analytics from database
    const { data: events, error } = await supabase
      .from('email_analytics')
      .select(`
        *,
        email_queue!inner(
          account_id,
          template_id,
          metadata
        )
      `)
      .eq('email_queue.account_id', user.account_id)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching email analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Calculate template-specific metrics if requested
    let templateMetrics = null
    if (templateId) {
      const templateEvents = events?.filter(e =>
        e.email_queue?.template_id === templateId
      ) || []

      const templateSent = templateEvents.filter(e => e.event === 'sent').length
      const templateDelivered = templateEvents.filter(e => e.event === 'delivered').length
      const templateOpened = templateEvents.filter(e => e.event === 'opened').length
      const templateClicked = templateEvents.filter(e => e.event === 'clicked').length
      const templateBounced = templateEvents.filter(e => e.event === 'bounced').length

      templateMetrics = {
        templateId,
        sent: templateSent,
        delivered: templateDelivered,
        opened: templateOpened,
        clicked: templateClicked,
        bounced: templateBounced,
        deliveryRate: templateSent > 0 ? (templateDelivered / templateSent) * 100 : 0,
        openRate: templateDelivered > 0 ? (templateOpened / templateDelivered) * 100 : 0,
        clickRate: templateOpened > 0 ? (templateClicked / templateOpened) * 100 : 0,
        bounceRate: templateSent > 0 ? (templateBounced / templateSent) * 100 : 0
      }
    }

    // Calculate daily metrics
    const dailyMetrics = new Map()
    events?.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, {
          date,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0
        })
      }
      const metrics = dailyMetrics.get(date)
      metrics[event.event] = (metrics[event.event] || 0) + 1
    })

    // Get queue status
    const { data: queueStats } = await supabase
      .from('email_queue')
      .select('status')
      .eq('account_id', user.account_id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    const queueStatus = {
      pending: queueStats?.filter(q => q.status === 'pending').length || 0,
      processing: queueStats?.filter(q => q.status === 'processing').length || 0,
      sent: queueStats?.filter(q => q.status === 'sent').length || 0,
      failed: queueStats?.filter(q => q.status === 'failed').length || 0
    }

    return NextResponse.json({
      summary: analytics,
      queue: queueStatus,
      daily: Array.from(dailyMetrics.values()),
      template: templateMetrics,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/email/analytics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}