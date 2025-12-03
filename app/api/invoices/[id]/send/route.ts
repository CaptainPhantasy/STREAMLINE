import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Get invoice with contact
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, contact:contacts(*)')
      .eq('id', params.id)
      .single()

    if (invoiceError || !invoice || !invoice.contact) {
      return NextResponse.json({ error: 'Invoice or contact not found' }, { status: 404 })
    }

    if (!invoice.contact.email) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 })
    }

    // Send email
    const amount = (invoice.total_amount / 100).toFixed(2)
    const subject = `Invoice ${invoice.invoice_number}`
    const html = `
      <h2>Invoice ${invoice.invoice_number}</h2>
      <p>Dear ${invoice.contact.first_name || 'Customer'},</p>
      <p>Please find your invoice below:</p>
      <p><strong>Amount:</strong> $${amount}</p>
      ${invoice.due_date ? `<p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
      ${invoice.stripe_payment_link ? `<p><a href="${invoice.stripe_payment_link}">Pay Online</a></p>` : ''}
      ${invoice.notes ? `<p>${invoice.notes}</p>` : ''}
    `

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'noreply@yourdomain.com', // Should be configured
        to: invoice.contact.email,
        subject,
        html,
      })

      // Update invoice status
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', params.id)

      return NextResponse.json({ success: true, message: 'Invoice sent successfully' })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

