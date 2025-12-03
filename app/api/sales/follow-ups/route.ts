import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales/follow-ups
 * Get pending follow-ups
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
    const overdueOnly = searchParams.get('overdue_only') === 'true'

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get follow-ups
    let query = supabase
      .from('sales_interactions')
      .select('*, contact:contacts(id, first_name, last_name, email, phone)')
      .eq('account_id', userData.account_id)
      .not('next_follow_up', 'is', null)

    if (overdueOnly) {
      query = query.lte('next_follow_up', new Date().toISOString())
    } else {
      query = query.gte('next_follow_up', new Date().toISOString())
    }

    query = query.order('next_follow_up', { ascending: true })

    const { data: followUps, error: followUpsError } = await query

    if (followUpsError) {
      console.error('Error fetching follow-ups:', followUpsError)
      return NextResponse.json(
        { error: 'Failed to fetch follow-ups' },
        { status: 500 }
      )
    }

    return NextResponse.json({ follow_ups: followUps || [] })
  } catch (error: unknown) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales/follow-ups
 * Schedule a follow-up
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
    const { contact_id, interaction_type, subject, notes, next_follow_up } = body

    if (!contact_id || !next_follow_up) {
      return NextResponse.json(
        { error: 'contact_id and next_follow_up are required' },
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

    // Verify contact belongs to account
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', contact_id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create or update interaction
    const { data: interaction, error: interactionError } = await supabase
      .from('sales_interactions')
      .insert({
        contact_id: contact_id,
        account_id: userData.account_id,
        interaction_type: interaction_type || 'other',
        subject: subject || null,
        notes: notes || null,
        next_follow_up: next_follow_up,
        created_by: user.id,
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Error creating follow-up:', interactionError)
      return NextResponse.json(
        { error: 'Failed to schedule follow-up' },
        { status: 500 }
      )
    }

    return NextResponse.json({ follow_up: interaction }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error scheduling follow-up:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

