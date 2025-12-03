'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Edit, Mail, Download, DollarSign, Calendar, User, FileText, ShoppingCart } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { Invoice } from '@/types/invoices'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [partsDialogOpen, setPartsDialogOpen] = useState(false)
  const [partsList, setPartsList] = useState<any[]>([])
  const [sendingParts, setSendingParts] = useState(false)
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  const invoiceId = params.id as string

  useEffect(() => {
    if (invoiceId && hasPermission('view_financials')) {
      fetchInvoice()
    }
  }, [invoiceId, hasPermission])

  async function fetchInvoice() {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
      } else {
        toast.error('Failed to load invoice', 'Invoice not found')
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice', 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateInvoice(formData: any) {
    try {
      setSaving(true)
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
        setEditDialogOpen(false)
        toast.success('Invoice updated successfully')
      } else {
        const errorData = await response.json()
        toast.error('Failed to update invoice', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Failed to update invoice', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendInvoice() {
    if (!invoice?.contact?.email) {
      toast.error('Cannot send invoice', 'Contact email is missing')
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Invoice sent successfully')
        fetchInvoice() // Refresh to get updated status
      } else {
        const errorData = await response.json()
        toast.error('Failed to send invoice', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice', 'Network error')
    }
  }

  async function handleConvertToParts() {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/convert-to-parts`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setPartsList(data.parts || [])
        setPartsDialogOpen(true)
      } else {
        const errorData = await response.json()
        toast.error('Failed to convert invoice', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error converting invoice:', error)
      toast.error('Failed to convert invoice', 'Network error')
    }
  }

  async function handleSendPartsList(recipientType: string, recipientId?: string, recipientEmail?: string, recipientPhone?: string) {
    if (!invoice?.job_id) {
      toast.error('Cannot send parts', 'Invoice has no associated job')
      return
    }

    try {
      setSendingParts(true)
      const response = await fetch('/api/parts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: invoice.job_id,
          recipientType,
          recipientId,
          recipientEmail,
          recipientPhone,
          parts: partsList,
        }),
      })

      if (response.ok) {
        toast.success('Parts list sent successfully')
        setPartsDialogOpen(false)
      } else {
        const errorData = await response.json()
        toast.error('Failed to send parts list', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error sending parts list:', error)
      toast.error('Failed to send parts list', 'Network error')
    } finally {
      setSendingParts(false)
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Invoice not found</div>
        <Button onClick={() => router.push('/admin/invoices')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    )
  }

  const canEdit = hasPermission('edit_invoices')
  const statusColors = getStatusColor(invoice.status)
  const contactName = invoice.contact
    ? `${invoice.contact.first_name || ''} ${invoice.contact.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/invoices')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {invoice.invoice_number}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          {canEdit && invoice.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button
              variant="outline"
              onClick={handleSendInvoice}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              onClick={handleConvertToParts}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Convert to Parts List
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Information */}
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-[var(--color-text-subtle)]">Invoice Number</Label>
              <div className="font-mono font-medium text-sm mt-1">{invoice.invoice_number}</div>
            </div>
            <div>
              <Label className="text-xs text-[var(--color-text-subtle)]">Amount</Label>
              <div className="text-2xl font-semibold flex items-center gap-1 mt-1">
                <DollarSign className="w-5 h-5" />
                ${(invoice.total_amount / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <Label className="text-xs text-[var(--color-text-subtle)]">Created</Label>
              <div className="text-sm mt-1">
                {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
              </div>
            </div>
            {invoice.due_date && (
              <div>
                <Label className="text-xs text-[var(--color-text-subtle)]">Due Date</Label>
                <div className="text-sm mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                </div>
              </div>
            )}
            {invoice.paid_at && (
              <div>
                <Label className="text-xs text-[var(--color-text-subtle)]">Paid At</Label>
                <div className="text-sm mt-1">
                  {format(new Date(invoice.paid_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Job Information */}
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact & Job
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-[var(--color-text-subtle)]">Contact</Label>
              <div className="text-sm font-medium mt-1">{contactName}</div>
              {invoice.contact?.email && (
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {invoice.contact.email}
                </div>
              )}
            </div>
            {invoice.job && (
              <div>
                <Label className="text-xs text-[var(--color-text-subtle)]">Job</Label>
                <div className="text-sm mt-1">
                  {invoice.job.description || 'No description'}
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1"
                  onClick={() => router.push(`/jobs?id=${invoice.job_id}`)}
                >
                  View Job
                </Button>
              </div>
            )}
            {invoice.stripe_payment_link && (
              <div>
                <Label className="text-xs text-[var(--color-text-subtle)]">Payment Link</Label>
                <div className="text-xs mt-1">
                  <a
                    href={invoice.stripe_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4B79FF] hover:underline"
                  >
                    {invoice.stripe_payment_link}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {canEdit && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>
                Update invoice details
              </DialogDescription>
            </DialogHeader>
            <InvoiceEditForm
              invoice={invoice}
              onSave={handleUpdateInvoice}
              onCancel={() => setEditDialogOpen(false)}
              saving={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Parts List Dialog */}
      <Dialog open={partsDialogOpen} onOpenChange={setPartsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Parts List</DialogTitle>
            <DialogDescription>
              Parts extracted from invoice. Send to technician, homeowner, or supply house.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {partsList.length > 0 ? (
              <>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Part Name</th>
                        <th className="text-left p-2">Qty</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsList.map((part: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{part.name}</td>
                          <td className="p-2">{part.quantity} {part.unit || 'each'}</td>
                          <td className="p-2 text-right">${((part.unit_price || 0) / 100).toFixed(2)}</td>
                          <td className="p-2 text-right">${((part.quantity || 0) * (part.unit_price || 0) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2">
                  <Label>Send To</Label>
                  <div className="flex gap-2">
                    {invoice?.job?.tech_assigned_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendPartsList('tech', invoice.job.tech_assigned_id)}
                        disabled={sendingParts}
                      >
                        Send to Technician
                      </Button>
                    )}
                    {invoice?.contact?.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendPartsList('homeowner', undefined, invoice.contact.email)}
                        disabled={sendingParts}
                      >
                        Send to Homeowner
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const email = prompt('Enter supply house email:')
                        if (email) {
                          handleSendPartsList('supply_house', undefined, email)
                        }
                      }}
                      disabled={sendingParts}
                    >
                      Send to Supply House
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                No parts found in invoice
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InvoiceEditForm({
  invoice,
  onSave,
  onCancel,
  saving,
}: {
  invoice: Invoice
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState({
    amount: invoice.amount / 100,
    taxAmount: invoice.tax_amount / 100,
    totalAmount: invoice.total_amount / 100,
    status: invoice.status,
    dueDate: invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : '',
    notes: invoice.notes || '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      amount: Math.round(formData.amount * 100),
      taxAmount: Math.round(formData.taxAmount * 100),
      totalAmount: Math.round(formData.totalAmount * 100),
      status: formData.status,
      dueDate: formData.dueDate || null,
      notes: formData.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                const amount = parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  amount,
                  totalAmount: amount + formData.taxAmount,
                })
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxAmount">Tax ($)</Label>
            <Input
              id="taxAmount"
              type="number"
              step="0.01"
              value={formData.taxAmount}
              onChange={(e) => {
                const taxAmount = parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  taxAmount,
                  totalAmount: formData.amount + taxAmount,
                })
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount ($)</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            value={formData.totalAmount}
            readOnly
            className="bg-[var(--card-bg)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#56D470] hover:bg-[#37C856] text-white">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}

