import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/parts/[id]/usage-history
 * Get usage history for a part
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const partId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Verify part belongs to user's account
    const { data: part, error: partError } = await supabase
      .from('parts')
      .select('account_id')
      .eq('id', partId)
      .single()

    if (partError || !part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== part.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get usage history
    const { data: history, error: historyError } = await supabase
      .from('part_usage_history')
      .select('*, part:parts(id, name), job:jobs(id, description), user:users(id, full_name)')
      .eq('part_id', partId)
      .order('used_at', { ascending: false })
      .limit(limit)

    if (historyError) {
      console.error('Error fetching usage history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch usage history' },
        { status: 500 }
      )
    }

    // Calculate totals
    const totalUsed = history?.reduce((sum, h) => sum + h.quantity_used, 0) || 0

    return NextResponse.json({
      history: history || [],
      summary: {
        total_used: totalUsed,
        total_records: history?.length || 0,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching usage history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/parts/[id]/usage-history
 * Record part usage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const partId = params.id
    const body = await request.json()
    const { job_id, quantity_used, notes } = body

    if (!quantity_used || quantity_used <= 0) {
      return NextResponse.json(
        { error: 'quantity_used must be greater than 0' },
        { status: 400 }
      )
    }

    // Verify part belongs to user's account
    const { data: part, error: partError } = await supabase
      .from('parts')
      .select('account_id, quantity_in_stock')
      .eq('id', partId)
      .single()

    if (partError || !part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== part.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify sufficient stock
    if (part.quantity_in_stock < quantity_used) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Create usage record
    const { data: usage, error: usageError } = await supabase
      .from('part_usage_history')
      .insert({
        part_id: partId,
        account_id: part.account_id,
        job_id: job_id || null,
        quantity_used: quantity_used,
        used_by: user.id,
        notes: notes || null,
      })
      .select()
      .single()

    if (usageError) {
      console.error('Error creating usage record:', usageError)
      return NextResponse.json(
        { error: 'Failed to record usage' },
        { status: 500 }
      )
    }

    // Update part stock
    await supabase
      .from('parts')
      .update({
        quantity_in_stock: part.quantity_in_stock - quantity_used,
      })
      .eq('id', partId)

    return NextResponse.json({ usage }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error recording usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

