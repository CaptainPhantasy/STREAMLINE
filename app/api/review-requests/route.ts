import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, contactId } = body

    if (!jobId && !contactId) {
      return NextResponse.json(
        { error: 'Missing required field: jobId or contactId' },
        { status: 400 }
      )
    }

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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get account settings for Google review link
    const { data: account } = await supabase
      .from('accounts')
      .select('name, google_review_link')
      .eq('id', user.account_id)
      .single()

    let contact
    let job

    if (jobId) {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*, contact:contacts(*)')
        .eq('id', jobId)
        .eq('account_id', user.account_id)
        .single()

      if (jobError || !jobData) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      job = jobData
      contact = jobData.contact
    } else if (contactId) {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('account_id', user.account_id)
        .single()

      if (contactError || !contactData) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }

      contact = contactData
    }

    if (!contact || !contact.email) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 })
    }

    // Get or create email template for review request
    let template
    const { data: templates } = await supabase
      .from('email_templates')
      .select('*')
      .eq('account_id', user.account_id)
      .eq('template_type', 'review_request')
      .eq('is_active', true)
      .limit(1)

    if (templates && templates.length > 0) {
      template = templates[0]
    } else {
      // Use default template
      template = {
        subject: `How was your experience with ${account?.name || 'us'}?`,
        body_html: `
          <h2>Thank you for choosing ${account?.name || 'us'}!</h2>
          <p>Dear ${contact.first_name || 'Customer'},</p>
          <p>We hope you were satisfied with our service. We would love to hear your feedback!</p>
          ${account?.google_review_link ? `<p><a href="${account.google_review_link}">Leave us a review on Google</a></p>` : ''}
          <p>Thank you for your business!</p>
        `,
      }
    }

    // Replace template variables
    let subject = template.subject
    let bodyHtml = template.body_html || ''

    const variables: Record<string, string> = {
      contact_name: contact.first_name || 'Customer',
      contact_first_name: contact.first_name || '',
      contact_last_name: contact.last_name || '',
      company_name: account?.name || '',
      job_id: job?.id || '',
      job_description: job?.description || '',
      review_link: account?.google_review_link || '',
    }

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, variables[key])
      bodyHtml = bodyHtml.replace(regex, variables[key])
    })

    // Send email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'noreply@yourdomain.com', // Should be configured
        to: contact.email,
        subject,
        html: bodyHtml,
      })

      return NextResponse.json({
        success: true,
        message: 'Review request sent successfully',
        sentTo: contact.email,
      })
    } catch (emailError) {
      console.error('Error sending review request email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error: unknown) {
    console.error('Error in POST /api/review-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

