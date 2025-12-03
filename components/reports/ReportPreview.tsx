/**
 * ReportPreview Component
 * Live preview of report data with interactive charts
 *
 * Agent Swarm 7: Reports & Analytics
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ReportPreviewProps, ChartType, ReportData } from '@/lib/types/reports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

const CHART_ICONS = {
  line: LineChartIcon,
  bar: BarChart3,
  pie: PieChartIcon,
  area: LineChartIcon,
  table: TableIcon,
}

/**
 * ReportPreview - Display report data with interactive charts
 *
 * @example
 * ```tsx
 * <ReportPreview
 *   report={report}
 *   data={reportData}
 *   chartType="line"
 *   onChartTypeChange={setChartType}
 * />
 * ```
 */
export function ReportPreview({
  report,
  data,
  chartType,
  onChartTypeChange,
  showDataTable = false,
  onToggleDataTable,
  loading = false,
  error = null,
  className,
}: ReportPreviewProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'data'>('chart')

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-4">Generating report...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('w-full border-destructive', className)}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-sm font-medium text-destructive">Error Loading Report</p>
            <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    // Prepare data based on report type
    let chartData: any[] = []
    let xKey = ''
    let yKey = ''

    switch (report.type) {
      case 'revenue':
        chartData = (data as any).revenueByPeriod || []
        xKey = 'date'
        yKey = 'revenue'
        break
      case 'job-performance':
        chartData = (data as any).jobsByStatus || []
        xKey = 'status'
        yKey = 'count'
        break
      case 'customer':
        chartData = (data as any).topCustomers || []
        xKey = 'customerName'
        yKey = 'totalRevenue'
        break
      case 'tech-performance':
        chartData = (data as any).techComparison || []
        xKey = 'techName'
        yKey = 'jobsCompleted'
        break
      case 'financial':
        chartData = (data as any).paymentTrends || []
        xKey = 'month'
        yKey = 'revenue'
        break
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey={yKey} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => entry.name}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={CHART_COLORS[0]}
                fill={CHART_COLORS[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center py-8 text-muted-foreground">Unsupported chart type</div>
    }
  }

  const renderDataTable = () => {
    let tableData: any[] = []
    let columns: string[] = []

    switch (report.type) {
      case 'revenue':
        tableData = (data as any).revenueByPeriod || []
        columns = ['Date', 'Revenue', 'Job Count']
        break
      case 'job-performance':
        tableData = (data as any).jobsByStatus || []
        columns = ['Status', 'Count', 'Percentage']
        break
      case 'customer':
        tableData = (data as any).topCustomers || []
        columns = ['Customer', 'Revenue', 'Jobs', 'Lifetime Value']
        break
      case 'tech-performance':
        tableData = (data as any).techComparison || []
        columns = ['Tech', 'Jobs Completed', 'Avg Rating', 'Revenue']
        break
      case 'financial':
        tableData = (data as any).paymentTrends || []
        columns = ['Month', 'Revenue', 'Expenses', 'Profit']
        break
    }

    return (
      <div className="rounded-md border overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, idx) => (
              <TableRow key={idx}>
                {Object.values(row).map((value: any, colIdx) => (
                  <TableCell key={colIdx}>
                    {typeof value === 'number' && value > 1000
                      ? `$${(value / 100).toLocaleString()}`
                      : String(value)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const supportedChartTypes: ChartType[] = ['line', 'bar', 'pie', 'area', 'table']

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{report.title}</CardTitle>
            {report.description && (
              <CardDescription className="mt-1">{report.description}</CardDescription>
            )}
          </div>
          <Badge variant="outline">{report.type}</Badge>
        </div>

        {/* Chart Type Selector */}
        {onChartTypeChange && (
          <div className="flex gap-2 mt-4">
            {supportedChartTypes.map((type) => {
              const IconComponent = CHART_ICONS[type]
              return (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChartTypeChange(type)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              )
            })}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chart' | 'data')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="data">Data Table</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-6">
            {chartType === 'table' ? renderDataTable() : renderChart()}
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            {renderDataTable()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export type { ReportPreviewProps }
