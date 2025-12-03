import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const period = searchParams.get('period') || 'month' // day, week, month, quarter, year

    // Initialize Supabase client
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${auth.session.access_token}`,
          },
        },
      }
    )

    // Get user's account and role for access control
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', auth.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Set date range based on period if not explicitly provided
    let startDate = dateFrom ? new Date(dateFrom) : new Date()
    let endDate = dateTo ? new Date(dateTo) : new Date()

    if (!dateFrom || !dateTo) {
      const now = new Date()
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = now
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDate = now
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = now
          break
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
          endDate = now
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = now
          break
      }
    }

    // Convert to ISO strings for database queries
    const startDateISO = startDate.toISOString()
    const endDateISO = endDate.toISOString()

    // Fetch sales analytics data in parallel
    const [
      meetingsResult,
      estimatesResult,
      jobsResult,
      contactsResult,
      leadsResult
    ] = await Promise.all([
      // Meetings analytics
      supabase
        .from('meetings')
        .select(`
          id,
          contact_id,
          meeting_type,
          status,
          sentiment,
          scheduled_at,
          created_at,
          user_id
        `)
        .eq('account_id', user.account_id)
        .gte('scheduled_at', startDateISO)
        .lte('scheduled_at', endDateISO),

      // Estimates analytics
      supabase
        .from('estimates')
        .select(`
          id,
          contact_id,
          status,
          total_amount,
          created_at,
          created_by
        `)
        .eq('account_id', user.account_id)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Jobs analytics for revenue tracking
      supabase
        .from('jobs')
        .select(`
          id,
          contact_id,
          status,
          total_amount,
          created_at,
          completed_at
        `)
        .eq('account_id', user.account_id)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // New contacts analytics
      supabase
        .from('contacts')
        .select(`
          id,
          type,
          lead_stage,
          lead_status,
          created_at
        `)
        .eq('account_id', user.account_id)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Leads pipeline analytics
      supabase
        .from('contacts')
        .select(`
          id,
          lead_stage,
          lead_status,
          lead_score,
          assigned_to,
          created_at,
          updated_at
        `)
        .eq('account_id', user.account_id)
        .eq('type', 'lead')
    ])

    const meetings = meetingsResult.data || []
    const estimates = estimatesResult.data || []
    const jobs = jobsResult.data || []
    const contacts = contactsResult.data || []
    const leads = leadsResult.data || []

    // Calculate meeting analytics
    const totalMeetings = meetings.length
    const completedMeetings = meetings.filter(m => m.status === 'completed').length
    const positiveMeetings = meetings.filter(m => m.sentiment === 'positive').length
    const meetingsByType = meetings.reduce((acc, meeting) => {
      acc[meeting.meeting_type] = (acc[meeting.meeting_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate estimates analytics
    const totalEstimates = estimates.length
    const approvedEstimates = estimates.filter(e => e.status === 'approved').length
    const pendingEstimates = estimates.filter(e => e.status === 'sent').length
    const rejectedEstimates = estimates.filter(e => e.status === 'rejected').length
    const estimatesValue = estimates.reduce((sum, e) => sum + (e.total_amount || 0), 0)
    const approvedValue = estimates
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0)

    // Calculate conversion rates
    const estimateApprovalRate = totalEstimates > 0 ? (approvedEstimates / totalEstimates) * 100 : 0
    const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0

    // Calculate jobs/revenue analytics
    const totalJobs = jobs.length
    const completedJobs = jobs.filter(j => j.status === 'completed').length
    const totalRevenue = jobs.reduce((sum, j) => sum + (j.total_amount || 0), 0)
    const completedRevenue = jobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (j.total_amount || 0), 0)

    // Calculate contact analytics
    const newContacts = contacts.filter(c => c.type === 'customer').length
    const newLeads = contacts.filter(c => c.type === 'lead').length

    // Calculate pipeline analytics
    const leadsByStage = leads.reduce((acc, lead) => {
      const stage = lead.lead_stage || 'new'
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalLeads = leads.length
    const qualifiedLeads = leads.filter(l => l.lead_stage === 'qualified' || l.lead_stage === 'proposal').length
    const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0

    // Calculate performance metrics
    const avgJobValue = completedJobs > 0 ? completedRevenue / completedJobs : 0
    const avgEstimateValue = totalEstimates > 0 ? estimatesValue / totalEstimates : 0
    const revenuePerMeeting = completedMeetings > 0 ? completedRevenue / completedMeetings : 0

    // Time-based analytics - group by day/week/month based on period
    const timeSeriesData = generateTimeSeriesData(
      meetings,
      estimates,
      jobs,
      startDate,
      endDate,
      period
    )

    // Top performers (if user has admin/owner role)
    let topPerformers: any[] = []
    if (user.role === 'admin' || user.role === 'owner') {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('account_id', user.account_id)
        .eq('role', 'sales')

      if (allUsers) {
        topPerformers = await Promise.all(
          allUsers.map(async (salesUser) => {
            const [userMeetings, userEstimates, userJobs] = await Promise.all([
              supabase
                .from('meetings')
                .select('id, status')
                .eq('user_id', salesUser.id)
                .gte('scheduled_at', startDateISO)
                .lte('scheduled_at', endDateISO),
              supabase
                .from('estimates')
                .select('id, status, total_amount')
                .eq('created_by', salesUser.id)
                .gte('created_at', startDateISO)
                .lte('created_at', endDateISO),
              supabase
                .from('jobs')
                .select('id, status, total_amount')
                .eq('created_by', salesUser.id)
                .gte('created_at', startDateISO)
                .lte('created_at', endDateISO)
            ])

            const userTotalRevenue = (userJobs.data || [])
              .filter(j => j.status === 'completed')
              .reduce((sum, j) => sum + (j.total_amount || 0), 0)

            const userApprovedEstimates = (userEstimates.data || [])
              .filter(e => e.status === 'approved').length

            return {
              userId: salesUser.id,
              userName: salesUser.full_name,
              totalMeetings: userMeetings.data?.length || 0,
              approvedEstimates: userApprovedEstimates,
              totalRevenue: userTotalRevenue
            }
          })
        )

        // Sort by revenue
        topPerformers.sort((a, b) => b.totalRevenue - a.totalRevenue)
        topPerformers = topPerformers.slice(0, 5) // Top 5 performers
      }
    }

    // Build comprehensive analytics response
    const analytics = {
      period: {
        start: startDateISO,
        end: endDateISO,
        type: period
      },
      overview: {
        totalMeetings,
        completedMeetings,
        positiveMeetings,
        totalEstimates,
        approvedEstimates,
        totalJobs,
        completedJobs,
        newContacts,
        newLeads,
        totalRevenue,
        completedRevenue
      },
      performance: {
        meetingCompletionRate: Math.round(meetingCompletionRate),
        estimateApprovalRate: Math.round(estimateApprovalRate),
        leadConversionRate: Math.round(conversionRate),
        avgJobValue: Math.round(avgJobValue),
        avgEstimateValue: Math.round(avgEstimateValue),
        revenuePerMeeting: Math.round(revenuePerMeeting)
      },
      pipeline: {
        totalLeads,
        qualifiedLeads,
        leadsByStage,
        pendingEstimates,
        rejectedEstimates
      },
      meetings: {
        byType: meetingsByType,
        completionRate: Math.round(meetingCompletionRate),
        positiveRate: totalMeetings > 0 ? Math.round((positiveMeetings / totalMeetings) * 100) : 0
      },
      revenue: {
        totalEstimatesValue: estimatesValue,
        approvedValue,
        pendingValue: estimates
          .filter(e => e.status === 'sent')
          .reduce((sum, e) => sum + (e.total_amount || 0), 0),
        completedRevenue,
        pipelineValue: estimates
          .filter(e => e.status === 'sent' || e.status === 'draft')
          .reduce((sum, e) => sum + (e.total_amount || 0), 0)
      },
      timeSeries: timeSeriesData,
      topPerformers
    }

    return NextResponse.json(analytics)

  } catch (error: unknown) {
    console.error('Error in GET /api/sales/analytics:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate time series data
function generateTimeSeriesData(
  meetings: any[],
  estimates: any[],
  jobs: any[],
  startDate: Date,
  endDate: Date,
  period: string
) {
  const timeSeriesData: any[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    let dateKey: string
    let nextDate: Date

    switch (period) {
      case 'day':
        dateKey = currentDate.toISOString().split('T')[0]
        nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'week':
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        dateKey = weekStart.toISOString().split('T')[0]
        nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        break
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3)
        dateKey = `${currentDate.getFullYear()}-Q${quarter + 1}`
        nextDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 1)
        break
      case 'year':
        dateKey = `${currentDate.getFullYear().toString()}`
        nextDate = new Date(currentDate.getFullYear() + 1, 0, 1)
        break
      default:
        dateKey = currentDate.toISOString().split('T')[0]
        nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
    }

    const periodStart = new Date(dateKey)
    const periodEnd = new Date(nextDate.getTime() - 1)

    // Count items within this period
    const periodMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at)
      return meetingDate >= periodStart && meetingDate <= periodEnd
    })

    const periodEstimates = estimates.filter(e => {
      const estimateDate = new Date(e.created_at)
      return estimateDate >= periodStart && estimateDate <= periodEnd
    })

    const periodJobs = jobs.filter(j => {
      const jobDate = new Date(j.created_at)
      return jobDate >= periodStart && jobDate <= periodEnd
    })

    timeSeriesData.push({
      date: dateKey,
      meetings: periodMeetings.length,
      estimates: periodEstimates.length,
      jobs: periodJobs.length,
      revenue: periodJobs
        .filter(j => j.status === 'completed')
        .reduce((sum, j) => sum + (j.total_amount || 0), 0),
      estimateValue: periodEstimates.reduce((sum, e) => sum + (e.total_amount || 0), 0),
      approvedEstimates: periodEstimates.filter(e => e.status === 'approved').length
    })

    currentDate.setTime(nextDate.getTime())
  }

  return timeSeriesData
}