'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPendingSyncItems, markSynced, incrementSyncAttempt } from '@/lib/offline/db'
import { createClient } from '@/lib/supabase/client'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when back online - with small delay for connection stability
      setTimeout(() => {
        syncPendingItems()
      }, 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get pending items count
  const updatePendingCount = useCallback(async () => {
    try {
      const items = await getPendingSyncItems()
      setPendingCount(items.length)
    } catch (error) {
      console.error('Failed to get pending count:', error)
    }
  }, [])

  // Sync pending items
  const syncPendingItems = useCallback(async () => {
    if (isSyncing || !isOnline) return

    setIsSyncing(true)
    try {
      const items = await getPendingSyncItems()

      for (const item of items) {
        try {
          // Sync based on table
          if (item.table === 'job_gates') {
            await syncGateCompletion(item.data, supabase)
          } else if (item.table === 'job_photos') {
            await syncPhoto(item.data, supabase)
          } else if (item.table === 'gps_logs') {
            await syncGpsLog(item.data, supabase)
          }

          // Mark as synced
          await markSynced(item.id)
        } catch (error) {
          console.error(`Sync failed for ${item.table}:`, error)
          await incrementSyncAttempt(item.id, (error as Error).message)
        }
      }

      await updatePendingCount()
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, supabase, updatePendingCount])

  // Check for pending items on mount
  useEffect(() => {
    updatePendingCount()
  }, [updatePendingCount])

  // Periodically update pending count
  useEffect(() => {
    const interval = setInterval(() => {
      updatePendingCount()
    }, 5000)

    return () => clearInterval(interval)
  }, [updatePendingCount])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow: syncPendingItems,
  }
}

// Sync helper functions
async function syncGateCompletion(data: any, supabase: any) {
  const { error } = await supabase.from('job_gates').insert({
    job_id: data.jobId,
    stage_name: data.stageName,
    status: data.status || 'completed',
    metadata: data.metadata,
    completed_at: data.completedAt || new Date().toISOString(),
    completed_by: data.completedBy,
    requires_exception: data.requiresException,
    satisfaction_rating: data.satisfactionRating,
    review_requested: data.reviewRequested,
    discount_applied: data.discountApplied,
  })

  if (error) throw error
}

async function syncPhoto(data: any, supabase: any) {
  // Photos with blobs need special handling
  if (data.blobData) {
    // Upload blob to storage first
    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(data.storagePath, data.blobData)

    if (uploadError) throw uploadError
  }

  // Then create record
  const { error } = await supabase.from('job_photos').insert({
    job_id: data.jobId,
    storage_path: data.storagePath,
    taken_by: data.takenBy,
    metadata: data.metadata,
  })

  if (error) throw error
}

async function syncGpsLog(data: any, supabase: any) {
  const { error } = await supabase.from('gps_logs').insert({
    account_id: data.accountId,
    user_id: data.userId,
    job_id: data.jobId,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    event_type: data.eventType,
    metadata: data.metadata,
  })

  if (error) throw error
}
