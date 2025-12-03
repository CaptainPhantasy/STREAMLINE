import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/suppliers
 * Get all suppliers for the account
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

    // Build query
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('account_id', userData.account_id)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query.order('name', { ascending: true })

    const { data: suppliers, error: suppliersError } = await query

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError)
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }

    return NextResponse.json({ suppliers: suppliers || [] })
  } catch (error: unknown) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
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
    const { name, contact_name, email, phone, address, website, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
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

    // Create supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        account_id: userData.account_id,
        name,
        contact_name: contact_name || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (supplierError) {
      console.error('Error creating supplier:', supplierError)
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      )
    }

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

