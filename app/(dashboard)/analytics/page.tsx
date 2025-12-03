'use client'

import { useState, useEffect } from 'react'
import { AnalyticsLayout } from '@/components/layout/analytics-layout'
import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  jobs: {
    total: number
    today: number
    completed: number
  }
  revenue: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  contacts: {
    total: number
    newThisMonth: number
  }
  invoices: {
    outstanding: number
    outstandingAmount: number
  }
}

interface JobAnalytics {
  totalJobs: number
  totalRevenue: number
  avgJobValue: number
  completedCount: number
  paidCount: number
  statusBreakdown: Record<string, number>
  dateBreakdown: Record<string, number>
}

interface ContactAnalytics {
  newContacts: number
  contactsWithJobs: number
  revenueFromContacts?: number
  totalRevenueFromContacts?: number
  dateBreakdown: Record<string, number>
}

interface RevenueAnalytics {
  totalRevenue: number
  breakdown: Record<string, number>
  groupBy?: string
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days')
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('view_analytics')) {
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

  if (!hasPermission('view_analytics')) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Access Denied</div>
      </div>
    )
  }

  const getDateRangeParams = () => {
    const today = new Date()
    let dateFrom: Date

    switch (dateRange) {
      case '7days':
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 7)
        break
      case '30days':
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 30)
        break
      case '90days':
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 90)
        break
      case 'year':
        dateFrom = new Date(today.getFullYear(), 0, 1)
        break
      default:
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 30)
    }

    return `dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${today.toISOString().split('T')[0]}`
  }

  // Parallel queries with React Query
  const dashboardQuery = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return res.json() as Promise<DashboardStats>
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const jobsQuery = useQuery({
    queryKey: ['analytics', 'jobs', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/jobs?${getDateRangeParams()}`)
      if (!res.ok) throw new Error('Failed to fetch job analytics')
      return res.json() as Promise<JobAnalytics>
    },
    staleTime: 5 * 60 * 1000
  })

  const contactsQuery = useQuery({
    queryKey: ['analytics', 'contacts', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/contacts?${getDateRangeParams()}`)
      if (!res.ok) throw new Error('Failed to fetch contact analytics')
      return res.json() as Promise<ContactAnalytics>
    },
    staleTime: 5 * 60 * 1000
  })

  const revenueQuery = useQuery({
    queryKey: ['analytics', 'revenue', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/revenue?${getDateRangeParams()}&groupBy=date`)
      if (!res.ok) throw new Error('Failed to fetch revenue analytics')
      return res.json() as Promise<RevenueAnalytics>
    },
    staleTime: 5 * 60 * 1000
  })

  const isLoading = dashboardQuery.isLoading || jobsQuery.isLoading || contactsQuery.isLoading || revenueQuery.isLoading

  return (
    <AnalyticsLayout
      loading={isLoading}
      dateRange={dateRange}
      dashboardStats={dashboardQuery.data || null}
      jobAnalytics={jobsQuery.data || null}
      contactAnalytics={contactsQuery.data || null}
      revenueAnalytics={revenueQuery.data || null}
      onDateRangeChange={setDateRange}
    />
  )
}

