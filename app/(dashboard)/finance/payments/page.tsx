'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Search, Calendar } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useRouter } from 'next/navigation'

interface Payment {
  id: string
  invoice_id: string | null
  job_id: string | null
  amount: number
  payment_method: string | null
  status: string
  processed_at: string | null
  created_at: string
  invoice?: {
    invoice_number: string
    contact_id: string
  }
  job?: {
    id: string
    description: string | null
    contact?: {
      first_name: string | null
      last_name: string | null
    }
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('manage_financials')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      </div>
    )
  }

  if (!hasPermission('manage_financials')) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-neutral-500">Access Denied</div>
      </div>
    )
  }
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    revenue: 0,
  })

  useEffect(() => {
    fetchPayments()
  }, [filters])

  async function fetchPayments() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/payments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])

        // Calculate stats
        const total = data.payments?.length || 0
        const paid = data.payments?.filter((p: Payment) => p.status === 'completed').length || 0
        const pending = data.payments?.filter((p: Payment) => p.status === 'pending' || p.status === 'processing').length || 0
        const revenue = data.payments?.filter((p: Payment) => p.status === 'completed').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0) || 0

        setStats({ total, paid, pending, revenue })
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      case 'pending':
      case 'processing':
        return { bg: '#FFF4E8', text: '#FFA24D', border: 'rgba(255, 162, 77, 0.2)' }
      case 'failed':
        return { bg: '#FEE2E2', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' }
      default:
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Payments</h1>
        <p className="text-sm text-neutral-500 mt-1">Track payment status and revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 shadow-md" style={{ borderLeftColor: '#4B79FF' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-neutral-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 shadow-md" style={{ borderLeftColor: '#56D470' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-neutral-800">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 shadow-md" style={{ borderLeftColor: '#FFA24D' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-neutral-800">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 shadow-md" style={{ borderLeftColor: '#6938EF' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-neutral-800">${(stats.revenue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-neutral-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No payments found</div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const statusColors = getStatusColor(payment.status)
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {payment.invoice?.invoice_number || `Job ${payment.job_id?.substring(0, 8)}`}
                        </span>
                        <Badge
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            borderColor: statusColors.border,
                            borderWidth: '1px',
                          }}
                        >
                          {payment.status}
                        </Badge>
                        {payment.payment_method && (
                          <Badge className="text-xs bg-[#EBF0FF] text-[#4B79FF]">
                            {payment.payment_method}
                          </Badge>
                        )}
                      </div>
                      {payment.job?.contact && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {payment.job.contact.first_name} {payment.job.contact.last_name}
                        </div>
                      )}
                      <div className="text-xs text-neutral-400 mt-1">
                        {new Date(payment.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${(payment.amount / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

