import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/estimates
 * List all estimates with filtering
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's account_id
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData?.account_id) {
      return NextResponse.json({ error: 'User has no account' }, { status: 400 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const contact_id = searchParams.get('contact_id') || undefined
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || 'desc'
    const sort_by = searchParams.get('sort_by') || 'created_at'

    // Build query
    let query = supabase
      .from('estimates')
      .select('*, contact:contacts(id, first_name, last_name, email, phone), estimate_items(*)', { count: 'exact' })
      .eq('account_id', userData.account_id)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (contact_id) {
      query = query.eq('contact_id', contact_id)
    }
    if (search) {
      query = query.or(`estimate_number.ilike.%${search}%,title.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort === 'asc' })

    // Apply pagination
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    // Execute query
    const { data: estimates, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 })
    }

    // Map contacts to flatten structure if needed (frontend expects contact.name)
    const mappedEstimates = estimates?.map(estimate => ({
      ...estimate,
      contact: estimate.contact ? {
        ...estimate.contact,
        name: `${estimate.contact.first_name} ${estimate.contact.last_name || ''}`.trim()
      } : null
    }))

    return NextResponse.json({
      estimates: mappedEstimates || [],
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/estimates
 * Create new estimate
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's account_id
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData?.account_id) {
      return NextResponse.json({ error: 'User has no account' }, { status: 400 })
    }

    const body = await request.json()
    const { contact_id, title, description, items, tax_rate, valid_until, customer_notes, notes } = body

    // Validate required fields
    if (!contact_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: contact_id and items' },
        { status: 400 }
      )
    }

    // 1. Generate Estimate Number
    // Check if rpc exists, otherwise manual generation
    // Assuming manual for safety if rpc missing, but trying rpc first is good practice.
    // For simplicity, I'll do a manual generation to avoid RPC dependency issues if migration wasn't run.
    const { count } = await supabase
      .from('estimates')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userData.account_id)
    
    const dateStr = new Date().toISOString().slice(0,7).replace('-',''); // YYYYMM
    const estimateNumber = `EST-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`

    // 2. Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
    // items unit_price is expected in cents? 
    // If frontend sends dollars, we convert. If cents, we use as is.
    // The blueprint says "unit_price: 5000 // $500.00 in cents"
    // I'll assume the frontend sends CENTS or I need to document strictly.
    // Let's assume frontend sends CENTS for consistency with blueprint.

    const taxAmount = Math.round(subtotal * (tax_rate || 0))
    const totalAmount = subtotal + taxAmount

    // 3. Create Estimate Record
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert({
        account_id: userData.account_id,
        contact_id,
        estimate_number: estimateNumber,
        title,
        description,
        subtotal,
        tax_rate: tax_rate || 0,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft',
        valid_until,
        customer_notes,
        notes,
        created_by: user.id
      })
      .select()
      .single()

    if (estimateError) {
      console.error('Estimate create error:', estimateError)
      return NextResponse.json({ error: estimateError.message }, { status: 400 })
    }

    // 4. Create Estimate Items
    const estimateItems = items.map((item: any, index: number) => ({
      account_id: userData.account_id,
      estimate_id: estimate.id,
      item_type: item.item_type || 'other',
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'each',
      unit_price: item.unit_price,
      total_price: Math.round(item.quantity * item.unit_price),
      sort_order: index
    }))

    const { error: itemsError } = await supabase
      .from('estimate_items')
      .insert(estimateItems)

    if (itemsError) {
      // Rollback (delete estimate)
      await supabase.from('estimates').delete().eq('id', estimate.id)
      console.error('Items create error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    // 5. Return complete estimate
    const { data: completeEstimate } = await supabase
      .from('estimates')
      .select('*, contact:contacts(id, first_name, last_name, email, phone), estimate_items(*)')
      .eq('id', estimate.id)
      .single()

     const mappedComplete = {
      ...completeEstimate,
      contact: completeEstimate.contact ? {
        ...completeEstimate.contact,
        name: `${completeEstimate.contact.first_name} ${completeEstimate.contact.last_name || ''}`.trim()
      } : null
    }

    return NextResponse.json(mappedComplete, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
