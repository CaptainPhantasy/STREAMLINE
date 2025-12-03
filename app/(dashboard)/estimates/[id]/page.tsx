'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EstimateDetailPanel } from '@/components/estimates/EstimateDetailPanel'
import { EstimateBuilderDialog } from '@/components/estimates/EstimateBuilderDialog'
import { getEstimate } from '@/lib/api/estimates'
import type { Estimate } from '@/lib/types/estimates'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast'

export default function EstimateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const id = params.id as string

  const fetchEstimate = async () => {
    try {
      setLoading(true)
      const data = await getEstimate(id)
      setEstimate(data)
    } catch (error) {
      console.error('Failed to fetch estimate:', error)
      toast({ title: 'Error', description: 'Failed to load estimate', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchEstimate()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Estimate not found</h1>
        <Button variant="link" onClick={() => router.push('/estimates')} className="mt-4">
          Return to Estimates
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/estimates')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <EstimateDetailPanel 
        estimate={estimate} 
        onEdit={() => setShowEditDialog(true)}
        onDelete={() => {
          // Delete logic handled inside panel or we can handle here to redirect
          if (confirm('Are you sure you want to delete this estimate?')) {
            fetch(`/api/estimates/${estimate.id}`, { method: 'DELETE' })
              .then(res => {
                if (res.ok) {
                  toast({ title: 'Success', description: 'Estimate deleted' })
                  router.push('/estimates')
                } else {
                  throw new Error('Failed to delete')
                }
              })
              .catch(() => toast({ title: 'Error', description: 'Could not delete', variant: 'destructive' }))
          }
        }}
      />

      <EstimateBuilderDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        estimate={estimate}
        onSave={(updatedEstimate) => {
          setEstimate(updatedEstimate)
          setShowEditDialog(false)
          fetchEstimate() // Refresh to get sure everything is consistent (e.g. joined data)
        }}
      />
    </div>
  )
}
