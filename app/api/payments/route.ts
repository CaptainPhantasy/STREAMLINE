import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let query = supabase
      .from('payments')
      .select('*, invoice:invoices(invoice_number, contact_id), job:jobs(id, description, contact:contacts(first_name, last_name))')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ payments: payments || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, jobId, amount, paymentMethod, notes, metadata } = body

    if (!amount) {
      return NextResponse.json({ error: 'Missing required field: amount' }, { status: 400 })
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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify invoice/job belong to account if provided
    if (invoiceId) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('account_id')
        .eq('id', invoiceId)
        .single()

      if (!invoice || invoice.account_id !== user.account_id) {
        return NextResponse.json({ error: 'Invoice not found or different account' }, { status: 404 })
      }
    }

    if (jobId) {
      const { data: job } = await supabase
        .from('jobs')
        .select('account_id')
        .eq('id', jobId)
        .single()

      if (!job || job.account_id !== user.account_id) {
        return NextResponse.json({ error: 'Job not found or different account' }, { status: 404 })
      }
    }

    const { data: payment, error: createError } = await supabase
      .from('payments')
      .insert({
        account_id: user.account_id,
        invoice_id: invoiceId || null,
        job_id: jobId || null,
        amount,
        payment_method: paymentMethod || 'manual',
        status: 'completed',
        processed_at: new Date().toISOString(),
        metadata: metadata || {},
      })
      .select('*, invoice:invoices(*), job:jobs(*)')
      .single()

    if (createError) {
      console.error('Error creating payment:', createError)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Update invoice status if linked
    if (invoiceId) {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoiceId)
    }

    // Update job status if linked
    if (jobId) {
      await supabase.from('jobs').update({ status: 'paid' }).eq('id', jobId)
    }

    return NextResponse.json({ success: true, payment }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

