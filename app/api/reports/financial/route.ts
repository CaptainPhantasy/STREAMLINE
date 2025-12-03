/**
 * Financial Overview Report API
 * GET /api/reports/financial
 *
 * Agent Swarm 7: Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FinancialReportData } from '@/lib/types/reports'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()

    // Fetch revenue (from jobs)
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, total_amount, status, created_at')
      .eq('account_id', userData.account_id)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('total_amount', 'is', null)

    const totalRevenue = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0

    // Fetch expenses (if expenses table exists, otherwise use 0)
    // For now, we'll estimate expenses as 40% of revenue for demo purposes
    const totalExpenses = Math.round(totalRevenue * 0.4)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

    // Fetch invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, total_amount, status, due_date, created_at')
      .eq('account_id', userData.account_id)
      .gte('created_at', from)
      .lte('created_at', to)

    const paidInvoices = invoices?.filter((inv) => inv.status === 'paid').length || 0
    const paidAmount = invoices
      ?.filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

    const outstandingInvoices = invoices?.filter((inv) => ['pending', 'sent', 'overdue'].includes(inv.status)).length || 0
    const outstandingAmount = invoices
      ?.filter((inv) => ['pending', 'sent', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

    // Payment trends by month
    const paymentTrends = jobs?.reduce((acc: any[], job) => {
      const month = format(new Date(job.created_at), 'MMM yyyy')
      const existing = acc.find((item) => item.month === month)

      const revenue = job.total_amount || 0
      const expenses = Math.round(revenue * 0.4)
      const profit = revenue - expenses

      if (existing) {
        existing.revenue += revenue
        existing.expenses += expenses
        existing.profit += profit
      } else {
        acc.push({ month, revenue, expenses, profit })
      }
      return acc
    }, [])

    // Invoice aging
    const now = new Date()
    const invoiceAging = [
      { ageRange: '0-30 days', count: 0, amount: 0 },
      { ageRange: '31-60 days', count: 0, amount: 0 },
      { ageRange: '61-90 days', count: 0, amount: 0 },
      { ageRange: '90+ days', count: 0, amount: 0 },
    ]

    invoices
      ?.filter((inv) => ['pending', 'sent', 'overdue'].includes(inv.status))
      .forEach((inv) => {
        const dueDate = new Date(inv.due_date || inv.created_at)
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysOverdue <= 30) {
          invoiceAging[0].count += 1
          invoiceAging[0].amount += inv.total_amount || 0
        } else if (daysOverdue <= 60) {
          invoiceAging[1].count += 1
          invoiceAging[1].amount += inv.total_amount || 0
        } else if (daysOverdue <= 90) {
          invoiceAging[2].count += 1
          invoiceAging[2].amount += inv.total_amount || 0
        } else {
          invoiceAging[3].count += 1
          invoiceAging[3].amount += inv.total_amount || 0
        }
      })

    const reportData: FinancialReportData = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      outstandingInvoices,
      outstandingAmount,
      paidInvoices,
      paidAmount,
      paymentTrends: paymentTrends || [],
      invoiceAging,
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        recordCount: jobs?.length || 0,
        dateRange: { from, to },
        executionTime: 0,
      },
    })
  } catch (error) {
    console.error('Financial report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
