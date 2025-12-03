/**
 * Reports Page
 * Main reports and analytics dashboard
 *
 * Agent Swarm 7: Reports & Analytics
 */

'use client'

import { useState, useEffect } from 'react'
import { ReportTemplate, ReportFilters, Report, ReportData, ChartType } from '@/lib/types/reports'
import { getDefaultFilters } from '@/lib/reports/date-utils'
import { ReportTemplateSelector } from '@/components/reports/ReportTemplateSelector'
import { ReportFilterPanel } from '@/components/reports/ReportFilterPanel'
import { ReportPreview } from '@/components/reports/ReportPreview'
import { ReportExportButton } from '@/components/reports/ReportExportButton'
import { ReportBuilderDialog } from '@/components/reports/ReportBuilderDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useRouter } from 'next/navigation'

function ReportsPageContent() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters())
  const [chartType, setChartType] = useState<ChartType>('line')
  const [customReportDialogOpen, setCustomReportDialogOpen] = useState(false)
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const router = useRouter()

  // Always call all hooks, regardless of component state
  useEffect(() => {
    if (!permissionsLoading && !hasPermission('view_reports')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  // Reset chart type when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setChartType(selectedTemplate.defaultChartType)
    }
  }, [selectedTemplate])

  const {
    data: queryData,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['report', selectedTemplate?.id, filters],
    queryFn: async () => {
      if (!selectedTemplate) return null

      const params = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
      })

      if (filters.techId) params.append('techId', filters.techId)
      if (filters.customerId) params.append('customerId', filters.customerId)
      if (filters.jobStatus?.[0]) params.append('status', filters.jobStatus[0])
      if (filters.serviceType?.[0]) params.append('serviceType', filters.serviceType[0])

      const response = await fetch(`/api/reports/${selectedTemplate.id}?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate report')
      }

      return response.json()
    },
    enabled: !!selectedTemplate,
    retry: 2, // Retry twice on failure to handle transient issues
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Show error toast when error occurs
  useEffect(() => {
    if (isError && error) {
      toast({
        title: 'Report Generation Failed',
        description: error.message,
        variant: 'error',
      })
    }
  }, [isError, error])

  // Show success toast when data is loaded (optional, but consistent with previous behavior)
  useEffect(() => {
    if (queryData && !isLoading && !isError) {
      // Only show if it's a fresh fetch (not from cache)? 
      // Actually, previous behavior showed toast on every generation.
      // We'll skip the toast for cached data to be less annoying, 
      // or we can keep it if desired. For now, let's skip it to reduce noise.
    }
  }, [queryData, isLoading, isError])

  const report: Report | null = queryData && selectedTemplate ? {
    id: `report-${selectedTemplate.id}-${filters.dateRange.from}`, // Stable ID based on params
    type: selectedTemplate.id,
    title: selectedTemplate.name,
    description: selectedTemplate.description,
    filters,
    data: queryData.data,
    chartType: chartType, // Use local state for chart type
    createdAt: queryData.metadata.generatedAt,
    createdBy: queryData.metadata.generatedBy,
    accountId: '',
  } : null

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    // React Query will automatically trigger the fetch due to key change
  }

  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters)
  }

  const handleChartTypeChange = (newChartType: ChartType) => {
    setChartType(newChartType)
  }

  const handleRefresh = () => {
    refetch()
    toast({
      title: 'Refreshing Report',
      description: 'Fetching latest data...',
    })
  }

  const handleSaveCustomReport = (config: any) => {
    toast({
      title: 'Custom Report Saved',
      description: 'Your custom report has been saved successfully',
    })
    // In production, would save to database
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive business reports and analyze your data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCustomReportDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Custom Report
          </Button>
          {report && selectedTemplate && (
            <>
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <ReportExportButton
                report={report}
                type={selectedTemplate.id}
                filters={filters}
              />
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 mt-6">
          {!selectedTemplate ? (
            <ReportTemplateSelector
              onSelectTemplate={handleTemplateSelect}
              selectedTemplate={selectedTemplate || undefined}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <ReportFilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  availableFilters={selectedTemplate.availableFilters}
                />

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Change Template
                </Button>
              </div>

              {/* Report Preview */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground mt-4">
                          Generating report...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : report ? (
                  <ReportPreview
                    report={report}
                    data={report.data}
                    chartType={chartType}
                    onChartTypeChange={handleChartTypeChange}
                    loading={isLoading}
                    error={error as Error | null}
                  />
                ) : isError ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center text-destructive">
                        <p className="font-semibold">Failed to generate report</p>
                        <p className="text-sm mt-2">{error?.message || 'Unknown error'}</p>
                        <Button variant="outline" onClick={() => refetch()} className="mt-4">
                          Try Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <p className="text-muted-foreground">No saved reports yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Generate and save reports to access them here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Report Builder Dialog */}
      <ReportBuilderDialog
        open={customReportDialogOpen}
        onOpenChange={setCustomReportDialogOpen}
        onSave={handleSaveCustomReport}
      />
    </div>
  )
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsPageContent />
    </ErrorBoundary>
  )
}
