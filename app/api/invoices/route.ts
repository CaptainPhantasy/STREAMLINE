import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import Stripe from 'stripe'

// Initialize Stripe lazily to prevent build-time errors when env vars are missing
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  })
}

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

    // Get user's account_id and role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission - owner/admin can view invoices
    const { hasPermission } = await import('@/lib/auth/permissions')
    if (!hasPermission(user.role, 'view_financials')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, job:jobs(*), contact:contacts(*)')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json({ invoices: invoices || [] })
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
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission - only owner/admin can create invoices
    const { hasPermission } = await import('@/lib/auth/permissions')
    if (!hasPermission(user.role, 'create_invoices')) {
      return NextResponse.json({ error: 'Forbidden: Only owners and administrators can create invoices' }, { status: 403 })
    }

    const body = await request.json()
    const { jobId, contactId, amount, description, dueDate } = body

    if (!amount || !description) {
      return NextResponse.json({ error: 'Amount and description are required' }, { status: 400 })
    }

    // Get contact email for Stripe payment link
    let contactEmail = null
    if (contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('email')
        .eq('id', contactId)
        .single()
      contactEmail = contact?.email || null
    }

    // Create Stripe payment link
    let paymentLinkUrl = null
    const stripe = getStripe()
    
    if (stripe) {
      try {
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: description.substring(0, 100), // Stripe limit
                },
                unit_amount: amount, // Amount in cents
              },
              quantity: 1,
            },
          ],
          ...(contactEmail && { customer_email: contactEmail }),
        })

        paymentLinkUrl = paymentLink.url
      } catch (stripeError) {
        console.error('Error creating Stripe payment link:', stripeError)
        // Continue without payment link - invoice can still be created
      }
    }

    // Generate invoice number using database function
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc('generate_invoice_number', { account_id_param: user.account_id, prefix: 'INV' })

    if (invoiceNumberError) {
      console.error('Error generating invoice number:', invoiceNumberError)
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 })
    }

    const invoiceNumber = invoiceNumberData || `INV-${Date.now()}`

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        account_id: user.account_id,
        job_id: jobId || null,
        contact_id: contactId || null,
        invoice_number: invoiceNumber,
        amount,
        tax_amount: 0,
        total_amount: amount,
        description,
        due_date: dueDate || null,
        stripe_payment_link: paymentLinkUrl,
        status: 'draft',
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Update job status to 'invoiced' if job exists
    if (jobId) {
      await supabase
        .from('jobs')
        .update({ 
          status: 'invoiced',
          total_amount: amount,
          stripe_payment_link: paymentLinkUrl,
        })
        .eq('id', jobId)
    }

    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

