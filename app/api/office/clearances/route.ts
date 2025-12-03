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

  // Get user's account and verify role
  const { data: userData } = await supabase
    .from('users')
    .select('account_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || !['admin', 'dispatcher', 'owner'].includes(userData.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch pending escalations (gates that require exception)
  const { data: escalations, error } = await supabase
    .from('job_gates')
    .select(`
      id,
      job_id,
      stage_name,
      satisfaction_rating,
      metadata,
      created_at,
      job:jobs (
        id,
        description,
        contact:contacts (
          first_name,
          last_name,
          phone
        ),
        tech:users!jobs_tech_assigned_id_fkey (
          full_name
        )
      )
    `)
    .eq('requires_exception', true)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to expected format
  const pending = escalations?.map(e => ({
    id: e.id,
    jobId: e.job_id,
    customerName: `${(e.job as any)?.contact?.first_name || ''} ${(e.job as any)?.contact?.last_name || ''}`.trim() || 'Unknown',
    customerPhone: (e.job as any)?.contact?.phone || '',
    techName: (e.job as any)?.tech?.full_name || 'Unassigned',
    jobDescription: (e.job as any)?.description || '',
    rating: e.satisfaction_rating || 0,
    createdAt: e.created_at,
    metadata: e.metadata,
  })) || []

  return NextResponse.json({ pending })
}

