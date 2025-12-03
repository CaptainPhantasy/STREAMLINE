import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedule/resources
 * Get all resources for the account
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
    const resourceType = searchParams.get('type')
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
      .from('resources')
      .select('*, user:users(id, full_name, avatar_url)')
      .eq('account_id', userData.account_id)

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query.order('name', { ascending: true })

    const { data: resources, error: resourcesError } = await query

    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError)
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resources: resources || [] })
  } catch (error: unknown) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedule/resources
 * Create a new resource
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
    const { resource_type, name, description, user_id, metadata } = body

    if (!resource_type || !name) {
      return NextResponse.json(
        { error: 'resource_type and name are required' },
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

    // Only admin/owner can create resources
    if (userData.role !== 'admin' && userData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Create resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        account_id: userData.account_id,
        resource_type,
        name,
        description: description || null,
        user_id: user_id || null,
        metadata: metadata || {},
        is_active: true,
      })
      .select()
      .single()

    if (resourceError) {
      console.error('Error creating resource:', resourceError)
      return NextResponse.json(
        { error: 'Failed to create resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resource }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

