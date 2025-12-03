/**
 * Onboarding Analytics API Route
 *
 * POST - Track onboarding analytics events
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding/analytics
 * Track onboarding event (optional - for future analytics integration)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, just log the event
    // In production, you could send to analytics service (PostHog, Mixpanel, etc.)
    console.log('[Onboarding Analytics]', body)

    // Could store in database for reporting
    // await supabase.from('onboarding_events').insert(body)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics error:', error)
    // Don't fail the request if analytics fails
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
