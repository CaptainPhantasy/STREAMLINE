'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Clock,
  Users,
  Activity,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TechLocation, JobLocation } from '@/types/dispatch'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DispatchStatsProps {
  techs: TechLocation[]
  jobs: JobLocation[]
  timeRange: 'today' | 'week' | 'month'
  onTimeRangeChange: (range: 'today' | 'week' | 'month') => void
}

interface StatsData {
  kpis: {
    avgJobsPerTech: number
    avgJobsPerTechTrend: 'up' | 'down' | 'stable'
    avgResponseTimeMinutes: number
    utilizationRate: number
    coverageRadiusMiles: number
  }
  charts: {
    jobsByStatus: Record<string, number>
    techActivityTimeline: Array<{ hour: string; active: number }>
    distanceTraveled: Array<{ techName: string; miles: number }>
    completionRates: Array<{
      techName: string
      rate: number
      completed: number
      assigned: number
    }>
  }
}

const STATUS_COLORS = {
  unassigned: '#EF4444',
  scheduled: '#F59E0B',
  en_route: '#F97316',
  in_progress: '#3B82F6',
  completed: '#10B981',
}

export default function DispatchStats({
  techs,
  jobs,
  timeRange,
  onTimeRangeChange,
}: DispatchStatsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch statistics data
  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dispatch/stats?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      const data = await response.json()
      setStatsData(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [timeRange])

  // Export to PDF
  const exportToPDF = () => {
    if (!statsData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(18)
    doc.text('Dispatch Statistics Report', pageWidth / 2, 20, { align: 'center' })

    // Time range and date
    doc.setFontSize(10)
    doc.text(`Time Range: ${timeRange.toUpperCase()}`, pageWidth / 2, 30, {
      align: 'center',
    })
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      36,
      { align: 'center' }
    )

    // KPIs Section
    doc.setFontSize(14)
    doc.text('Key Performance Indicators', 14, 50)

    const kpiData = [
      ['Metric', 'Value'],
      ['Average Jobs per Tech', statsData.kpis.avgJobsPerTech.toFixed(1)],
      ['Trend', statsData.kpis.avgJobsPerTechTrend],
      ['Average Response Time', `${statsData.kpis.avgResponseTimeMinutes} min`],
      ['Team Utilization Rate', `${statsData.kpis.utilizationRate}%`],
      ['Coverage Radius', `${statsData.kpis.coverageRadiusMiles.toFixed(1)} miles`],
    ]

    autoTable(doc, {
      startY: 55,
      head: [kpiData[0]],
      body: kpiData.slice(1),
      theme: 'grid',
    })

    // Jobs by Status
    const finalY1 = (doc as any).lastAutoTable.finalY || 100
    doc.setFontSize(14)
    doc.text('Jobs by Status', 14, finalY1 + 10)

    const jobsStatusData = Object.entries(statsData.charts.jobsByStatus).map(
      ([status, count]) => [status, count.toString()]
    )

    autoTable(doc, {
      startY: finalY1 + 15,
      head: [['Status', 'Count']],
      body: jobsStatusData,
      theme: 'striped',
    })

    // Distance Traveled
    const finalY2 = (doc as any).lastAutoTable.finalY || 150
    doc.setFontSize(14)
    doc.text('Distance Traveled (Top 10)', 14, finalY2 + 10)

    const distanceData = statsData.charts.distanceTraveled.map((item) => [
      item.techName,
      `${item.miles.toFixed(1)} miles`,
    ])

    autoTable(doc, {
      startY: finalY2 + 15,
      head: [['Tech Name', 'Miles Traveled']],
      body: distanceData,
      theme: 'grid',
    })

    // Completion Rates (on new page if needed)
    const finalY3 = (doc as any).lastAutoTable.finalY || 200
    if (finalY3 > 250) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Completion Rates', 14, 20)
      autoTable(doc, {
        startY: 25,
        head: [['Tech Name', 'Rate', 'Completed', 'Assigned']],
        body: statsData.charts.completionRates.map((item) => [
          item.techName,
          `${item.rate}%`,
          item.completed.toString(),
          item.assigned.toString(),
        ]),
        theme: 'striped',
      })
    } else {
      doc.setFontSize(14)
      doc.text('Completion Rates', 14, finalY3 + 10)
      autoTable(doc, {
        startY: finalY3 + 15,
        head: [['Tech Name', 'Rate', 'Completed', 'Assigned']],
        body: statsData.charts.completionRates.map((item) => [
          item.techName,
          `${item.rate}%`,
          item.completed.toString(),
          item.assigned.toString(),
        ]),
        theme: 'striped',
      })
    }

    doc.save(`dispatch-stats-${timeRange}-${Date.now()}.pdf`)
  }

  // Export to CSV
  const exportToCSV = () => {
    if (!statsData) return

    let csv = 'Dispatch Statistics Report\n'
    csv += `Time Range: ${timeRange}\n`
    csv += `Generated: ${new Date().toLocaleString()}\n\n`

    // KPIs
    csv += 'Key Performance Indicators\n'
    csv += 'Metric,Value\n'
    csv += `Average Jobs per Tech,${statsData.kpis.avgJobsPerTech.toFixed(1)}\n`
    csv += `Trend,${statsData.kpis.avgJobsPerTechTrend}\n`
    csv += `Average Response Time,${statsData.kpis.avgResponseTimeMinutes} min\n`
    csv += `Team Utilization Rate,${statsData.kpis.utilizationRate}%\n`
    csv += `Coverage Radius,${statsData.kpis.coverageRadiusMiles.toFixed(1)} miles\n\n`

    // Jobs by Status
    csv += 'Jobs by Status\n'
    csv += 'Status,Count\n'
    Object.entries(statsData.charts.jobsByStatus).forEach(([status, count]) => {
      csv += `${status},${count}\n`
    })
    csv += '\n'

    // Distance Traveled
    csv += 'Distance Traveled\n'
    csv += 'Tech Name,Miles\n'
    statsData.charts.distanceTraveled.forEach((item) => {
      csv += `${item.techName},${item.miles.toFixed(1)}\n`
    })
    csv += '\n'

    // Completion Rates
    csv += 'Completion Rates\n'
    csv += 'Tech Name,Rate,Completed,Assigned\n'
    statsData.charts.completionRates.forEach((item) => {
      csv += `${item.techName},${item.rate}%,${item.completed},${item.assigned}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dispatch-stats-${timeRange}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up')
      return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down')
      return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  // Get response time color
  const getResponseTimeColor = (minutes: number) => {
    if (minutes < 15) return 'text-green-500'
    if (minutes < 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  // Loading skeleton
  if (loading && !statsData) {
    return (
      <div className="mb-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </CardHeader>
          {isExpanded && (
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="mb-4">
        <Card className="border-red-500 dark:border-red-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Failed to load statistics</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={fetchStats} variant="outline" size="sm" className="ml-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!statsData) return null

  // Prepare chart data
  const jobsStatusChartData = Object.entries(statsData.charts.jobsByStatus).map(
    ([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
    })
  )

  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <CardTitle>Statistics Dashboard</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Time Range Selector */}
              <div className="flex gap-1">
                {(['today', 'week', 'month'] as const).map((range) => (
                  <Button
                    key={range}
                    onClick={() => onTimeRangeChange(range)}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                  >
                    {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
                  </Button>
                ))}
              </div>

              {/* Export Buttons */}
              <Button
                onClick={exportToPDF}
                variant="outline"
                size="sm"
                title="Export to PDF"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                title="Export to CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>

              {/* Refresh Button */}
              <Button onClick={fetchStats} variant="ghost" size="sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Collapse Button */}
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Team Efficiency */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Team Efficiency
                        </p>
                        <p className="text-3xl font-bold mt-2">
                          {statsData.kpis.avgJobsPerTech.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          avg jobs/tech/day
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Users className="w-8 h-8 text-blue-500" />
                        {getTrendIcon(statsData.kpis.avgJobsPerTechTrend)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Response Time
                        </p>
                        <p
                          className={`text-3xl font-bold mt-2 ${getResponseTimeColor(
                            statsData.kpis.avgResponseTimeMinutes
                          )}`}
                        >
                          {statsData.kpis.avgResponseTimeMinutes}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          minutes (target: &lt;15)
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Utilization Rate */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Utilization Rate
                        </p>
                        <p className="text-3xl font-bold mt-2">
                          {statsData.kpis.utilizationRate}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          techs on job (goal: 70-80%)
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Coverage Area */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Coverage Area
                        </p>
                        <p className="text-3xl font-bold mt-2">
                          {statsData.kpis.coverageRadiusMiles.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          miles radius
                        </p>
                      </div>
                      <MapPin className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Jobs by Status - Donut Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Jobs by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={jobsStatusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {jobsStatusChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                STATUS_COLORS[
                                  entry.name.toLowerCase().replace(' ', '_') as keyof typeof STATUS_COLORS
                                ] || '#666'
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tech Activity Timeline - Line Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tech Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={statsData.charts.techActivityTimeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="active"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          name="Active Techs"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distance Traveled - Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Distance Traveled (Top 10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statsData.charts.distanceTraveled}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="techName"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis label={{ value: 'Miles', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="miles" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Completion Rate - Progress Bars */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Completion Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                      {statsData.charts.completionRates.map((tech, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate max-w-[200px]">
                              {tech.techName}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {tech.rate}% ({tech.completed}/{tech.assigned})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${tech.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
