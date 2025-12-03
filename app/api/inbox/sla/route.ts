import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inbox/sla
 * Get SLA monitoring data for conversations
 */
export async function GET(request: NextRequest) {
  try {
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
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'on_track', 'at_risk', 'breached'
    const includeStats = searchParams.get('include_stats') === 'true'

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('conversations')
      .select('id, status, sla_status, sla_target_minutes, last_message_at, assigned_to, ai_routed_to, routing_confidence')
      .eq('account_id', userData.account_id)
      .not('sla_status', 'is', null)

    if (status) {
      query = query.eq('sla_status', status)
    }

    const { data: conversations, error: conversationsError } = await query

    if (conversationsError) {
      console.error('Error fetching SLA data:', conversationsError)
      return NextResponse.json(
        { error: 'Failed to fetch SLA data' },
        { status: 500 }
      )
    }

    // Calculate stats if requested
    let stats = null
    if (includeStats) {
      const onTrack = conversations?.filter(c => c.sla_status === 'on_track').length || 0
      const atRisk = conversations?.filter(c => c.sla_status === 'at_risk').length || 0
      const breached = conversations?.filter(c => c.sla_status === 'breached').length || 0
      const total = conversations?.length || 0

      stats = {
        total,
        on_track: onTrack,
        at_risk: atRisk,
        breached,
        on_track_percentage: total > 0 ? Math.round((onTrack / total) * 100) : 0,
        at_risk_percentage: total > 0 ? Math.round((atRisk / total) * 100) : 0,
        breached_percentage: total > 0 ? Math.round((breached / total) * 100) : 0,
      }
    }

    // Recalculate SLA status for all conversations (background update)
    if (conversations && conversations.length > 0) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Update SLA status for each conversation
      for (const conv of conversations) {
        await supabaseAdmin.rpc('calculate_sla_status', {
          p_conversation_id: conv.id,
        })
      }
    }

    return NextResponse.json({
      conversations: conversations || [],
      stats,
    })
  } catch (error: unknown) {
    console.error('Error fetching SLA data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inbox/sla
 * Update SLA target for a conversation
 */
export async function POST(request: NextRequest) {
  try {
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
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, sla_target_minutes } = body

    if (!conversation_id || !sla_target_minutes) {
      return NextResponse.json(
        { error: 'conversation_id and sla_target_minutes are required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify conversation belongs to account
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('account_id')
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update SLA target and recalculate status
    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        sla_target_minutes: sla_target_minutes,
      })
      .eq('id', conversation_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating SLA:', updateError)
      return NextResponse.json(
        { error: 'Failed to update SLA' },
        { status: 500 }
      )
    }

    // Recalculate SLA status
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabaseAdmin.rpc('calculate_sla_status', {
      p_conversation_id: conversation_id,
    })

    return NextResponse.json({ conversation: updated })
  } catch (error: unknown) {
    console.error('Error updating SLA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

