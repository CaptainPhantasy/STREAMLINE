import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: NextRequest,
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

    // Get user's account_id and role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission - only owner/admin can convert invoices
    const { hasPermission } = await import('@/lib/auth/permissions')
    if (!hasPermission(user.role, 'edit_invoices')) {
      return NextResponse.json({ error: 'Forbidden: Only owners and administrators can convert invoices' }, { status: 403 })
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, job:jobs(*)')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get job parts if job exists
    let parts: any[] = []
    if (invoice.job_id) {
      const { data: jobParts } = await supabase
        .from('job_parts')
        .select('*')
        .eq('job_id', invoice.job_id)
        .eq('account_id', user.account_id)

      if (jobParts) {
        parts = jobParts.map((jp) => ({
          name: jp.name,
          quantity: jp.quantity,
          unit: jp.unit || 'each',
          unit_price: jp.unit_price || 0,
          total_price: jp.total_price || 0,
        }))
      }
    }

    // If no job parts, create a parts list from invoice description
    // This is a simple extraction - in production, you might use AI to parse the description
    if (parts.length === 0 && invoice.description) {
      // Simple extraction: look for common patterns
      // This is a basic implementation - could be enhanced with AI parsing
      const description = invoice.description.toLowerCase()
      const commonParts = [
        { pattern: /pipe/i, name: 'Pipe', defaultQty: 1 },
        { pattern: /fitting/i, name: 'Fitting', defaultQty: 1 },
        { pattern: /valve/i, name: 'Valve', defaultQty: 1 },
        { pattern: /faucet/i, name: 'Faucet', defaultQty: 1 },
        { pattern: /toilet/i, name: 'Toilet', defaultQty: 1 },
      ]

      commonParts.forEach(({ pattern, name, defaultQty }) => {
        if (pattern.test(description)) {
          parts.push({
            name,
            quantity: defaultQty,
            unit: 'each',
            unit_price: Math.round(invoice.total_amount / (parts.length + 1)),
            total_price: Math.round(invoice.total_amount / (parts.length + 1)),
          })
        }
      })

      // If still no parts, create a generic entry
      if (parts.length === 0) {
        parts.push({
          name: 'Materials and Parts',
          quantity: 1,
          unit: 'each',
          unit_price: invoice.total_amount,
          total_price: invoice.total_amount,
        })
      }
    }

    // Return parts list (frontend will handle creating the actual parts list or sending)
    return NextResponse.json({
      success: true,
      parts,
      invoiceId: invoice.id,
      jobId: invoice.job_id,
      message: 'Parts list extracted from invoice',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

