'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pen, X, Save, Download } from 'lucide-react'
import { toast } from 'sonner'

interface PhotoMarkupProps {
  imageUrl: string
  onSave?: (annotatedImageUrl: string, annotations: Annotation[]) => void
  onCancel?: () => void
  initialAnnotations?: Annotation[]
}

export interface Annotation {
  id: string
  type: 'text' | 'arrow' | 'circle' | 'rectangle'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color?: string
}

export function PhotoMarkup({
  imageUrl,
  onSave,
  onCancel,
  initialAnnotations = [],
}: PhotoMarkupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [currentTool, setCurrentTool] = useState<'text' | 'arrow' | 'circle' | 'rectangle'>('text')
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      redrawAnnotations(ctx, img)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)
    redrawAnnotations(ctx, imageRef.current)
  }, [annotations])

  function redrawAnnotations(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement
  ) {
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color || '#FF0000'
      ctx.fillStyle = annotation.color || '#FF0000'
      ctx.lineWidth = 2

      switch (annotation.type) {
        case 'text':
          if (annotation.text) {
            ctx.font = '16px Arial'
            ctx.fillText(annotation.text, annotation.x, annotation.y)
          }
          break
        case 'arrow':
          drawArrow(ctx, annotation.x, annotation.y, annotation.width || 0, annotation.height || 0)
          break
        case 'circle':
          if (annotation.width && annotation.height) {
            ctx.beginPath()
            ctx.arc(
              annotation.x + annotation.width / 2,
              annotation.y + annotation.height / 2,
              Math.min(annotation.width, annotation.height) / 2,
              0,
              2 * Math.PI
            )
            ctx.stroke()
          }
          break
        case 'rectangle':
          if (annotation.width && annotation.height) {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
          }
          break
      }
    })
  }

  function drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const headlen = 10
    const angle = Math.atan2(y2 - y1, x2 - x1)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(
      x2 - headlen * Math.cos(angle - Math.PI / 6),
      y2 - headlen * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - headlen * Math.cos(angle + Math.PI / 6),
      y2 - headlen * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (currentTool === 'text') {
      setTextPosition({ x, y })
      return
    }

    setIsDrawing(true)
    setDrawStart({ x, y })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !drawStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx || !imageRef.current) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)
    redrawAnnotations(ctx, imageRef.current)

    // Draw preview
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2

    if (currentTool === 'arrow') {
      drawArrow(ctx, drawStart.x, drawStart.y, x, y)
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(x - drawStart.x, 2) + Math.pow(y - drawStart.y, 2)
      )
      ctx.beginPath()
      ctx.arc(drawStart.x, drawStart.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (currentTool === 'rectangle') {
      ctx.strokeRect(
        drawStart.x,
        drawStart.y,
        x - drawStart.x,
        y - drawStart.y
      )
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !drawStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentTool,
      x: drawStart.x,
      y: drawStart.y,
      width: x - drawStart.x,
      height: y - drawStart.y,
      color: '#FF0000',
    }

    setAnnotations([...annotations, newAnnotation])
    setIsDrawing(false)
    setDrawStart(null)
  }

  function handleAddText() {
    if (!textPosition || !textInput.trim()) return

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      color: '#FF0000',
    }

    setAnnotations([...annotations, newAnnotation])
    setTextInput('')
    setTextPosition(null)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return

    const annotatedImageUrl = canvas.toDataURL('image/png')
    onSave?.(annotatedImageUrl, annotations)
    toast.success('Photo saved with annotations')
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `annotated-photo-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Photo downloaded')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Markup</CardTitle>
        <CardDescription>Add annotations to your photo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool Selection */}
        <div className="flex gap-2">
          <Button
            variant={currentTool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('text')}
          >
            <Pen className="w-4 h-4 mr-2" />
            Text
          </Button>
          <Button
            variant={currentTool === 'arrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('arrow')}
          >
            Arrow
          </Button>
          <Button
            variant={currentTool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('circle')}
          >
            Circle
          </Button>
          <Button
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('rectangle')}
          >
            Rectangle
          </Button>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg overflow-auto max-h-[600px]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="cursor-crosshair"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Text Input */}
        {textPosition && (
          <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
            <Label>Add Text</Label>
            <div className="flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddText()
                  }
                }}
              />
              <Button onClick={handleAddText} size="sm">
                Add
              </Button>
              <Button
                onClick={() => {
                  setTextPosition(null)
                  setTextInput('')
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

