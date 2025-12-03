import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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
    const { status, notes } = body

    const validStatuses = ['en_route', 'in_progress', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Verify job belongs to this tech
    const { data: job } = await supabase
      .from('jobs')
      .select('*, contact:contacts(*), tech:users!tech_assigned_id(*)')
      .eq('id', params.id)
      .eq('tech_assigned_id', user.id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found or not assigned to you' }, { status: 404 })
    }

    // Update job
    const updateData: any = { status }
    if (notes) {
      // Store notes in description or create a notes field (for now, append to description)
      updateData.description = job.description ? `${job.description}\n\nNotes: ${notes}` : notes
    }

    const { data: updatedJob, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    // Send email notifications
    let emailSent = false
    if (status === 'en_route' && job.contact?.email && job.tech) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'CRM-AI PRO <noreply@crm-ai-pro.com>',
        to: job.contact.email,
        subject: 'Your technician is on the way!',
        html: `
          <h2>Your technician ${job.tech.full_name || 'is on the way'}!</h2>
          <p>They should arrive shortly. If you have any questions, please reply to this email.</p>
        `
      })
      emailSent = true
    }

    if (status === 'completed' && job.contact?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'CRM-AI PRO <noreply@crm-ai-pro.com>',
        to: job.contact.email,
        subject: 'Job completed - How did we do?',
        html: `
          <h2>Thank you for choosing CRM-AI PRO!</h2>
          <p>We hope you're satisfied with our service. Please take a moment to leave us a review.</p>
        `
      })
      emailSent = true
    }

    return NextResponse.json({ success: true, job: updatedJob, emailSent })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

