'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, DollarSign } from 'lucide-react'
import { EstimateSignature } from './EstimateSignature'

interface EstimatePreviewProps {
  estimateId: string
  previewToken?: string
}

export function EstimatePreview({ estimateId, previewToken }: EstimatePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [estimate, setEstimate] = useState<any>(null)
  const [signature, setSignature] = useState<any>(null)

  useEffect(() => {
    fetchEstimate()
  }, [estimateId])

  useEffect(() => {
    // Track view when component mounts
    if (estimate) {
      trackView()
    }
  }, [estimate])

  async function fetchEstimate() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (previewToken) params.append('token', previewToken)

      const response = await fetch(`/api/estimates/${estimateId}/preview?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch estimate')
      }

      const data = await response.json()
      setEstimate(data.estimate)
      setSignature(data.signature)
    } catch (error: any) {
      console.error('Error fetching estimate:', error)
    } finally {
      setLoading(false)
    }
  }

  async function trackView() {
    try {
      await fetch(`/api/estimates/${estimateId}/track-view`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!estimate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Estimate not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estimate #{estimate.id.slice(0, 8)}</CardTitle>
              <CardDescription>
                {estimate.contact?.first_name} {estimate.contact?.last_name}
              </CardDescription>
            </div>
            <Badge variant="outline">{estimate.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Line Items */}
            {estimate.line_items && Array.isArray(estimate.line_items) && (
              <div>
                <h3 className="font-semibold mb-2">Line Items</h3>
                <div className="space-y-2">
                  {estimate.line_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.description || item.name}</p>
                        {item.quantity && (
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} @ ${item.unit_price ? (item.unit_price / 100).toFixed(2) : '0.00'}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">
                        ${item.total ? (item.total / 100).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                ${estimate.total_amount ? (estimate.total_amount / 100).toFixed(2) : '0.00'}
              </span>
            </div>

            {/* Notes */}
            {estimate.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{estimate.notes}</p>
              </div>
            )}

            {/* View Tracking */}
            {estimate.view_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>Viewed {estimate.view_count} time{estimate.view_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      {!signature && estimate.status !== 'accepted' && (
        <EstimateSignature
          estimateId={estimateId}
          onSignatureComplete={() => {
            fetchEstimate() // Refresh to show signature
          }}
        />
      )}

      {/* Signed Status */}
      {signature && (
        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>
              Signed by {signature.signer_name} on{' '}
              {new Date(signature.signed_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <img
              src={signature.signature_data}
              alt="Signature"
              className="border rounded p-4 bg-white"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

