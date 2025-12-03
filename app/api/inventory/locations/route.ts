import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inventory/locations
 * Get all inventory locations
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

    // Get locations
    const { data: locations, error: locationsError } = await supabase
      .from('inventory_locations')
      .select('*')
      .eq('account_id', userData.account_id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (locationsError) {
      console.error('Error fetching locations:', locationsError)
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ locations: locations || [] })
  } catch (error: unknown) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/locations
 * Create a new inventory location
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
    const { name, address, is_default } = body

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

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('inventory_locations')
        .update({ is_default: false })
        .eq('account_id', userData.account_id)
        .eq('is_default', true)
    }

    // Create location
    const { data: location, error: locationError } = await supabase
      .from('inventory_locations')
      .insert({
        account_id: userData.account_id,
        name,
        address: address || null,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (locationError) {
      console.error('Error creating location:', locationError)
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      )
    }

    return NextResponse.json({ location }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

