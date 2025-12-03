/**
 * Offline Queue Management with IndexedDB
 * Stores actions when offline and syncs when back online
 */

import type { OfflineQueueItem } from '@/lib/types/tech-mobile'

const DB_NAME = 'CRM_AI_Offline'
const DB_VERSION = 1
const QUEUE_STORE = 'offline_queue'

/**
 * Initialize IndexedDB
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create offline queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        store.createIndex('syncStatus', 'syncStatus', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('type', 'type', { unique: false })
      }
    }
  })
}

/**
 * Add item to offline queue
 */
export async function addToQueue(item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<OfflineQueueItem> {
  const db = await initOfflineDB()

  const queueItem: OfflineQueueItem = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    syncStatus: 'pending',
    ...item,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const request = store.add(queueItem)

    request.onsuccess = () => resolve(queueItem)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all items from offline queue
 */
export async function getQueueItems(status?: OfflineQueueItem['syncStatus']): Promise<OfflineQueueItem[]> {
  const db = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readonly')
    const store = transaction.objectStore(QUEUE_STORE)

    let request: IDBRequest<OfflineQueueItem[]>

    if (status) {
      const index = store.index('syncStatus')
      request = index.getAll(status) as IDBRequest<OfflineQueueItem[]>
    } else {
      request = store.getAll() as IDBRequest<OfflineQueueItem[]>
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Update queue item status
 */
export async function updateQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
  const db = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const item = getRequest.result
      if (!item) {
        reject(new Error('Item not found'))
        return
      }

      const updatedItem = { ...item, ...updates }
      const putRequest = store.put(updatedItem)

      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * Delete queue item
 */
export async function deleteQueueItem(id: string): Promise<void> {
  const db = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all synced items from queue
 */
export async function clearSyncedItems(): Promise<void> {
  const db = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const index = store.index('syncStatus')
    const request = index.openCursor(IDBKeyRange.only('synced'))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Sync queue items to server
 */
export async function syncQueue(): Promise<{
  synced: number
  failed: number
  pending: number
  errors: Array<{ id: string; error: string }>
}> {
  const pendingItems = await getQueueItems('pending')
  const failedItems = await getQueueItems('failed')
  const itemsToSync = [...pendingItems, ...failedItems]

  const results = {
    synced: 0,
    failed: 0,
    pending: 0,
    errors: [] as Array<{ id: string; error: string }>,
  }

  for (const item of itemsToSync) {
    try {
      // Mark as syncing
      await updateQueueItem(item.id, { syncStatus: 'syncing' })

      // Determine endpoint based on type
      let endpoint = ''
      let method = 'POST'

      switch (item.type) {
        case 'job_start':
          endpoint = `/api/tech/jobs/${item.jobId}/start`
          break
        case 'job_complete':
          endpoint = `/api/tech/jobs/${item.jobId}/complete`
          break
        case 'photo_upload':
          endpoint = '/api/photos'
          break
        case 'material_add':
          endpoint = '/api/tech/materials/quick-add'
          break
        case 'time_clock':
          endpoint = '/api/tech/time-clock'
          break
        case 'voice_note':
          endpoint = '/api/notes'
          break
        default:
          throw new Error(`Unknown queue item type: ${item.type}`)
      }

      // Make API call
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Mark as synced
      await updateQueueItem(item.id, {
        syncStatus: 'synced',
        lastError: undefined,
      })
      results.synced++

      // Optionally delete synced items after a delay
      setTimeout(() => deleteQueueItem(item.id), 60000) // Keep for 1 minute
    } catch (error: any) {
      console.error(`Failed to sync queue item ${item.id}:`, error)

      // Increment retry count
      const newRetryCount = item.retryCount + 1
      const maxRetries = 3

      if (newRetryCount >= maxRetries) {
        // Mark as failed after max retries
        await updateQueueItem(item.id, {
          syncStatus: 'failed',
          retryCount: newRetryCount,
          lastError: error.message,
        })
        results.failed++
        results.errors.push({ id: item.id, error: error.message })
      } else {
        // Mark as pending for retry
        await updateQueueItem(item.id, {
          syncStatus: 'pending',
          retryCount: newRetryCount,
          lastError: error.message,
        })
        results.pending++
      }
    }
  }

  return results
}

/**
 * Auto-sync when coming back online
 */
export function setupAutoSync(onSyncComplete?: (results: any) => void): () => void {
  const handleOnline = async () => {
    console.log('Back online - syncing queue...')
    try {
      const results = await syncQueue()
      console.log('Sync complete:', results)
      if (onSyncComplete) {
        onSyncComplete(results)
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }

  window.addEventListener('online', handleOnline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
  }
}
