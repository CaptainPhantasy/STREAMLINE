import { Json } from './index'

export type ReportType =
  | 'jobs_summary'
  | 'revenue_summary'
  | 'contact_summary'
  | 'tech_performance'
  | 'custom'

export interface Report {
  id?: string
  type: ReportType
  title: string
  dateFrom: string
  dateTo: string
  filters?: Json
  data: Json
  generatedAt: string
  generatedBy?: string
}

export interface ReportGenerateRequest {
  type: ReportType
  dateFrom: string
  dateTo: string
  filters?: Json
}

export interface ReportResponse {
  report: Report
}

