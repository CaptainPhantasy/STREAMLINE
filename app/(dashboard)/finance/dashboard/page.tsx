'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Clock, FileText } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useRouter } from 'next/navigation'

interface FinancialStats {
  revenue: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
  outstanding: {
    count: number
    amount: number
  }
  paymentRate: number
  averageInvoice: number
}

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('view_financials')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    )
  }

  if (!hasPermission('view_financials')) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Access Denied</div>
      </div>
    )
  }

  useEffect(() => {
    fetchFinancialData()
  }, [])

  async function fetchFinancialData() {
    try {
      const response = await fetch('/api/finance/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading financial data...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Financial Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Revenue and payment analytics</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              ${((stats?.revenue.today || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              ${((stats?.revenue.thisWeek || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              ${((stats?.revenue.thisMonth || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              ${((stats?.revenue.total || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <FileText className="w-5 h-5 text-[var(--color-accent-primary)]" />
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[var(--color-text-primary)]">
              {stats?.outstanding.count || 0}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-2">
              ${((stats?.outstanding.amount || 0) / 100).toFixed(2)} total
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <TrendingUp className="w-5 h-5 text-[var(--color-accent-primary)]" />
              Payment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[var(--color-text-primary)]">
              {(stats?.paymentRate || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-2">
              Of invoices paid on time
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <DollarSign className="w-5 h-5 text-[var(--color-accent-primary)]" />
              Average Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[var(--color-text-primary)]">
              ${((stats?.averageInvoice || 0) / 100).toFixed(2)}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-2">
              Per invoice
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

