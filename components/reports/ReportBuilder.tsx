'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, BarChart3, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ChartTypes } from './ChartTypes'

interface ReportBuilderProps {
  onReportGenerated?: (report: any) => void
}

export function ReportBuilder({ onReportGenerated }: ReportBuilderProps) {
  const [dataSources, setDataSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [config, setConfig] = useState({
    data_source: '',
    fields: [] as string[],
    chart_type: 'table' as 'line' | 'bar' | 'pie' | 'area' | 'table',
    group_by: '',
    date_range: {
      start: '',
      end: '',
    },
  })
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    fetchDataSources()
  }, [])

  async function fetchDataSources() {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/builder')

      if (!response.ok) {
        throw new Error('Failed to fetch data sources')
      }

      const data = await response.json()
      setDataSources(data.data_sources || [])
    } catch (error: any) {
      console.error('Error fetching data sources:', error)
      toast.error('Failed to load data sources')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!config.data_source || config.fields.length === 0) {
      toast.error('Please select a data source and at least one field')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate report')
      }

      const data = await response.json()
      setReportData(data)
      onReportGenerated?.(data)
      toast.success('Report generated successfully')
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error(error.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  function toggleField(field: string) {
    setConfig({
      ...config,
      fields: config.fields.includes(field)
        ? config.fields.filter(f => f !== field)
        : [...config.fields, field],
    })
  }

  const selectedDataSource = dataSources.find(ds => ds.id === config.data_source)

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Report Builder
        </CardTitle>
        <CardDescription>Build custom reports with drag-and-drop</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Source Selection */}
        <div className="space-y-2">
          <Label>Data Source</Label>
          <Select
            value={config.data_source}
            onValueChange={(value) => setConfig({ ...config, data_source: value, fields: [] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((ds) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Field Selection */}
        {selectedDataSource && (
          <div className="space-y-2">
            <Label>Fields</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {selectedDataSource.fields.map((field: string) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field}`}
                    checked={config.fields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <Label htmlFor={`field-${field}`} className="font-normal cursor-pointer">
                    {field}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart Type */}
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select
            value={config.chart_type}
            onValueChange={(value: any) => setConfig({ ...config, chart_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Group By */}
        {config.chart_type !== 'table' && selectedDataSource && (
          <div className="space-y-2">
            <Label>Group By (Optional)</Label>
            <Select
              value={config.group_by}
              onValueChange={(value) => setConfig({ ...config, group_by: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field to group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {selectedDataSource.fields.map((field: string) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={config.date_range.start}
              onChange={(e) =>
                setConfig({
                  ...config,
                  date_range: { ...config.date_range, start: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={config.date_range.end}
              onChange={(e) =>
                setConfig({
                  ...config,
                  date_range: { ...config.date_range, end: e.target.value },
                })
              }
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={generating} className="w-full">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>

        {/* Report Preview */}
        {reportData && (
          <div className="mt-6 border-t pt-6">
            <ChartTypes
              data={reportData.chart_data}
              chartType={config.chart_type}
              title="Report Preview"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

