import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      id,
      description,
      status,
      scheduled_start,
      scheduled_end,
      notes,
      contact:contacts (
        id,
        first_name,
        last_name,
        address,
        phone,
        email
      )
    `)
    .eq('id', id)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Fetch gate completions
  const { data: gates } = await supabase
    .from('job_gates')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  // Transform
  const transformedJob = {
    id: job.id,
    description: job.description,
    status: job.status,
    scheduledStart: job.scheduled_start,
    scheduledEnd: job.scheduled_end,
    notes: job.notes,
    contact: job.contact ? {
      id: (job.contact as any).id,
      firstName: (job.contact as any).first_name,
      lastName: (job.contact as any).last_name,
      address: (job.contact as any).address,
      phone: (job.contact as any).phone,
      email: (job.contact as any).email,
    } : null,
  }

  return NextResponse.json({ job: transformedJob, gates })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { status, completionNotes } = body

  const updateData: Record<string, unknown> = {}
  if (status) updateData.status = status
  if (completionNotes) updateData.completion_notes = completionNotes

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

