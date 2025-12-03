import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedule/resources/[id]/working-hours
 * Get working hours for a resource
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
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== resource.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get working hours
    const { data: workingHours, error: hoursError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('resource_id', resourceId)
      .order('day_of_week', { ascending: true })

    if (hoursError) {
      console.error('Error fetching working hours:', hoursError)
      return NextResponse.json(
        { error: 'Failed to fetch working hours' },
        { status: 500 }
      )
    }

    return NextResponse.json({ working_hours: workingHours || [] })
  } catch (error: unknown) {
    console.error('Error fetching working hours:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedule/resources/[id]/working-hours
 * Set working hours for a resource
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

    const resourceId = params.id
    const body = await request.json()
    const { working_hours } = body

    if (!Array.isArray(working_hours)) {
      return NextResponse.json(
        { error: 'working_hours must be an array' },
        { status: 400 }
      )
    }

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

    // Only admin/owner can set working hours
    if (userData.role !== 'admin' && userData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Delete existing working hours
    await supabase
      .from('working_hours')
      .delete()
      .eq('resource_id', resourceId)

    // Insert new working hours
    const hoursToInsert = working_hours.map((wh: any) => ({
      resource_id: resourceId,
      account_id: resource.account_id,
      day_of_week: wh.day_of_week,
      start_time: wh.start_time,
      end_time: wh.end_time,
      is_available: wh.is_available !== undefined ? wh.is_available : true,
    }))

    const { data: createdHours, error: createError } = await supabase
      .from('working_hours')
      .insert(hoursToInsert)
      .select()

    if (createError) {
      console.error('Error creating working hours:', createError)
      return NextResponse.json(
        { error: 'Failed to set working hours' },
        { status: 500 }
      )
    }

    return NextResponse.json({ working_hours: createdHours || [] })
  } catch (error: unknown) {
    console.error('Error setting working hours:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

