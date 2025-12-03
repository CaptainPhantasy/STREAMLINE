import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Initialize Stripe lazily
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  })
}

// Initialize Supabase lazily (not at build time)
const getSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const stripe = getStripe()
    if (!stripe) {
      console.error('Stripe secret key is missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error('Supabase configuration is missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Find invoice or job by payment link or payment intent
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, job:jobs(id)')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (invoice) {
        // Update invoice status
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', invoice.id)

        // Create payment record
        await supabase
          .from('payments')
          .insert({
            account_id: invoice.account_id,
            invoice_id: invoice.id,
            job_id: invoice.job_id,
            amount: invoice.total_amount,
            payment_method: 'stripe',
            stripe_payment_intent_id: paymentIntent.id,
            status: 'completed',
            processed_at: new Date().toISOString(),
          })

        // Update job status if linked
        if (invoice.job_id) {
          await supabase
            .from('jobs')
            .update({ status: 'paid' })
            .eq('id', invoice.job_id)
        }
      } else {
        // Try to find by job's payment link
        const { data: job } = await supabase
          .from('jobs')
          .select('id, account_id, total_amount')
          .eq('stripe_payment_link', paymentIntent.metadata?.payment_link || '')
          .single()

        if (job) {
          // Create payment record
          await supabase
            .from('payments')
            .insert({
              account_id: job.account_id,
              job_id: job.id,
              amount: job.total_amount || 0,
              payment_method: 'stripe',
              stripe_payment_intent_id: paymentIntent.id,
              status: 'completed',
              processed_at: new Date().toISOString(),
            })

          // Update job status
          await supabase
            .from('jobs')
            .update({ status: 'paid' })
            .eq('id', job.id)
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

