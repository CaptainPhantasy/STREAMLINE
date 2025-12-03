import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { logAudit } from '@/lib/audit'
import { getJobStatusSenderEmail, get317PlumberSenderEmail } from '@/lib/email/domain-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
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

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    // Get job to verify account
    const { data: currentJob } = await supabase
      .from('jobs')
      .select('account_id, contact:contacts(*)')
      .eq('id', params.id)
      .single()

    if (!currentJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Call Edge Function for state machine validation
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-job-status`
    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: currentJob.account_id,
        jobId: params.id,
        newStatus: status,
        userId: session.user.id,
      }),
    })

    const edgeData = await edgeResponse.json()

    if (!edgeResponse.ok) {
      return NextResponse.json(edgeData, { status: edgeResponse.status })
    }

    // Send email notification if status changed to "en_route" or "completed"
    let emailSent = false
    const job = edgeData.job
    if (status === 'en_route' && job.tech_assigned_id && currentJob.contact?.email) {
      const { data: tech } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', job.tech_assigned_id)
        .single()

      if (tech) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: getJobStatusSenderEmail(),
          to: currentJob.contact.email,
          subject: 'Your technician is on the way!',
          html: `
            <h2>Your technician ${tech.full_name} is on the way!</h2>
            <p>They should arrive shortly. If you have any questions, please reply to this email.</p>
          `
        })
        emailSent = true
      }
    }

    if (status === 'completed' && currentJob.contact?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: get317PlumberSenderEmail(),
        to: currentJob.contact.email,
        subject: 'Job completed - How did we do?',
        html: `
          <h2>Thank you for choosing CRM-AI PRO!</h2>
          <p>We hope you're satisfied with our service. Please take a moment to leave us a review.</p>
        `
      })
      emailSent = true
    }

    return NextResponse.json({ success: true, job, emailSent })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

