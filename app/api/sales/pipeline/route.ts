import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales/pipeline
 * Get pipeline view with contacts grouped by stage
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

    // Get all contacts with pipeline stages
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, lead_score, pipeline_stage, conversion_probability, created_at')
      .eq('account_id', userData.account_id)
      .not('pipeline_stage', 'is', null)
      .order('lead_score', { ascending: false })

    if (contactsError) {
      console.error('Error fetching pipeline:', contactsError)
      return NextResponse.json(
        { error: 'Failed to fetch pipeline' },
        { status: 500 }
      )
    }

    // Group by pipeline stage
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    const pipeline: Record<string, any[]> = {}

    stages.forEach((stage) => {
      pipeline[stage] = contacts?.filter((c) => c.pipeline_stage === stage) || []
    })

    // Calculate totals
    const totalValue = contacts?.reduce((sum, c) => {
      // Estimate value based on lead score (simplified)
      return sum + (c.lead_score || 0)
    }, 0) || 0

    return NextResponse.json({
      pipeline,
      summary: {
        total_contacts: contacts?.length || 0,
        by_stage: stages.reduce((acc, stage) => {
          acc[stage] = pipeline[stage].length
          return acc
        }, {} as Record<string, number>),
        total_estimated_value: totalValue,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sales/pipeline
 * Update pipeline stage for contacts
 */
export async function PATCH(request: NextRequest) {
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
    const { contact_ids, pipeline_stage } = body

    if (!Array.isArray(contact_ids) || !pipeline_stage) {
      return NextResponse.json(
        { error: 'contact_ids array and pipeline_stage are required' },
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

    // Update contacts
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ pipeline_stage })
      .in('id', contact_ids)
      .eq('account_id', userData.account_id)

    if (updateError) {
      console.error('Error updating pipeline:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pipeline' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, updated: contact_ids.length })
  } catch (error: unknown) {
    console.error('Error updating pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

