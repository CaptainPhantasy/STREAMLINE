import { useState, useEffect, useCallback } from 'react'
import { getOfflineDB } from '@/lib/offline/db'
import type { OfflineJob, OfflinePhoto } from '@/lib/offline/db'

interface UseOfflineJobReturn {
  job: OfflineJob | null
  photos: OfflinePhoto[]
  isOnline: boolean
  isSyncing: boolean
  saveJobNotes: (notes: string) => Promise<void>
  addPhoto: (file: File, metadata?: Record<string, unknown>) => Promise<void>
  syncNow: () => Promise<void>
}

export function useOfflineJob(jobId: string): UseOfflineJobReturn {
  const [job, setJob] = useState<OfflineJob | null>(null)
  const [photos, setPhotos] = useState<OfflinePhoto[]>([])
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadJobData = useCallback(async () => {
    try {
      const db = getOfflineDB()
      
      const offlineJob = await db.jobs.get(jobId)
      if (offlineJob) {
        setJob(offlineJob)
      } else if (isOnline) {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (res.ok) {
          const data = await res.json()
          const jobData: OfflineJob = {
            id: data.job.id,
            accountId: data.job.accountId,
            contactId: data.job.contactId,
            status: data.job.status,
            description: data.job.description,
            scheduledStart: data.job.scheduledStart,
            techAssignedId: data.job.techAssignedId,
            syncStatus: 'synced',
            lastModified: Date.now()
          }
          await db.jobs.put(jobData)
          setJob(jobData)
        }
      }

      const offlinePhotos = await db.photos.where('jobId').equals(jobId).toArray()
      setPhotos(offlinePhotos)
    } catch (error) {
      console.error('Failed to load job data:', error)
    }
  }, [jobId, isOnline])

  useEffect(() => {
    loadJobData()
  }, [loadJobData])

  useEffect(() => {
    if (isOnline) {
      syncNow()
    }
  }, [isOnline])

  const saveJobNotes = useCallback(async (notes: string) => {
    try {
      const db = getOfflineDB()
      
      if (job) {
        const updatedJob: OfflineJob = {
          ...job,
          description: notes,
          syncStatus: 'pending',
          lastModified: Date.now()
        }
        
        await db.jobs.put(updatedJob)
        setJob(updatedJob)

        await db.syncQueue.add({
          id: crypto.randomUUID(),
          table: 'jobs',
          operation: 'update',
          data: { id: jobId, description: notes },
          attempts: 0
        })

        if (isOnline) {
          await syncNow()
        }
      }
    } catch (error) {
      console.error('Failed to save notes:', error)
      throw error
    }
  }, [job, jobId, isOnline])

  const addPhoto = useCallback(async (file: File, metadata: Record<string, unknown> = {}) => {
    try {
      const db = getOfflineDB()
      
      const photoData: OfflinePhoto = {
        id: crypto.randomUUID(),
        localId: `local_${Date.now()}`,
        jobId,
        blobData: file,
        metadata: {
          ...metadata,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        },
        syncStatus: 'pending',
        lastModified: Date.now()
      }

      await db.photos.add(photoData)
      setPhotos(prev => [...prev, photoData])

      await db.syncQueue.add({
        id: crypto.randomUUID(),
        table: 'photos',
        operation: 'create',
        data: { photoId: photoData.id, jobId },
        attempts: 0
      })

      if (isOnline) {
        await syncNow()
      }
    } catch (error) {
      console.error('Failed to add photo:', error)
      throw error
    }
  }, [jobId, isOnline])

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const db = getOfflineDB()
      const pendingItems = await db.syncQueue.where('attempts').below(3).toArray()

      for (const item of pendingItems) {
        try {
          if (item.table === 'jobs' && item.operation === 'update') {
            const res = await fetch(`/api/jobs/${item.data.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            })

            if (res.ok) {
              await db.syncQueue.delete(item.id)
              
              const jobToUpdate = await db.jobs.get(item.data.id as string)
              if (jobToUpdate) {
                await db.jobs.update(item.data.id as string, { syncStatus: 'synced' })
              }
            } else {
              await db.syncQueue.update(item.id, {
                attempts: item.attempts + 1,
                lastAttempt: Date.now(),
                error: `HTTP ${res.status}`
              })
            }
          } else if (item.table === 'photos' && item.operation === 'create') {
            const photo = await db.photos.get(item.data.photoId as string)
            if (photo) {
              const formData = new FormData()
              formData.append('photo', photo.blobData)
              formData.append('jobId', jobId)
              formData.append('metadata', JSON.stringify(photo.metadata))

              const res = await fetch('/api/jobs/photos', {
                method: 'POST',
                body: formData
              })

              if (res.ok) {
                const data = await res.json()
                await db.photos.update(photo.id, {
                  syncStatus: 'synced',
                  storagePath: data.path
                })
                await db.syncQueue.delete(item.id)
              } else {
                await db.syncQueue.update(item.id, {
                  attempts: item.attempts + 1,
                  lastAttempt: Date.now(),
                  error: `HTTP ${res.status}`
                })
              }
            }
          }
        } catch (error) {
          console.error('Sync error for item:', item.id, error)
          await db.syncQueue.update(item.id, {
            attempts: item.attempts + 1,
            lastAttempt: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      await loadJobData()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, jobId, loadJobData])

  return {
    job,
    photos,
    isOnline,
    isSyncing,
    saveJobNotes,
    addPhoto,
    syncNow
  }
}
