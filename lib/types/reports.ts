/**
 * Comprehensive TypeScript types for Reports & Analytics System
 * Agent Swarm 7: Reports & Analytics
 */

import { Json } from '@/types'

// ============================================================================
// REPORT TYPES & ENUMS
// ============================================================================

export type ReportType =
  | 'revenue'
  | 'job-performance'
  | 'customer'
  | 'tech-performance'
  | 'financial'
  | 'custom'

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'table'

export type ExportFormat = 'pdf' | 'excel' | 'csv'

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom'

// ============================================================================
// REPORT TEMPLATE DEFINITIONS
// ============================================================================

export interface ReportTemplate {
  id: ReportType
  name: string
  description: string
  icon: string
  defaultChartType: ChartType
  supportsChartTypes: ChartType[]
  availableFilters: string[]
  requiresFilters?: string[]
  category: 'financial' | 'operations' | 'sales' | 'analytics'
}

// ============================================================================
// REPORT DATA STRUCTURES
// ============================================================================

export interface RevenueReportData {
  totalRevenue: number
  revenueByPeriod: Array<{
    date: string
    revenue: number
    jobCount: number
  }>
  revenueByServiceType: Array<{
    serviceType: string
    revenue: number
    percentage: number
  }>
  revenueByCustomer: Array<{
    customerId: string
    customerName: string
    revenue: number
    jobCount: number
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    growth: number
  }>
}

export interface JobPerformanceReportData {
  totalJobs: number
  completedJobs: number
  pendingJobs: number
  cancelledJobs: number
  averageCompletionTime: number
  jobsByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  jobsByTech: Array<{
    techId: string
    techName: string
    jobCount: number
    averageRating: number
  }>
  jobsOverTime: Array<{
    date: string
    scheduled: number
    completed: number
    cancelled: number
  }>
}

export interface CustomerReportData {
  totalCustomers: number
  newCustomers: number
  activeCustomers: number
  topCustomers: Array<{
    customerId: string
    customerName: string
    totalRevenue: number
    jobCount: number
    lifetimeValue: number
    lastJobDate: string
  }>
  customerAcquisition: Array<{
    month: string
    newCustomers: number
    totalCustomers: number
  }>
  retentionRate: number
  churnRate: number
}

export interface TechPerformanceReportData {
  techId?: string
  techName?: string
  totalJobs: number
  completedJobs: number
  averageRating: number
  averageCompletionTime: number
  revenueGenerated: number
  efficiencyScore: number
  techComparison: Array<{
    techId: string
    techName: string
    jobsCompleted: number
    averageRating: number
    revenue: number
  }>
  performanceOverTime: Array<{
    date: string
    jobsCompleted: number
    averageRating: number
  }>
}

export interface FinancialReportData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  outstandingInvoices: number
  outstandingAmount: number
  paidInvoices: number
  paidAmount: number
  paymentTrends: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  invoiceAging: Array<{
    ageRange: string
    count: number
    amount: number
  }>
}

export type ReportData =
  | RevenueReportData
  | JobPerformanceReportData
  | CustomerReportData
  | TechPerformanceReportData
  | FinancialReportData

// ============================================================================
// REPORT FILTERS
// ============================================================================

export interface ReportFilters {
  dateRange: {
    preset: DateRangePreset
    from: string
    to: string
  }
  techId?: string
  customerId?: string
  jobStatus?: string[]
  serviceType?: string[]
  minAmount?: number
  maxAmount?: number
}

export interface ReportFilterPreset {
  id: string
  name: string
  filters: ReportFilters
  createdAt: string
  userId: string
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

export interface GenerateReportRequest {
  type: ReportType
  filters: ReportFilters
  chartType?: ChartType
  includeRawData?: boolean
}

export interface GenerateReportResponse {
  report: Report
  data: ReportData
  metadata: ReportMetadata
}

export interface Report {
  id: string
  type: ReportType
  title: string
  description: string
  filters: ReportFilters
  data: ReportData
  chartType: ChartType
  createdAt: string
  createdBy: string
  accountId: string
}

export interface ReportMetadata {
  generatedAt: string
  generatedBy: string
  recordCount: number
  dateRange: {
    from: string
    to: string
  }
  executionTime: number
}

// ============================================================================
// REPORT EXPORT
// ============================================================================

export interface ExportReportRequest {
  reportId?: string
  type: ReportType
  filters: ReportFilters
  format: ExportFormat
  includeCharts: boolean
  fileName?: string
}

export interface ExportReportResponse {
  downloadUrl: string
  fileName: string
  fileSize: number
  expiresAt: string
}

// ============================================================================
// CUSTOM REPORT BUILDER
// ============================================================================

export interface CustomReportConfig {
  id?: string
  name: string
  description?: string
  metrics: ReportMetric[]
  dimensions: ReportDimension[]
  filters: ReportFilters
  chartType: ChartType
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

export interface ReportMetric {
  id: string
  name: string
  field: string
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  format?: 'currency' | 'percentage' | 'number' | 'duration'
}

export interface ReportDimension {
  id: string
  name: string
  field: string
  type: 'date' | 'category' | 'number'
}

// ============================================================================
// CHART DATA STRUCTURES
// ============================================================================

export interface ChartDataPoint {
  name: string
  value: number
  label?: string
  fill?: string
  [key: string]: any
}

export interface LineChartData {
  data: ChartDataPoint[]
  xAxisKey: string
  yAxisKey: string
  lines: Array<{
    dataKey: string
    name: string
    color: string
  }>
}

export interface BarChartData {
  data: ChartDataPoint[]
  xAxisKey: string
  yAxisKey: string
  bars: Array<{
    dataKey: string
    name: string
    color: string
  }>
}

export interface PieChartData {
  data: ChartDataPoint[]
  nameKey: string
  valueKey: string
  colors: string[]
}

export type ChartData = LineChartData | BarChartData | PieChartData

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface ReportTemplateSelectorProps {
  onSelectTemplate: (template: ReportTemplate) => void
  selectedTemplate?: ReportTemplate
  className?: string
}

export interface ReportPreviewProps {
  report: Report
  data: ReportData
  chartType: ChartType
  onChartTypeChange?: (chartType: ChartType) => void
  showDataTable?: boolean
  onToggleDataTable?: () => void
  loading?: boolean
  error?: Error | null
  className?: string
}

export interface ReportExportButtonProps {
  report?: Report
  type: ReportType
  filters: ReportFilters
  onExport?: (format: ExportFormat) => void
  disabled?: boolean
  className?: string
}

export interface ReportFilterPanelProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  availableFilters?: string[]
  presets?: ReportFilterPreset[]
  onSavePreset?: (name: string) => void
  onLoadPreset?: (preset: ReportFilterPreset) => void
  className?: string
}

export interface ReportBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (config: CustomReportConfig) => void
  initialConfig?: CustomReportConfig
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ReportsListResponse {
  reports: Report[]
  total: number
  page: number
  limit: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DateRange {
  from: Date
  to: Date
}

export interface ReportSchedule {
  id: string
  reportType: ReportType
  filters: ReportFilters
  schedule: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  format: ExportFormat
  enabled: boolean
  nextRunAt: string
  lastRunAt?: string
}
