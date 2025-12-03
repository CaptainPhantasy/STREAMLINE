import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/jobs/[id]/checklist/[itemId]
 * Update a checklist item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const itemId = params.itemId
    const body = await request.json()
    const { title, description, is_completed, display_order } = body

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

    // Verify item belongs to job
    const { data: item, error: itemError } = await supabase
      .from('job_checklist_items')
      .select('*')
      .eq('id', itemId)
      .eq('job_id', jobId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (display_order !== undefined) updateData.display_order = display_order
    
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed
      if (is_completed && !item.is_completed) {
        // Marking as completed
        updateData.completed_by = user.id
        updateData.completed_at = new Date().toISOString()
      } else if (!is_completed && item.is_completed) {
        // Marking as incomplete
        updateData.completed_by = null
        updateData.completed_at = null
      }
    }

    // Update item
    const { data: updatedItem, error: updateError } = await supabase
      .from('job_checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating checklist item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update checklist item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ item: updatedItem })
  } catch (error: unknown) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/jobs/[id]/checklist/[itemId]
 * Delete a checklist item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const itemId = params.itemId

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

    // Delete item
    const { error: deleteError } = await supabase
      .from('job_checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('job_id', jobId)

    if (deleteError) {
      console.error('Error deleting checklist item:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete checklist item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

