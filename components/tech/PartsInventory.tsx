'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Package, Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface PartsInventoryProps {
  jobId?: string
  onPartSelected?: (part: any) => void
}

export function PartsInventory({ jobId, onPartSelected }: PartsInventoryProps) {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchParts()
  }, [])

  async function fetchParts() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/tech/parts?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch parts')
      }

      const data = await response.json()
      setParts(data.parts || [])
    } catch (error: any) {
      console.error('Error fetching parts:', error)
      toast.error('Failed to load parts inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchParts()
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery])

  async function handleRequestPart(part: any) {
    if (!jobId) {
      toast.error('No job selected')
      return
    }

    try {
      const response = await fetch('/api/tech/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          part_id: part.id,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request part')
      }

      toast.success(`Requested ${part.name}`)
      onPartSelected?.(part)
    } catch (error: any) {
      console.error('Error requesting part:', error)
      toast.error(error.message || 'Failed to request part')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Parts Inventory
        </CardTitle>
        <CardDescription>View and request parts for jobs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Parts List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : parts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No parts found</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {parts.map((part) => {
              const isLowStock =
                part.quantity_in_stock <= (part.reorder_level || 0)

              return (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{part.name}</p>
                      {isLowStock && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    {part.sku && (
                      <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Stock: {part.quantity_in_stock} {part.unit || 'units'}
                    </p>
                  </div>
                  {jobId && (
                    <Button
                      onClick={() => handleRequestPart(part)}
                      size="sm"
                      variant="outline"
                    >
                      Request
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

