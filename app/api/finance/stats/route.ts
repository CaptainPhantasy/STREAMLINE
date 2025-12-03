import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const auth = await getAuthenticatedSession()
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

    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()
    const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString()
    const monthStart = new Date(now.setMonth(now.getMonth() - 1)).toISOString()

    // Batch all queries in parallel for faster loading
    const [
      { data: payments },
      { data: outstandingInvoices },
      { data: allInvoices },
      { data: paidInvoicesData },
    ] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, created_at')
        .eq('account_id', user.account_id)
        .eq('status', 'completed'),
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('account_id', user.account_id)
        .in('status', ['sent', 'overdue']),
      supabase
        .from('invoices')
        .select('status')
        .eq('account_id', user.account_id),
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('account_id', user.account_id)
        .eq('status', 'paid'),
    ])

    // Calculate revenue efficiently
    const revenue = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
    }

    if (payments) {
      const todayDate = new Date(todayStart)
      const weekDate = new Date(weekStart)
      const monthDate = new Date(monthStart)
      
      payments.forEach((payment) => {
        const paymentDate = new Date(payment.created_at)
        const amount = payment.amount || 0
        revenue.total += amount

        if (paymentDate >= todayDate) {
          revenue.today += amount
        }
        if (paymentDate >= weekDate) {
          revenue.thisWeek += amount
        }
        if (paymentDate >= monthDate) {
          revenue.thisMonth += amount
        }
      })
    }

    const outstanding = {
      count: outstandingInvoices?.length || 0,
      amount: outstandingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    }

    const totalInvoices = allInvoices?.length || 0
    const paidInvoices = allInvoices?.filter(inv => inv.status === 'paid').length || 0
    const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0

    const totalPaidAmount = paidInvoicesData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const averageInvoice = paidInvoicesData && paidInvoicesData.length > 0
      ? totalPaidAmount / paidInvoicesData.length
      : 0

    return NextResponse.json({
      stats: {
        revenue,
        outstanding,
        paymentRate,
        averageInvoice,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

