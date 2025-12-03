import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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
  const {
    jobId,
    stageName,
    metadata = {},
    requiresException = false,
    satisfactionRating,
    reviewRequested,
    discountApplied,
  } = body

  // Get user's data for completed_by reference
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  // Create gate completion record
  const { data: gate, error } = await supabase
    .from('job_gates')
    .insert({
      job_id: jobId,
      stage_name: stageName,
      status: requiresException ? 'pending' : 'completed',
      metadata,
      completed_at: new Date().toISOString(),
      completed_by: userData?.id || user.id,
      requires_exception: requiresException,
      satisfaction_rating: satisfactionRating,
      review_requested: reviewRequested,
      discount_applied: discountApplied,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If low satisfaction rating, create notification for office
  if (satisfactionRating && satisfactionRating <= 3) {
    // Get job details for notification
    const { data: job } = await supabase
      .from('jobs')
      .select(`
        account_id,
        description,
        contact:contacts(first_name, last_name, phone)
      `)
      .eq('id', jobId)
      .single()

    if (job) {
      // Find dispatcher/admin users to notify
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('account_id', job.account_id)
        .in('role', ['admin', 'dispatcher', 'owner'])

      // Create notifications
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          account_id: job.account_id,
          user_id: admin.id,
          type: 'escalation',
          title: 'Low Satisfaction Rating',
          message: `${(job.contact as any)?.first_name} ${(job.contact as any)?.last_name} rated ${satisfactionRating}/5 - needs follow-up`,
          entity_type: 'job',
          entity_id: jobId,
          metadata: {
            rating: satisfactionRating,
            gateId: gate.id,
            customerPhone: (job.contact as any)?.phone,
          },
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }
  }

  // If review requested with discount, log it
  if (reviewRequested && discountApplied) {
    const { data: job } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (job) {
      await supabase.from('crmai_audit').insert({
        account_id: job.account_id,
        user_id: user.id,
        action: 'review_discount_offered',
        entity_type: 'job',
        entity_id: jobId,
        new_values: {
          discount_percent: discountApplied,
          review_requested: true,
        },
      })
    }
  }

  return NextResponse.json({ success: true, gate })
}

