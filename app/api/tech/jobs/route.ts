import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch jobs assigned to this tech for today
  const { data: jobs, error } = await supabase
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
    .eq('tech_assigned_id', user.id)
    .gte('scheduled_start', today.toISOString())
    .lt('scheduled_start', tomorrow.toISOString())
    .order('scheduled_start', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to camelCase
  const transformedJobs = jobs?.map(job => ({
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
  }))

  return NextResponse.json({ jobs: transformedJobs })
}
