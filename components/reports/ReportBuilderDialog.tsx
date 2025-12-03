/**
 * ReportBuilderDialog Component
 * Advanced custom report builder with metrics and dimensions
 *
 * Agent Swarm 7: Reports & Analytics
 */

'use client'

import { useState } from 'react'
import { CustomReportConfig, ReportBuilderDialogProps, ReportMetric, ReportDimension } from '@/lib/types/reports'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { getDefaultFilters } from '@/lib/reports/date-utils'
import { Plus, X, Save } from 'lucide-react'

const AVAILABLE_METRICS: ReportMetric[] = [
  { id: 'total_revenue', name: 'Total Revenue', field: 'total_amount', aggregation: 'sum', format: 'currency' },
  { id: 'avg_revenue', name: 'Average Revenue', field: 'total_amount', aggregation: 'avg', format: 'currency' },
  { id: 'job_count', name: 'Job Count', field: 'id', aggregation: 'count', format: 'number' },
  { id: 'completion_time', name: 'Avg Completion Time', field: 'completion_time', aggregation: 'avg', format: 'duration' },
  { id: 'customer_count', name: 'Customer Count', field: 'customer_id', aggregation: 'count', format: 'number' },
]

const AVAILABLE_DIMENSIONS: ReportDimension[] = [
  { id: 'date', name: 'Date', field: 'created_at', type: 'date' },
  { id: 'status', name: 'Job Status', field: 'status', type: 'category' },
  { id: 'tech', name: 'Tech', field: 'tech_assigned_id', type: 'category' },
  { id: 'customer', name: 'Customer', field: 'contact_id', type: 'category' },
  { id: 'service_type', name: 'Service Type', field: 'service_type', type: 'category' },
]

/**
 * ReportBuilderDialog - Create custom reports
 *
 * @example
 * ```tsx
 * <ReportBuilderDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSave={(config) => saveCustomReport(config)}
 * />
 * ```
 */
export function ReportBuilderDialog({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: ReportBuilderDialogProps) {
  const [config, setConfig] = useState<CustomReportConfig>(
    initialConfig || {
      name: '',
      description: '',
      metrics: [],
      dimensions: [],
      filters: getDefaultFilters(),
      chartType: 'bar',
      sortOrder: 'desc',
      limit: 100,
    }
  )

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    initialConfig?.metrics.map((m) => m.id) || []
  )
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(
    initialConfig?.dimensions.map((d) => d.id) || []
  )

  const handleMetricToggle = (metricId: string) => {
    const metric = AVAILABLE_METRICS.find((m) => m.id === metricId)
    if (!metric) return

    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics((prev) => prev.filter((id) => id !== metricId))
      setConfig((prev) => ({
        ...prev,
        metrics: prev.metrics.filter((m) => m.id !== metricId),
      }))
    } else {
      setSelectedMetrics((prev) => [...prev, metricId])
      setConfig((prev) => ({
        ...prev,
        metrics: [...prev.metrics, metric],
      }))
    }
  }

  const handleDimensionToggle = (dimensionId: string) => {
    const dimension = AVAILABLE_DIMENSIONS.find((d) => d.id === dimensionId)
    if (!dimension) return

    if (selectedDimensions.includes(dimensionId)) {
      setSelectedDimensions((prev) => prev.filter((id) => id !== dimensionId))
      setConfig((prev) => ({
        ...prev,
        dimensions: prev.dimensions.filter((d) => d.id !== dimensionId),
      }))
    } else {
      setSelectedDimensions((prev) => [...prev, dimensionId])
      setConfig((prev) => ({
        ...prev,
        dimensions: [...prev.dimensions, dimension],
      }))
    }
  }

  const handleSave = () => {
    if (!config.name.trim()) {
      alert('Please enter a report name')
      return
    }

    if (config.metrics.length === 0) {
      alert('Please select at least one metric')
      return
    }

    if (config.dimensions.length === 0) {
      alert('Please select at least one dimension')
      return
    }

    onSave(config)
    onOpenChange(false)
  }

  const handleReset = () => {
    setConfig({
      name: '',
      description: '',
      metrics: [],
      dimensions: [],
      filters: getDefaultFilters(),
      chartType: 'bar',
      sortOrder: 'desc',
      limit: 100,
    })
    setSelectedMetrics([])
    setSelectedDimensions([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Report Builder</DialogTitle>
          <DialogDescription>
            Create a custom report by selecting metrics, dimensions, and filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Name & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Revenue by Tech"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Describe what this report shows..."
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
              />
            </div>
          </div>

          {/* Metrics Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metrics *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_METRICS.map((metric) => (
                <div key={metric.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={metric.id}
                    checked={selectedMetrics.includes(metric.id)}
                    onCheckedChange={() => handleMetricToggle(metric.id)}
                  />
                  <Label htmlFor={metric.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {metric.aggregation.toUpperCase()} of {metric.field}
                      {metric.format && (
                        <Badge variant="outline" className="ml-2">
                          {metric.format}
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dimensions Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dimensions (Group By) *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_DIMENSIONS.map((dimension) => (
                <div key={dimension.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={dimension.id}
                    checked={selectedDimensions.includes(dimension.id)}
                    onCheckedChange={() => handleDimensionToggle(dimension.id)}
                  />
                  <Label htmlFor={dimension.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{dimension.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {dimension.type} - {dimension.field}
                    </div>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chart Type */}
          <div className="space-y-2">
            <Label htmlFor="chartType">Chart Type</Label>
            <Select
              value={config.chartType}
              onValueChange={(value: any) => setConfig({ ...config, chartType: value })}
            >
              <SelectTrigger id="chartType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="table">Data Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort and Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select
                value={config.sortOrder}
                onValueChange={(value: any) => setConfig({ ...config, sortOrder: value })}
              >
                <SelectTrigger id="sortOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Result Limit</Label>
              <Input
                id="limit"
                type="number"
                min={10}
                max={1000}
                value={config.limit || 100}
                onChange={(e) =>
                  setConfig({ ...config, limit: parseInt(e.target.value) || 100 })
                }
              />
            </div>
          </div>

          {/* Preview Summary */}
          {config.metrics.length > 0 && config.dimensions.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Report Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Metrics: </span>
                  {config.metrics.map((m) => m.name).join(', ')}
                </div>
                <div>
                  <span className="font-medium">Dimensions: </span>
                  {config.dimensions.map((d) => d.name).join(', ')}
                </div>
                <div>
                  <span className="font-medium">Visualization: </span>
                  {config.chartType}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ReportBuilderDialogProps }
