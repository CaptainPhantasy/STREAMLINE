import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
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

  // Verify role
  const { data: userData } = await supabase
    .from('users')
    .select('account_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || !['admin', 'dispatcher', 'owner'].includes(userData.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { notes, resolved = true } = body

  if (!notes) {
    return NextResponse.json({ error: 'Notes required' }, { status: 400 })
  }

  // Update the gate
  const { error } = await supabase
    .from('job_gates')
    .update({
      status: resolved ? 'completed' : 'escalated',
      requires_exception: false,
      exception_reason: notes,
      escalated_to: user.id,
      escalation_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the clearance in audit
  const { data: gate } = await supabase
    .from('job_gates')
    .select('job_id')
    .eq('id', id)
    .single()

  if (gate) {
    await supabase.from('crmai_audit').insert({
      account_id: userData.account_id,
      user_id: user.id,
      action: 'escalation_cleared',
      entity_type: 'job_gate',
      entity_id: id,
      new_values: {
        resolution_notes: notes,
        resolved_by: user.id,
      },
    })
  }

  return NextResponse.json({ success: true })
}

