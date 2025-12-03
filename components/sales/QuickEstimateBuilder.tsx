'use client'

/**
 * QuickEstimateBuilder - Simplified mobile estimate creation
 *
 * Fast estimate builder optimized for mobile with AI pricing suggestions.
 *
 * @example
 * ```tsx
 * <QuickEstimateBuilder
 *   contactId="contact-123"
 *   onSend={(estimate) => console.log('Sent:', estimate)}
 *   serviceTemplates={templates}
 * />
 * ```
 */

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Send, DollarSign, Loader2 } from 'lucide-react'
import type { QuickEstimateBuilderProps, EstimateService, ServiceTemplate } from '@/lib/types/sales'

export function QuickEstimateBuilder({
  contactId,
  onSend,
  serviceTemplates = [],
  className,
}: QuickEstimateBuilderProps) {
  const [services, setServices] = useState<EstimateService[]>([])
  const [notes, setNotes] = useState('')
  const [validUntilDays, setValidUntilDays] = useState(30)
  const [isSending, setIsSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const TAX_RATE = 0.08 // 8% tax

  const totals = useMemo(() => {
    const subtotal = services.reduce((sum, service) => sum + service.total, 0)
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax

    return { subtotal, tax, total }
  }, [services])

  const addService = (template?: ServiceTemplate) => {
    const newService: EstimateService = {
      id: `service-${Date.now()}`,
      name: template?.name || '',
      description: template?.description || '',
      quantity: 1,
      unit_price: template?.default_price || 0,
      total: template?.default_price || 0,
    }
    setServices([...services, newService])
    setShowTemplates(false)
  }

  const updateService = (id: string, field: keyof EstimateService, value: any) => {
    setServices(
      services.map((service) => {
        if (service.id !== id) return service

        const updated = { ...service, [field]: value }

        // Recalculate total
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price
        }

        return updated
      })
    )
  }

  const removeService = (id: string) => {
    setServices(services.filter((s) => s.id !== id))
  }

  const handleSend = async () => {
    if (services.length === 0) return

    setIsSending(true)

    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + validUntilDays)

      const response = await fetch('/api/estimates/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          services,
          notes,
          send_immediately: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create estimate')
      }

      const data = await response.json()
      onSend?.(data.estimate)

      // Reset form
      setServices([])
      setNotes('')
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send estimate. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className={cn('bg-gray-800 rounded-xl p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">Quick Estimate</h3>
        <div className="flex items-center gap-2 text-green-400">
          <DollarSign className="w-5 h-5" />
          <span className="text-2xl font-bold">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {/* Services */}
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={service.id} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
            {/* Service Name */}
            <div className="flex items-start gap-2">
              <span className="text-gray-400 font-bold mt-2">{index + 1}.</span>
              <input
                type="text"
                value={service.name}
                onChange={(e) => updateService(service.id, 'name', e.target.value)}
                placeholder="Service name"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => removeService(service.id)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={service.quantity}
                  onChange={(e) =>
                    updateService(service.id, 'quantity', parseInt(e.target.value) || 1)
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={service.unit_price}
                  onChange={(e) =>
                    updateService(service.id, 'unit_price', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Total */}
            <div className="text-right">
              <span className="text-gray-400 text-sm">Total: </span>
              <span className="text-green-400 text-xl font-bold">
                {formatCurrency(service.total)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service */}
      {showTemplates && serviceTemplates.length > 0 ? (
        <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-300">Select Template</span>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {serviceTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => addService(template)}
              className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="font-semibold text-white">{template.name}</div>
              <div className="text-sm text-gray-400">{template.description}</div>
              <div className="text-green-400 font-bold mt-1">
                {formatCurrency(template.default_price)} / {template.unit}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => (serviceTemplates.length > 0 ? setShowTemplates(true) : addService())}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      )}

      {/* Notes */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details, terms, or conditions..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
        />
      </div>

      {/* Summary */}
      <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-gray-300">
          <span>Subtotal:</span>
          <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Tax (8%):</span>
          <span className="font-semibold">{formatCurrency(totals.tax)}</span>
        </div>
        <div className="border-t border-gray-600 pt-2 flex justify-between text-white text-lg">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-green-400">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={services.length === 0 || isSending}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white text-lg font-bold transition-colors flex items-center justify-center gap-2"
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Estimate
          </>
        )}
      </button>
    </div>
  )
}

export default QuickEstimateBuilder
