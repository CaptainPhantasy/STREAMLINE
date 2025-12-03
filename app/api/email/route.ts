/**
 * Email API Endpoint
 *
 * Supports:
 * - Sending single or batch emails
 * - Queue management
 * - Template-based sending
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { resendService } from '@/lib/email/resend-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      templateId,
      recipients,
      from,
      replyTo,
      subject,
      html,
      text,
      scheduledAt,
      batchId,
      metadata
    } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.email || typeof recipient.email !== 'string') {
        return NextResponse.json(
          { error: 'Each recipient must have a valid email address' },
          { status: 400 }
        )
      }
    }

    // Get user's account
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

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare email options
    const emailOptions = {
      templateId,
      recipients: recipients.map((r: any) => ({
        email: r.email,
        name: r.name,
        variables: r.variables || {}
      })),
      from,
      replyTo,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      batchId,
      metadata: {
        ...metadata,
        userId: session.user.id,
        accountId: user.account_id
      }
    }

    // If using custom content instead of template
    if (subject && html) {
      emailOptions.template = {
        name: 'Custom Email',
        subject,
        html,
        text
      }
    }

    // Send email
    const result = await resendService.sendEmail(emailOptions)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        sentTo: recipients.length
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Error in POST /api/email:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    let query = supabase
      .from('email_queue')
      .select('*', { count: 'exact' })
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: emails, error, count } = await query

    if (error) {
      console.error('Error fetching emails:', error)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
    }

    return NextResponse.json({
      emails: emails || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/email:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}