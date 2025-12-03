import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/parts/bundles
 * Get all part bundles
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
    const activeOnly = searchParams.get('active_only') === 'true'

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get bundles with items
    let query = supabase
      .from('part_bundles')
      .select('*, items:part_bundle_items(*, part:parts(id, name, unit_cost))')
      .eq('account_id', userData.account_id)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query.order('name', { ascending: true })

    const { data: bundles, error: bundlesError } = await query

    if (bundlesError) {
      console.error('Error fetching bundles:', bundlesError)
      return NextResponse.json(
        { error: 'Failed to fetch bundles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bundles: bundles || [] })
  } catch (error: unknown) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/parts/bundles
 * Create a new part bundle
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
    const { name, description, sku, total_cost, items } = body

    if (!name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'name and items array are required' },
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

    // Create bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('part_bundles')
      .insert({
        account_id: userData.account_id,
        name,
        description: description || null,
        sku: sku || null,
        total_cost: total_cost || null,
        is_active: true,
      })
      .select()
      .single()

    if (bundleError) {
      console.error('Error creating bundle:', bundleError)
      return NextResponse.json(
        { error: 'Failed to create bundle' },
        { status: 500 }
      )
    }

    // Create bundle items
    const itemsToInsert = items.map((item: any) => ({
      bundle_id: bundle.id,
      part_id: item.part_id,
      quantity: item.quantity || 1,
    }))

    const { error: itemsError } = await supabase
      .from('part_bundle_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Error creating bundle items:', itemsError)
      // Clean up bundle
      await supabase.from('part_bundles').delete().eq('id', bundle.id)
      return NextResponse.json(
        { error: 'Failed to create bundle items' },
        { status: 500 }
      )
    }

    // Fetch complete bundle with items
    const { data: completeBundle } = await supabase
      .from('part_bundles')
      .select('*, items:part_bundle_items(*, part:parts(id, name, unit_cost))')
      .eq('id', bundle.id)
      .single()

    return NextResponse.json({ bundle: completeBundle }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating bundle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

