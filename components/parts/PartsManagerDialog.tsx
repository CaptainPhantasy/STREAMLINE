'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useParts } from '@/lib/hooks/use-parts'
import type { Part, CreatePartRequest, PartCategory, PartUnit } from '@/lib/types/parts'
import { useToast } from '@/lib/toast'

// Zod Schema
const partSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.coerce.number().min(0, 'Price must be >= 0'),
  quantity_in_stock: z.coerce.number().int().min(0, 'Quantity must be >= 0'),
  reorder_threshold: z.coerce.number().int().min(0, 'Threshold must be >= 0'),
  supplier_name: z.string().optional(),
  supplier_sku: z.string().optional(),
  supplier_contact: z.string().optional(),
  notes: z.string().optional(),
})

type PartFormValues = z.infer<typeof partSchema>

interface PartsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part?: Part
  onSave?: (part: Part) => void
}

export function PartsManagerDialog({
  open,
  onOpenChange,
  part,
  onSave
}: PartsManagerDialogProps) {
  const { toast } = useToast()
  const { create, update } = useParts({ enabled: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: 'materials',
      unit: 'each',
      unit_price: 0,
      quantity_in_stock: 0,
      reorder_threshold: 0,
      supplier_name: '',
      supplier_sku: '',
      supplier_contact: '',
      notes: ''
    }
  })

  useEffect(() => {
    if (open) {
      if (part) {
        form.reset({
          sku: part.sku || '',
          name: part.name,
          description: part.description || '',
          category: part.category,
          unit: part.unit,
          unit_price: part.unit_price / 100, // Convert cents to dollars
          quantity_in_stock: part.quantity_in_stock,
          reorder_threshold: part.reorder_threshold,
          supplier_name: part.supplier_name || '',
          supplier_sku: part.supplier_sku || '',
          supplier_contact: part.supplier_contact || '',
          notes: part.notes || ''
        })
      } else {
        form.reset({
          sku: '',
          name: '',
          description: '',
          category: 'materials',
          unit: 'each',
          unit_price: 0,
          quantity_in_stock: 0,
          reorder_threshold: 0,
          supplier_name: '',
          supplier_sku: '',
          supplier_contact: '',
          notes: ''
        })
      }
    }
  }, [open, part, form])

  const onSubmit = async (data: PartFormValues) => {
    try {
      setIsSubmitting(true)
      
      const formattedData: CreatePartRequest = {
        sku: data.sku || undefined,
        name: data.name,
        description: data.description,
        category: data.category as PartCategory,
        unit: data.unit as PartUnit,
        unit_price: Math.round(data.unit_price * 100), // Convert dollars to cents
        quantity_in_stock: data.quantity_in_stock,
        reorder_threshold: data.reorder_threshold,
        supplier_name: data.supplier_name || undefined,
        supplier_sku: data.supplier_sku || undefined,
        supplier_contact: data.supplier_contact || undefined,
        notes: data.notes
      }

      let savedPart: Part
      if (part) {
        savedPart = await update(part.id, formattedData)
        toast({ title: 'Success', description: 'Part updated successfully' })
      } else {
        savedPart = await create(formattedData)
        toast({ title: 'Success', description: 'Part created successfully' })
      }

      onSave?.(savedPart)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving part:', error)
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save part', 
        variant: 'destructive' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part ? 'Edit Part' : 'Add New Part'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU</label>
              <Input {...form.register('sku')} placeholder="Auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register('name')} placeholder="Part Name" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea {...form.register('description')} placeholder="Description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={form.watch('category')} 
                onValueChange={(val) => form.setValue('category', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Select 
                value={form.watch('unit')} 
                onValueChange={(val) => form.setValue('unit', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="case">Case</SelectItem>
                  <SelectItem value="ft">Feet</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="lb">Pound</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="gallon">Gallon</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="pair">Pair</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.unit && (
                <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price ($)</label>
              <Input 
                type="number" 
                step="0.01" 
                {...form.register('unit_price', { valueAsNumber: true })} 
              />
              {form.formState.errors.unit_price && (
                <p className="text-sm text-destructive">{form.formState.errors.unit_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity in Stock</label>
              <Input 
                type="number" 
                {...form.register('quantity_in_stock', { valueAsNumber: true })} 
              />
              {form.formState.errors.quantity_in_stock && (
                <p className="text-sm text-destructive">{form.formState.errors.quantity_in_stock.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reorder Threshold</label>
              <Input 
                type="number" 
                {...form.register('reorder_threshold', { valueAsNumber: true })} 
              />
              {form.formState.errors.reorder_threshold && (
                <p className="text-sm text-destructive">{form.formState.errors.reorder_threshold.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier Name</label>
                <Input {...form.register('supplier_name')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier SKU</label>
                <Input {...form.register('supplier_sku')} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier Contact</label>
              <Input {...form.register('supplier_contact')} placeholder="Email or Phone" />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <label className="text-sm font-medium">Notes</label>
            <Textarea {...form.register('notes')} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}