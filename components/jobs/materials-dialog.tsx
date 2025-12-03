'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'
import { confirmDialog } from '@/lib/confirm'

interface Material {
  id: string
  material_name: string
  quantity: number
  unit: string
  unit_cost: number | null
  total_cost: number | null
  supplier: string | null
  notes: string | null
}

interface MaterialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
}

export function MaterialsDialog({ open, onOpenChange, jobId }: MaterialsDialogProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    material_name: '',
    quantity: 1,
    unit: 'each',
    unit_cost: '',
    supplier: '',
    notes: '',
  })

  useEffect(() => {
    if (open && jobId) {
      fetchMaterials()
    }
  }, [open, jobId])

  async function fetchMaterials() {
    setLoading(true)
    try {
      const response = await fetch(`/api/job-materials?jobId=${jobId}`)
      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMaterial() {
    if (!newMaterial.material_name.trim()) {
      toastError('Please enter a material name')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/job-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          material_name: newMaterial.material_name,
          quantity: newMaterial.quantity,
          unit: newMaterial.unit,
          unit_cost: newMaterial.unit_cost ? Math.round(parseFloat(newMaterial.unit_cost) * 100) : null,
          supplier: newMaterial.supplier || null,
          notes: newMaterial.notes || null,
        }),
      })

      if (response.ok) {
        await fetchMaterials()
        setNewMaterial({
          material_name: '',
          quantity: 1,
          unit: 'each',
          unit_cost: '',
          supplier: '',
          notes: '',
        })
        toastSuccess('Material added successfully')
      } else {
        const error = await response.json()
        toastError('Failed to add material', error.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error adding material:', error)
      toastError('Failed to add material', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    const confirmed = await confirmDialog({
      title: 'Delete Material',
      description: 'Are you sure you want to delete this material? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    
    if (!confirmed) return

    setSaving(true)
    try {
      const response = await fetch(`/api/job-materials/${materialId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toastSuccess('Material deleted successfully')
        await fetchMaterials()
      } else {
        const error = await response.json()
        toastError('Failed to delete material', error.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      toastError('Failed to delete material', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function formatCurrency(cents: number | null): string {
    if (!cents) return '$0.00'
    return `$${(cents / 100).toFixed(2)}`
  }

  const totalCost = materials.reduce((sum, m) => sum + (m.total_cost || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Material Usage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Material Form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material_name">Material Name *</Label>
                  <Input
                    id="material_name"
                    value={newMaterial.material_name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, material_name: e.target.value })}
                    placeholder="e.g., Pipe, Wire, Fitting"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    placeholder="each, ft, lb, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMaterial.unit_cost}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={newMaterial.notes}
                    onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddMaterial}
                disabled={saving || !newMaterial.material_name.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </CardContent>
          </Card>

          {/* Materials List */}
          {loading ? (
            <div className="text-center py-8 text-neutral-500">Loading materials...</div>
          ) : materials.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center font-semibold p-2 bg-neutral-100 rounded">
                <span>Total Materials Cost:</span>
                <span className="text-lg">{formatCurrency(totalCost)}</span>
              </div>
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{material.material_name}</span>
                          <span className="text-sm text-neutral-500">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                        {material.unit_cost && (
                          <p className="text-sm text-neutral-600">
                            ${(material.unit_cost / 100).toFixed(2)} per {material.unit}
                          </p>
                        )}
                        {material.supplier && (
                          <p className="text-xs text-neutral-500">Supplier: {material.supplier}</p>
                        )}
                        {material.notes && (
                          <p className="text-xs text-neutral-500 mt-1">{material.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          {formatCurrency(material.total_cost)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id)}
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              No materials added yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

