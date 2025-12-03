'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, Briefcase, Calendar, Download, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useRouter } from 'next/navigation'

interface ReportData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  jobs: {
    total: number
    completed: number
    pending: number
    cancelled: number
  }
  customers: {
    total: number
    new: number
    returning: number
  }
  techs: {
    total: number
    active: number
    avgJobsPerTech: number
  }
}

export default function OwnerReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('export_reports')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!hasPermission('export_reports')) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Access Denied</div>
      </div>
    )
  }

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      const res = await fetch(`/api/reports?range=${dateRange}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const res = await fetch(`/api/reports/export?range=${dateRange}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `business-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-accent-primary" />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-theme-secondary">Failed to load report data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Business Reports</h1>
          <p className="text-xs text-theme-secondary">
            Comprehensive analytics and insights
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-theme-border rounded-md bg-theme-input text-theme-primary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button
            onClick={exportReport}
            className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-theme-primary mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l border-l-green-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  ${reportData.revenue.total.toLocaleString()}
                </div>
                <p className="text-xs mt-1 font-medium text-green-600">
                  +{reportData.revenue.growth}% growth
                </p>
              </CardContent>
            </Card>

            <Card className="border-l border-l-blue-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  ${reportData.revenue.thisMonth.toLocaleString()}
                </div>
                <p className="text-xs mt-1 font-medium text-theme-secondary">
                  Current period
                </p>
              </CardContent>
            </Card>

            <Card className="border-l border-l-purple-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Last Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  ${reportData.revenue.lastMonth.toLocaleString()}
                </div>
                <p className="text-xs mt-1 font-medium text-theme-secondary">
                  Previous period
                </p>
              </CardContent>
            </Card>

            <Card className="border-l border-l-orange-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  {reportData.revenue.growth}%
                </div>
                <p className="text-xs mt-1 font-medium text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending up
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-theme-primary mb-4">Job Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l border-l-theme-accent-primary border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  {reportData.jobs.total}
                </div>
                <p className="text-xs mt-1 font-medium text-theme-secondary">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card className="border-l border-l-green-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  {reportData.jobs.completed}
                </div>
                <p className="text-xs mt-1 font-medium text-green-600">
                  {Math.round((reportData.jobs.completed / reportData.jobs.total) * 100)}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-l border-l-yellow-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  {reportData.jobs.pending}
                </div>
                <p className="text-xs mt-1 font-medium text-theme-secondary">
                  In progress
                </p>
              </CardContent>
            </Card>

            <Card className="border-l border-l-red-500 border-theme-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-theme-secondary">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-theme-primary">
                  {reportData.jobs.cancelled}
                </div>
                <p className="text-xs mt-1 font-medium text-red-600">
                  {Math.round((reportData.jobs.cancelled / reportData.jobs.total) * 100)}% cancellation rate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-theme-primary mb-4">Customer Metrics</h2>
            <div className="space-y-4">
              <Card className="border-l border-l-theme-accent-primary border-theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-theme-secondary flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-theme-primary">
                    {reportData.customers.total}
                  </div>
                  <p className="text-xs mt-1 font-medium text-theme-secondary">
                    Active customer base
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l border-l-green-500 border-theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-theme-secondary">New Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-theme-primary">
                    {reportData.customers.new}
                  </div>
                  <p className="text-xs mt-1 font-medium text-green-600">
                    This period
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l border-l-blue-500 border-theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-theme-secondary">Returning Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-theme-primary">
                    {reportData.customers.returning}
                  </div>
                  <p className="text-xs mt-1 font-medium text-blue-600">
                    {Math.round((reportData.customers.returning / reportData.customers.total) * 100)}% retention rate
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-theme-primary mb-4">Technician Performance</h2>
            <div className="space-y-4">
              <Card className="border-l border-l-theme-accent-primary border-theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-theme-secondary flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Total Technicians
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-theme-primary">
                    {reportData.techs.total}
                  </div>
                  <p className="text-xs mt-1 font-medium text-theme-secondary">
                    Team size
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l border-l-green-500 border-theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-theme-secondary">Active Techs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-theme-primary">
                    {reportData.techs.active}
                  </div>
                  <p className="text-xs mt-1 font-medium text-green-600">
                    Currently working
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l border-l-purple-500 border-theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-theme-secondary">Avg Jobs Per Tech</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-theme-primary">
                    {reportData.techs.avgJobsPerTech.toFixed(1)}
                  </div>
                  <p className="text-xs mt-1 font-medium text-theme-secondary">
                    Workload distribution
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
