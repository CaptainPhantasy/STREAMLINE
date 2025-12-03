/**
 * Revenue Report API
 * GET /api/reports/revenue
 *
 * Agent Swarm 7: Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RevenueReportData } from '@/lib/types/reports'
import { format, parse } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's account
    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only Owner/Admin can access reports
    if (!['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()
    const serviceType = searchParams.get('serviceType')

    // Build base query - note: service_type column may not exist in all deployments
    let jobsQuery = supabase
      .from('jobs')
      .select('id, total_amount, type, created_at, status, contact:contacts(id, first_name, last_name)')
      .eq('account_id', userData.account_id)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('total_amount', 'is', null)

    if (serviceType) {
      jobsQuery = jobsQuery.eq('type', serviceType)
    }

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Jobs query error:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Calculate revenue metrics
    const totalRevenue = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0

    // Revenue by period (daily aggregation)
    const revenueByPeriod = jobs?.reduce((acc: any[], job) => {
      const date = format(new Date(job.created_at), 'yyyy-MM-dd')
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing.revenue += job.total_amount || 0
        existing.jobCount += 1
      } else {
        acc.push({
          date,
          revenue: job.total_amount || 0,
          jobCount: 1,
        })
      }

      return acc
    }, [])

    // Revenue by service type (using 'type' field)
    const revenueByServiceType = jobs?.reduce((acc: any[], job) => {
      const serviceType = job.type || 'Unknown'
      const existing = acc.find((item) => item.serviceType === serviceType)

      if (existing) {
        existing.revenue += job.total_amount || 0
      } else {
        acc.push({
          serviceType,
          revenue: job.total_amount || 0,
          percentage: 0,
        })
      }

      return acc
    }, [])

    // Calculate percentages
    revenueByServiceType?.forEach((item) => {
      item.percentage = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0
    })

    // Revenue by customer
    const revenueByCustomer = jobs?.reduce((acc: any[], job) => {
      if (!job.contact) return acc

      const customerId = job.contact.id
      const customerName = `${job.contact.first_name} ${job.contact.last_name}`
      const existing = acc.find((item) => item.customerId === customerId)

      if (existing) {
        existing.revenue += job.total_amount || 0
        existing.jobCount += 1
      } else {
        acc.push({
          customerId,
          customerName,
          revenue: job.total_amount || 0,
          jobCount: 1,
        })
      }

      return acc
    }, [])

    // Sort top customers by revenue
    revenueByCustomer?.sort((a, b) => b.revenue - a.revenue)
    const topCustomers = revenueByCustomer?.slice(0, 10) || []

    // Monthly trend (group by month)
    const monthlyTrend = jobs?.reduce((acc: any[], job) => {
      const month = format(new Date(job.created_at), 'MMM yyyy')
      const existing = acc.find((item) => item.month === month)

      if (existing) {
        existing.revenue += job.total_amount || 0
      } else {
        acc.push({
          month,
          revenue: job.total_amount || 0,
          growth: 0,
        })
      }

      return acc
    }, [])

    // Calculate growth percentages
    monthlyTrend?.forEach((item, index) => {
      if (index > 0) {
        const prevRevenue = monthlyTrend[index - 1].revenue
        item.growth = prevRevenue > 0 ? Math.round(((item.revenue - prevRevenue) / prevRevenue) * 100) : 0
      }
    })

    const reportData: RevenueReportData = {
      totalRevenue,
      revenueByPeriod: revenueByPeriod || [],
      revenueByServiceType: revenueByServiceType || [],
      revenueByCustomer: topCustomers,
      monthlyTrend: monthlyTrend || [],
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
    console.error('Revenue report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
