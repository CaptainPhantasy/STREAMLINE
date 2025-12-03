'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, Package, X } from 'lucide-react'
import { toast } from 'sonner'
import type { PartBundle, Part } from '@/types/inventory'

export function PartBundles() {
  const [bundles, setBundles] = useState<PartBundle[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    total_cost: '',
    items: [] as Array<{ part_id: string; quantity: number }>,
  })

  useEffect(() => {
    fetchBundles()
    fetchParts()
  }, [])

  async function fetchBundles() {
    try {
      setLoading(true)
      const response = await fetch('/api/parts/bundles?active_only=true')

      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }

      const data = await response.json()
      setBundles(data.bundles || [])
    } catch (error: any) {
      console.error('Error fetching bundles:', error)
      toast.error('Failed to load bundles')
    } finally {
      setLoading(false)
    }
  }

  async function fetchParts() {
    try {
      const response = await fetch('/api/parts')
      if (response.ok) {
        const data = await response.json()
        setParts(data.parts || [])
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
    }
  }

  function handleAddItem() {
    setFormData({
      ...formData,
      items: [...formData.items, { part_id: '', quantity: 1 }],
    })
  }

  function handleRemoveItem(index: number) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  function handleItemChange(index: number, field: 'part_id' | 'quantity', value: string | number) {
    const newItems = [...formData.items]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? Number(value) : value,
    }
    setFormData({ ...formData, items: newItems })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim() || formData.items.length === 0) {
      toast.error('Name and at least one item are required')
      return
    }

    try {
      const response = await fetch('/api/parts/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_cost: formData.total_cost ? parseFloat(formData.total_cost) * 100 : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create bundle')
      }

      toast.success('Bundle created successfully')
      setShowForm(false)
      setFormData({
        name: '',
        description: '',
        sku: '',
        total_cost: '',
        items: [],
      })
      fetchBundles()
    } catch (error: any) {
      console.error('Error creating bundle:', error)
      toast.error(error.message || 'Failed to create bundle')
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Part Bundles</CardTitle>
            <CardDescription>Create bundles/kits of parts</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Bundle Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Standard Service Kit"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="BUNDLE-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bundle description..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bundle Items *</Label>
                <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={item.part_id}
                      onValueChange={(value) => handleItemChange(index, 'part_id', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select part" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                      }
                      className="w-24"
                      placeholder="Qty"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={formData.items.length === 0}>
                Create Bundle
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {bundles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No bundles yet</p>
          ) : (
            bundles.map((bundle) => (
              <div key={bundle.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold">{bundle.name}</h3>
                      {bundle.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                    )}
                    {bundle.total_cost && (
                      <p className="text-sm font-medium text-green-600 mb-2">
                        ${(bundle.total_cost / 100).toFixed(2)}
                      </p>
                    )}
                    {bundle.items && bundle.items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-500">Contains:</p>
                        {bundle.items.map((item, idx) => (
                          <p key={idx} className="text-xs text-gray-600 pl-2">
                            • {item.part?.name || 'Unknown'} (x{item.quantity})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

