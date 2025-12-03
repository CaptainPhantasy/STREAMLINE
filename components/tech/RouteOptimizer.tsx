'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Route, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface RouteOptimizerProps {
  jobIds: string[]
  originLocation?: { lat: number; lng: number }
  onOptimized?: (optimizedOrder: string[]) => void
}

export function RouteOptimizer({
  jobIds,
  originLocation,
  onOptimized,
}: RouteOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([])

  async function handleOptimize() {
    if (jobIds.length < 2) {
      toast.error('Need at least 2 jobs to optimize route')
      return
    }

    setOptimizing(true)

    try {
      const response = await fetch('/api/schedule/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_ids: jobIds,
          origin_location: originLocation,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to optimize route')
      }

      const data = await response.json()
      setOptimizedOrder(data.optimized_order || [])
      onOptimized?.(data.optimized_order || [])
      toast.success('Route optimized successfully')
    } catch (error: any) {
      console.error('Error optimizing route:', error)
      toast.error(error.message || 'Failed to optimize route')
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Route Optimization
        </CardTitle>
        <CardDescription>
          Optimize job order for minimal travel time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>{jobIds.length} job(s) selected</p>
          {originLocation && (
            <p className="text-xs text-gray-500 mt-1">
              Origin: {originLocation.lat.toFixed(4)}, {originLocation.lng.toFixed(4)}
            </p>
          )}
        </div>

        <Button
          onClick={handleOptimize}
          disabled={optimizing || jobIds.length < 2}
          className="w-full"
        >
          {optimizing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Route className="w-4 h-4 mr-2" />
              Optimize Route
            </>
          )}
        </Button>

        {optimizedOrder.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Optimized Order:</p>
            <div className="space-y-1">
              {optimizedOrder.map((jobId, index) => (
                <div
                  key={jobId}
                  className="flex items-center gap-2 p-2 border rounded text-sm"
                >
                  <span className="font-medium text-gray-500">#{index + 1}</span>
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700">{jobId.substring(0, 8)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

