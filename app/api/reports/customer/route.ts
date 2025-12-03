/**
 * Customer Analytics Report API
 * GET /api/reports/customer
 *
 * Agent Swarm 7: Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CustomerReportData } from '@/lib/types/reports'
import { format, startOfMonth, subMonths } from 'date-fns'

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

    // Fetch all contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, created_at')
      .eq('account_id', userData.account_id)

    const totalCustomers = contacts?.length || 0
    const newCustomers = contacts?.filter((c) => {
      const createdAt = new Date(c.created_at)
      return createdAt >= new Date(from) && createdAt <= new Date(to)
    }).length || 0

    // Fetch jobs for customer analysis
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, contact_id, total_amount, created_at, status')
      .eq('account_id', userData.account_id)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('total_amount', 'is', null)

    // Calculate top customers
    const customerStats = contacts?.map((contact) => {
      const customerJobs = jobs?.filter((j) => j.contact_id === contact.id) || []
      const totalRevenue = customerJobs.reduce((sum, j) => sum + (j.total_amount || 0), 0)
      const lastJob = customerJobs.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        customerId: contact.id,
        customerName: `${contact.first_name} ${contact.last_name}`,
        totalRevenue,
        jobCount: customerJobs.length,
        lifetimeValue: totalRevenue,
        lastJobDate: lastJob?.created_at || contact.created_at,
      }
    })

    // Sort and get top 10
    const topCustomers = customerStats
      ?.sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10) || []

    const activeCustomers = customerStats?.filter((c) => c.jobCount > 0).length || 0

    // Customer acquisition trend
    const customerAcquisition = contacts?.reduce((acc: any[], contact) => {
      const month = format(new Date(contact.created_at), 'MMM yyyy')
      const existing = acc.find((item) => item.month === month)

      if (existing) {
        existing.newCustomers += 1
      } else {
        acc.push({
          month,
          newCustomers: 1,
          totalCustomers: 0,
        })
      }
      return acc
    }, [])

    // Calculate running total
    let runningTotal = 0
    customerAcquisition?.forEach((item) => {
      runningTotal += item.newCustomers
      item.totalCustomers = runningTotal
    })

    // Retention rate (customers with >1 job)
    const repeatCustomers = customerStats?.filter((c) => c.jobCount > 1).length || 0
    const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
    const churnRate = 100 - retentionRate

    const reportData: CustomerReportData = {
      totalCustomers,
      newCustomers,
      activeCustomers,
      topCustomers,
      customerAcquisition: customerAcquisition || [],
      retentionRate,
      churnRate,
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        recordCount: totalCustomers,
        dateRange: { from, to },
        executionTime: 0,
      },
    })
  } catch (error) {
    console.error('Customer report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
