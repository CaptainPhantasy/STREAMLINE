'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Job } from '@/types'

interface GenerateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
  onSuccess: () => void
}

export function GenerateInvoiceDialog({ open, onOpenChange, job, onSuccess }: GenerateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    dueDate: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && job) {
      // Pre-fill amount from job if available
      const amount = job.total_amount ? (job.total_amount / 100).toFixed(2) : ''
      setFormData({
        amount,
        description: job.description || '',
        dueDate: '',
      })
      setError(null)
    }
  }, [open, job])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.amount || !formData.description) {
      setError('Amount and description are required')
      setLoading(false)
      return
    }

    const amountInCents = Math.round(parseFloat(formData.amount) * 100)
    if (isNaN(amountInCents) || amountInCents <= 0) {
      setError('Amount must be a positive number')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job?.id,
          contactId: job?.contact_id,
          amount: amountInCents,
          description: formData.description,
          dueDate: formData.dueDate || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          amount: '',
          description: '',
          dueDate: '',
        })
      } else {
        setError(data.error || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      setError('Failed to generate invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!job) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice for {job.contact?.first_name} {job.contact?.last_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Invoice description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
              />
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setError(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF]">
              {loading ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

