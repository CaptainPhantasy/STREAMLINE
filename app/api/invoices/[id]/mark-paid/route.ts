import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, job:jobs(*)')
      .eq('id', params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*, job:jobs(*)')
      .single()

    if (updateError || !updatedInvoice) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    // Update job status if linked
    if (invoice.job_id) {
      await supabase
        .from('jobs')
        .update({ status: 'paid' })
        .eq('id', invoice.job_id)
    }

    // Create payment record
    if (invoice.job_id) {
      await supabase.from('payments').insert({
        account_id: invoice.account_id,
        invoice_id: invoice.id,
        job_id: invoice.job_id,
        amount: invoice.total_amount,
        payment_method: 'manual',
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

