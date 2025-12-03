import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/marketing/follow-ups
 * Create automated follow-up sequences
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
    const { contact_ids, sequence_type, delay_days } = body

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids array is required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get email template for follow-up
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('account_id', userData.account_id)
      .eq('template_type', 'follow_up')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!template) {
      return NextResponse.json(
        { error: 'No active follow-up template found' },
        { status: 404 }
      )
    }

    // Create follow-up automation records
    const followUps = contact_ids.map((contactId) => ({
      account_id: userData.account_id,
      contact_id: contactId,
      sequence_type: sequence_type || 'standard',
      delay_days: delay_days || 3,
      template_id: template.id,
      status: 'scheduled',
      scheduled_at: new Date(
        Date.now() + (delay_days || 3) * 24 * 60 * 60 * 1000
      ).toISOString(),
      created_by: user.id,
    }))

    const { data: created, error: createError } = await supabase
      .from('marketing_automations')
      .insert(followUps)
      .select()

    if (createError) {
      console.error('Error creating follow-ups:', createError)
      return NextResponse.json(
        { error: 'Failed to create follow-up sequence' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      follow_ups: created,
      total_scheduled: created?.length || 0,
    })
  } catch (error: unknown) {
    console.error('Error creating follow-ups:', error)
    return NextResponse.json(
      { error: 'Failed to create follow-up sequence' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/marketing/follow-ups
 * Get scheduled follow-up sequences
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

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'scheduled'

    const { data: followUps, error: fetchError } = await supabase
      .from('marketing_automations')
      .select('*, contact:contacts(*), template:email_templates(*)')
      .eq('account_id', userData.account_id)
      .eq('status', status)
      .order('scheduled_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching follow-ups:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch follow-ups' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      follow_ups: followUps || [],
      total: followUps?.length || 0,
    })
  } catch (error: unknown) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

