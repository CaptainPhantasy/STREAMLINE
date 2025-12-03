'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, PenTool, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EstimateSignatureProps {
  estimateId: string
  onSignatureComplete?: () => void
}

export function EstimateSignature({
  estimateId,
  onSignatureComplete,
}: EstimateSignatureProps) {
  const [signing, setSigning] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  function handleMouseUp() {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL('image/png')
    setSignatureData(dataURL)
  }

  function handleClear() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
  }

  async function handleSubmit() {
    if (!signerName || !signatureData) {
      toast.error('Please provide your name and signature')
      return
    }

    setSigning(true)

    try {
      const response = await fetch(`/api/estimates/${estimateId}/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName,
          signer_email: signerEmail || undefined,
          signature_data: signatureData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit signature')
      }

      toast.success('Signature submitted successfully')
      onSignatureComplete?.()
    } catch (error: any) {
      console.error('Error submitting signature:', error)
      toast.error(error.message || 'Failed to submit signature')
    } finally {
      setSigning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          E-Signature
        </CardTitle>
        <CardDescription>Sign this estimate to accept it</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label>Email (Optional)</Label>
          <Input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Signature *</Label>
          <div className="border-2 border-dashed rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="border rounded cursor-crosshair w-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="mt-2"
            >
              Clear
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={signing || !signerName || !signatureData}
          className="w-full"
        >
          {signing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Sign & Accept Estimate
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

