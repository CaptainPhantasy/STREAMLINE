import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedule/resources/[id]
 * Get a specific resource with assignments and working hours
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

    const resourceId = params.id

    // Get resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*, user:users(id, full_name, avatar_url)')
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Verify account access
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== resource.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get working hours
    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('*')
      .eq('resource_id', resourceId)
      .order('day_of_week', { ascending: true })

    // Get current assignments
    const { data: assignments } = await supabase
      .from('resource_assignments')
      .select('*, job:jobs(id, description, scheduled_start, scheduled_end, status)')
      .eq('resource_id', resourceId)
      .order('assigned_at', { ascending: false })

    return NextResponse.json({
      resource: {
        ...resource,
        working_hours: workingHours || [],
        assignments: assignments || [],
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/schedule/resources/[id]
 * Update a resource
 */
export async function PATCH(
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

    const resourceId = params.id
    const body = await request.json()
    const { name, description, is_active, metadata } = body

    // Verify resource belongs to user's account
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('account_id')
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== resource.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admin/owner can update resources
    if (userData.role !== 'admin' && userData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active
    if (metadata !== undefined) updateData.metadata = metadata

    // Update resource
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', resourceId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating resource:', updateError)
      return NextResponse.json(
        { error: 'Failed to update resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resource: updatedResource })
  } catch (error: unknown) {
    console.error('Error updating resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

