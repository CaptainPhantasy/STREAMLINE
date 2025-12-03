import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
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

    // Get user's account_id to verify invoice belongs to their account
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, job:jobs(*), contact:contacts(*)')
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .single()

    if (error || !invoice) {
      console.error('Invoice fetch error:', error)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, taxAmount, totalAmount, status, dueDate, notes } = body

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

    // Get user's role and account_id for permission check
    const { data: user } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission - only owner/admin can edit invoices
    const { hasPermission } = await import('@/lib/auth/permissions')
    if (!hasPermission(user.role, 'edit_invoices')) {
      return NextResponse.json({ error: 'Forbidden: Only owners and administrators can edit invoices' }, { status: 403 })
    }

    // Verify invoice belongs to user's account
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, account_id')
      .eq('id', params.id)
      .single()

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (existingInvoice.account_id !== user.account_id) {
      return NextResponse.json({ error: 'Forbidden: Invoice does not belong to your account' }, { status: 403 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = amount
    if (taxAmount !== undefined) updateData.tax_amount = taxAmount
    if (totalAmount !== undefined) updateData.total_amount = totalAmount
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.due_date = dueDate
    if (notes !== undefined) updateData.notes = notes

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', params.id)
      .eq('account_id', user.account_id)
      .select('*, job:jobs(*), contact:contacts(*)')
      .single()

    if (updateError || !invoice) {
      console.error('Invoice update error:', updateError)
      return NextResponse.json({ error: 'Invoice not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase.from('invoices').delete().eq('id', params.id)

    if (error) {
      console.error('Error deleting invoice:', error)
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

