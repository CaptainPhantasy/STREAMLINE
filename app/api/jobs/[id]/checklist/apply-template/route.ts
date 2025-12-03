import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/jobs/[id]/checklist/apply-template
 * Apply a checklist template to a job
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
    const { template_id } = body

    if (!template_id) {
      return NextResponse.json(
        { error: 'template_id is required' },
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

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('job_checklist_templates')
      .select('*')
      .eq('id', template_id)
      .eq('account_id', job.account_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get existing items to determine next display order
    const { data: existingItems } = await supabase
      .from('job_checklist_items')
      .select('display_order')
      .eq('job_id', jobId)
      .order('display_order', { ascending: false })
      .limit(1)

    const startOrder =
      existingItems && existingItems.length > 0
        ? existingItems[0].display_order + 1
        : 0

    // Create checklist items from template
    const itemsToInsert = (template.items as Array<{ title: string; description?: string; display_order: number }>).map(
      (item, index) => ({
        job_id: jobId,
        account_id: job.account_id,
        title: item.title,
        description: item.description || null,
        display_order: startOrder + index,
      })
    )

    const { data: createdItems, error: createError } = await supabase
      .from('job_checklist_items')
      .insert(itemsToInsert)
      .select()

    if (createError) {
      console.error('Error applying template:', createError)
      return NextResponse.json(
        { error: 'Failed to apply template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items: createdItems || [] }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error applying checklist template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

