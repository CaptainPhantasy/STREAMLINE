import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tech/parts
 * Get parts inventory for tech dashboard
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

    // Verify user is a tech
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'tech') {
      return NextResponse.json(
        { error: 'Forbidden: Tech access only' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const lowStockOnly = searchParams.get('low_stock') === 'true'

    // Build query
    let query = supabase
      .from('parts')
      .select('*')
      .eq('account_id', userData.account_id)
      .eq('is_active', true)

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (lowStockOnly) {
      query = query.filter('quantity_in_stock', 'lte', 'reorder_level')
    }

    query = query.order('name', { ascending: true }).limit(100)

    const { data: parts, error: partsError } = await query

    if (partsError) {
      console.error('Error fetching parts:', partsError)
      return NextResponse.json(
        { error: 'Failed to fetch parts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      parts: parts || [],
      total: parts?.length || 0,
    })
  } catch (error: unknown) {
    console.error('Error fetching tech parts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tech/parts
 * Request parts for a job (creates a parts request, doesn't actually order)
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

    // Verify user is a tech
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'tech') {
      return NextResponse.json(
        { error: 'Forbidden: Tech access only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { job_id, part_id, quantity, notes } = body

    if (!job_id || !part_id || !quantity) {
      return NextResponse.json(
        { error: 'job_id, part_id, and quantity are required' },
        { status: 400 }
      )
    }

    // Verify job belongs to tech
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, tech_assigned_id, account_id')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.tech_assigned_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Job not assigned to you' },
        { status: 403 }
      )
    }

    // Create parts request (or add to job parts if that table exists)
    // For now, we'll create a notification/request
    const { data: request, error: requestError } = await supabase
      .from('notifications')
      .insert({
        account_id: userData.account_id,
        user_id: user.id, // Tech requesting
        type: 'parts_request',
        title: 'Parts Request',
        message: `Requested ${quantity} of part for job ${job_id}`,
        metadata: {
          job_id,
          part_id,
          quantity,
          notes: notes || null,
        },
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating parts request:', requestError)
      return NextResponse.json(
        { error: 'Failed to create parts request' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        request,
        message: 'Parts request created',
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Error creating parts request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

