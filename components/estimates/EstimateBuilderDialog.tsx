'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Loader2, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form' // Assuming these exist or I might need to use basic label/input if not
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useEstimates } from '@/lib/hooks/use-estimates'
import type { Estimate, CreateEstimateRequest, EstimateItemType } from '@/lib/types/estimates'
import { useToast } from '@/lib/toast' // Assuming useToast exists

// Zod Schema
const estimateSchema = z.object({
  contact_id: z.string().min(1, 'Contact is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  valid_until: z.string().optional(),
  tax_rate: z.coerce.number().min(0).max(100),
  customer_notes: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    item_type: z.enum(['labor', 'material', 'equipment', 'other'] as [string, ...string[]]),
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
    unit: z.string().min(1, 'Unit is required'),
    unit_price: z.coerce.number().min(0, 'Price must be >= 0'), // In dollars
  })).min(1, 'At least one item is required')
})

type EstimateFormValues = z.infer<typeof estimateSchema>

interface EstimateBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estimate?: Estimate
  onSave?: (estimate: Estimate) => void
}

export function EstimateBuilderDialog({
  open,
  onOpenChange,
  estimate,
  onSave
}: EstimateBuilderDialogProps) {
  const { toast } = useToast()
  const { create, update } = useEstimates({ enabled: false })
  const [contacts, setContacts] = useState<Array<{ id: string, name: string }>>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      contact_id: '',
      title: '',
      description: '',
      valid_until: '',
      tax_rate: 0,
      customer_notes: '',
      notes: '',
      items: [{ item_type: 'labor', name: '', quantity: 1, unit: 'hour', unit_price: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  // Fetch contacts
  useEffect(() => {
    if (open) {
      setLoadingContacts(true)
      fetch('/api/contacts?limit=100')
        .then(res => res.json())
        .then(data => {
          if (data.contacts) {
            setContacts(data.contacts.map((c: any) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name || ''}`.trim()
            })))
          }
        })
        .catch(err => console.error('Failed to fetch contacts', err))
        .finally(() => setLoadingContacts(false))
    }
  }, [open])

  // Reset form when opening/closing or changing estimate
  useEffect(() => {
    if (open) {
      if (estimate) {
        form.reset({
          contact_id: estimate.contact_id,
          title: estimate.title || '',
          description: estimate.description || '',
          valid_until: estimate.valid_until ? format(new Date(estimate.valid_until), 'yyyy-MM-dd') : '',
          tax_rate: (estimate.tax_rate || 0) * 100, // Convert to percentage
          customer_notes: estimate.customer_notes || '',
          notes: estimate.notes || '',
          items: estimate.estimate_items?.map(item => ({
            item_type: item.item_type,
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price / 100 // Convert cents to dollars
          })) || []
        })
      } else {
        form.reset({
          contact_id: '',
          title: '',
          description: '',
          valid_until: '',
          tax_rate: 0,
          customer_notes: '',
          notes: '',
          items: [{ item_type: 'labor', name: '', quantity: 1, unit: 'hour', unit_price: 0 }]
        })
      }
    }
  }, [open, estimate, form])

  const watchItems = form.watch('items')
  const watchTaxRate = form.watch('tax_rate')

  const subtotal = watchItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0)
  }, 0)
  
  const taxAmount = subtotal * ((watchTaxRate || 0) / 100)
  const totalAmount = subtotal + taxAmount

  const onSubmit = async (data: EstimateFormValues) => {
    try {
      setIsSubmitting(true)
      
      const formattedData: CreateEstimateRequest = {
        contact_id: data.contact_id,
        title: data.title,
        description: data.description,
        tax_rate: data.tax_rate / 100, // Convert percentage to decimal
        valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : undefined,
        customer_notes: data.customer_notes,
        notes: data.notes,
        items: data.items.map(item => ({
          ...item,
          item_type: item.item_type as EstimateItemType,
          unit_price: Math.round(item.unit_price * 100) // Convert dollars to cents
        }))
      }

      let savedEstimate: Estimate
      if (estimate) {
        savedEstimate = await update(estimate.id, formattedData)
        toast({ title: 'Success', description: 'Estimate updated successfully' })
      } else {
        savedEstimate = await create(formattedData)
        toast({ title: 'Success', description: 'Estimate created successfully' })
      }

      onSave?.(savedEstimate)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving estimate:', error)
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save estimate', 
        variant: 'destructive' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{estimate ? 'Edit Estimate' : 'Create Estimate'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <Select 
                value={form.watch('contact_id')} 
                onValueChange={(val) => form.setValue('contact_id', val)}
                disabled={loadingContacts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingContacts ? "Loading..." : "Select Customer"} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.contact_id && (
                <p className="text-sm text-destructive">{form.formState.errors.contact_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input {...form.register('title')} placeholder="e.g. Kitchen Remodel" />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea {...form.register('description')} placeholder="Project description..." />
          </div>

          <div className="border rounded-md p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Line Items</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ item_type: 'labor', name: '', quantity: 1, unit: 'hour', unit_price: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[100px] text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qty = form.watch(`items.${index}.quantity`) || 0
                  const price = form.watch(`items.${index}.unit_price`) || 0
                  const total = qty * price

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select 
                          defaultValue={field.item_type} 
                          onValueChange={(val) => form.setValue(`items.${index}.item_type`, val as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input {...form.register(`items.${index}.name`)} placeholder="Item name" />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} 
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          defaultValue={field.unit} 
                          onValueChange={(val) => form.setValue(`items.${index}.unit`, val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hour">Hour</SelectItem>
                            <SelectItem value="each">Each</SelectItem>
                            <SelectItem value="ft">Ft</SelectItem>
                            <SelectItem value="lb">Lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        ${total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {form.formState.errors.items && (
              <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-8 border-t pt-4">
            <div className="w-[300px] space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Tax Rate (%):</span>
                <Input 
                  type="number" 
                  className="w-20 h-8 text-right"
                  {...form.register('tax_rate', { valueAsNumber: true })}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax Amount:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid Until</label>
              <Input type="date" {...form.register('valid_until')} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Notes</label>
            <Textarea {...form.register('customer_notes')} placeholder="Notes visible to customer..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Internal Notes</label>
            <Textarea {...form.register('notes')} placeholder="Internal team notes..." />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Estimate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}