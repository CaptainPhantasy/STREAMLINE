export interface JobAnalytics {
  account_id: string
  job_date: string
  status: string
  job_count: number
  total_revenue: number | null
  avg_job_value: number | null
  completed_count: number
  paid_count: number
}

export interface ContactAnalytics {
  account_id: string
  contact_date: string
  new_contacts: number
  contacts_with_jobs: number
  total_revenue_from_contacts: number | null
}

export interface RevenueAnalytics {
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  outstandingInvoices: number
  averageInvoiceAmount: number
  revenueByMonth: Array<{
    month: string
    revenue: number
    invoiceCount: number
  }>
}

export interface JobAnalyticsResponse {
  analytics: JobAnalytics[]
  total: number
}

export interface ContactAnalyticsResponse {
  analytics: ContactAnalytics[]
  total: number
}

export interface RevenueAnalyticsResponse {
  analytics: RevenueAnalytics
}

export interface DashboardStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  totalRevenue: number
  totalContacts: number
  newContactsThisMonth: number
  averageJobValue: number
  completionRate: number
}

export interface DashboardStatsResponse {
  stats: DashboardStats
}

