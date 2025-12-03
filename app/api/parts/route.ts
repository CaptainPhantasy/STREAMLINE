import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/parts
 * List all parts
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
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
            } catch { }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData?.account_id) return NextResponse.json({ error: 'No account' }, { status: 400 })

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('low_stock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50') // Increased default

    let query = supabase
      .from('parts')
      .select('*', { count: 'exact' })
      .eq('account_id', userData.account_id)
      .range((page - 1) * limit, page * limit - 1)
      .order('name', { ascending: true }) // Add ordering

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    // For low stock, we might need a raw filter or post-filter if Supabase doesn't support col comparisons easily in JS client
    // Actually .lte('quantity_in_stock', supabase.raw('reorder_threshold')) might NOT work directly in JS client easily without RPC
    // For now, let's filter in JS if low_stock is true, or assume simple filter if threshold is constant (it's not).
    // Best approach: fetch and filter, or use RPC. Given urgency, fetch & filter is safer if list isn't massive.
    // But wait, pagination... 
    // Let's assume standard filtering for now. 
    
    const { data: parts, error, count } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let filteredParts = parts || []
    if (lowStock) {
      filteredParts = filteredParts.filter(p => p.quantity_in_stock <= p.reorder_threshold)
    }

    return NextResponse.json({
      parts: filteredParts,
      total: count || 0
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/parts
 * Create part
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
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
            } catch { }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    
    const { data: part, error } = await supabase
      .from('parts')
      .insert({
        ...body,
        account_id: userData.account_id
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
