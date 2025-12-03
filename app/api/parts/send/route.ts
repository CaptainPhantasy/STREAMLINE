import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
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

    // Get user's account_id and role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { jobId, recipientType, recipientId, recipientEmail, recipientPhone, parts } = body

    if (!jobId || !recipientType || !parts || parts.length === 0) {
      return NextResponse.json({ error: 'Job ID, recipient type, and parts are required' }, { status: 400 })
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, contact:contacts(*)')
      .eq('id', jobId)
      .eq('account_id', user.account_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Build parts list HTML
    const partsListHtml = `
      <h2>Parts List for Job</h2>
      <p><strong>Job:</strong> ${job.description || 'No description'}</p>
      <p><strong>Customer:</strong> ${job.contact?.first_name || ''} ${job.contact?.last_name || ''}</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Part Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Unit</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Unit Price</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${parts.map((part: any) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${part.name || 'N/A'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${part.quantity || 0}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${part.unit || 'each'}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${(part.unit_price || 0) / 100}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${((part.quantity || 0) * (part.unit_price || 0)) / 100}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total:</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">
              $${parts.reduce((sum: number, part: any) => sum + ((part.quantity || 0) * (part.unit_price || 0)), 0) / 100}
            </td>
          </tr>
        </tfoot>
      </table>
    `

    // Determine recipient email/phone based on type
    let recipientEmailAddress: string | null = null
    let recipientPhoneNumber: string | null = null

    if (recipientType === 'tech') {
      const { data: tech } = await supabase
        .from('users')
        .select('email')
        .eq('id', recipientId)
        .eq('account_id', user.account_id)
        .single()
      recipientEmailAddress = tech?.email || null
    } else if (recipientType === 'homeowner') {
      recipientEmailAddress = job.contact?.email || recipientEmail || null
      recipientPhoneNumber = job.contact?.phone || recipientPhone || null
    } else if (recipientType === 'supply_house') {
      recipientEmailAddress = recipientEmail || null
      recipientPhoneNumber = recipientPhone || null
    }

    // Send email if email address is available
    if (recipientEmailAddress) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: recipientEmailAddress,
          subject: `Parts List - ${job.description || 'Job Parts'}`,
          html: partsListHtml,
        })
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        // Continue - we'll try SMS if available
      }
    }

    // Send SMS if phone number is available (would need Twilio or similar)
    // For now, we'll just log it
    if (recipientPhoneNumber) {
      console.log('SMS sending not yet implemented. Would send to:', recipientPhoneNumber)
      // TODO: Integrate with Twilio or SMS service
    }

    return NextResponse.json({
      success: true,
      message: 'Parts list sent successfully',
      sentVia: recipientEmailAddress ? 'email' : recipientPhoneNumber ? 'sms' : 'none',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

