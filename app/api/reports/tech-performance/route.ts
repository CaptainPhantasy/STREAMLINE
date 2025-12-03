/**
 * Tech Performance Report API
 * GET /api/reports/tech-performance
 *
 * Agent Swarm 7: Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TechPerformanceReportData } from '@/lib/types/reports'
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
    const techId = searchParams.get('techId')

    // Fetch all techs
    const { data: techs } = await supabase
      .from('users')
      .select('id, name')
      .eq('account_id', userData.account_id)
      .eq('role', 'tech')

    if (!techs || techs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalJobs: 0,
          completedJobs: 0,
          averageRating: 0,
          averageCompletionTime: 0,
          revenueGenerated: 0,
          efficiencyScore: 0,
          techComparison: [],
          performanceOverTime: [],
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: user.id,
          recordCount: 0,
          dateRange: { from, to },
          executionTime: 0,
        },
      })
    }

    // Build query
    let jobsQuery = supabase
      .from('jobs')
      .select('id, tech_assigned_id, status, total_amount, created_at, completed_at, tech:users!tech_assigned_id(id, name)')
      .eq('account_id', userData.account_id)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('tech_assigned_id', 'is', null)

    if (techId) {
      jobsQuery = jobsQuery.eq('tech_assigned_id', techId)
    }

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Jobs query error:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    const totalJobs = jobs?.length || 0
    const completedJobs = jobs?.filter((j) => j.status === 'completed').length || 0

    // Average completion time
    const completedWithTimes = jobs?.filter((j) => j.status === 'completed' && j.completed_at)
    const totalCompletionTime = completedWithTimes?.reduce((sum, job) => {
      const start = new Date(job.created_at).getTime()
      const end = new Date(job.completed_at!).getTime()
      return sum + (end - start)
    }, 0) || 0
    const averageCompletionTime = completedWithTimes?.length
      ? Math.round(totalCompletionTime / completedWithTimes.length / (1000 * 60 * 60))
      : 0

    // Revenue generated
    const revenueGenerated = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0

    // Tech comparison
    const techComparison = techs.map((tech) => {
      const techJobs = jobs?.filter((j) => j.tech_assigned_id === tech.id) || []
      const techCompleted = techJobs.filter((j) => j.status === 'completed').length
      const techRevenue = techJobs.reduce((sum, j) => sum + (j.total_amount || 0), 0)

      return {
        techId: tech.id,
        techName: tech.name,
        jobsCompleted: techCompleted,
        averageRating: 0, // Would need ratings table
        revenue: techRevenue,
      }
    })

    // Performance over time
    const performanceOverTime = jobs?.reduce((acc: any[], job) => {
      const date = format(new Date(job.created_at), 'yyyy-MM-dd')
      const existing = acc.find((item) => item.date === date)

      if (existing && job.status === 'completed') {
        existing.jobsCompleted += 1
      } else if (job.status === 'completed') {
        acc.push({
          date,
          jobsCompleted: 1,
          averageRating: 0,
        })
      }
      return acc
    }, [])

    // Calculate efficiency score (jobs per day)
    const daysInPeriod = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
    const efficiencyScore = daysInPeriod > 0 ? Math.round((completedJobs / daysInPeriod) * 10) / 10 : 0

    const reportData: TechPerformanceReportData = {
      techId: techId || undefined,
      techName: techId ? techs.find((t) => t.id === techId)?.name : undefined,
      totalJobs,
      completedJobs,
      averageRating: 0,
      averageCompletionTime,
      revenueGenerated,
      efficiencyScore,
      techComparison,
      performanceOverTime: performanceOverTime || [],
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
    console.error('Tech performance report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
