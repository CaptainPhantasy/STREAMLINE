'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Edit, 
  Trash2, 
  Send, 
  Copy, 
  Download, 
  Briefcase, 
  Loader2,
  MoreHorizontal 
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEstimates } from '@/lib/hooks/use-estimates'
import type { Estimate } from '@/lib/types/estimates'
import { useToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

interface EstimateDetailPanelProps {
  estimate: Estimate
  onEdit?: () => void
  onConvert?: () => void // Custom handler or use default logic
  onDelete?: () => void // Custom handler or use default logic
}

export function EstimateDetailPanel({
  estimate,
  onEdit,
  onConvert,
  onDelete
}: EstimateDetailPanelProps) {
  const { toast } = useToast()
  const router = useRouter()
  // We might want to use the update/delete actions from the hook if they were exposed directly or just rely on the API calls
  // Since we have passed specific actions or generic ones, let's implement the API calls directly here for actions like Send/Duplicate/Convert
  // The useEstimates hook handles CRUD on the list. For detail actions, we can just call API or use fetch.
  // Actually, let's just use fetch for specific actions to keep it simple.

  const [isActionLoading, setIsActionLoading] = useState(false)

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'sent': return 'default'
      case 'viewed': return 'default'
      case 'accepted': return 'success'
      case 'rejected': return 'destructive'
      case 'expired': return 'outline'
      default: return 'default'
    }
  }

  const handleSend = async () => {
    try {
      setIsActionLoading(true)
      const res = await fetch(`/api/estimates/${estimate.id}/send`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to send estimate')
      toast({ title: 'Success', description: 'Estimate sent to customer' })
      // Ideally refetch or update status
      router.refresh()
    } catch (error) {
      toast({ title: 'Error', description: 'Could not send estimate', variant: 'destructive' })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      setIsActionLoading(true)
      const res = await fetch(`/api/estimates/${estimate.id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to duplicate estimate')
      const newEstimate = await res.json()
      toast({ title: 'Success', description: 'Estimate duplicated' })
      router.push(`/estimates/${newEstimate.id}`) // Navigate to new estimate if page exists, or just refresh list
    } catch (error) {
      toast({ title: 'Error', description: 'Could not duplicate estimate', variant: 'destructive' })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleConvert = async () => {
    if (onConvert) {
      onConvert()
      return
    }
    try {
      setIsActionLoading(true)
      const res = await fetch(`/api/estimates/${estimate.id}/convert`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to convert estimate')
      const { job_id } = await res.json()
      toast({ title: 'Success', description: 'Estimate converted to Job' })
      router.push(`/jobs/${job_id}`)
    } catch (error) {
      toast({ title: 'Error', description: 'Could not convert estimate', variant: 'destructive' })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      onDelete()
      return
    }
    if (!confirm('Are you sure you want to delete this estimate?')) return
    try {
      setIsActionLoading(true)
      const res = await fetch(`/api/estimates/${estimate.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete estimate')
      toast({ title: 'Success', description: 'Estimate deleted' })
      router.push('/estimates')
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete estimate', variant: 'destructive' })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setIsActionLoading(true)
      // Trigger download by navigating to the PDF route
      window.open(`/api/estimates/${estimate.id}/pdf`, '_blank')
    } catch (error) {
      toast({ title: 'Error', description: 'Could not download PDF', variant: 'destructive' })
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">
              {estimate.title || 'Untitled Estimate'}
            </CardTitle>
            <CardDescription className="font-mono text-sm mt-1">
              {estimate.estimate_number}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(estimate.status)} className="uppercase">
            {estimate.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Customer</h3>
            <div className="text-sm font-medium">
              <p>{estimate.contact?.name || 'Unknown Customer'}</p>
              <p className="text-muted-foreground font-normal">{estimate.contact?.email}</p>
              <p className="text-muted-foreground font-normal">{estimate.contact?.phone}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Details</h3>
            <div className="text-sm">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(estimate.created_at), 'MMM dd, yyyy')}</span>
              </div>
              {estimate.valid_until && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Valid Until:</span>
                  <span>{format(new Date(estimate.valid_until), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {estimate.description && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{estimate.description}</p>
          </div>
        )}

        {/* Line Items */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Line Items</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimate.estimate_items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0 h-5">
                          {item.item_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${(item.unit_price / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ${(item.total_price / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${(estimate.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({(estimate.tax_rate * 100).toFixed(1)}%):</span>
              <span>${(estimate.tax_amount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${(estimate.total_amount / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Notes */}
        {estimate.customer_notes && (
          <div className="bg-muted/20 p-4 rounded-md">
            <h3 className="font-semibold text-sm mb-1">Notes for Customer</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{estimate.customer_notes}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 justify-end border-t pt-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isActionLoading}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isActionLoading}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Estimate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
          {estimate.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit} disabled={isActionLoading}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button size="sm" onClick={handleSend} disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send to Customer
              </Button>
            </>
          )}
          
          {(estimate.status === 'accepted' || estimate.status === 'sent' || estimate.status === 'viewed') && !estimate.converted_to_job_id && (
            <Button size="sm" onClick={handleConvert} disabled={isActionLoading}>
              <Briefcase className="mr-2 h-4 w-4" /> Convert to Job
            </Button>
          )}
          
          {estimate.converted_to_job_id && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${estimate.converted_to_job_id}`)}>
              View Job
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}