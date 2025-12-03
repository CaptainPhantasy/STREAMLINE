import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/jobs/[id]/checklist
 * Get all checklist items for a job
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

    const jobId = params.id

    // Verify job belongs to user's account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== job.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get checklist items
    const { data: items, error: itemsError } = await supabase
      .from('job_checklist_items')
      .select('*')
      .eq('job_id', jobId)
      .order('display_order', { ascending: true })

    if (itemsError) {
      console.error('Error fetching checklist items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch checklist items' },
        { status: 500 }
      )
    }

    // Calculate progress
    const total = items?.length || 0
    const completed = items?.filter(i => i.is_completed).length || 0
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      items: items || [],
      progress: {
        total,
        completed,
        percentage,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jobs/[id]/checklist
 * Create a new checklist item
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

    const jobId = params.id
    const body = await request.json()
    const { title, description, display_order } = body

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    // Verify job belongs to user's account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== job.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get next display order if not provided
    let finalDisplayOrder = display_order
    if (finalDisplayOrder === undefined) {
      const { data: existingItems } = await supabase
        .from('job_checklist_items')
        .select('display_order')
        .eq('job_id', jobId)
        .order('display_order', { ascending: false })
        .limit(1)

      finalDisplayOrder =
        existingItems && existingItems.length > 0
          ? existingItems[0].display_order + 1
          : 0
    }

    // Create checklist item
    const { data: item, error: itemError } = await supabase
      .from('job_checklist_items')
      .insert({
        job_id: jobId,
        account_id: job.account_id,
        title,
        description: description || null,
        display_order: finalDisplayOrder,
      })
      .select()
      .single()

    if (itemError) {
      console.error('Error creating checklist item:', itemError)
      return NextResponse.json(
        { error: 'Failed to create checklist item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

