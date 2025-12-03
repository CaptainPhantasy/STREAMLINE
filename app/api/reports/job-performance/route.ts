/**
 * Job Performance Report API
 * GET /api/reports/job-performance
 *
 * Agent Swarm 7: Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { JobPerformanceReportData } from '@/lib/types/reports'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authentication
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

    // Parse parameters
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()
    const status = searchParams.get('status')

    // Fetch jobs with tech info
    let jobsQuery = supabase
      .from('jobs')
      .select('id, status, created_at, completed_at, tech_assigned_id, tech:users!tech_assigned_id(id, name)')
      .eq('account_id', userData.account_id)
      .gte('created_at', from)
      .lte('created_at', to)

    if (status) {
      jobsQuery = jobsQuery.eq('status', status)
    }

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Jobs query error:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Calculate metrics
    const totalJobs = jobs?.length || 0
    const completedJobs = jobs?.filter((j) => j.status === 'completed').length || 0
    const pendingJobs = jobs?.filter((j) => ['scheduled', 'in_progress'].includes(j.status)).length || 0
    const cancelledJobs = jobs?.filter((j) => j.status === 'cancelled').length || 0

    // Calculate average completion time (in hours)
    const completedWithTimes = jobs?.filter((j) => j.status === 'completed' && j.completed_at)
    const totalCompletionTime = completedWithTimes?.reduce((sum, job) => {
      const start = new Date(job.created_at).getTime()
      const end = new Date(job.completed_at!).getTime()
      return sum + (end - start)
    }, 0) || 0
    const averageCompletionTime = completedWithTimes?.length
      ? Math.round(totalCompletionTime / completedWithTimes.length / (1000 * 60 * 60)) // Convert to hours
      : 0

    // Jobs by status
    const jobsByStatus = [
      { status: 'Scheduled', count: jobs?.filter((j) => j.status === 'scheduled').length || 0, percentage: 0 },
      { status: 'In Progress', count: jobs?.filter((j) => j.status === 'in_progress').length || 0, percentage: 0 },
      { status: 'Completed', count: completedJobs, percentage: 0 },
      { status: 'Cancelled', count: cancelledJobs, percentage: 0 },
    ]

    jobsByStatus.forEach((item) => {
      item.percentage = totalJobs > 0 ? Math.round((item.count / totalJobs) * 100) : 0
    })

    // Jobs by tech
    const jobsByTech = jobs?.reduce((acc: any[], job) => {
      if (!job.tech) return acc

      const existing = acc.find((item) => item.techId === job.tech_assigned_id)
      if (existing) {
        existing.jobCount += 1
      } else {
        acc.push({
          techId: job.tech_assigned_id,
          techName: job.tech.name,
          jobCount: 1,
          averageRating: 0, // Would need ratings table
        })
      }
      return acc
    }, [])

    // Jobs over time
    const jobsOverTime = jobs?.reduce((acc: any[], job) => {
      const date = format(new Date(job.created_at), 'yyyy-MM-dd')
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        if (job.status === 'scheduled') existing.scheduled += 1
        if (job.status === 'completed') existing.completed += 1
        if (job.status === 'cancelled') existing.cancelled += 1
      } else {
        acc.push({
          date,
          scheduled: job.status === 'scheduled' ? 1 : 0,
          completed: job.status === 'completed' ? 1 : 0,
          cancelled: job.status === 'cancelled' ? 1 : 0,
        })
      }
      return acc
    }, [])

    const reportData: JobPerformanceReportData = {
      totalJobs,
      completedJobs,
      pendingJobs,
      cancelledJobs,
      averageCompletionTime,
      jobsByStatus,
      jobsByTech: jobsByTech || [],
      jobsOverTime: jobsOverTime || [],
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        recordCount: totalJobs,
        dateRange: { from, to },
        executionTime: 0,
      },
    })
  } catch (error) {
    console.error('Job performance report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
