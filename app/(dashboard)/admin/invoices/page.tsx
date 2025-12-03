'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, FileText, DollarSign } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { Invoice } from '@/types/invoices'
import { format } from 'date-fns'

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('view_financials')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  useEffect(() => {
    if (hasPermission('view_financials')) {
      fetchInvoices()
    }
  }, [statusFilter, hasPermission])

  async function fetchInvoices() {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        let filteredInvoices = data.invoices || []

        // Apply status filter
        if (statusFilter !== 'all') {
          filteredInvoices = filteredInvoices.filter((inv: Invoice) => inv.status === statusFilter)
        }

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filteredInvoices = filteredInvoices.filter((inv: Invoice) =>
            inv.invoice_number.toLowerCase().includes(query) ||
            inv.contact?.first_name?.toLowerCase().includes(query) ||
            inv.contact?.last_name?.toLowerCase().includes(query) ||
            inv.job?.description?.toLowerCase().includes(query)
          )
        }

        setInvoices(filteredInvoices)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'paid':
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      case 'sent':
        return { bg: '#EBF0FF', text: '#4B79FF', border: 'rgba(75, 121, 255, 0.2)' }
      case 'overdue':
        return { bg: '#FEE2E2', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' }
      case 'draft':
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
      case 'cancelled':
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
      default:
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
    }
  }

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

  const canCreate = hasPermission('create_invoices')
  const canEdit = hasPermission('edit_invoices')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Invoices</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage invoices and payments</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => router.push('/admin/invoices/new')}
            className="bg-[#56D470] hover:bg-[#37C856] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--color-text-subtle)]" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  fetchInvoices()
                }}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>{invoices.length} invoice(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-subtle)]" />
              <p className="text-lg font-medium mb-2">No invoices found</p>
              <p className="text-sm">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const statusColors = getStatusColor(invoice.status)
                const contactName = invoice.contact
                  ? `${invoice.contact.first_name || ''} ${invoice.contact.last_name || ''}`.trim() || 'Unknown'
                  : 'Unknown'

                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-[var(--card-bg-hover)] cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm text-[var(--color-text-primary)]">
                            {invoice.invoice_number}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                            {contactName}
                          </div>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            borderColor: statusColors.border,
                            borderWidth: '1px',
                          }}
                        >
                          {invoice.status}
                        </Badge>
                        {invoice.job && (
                          <span className="text-xs text-[var(--color-text-subtle)]">
                            Job: {invoice.job.description?.substring(0, 30) || 'No description'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-subtle)] mt-2">
                        Created: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                        {invoice.due_date && ` • Due: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg flex items-center gap-1 text-[var(--color-text-primary)]">
                        <DollarSign className="w-5 h-5" />
                        ${(invoice.total_amount / 100).toFixed(2)}
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/invoices/${invoice.id}`)
                          }}
                        >
                          Edit
                        </Button>
                      )}
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

