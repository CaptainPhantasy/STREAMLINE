'use client'

/**
 * PhotoUploadQueue Component
 *
 * Displays and manages the offline photo upload queue.
 * Automatically syncs when connection is restored.
 *
 * @example
 * ```tsx
 * <PhotoUploadQueue
 *   onUploadComplete={(photo) => console.log('Uploaded:', photo)}
 *   autoSync
 *   maxRetries={3}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { Upload, WifiOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  getQueueItems,
  updateQueueItem,
  removeFromQueue,
  getQueueCount,
} from '@/lib/utils/upload-queue'
import type { PhotoUploadQueueProps, UploadQueueItem, JobPhoto } from '@/lib/types/documents'
import { cn } from '@/lib/utils'

export function PhotoUploadQueue({
  onQueueChange,
  onUploadComplete,
  onUploadError,
  autoSync = true,
  maxRetries = 3,
  className,
}: PhotoUploadQueueProps) {
  const [queueItems, setQueueItems] = useState<UploadQueueItem[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  /**
   * Load queue items from IndexedDB
   */
  const loadQueue = useCallback(async () => {
    try {
      const items = await getQueueItems()
      setQueueItems(items)
      onQueueChange?.(items.length)
    } catch (error) {
      console.error('Failed to load queue:', error)
    }
  }, [onQueueChange])

  /**
   * Handle online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (autoSync) {
        syncQueue()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: 'You are offline',
        description: 'Photos will be uploaded when connection is restored',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial online status
    setIsOnline(navigator.onLine)

    // Load queue on mount
    loadQueue()

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [autoSync, loadQueue, toast])

  /**
   * Upload a single item
   */
  const uploadItem = async (item: UploadQueueItem): Promise<void> => {
    try {
      // Update status to uploading
      await updateQueueItem(item.id, {
        status: 'uploading',
        progress: 0,
      })

      // Create form data
      const formData = new FormData()
      formData.append('file', item.file, item.fileName)
      formData.append('jobId', item.jobId)

      if (item.caption) {
        formData.append('caption', item.caption)
      }

      if (item.category) {
        formData.append('category', item.category)
      }

      // Upload to API
      const response = await fetch('/api/job-photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const data = await response.json()
      const photo: JobPhoto = data.photo

      // Update status to completed
      await updateQueueItem(item.id, {
        status: 'completed',
        progress: 100,
      })

      // Remove from queue after successful upload
      await removeFromQueue(item.id)

      onUploadComplete?.(photo)

      toast({
        title: 'Photo uploaded',
        description: item.fileName,
      })
    } catch (error) {
      console.error('Upload error:', error)
      const err = error as Error

      const retryCount = item.retryCount + 1

      if (retryCount >= maxRetries) {
        // Max retries reached, mark as failed
        await updateQueueItem(item.id, {
          status: 'failed',
          error: err.message,
          retryCount,
        })

        onUploadError?.(err, item)

        toast({
          title: 'Upload failed',
          description: `${item.fileName}: ${err.message}`,
          variant: 'destructive',
        })
      } else {
        // Reset to pending for retry
        await updateQueueItem(item.id, {
          status: 'pending',
          error: err.message,
          retryCount,
        })
      }
    } finally {
      // Reload queue
      await loadQueue()
    }
  }

  /**
   * Sync all pending items
   */
  const syncQueue = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)

    try {
      const pendingItems = await getQueueItems('pending')

      if (pendingItems.length === 0) {
        return
      }

      toast({
        title: 'Syncing photos',
        description: `Uploading ${pendingItems.length} photo(s)...`,
      })

      // Upload items sequentially to avoid overwhelming the connection
      for (const item of pendingItems) {
        await uploadItem(item)
      }

      const count = await getQueueCount('pending')

      if (count === 0) {
        toast({
          title: 'Sync complete',
          description: 'All photos uploaded successfully',
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Retry a failed upload
   */
  const retryUpload = async (item: UploadQueueItem) => {
    await updateQueueItem(item.id, {
      status: 'pending',
      retryCount: 0,
      error: undefined,
    })

    await loadQueue()

    if (isOnline) {
      await uploadItem(item)
    }
  }

  /**
   * Remove item from queue
   */
  const removeItem = async (id: string) => {
    await removeFromQueue(id)
    await loadQueue()
  }

  // Don't render if queue is empty
  if (queueItems.length === 0) {
    return null
  }

  const pendingCount = queueItems.filter((item) => item.status === 'pending').length
  const uploadingCount = queueItems.filter((item) => item.status === 'uploading').length
  const failedCount = queueItems.filter((item) => item.status === 'failed').length

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Upload className="h-5 w-5 text-blue-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-orange-600" />
          )}
          <h3 className="font-semibold">Upload Queue</h3>
          <span className="text-sm text-muted-foreground">
            {pendingCount + uploadingCount} pending
            {failedCount > 0 && `, ${failedCount} failed`}
          </span>
        </div>

        {isOnline && pendingCount > 0 && (
          <Button onClick={syncQueue} disabled={isSyncing} size="sm">
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
          >
            <div className="flex-shrink-0">
              {item.status === 'uploading' && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
              {item.status === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {item.status === 'failed' && (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {item.status === 'pending' && (
                <Upload className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.fileName}</p>
              {item.status === 'uploading' && (
                <Progress value={item.progress} className="h-1 mt-1" />
              )}
              {item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>

            <div className="flex-shrink-0">
              {item.status === 'failed' && (
                <Button
                  onClick={() => retryUpload(item)}
                  size="sm"
                  variant="outline"
                >
                  Retry
                </Button>
              )}
              {item.status !== 'uploading' && (
                <Button
                  onClick={() => removeItem(item.id)}
                  size="sm"
                  variant="ghost"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Export types for external use
 */
export type { PhotoUploadQueueProps }
