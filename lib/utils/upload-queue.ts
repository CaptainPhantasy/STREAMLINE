/**
 * Upload Queue Utility
 *
 * IndexedDB-based upload queue for offline photo uploads.
 * Automatically syncs when connection is restored.
 */

import type { UploadQueueItem } from '@/lib/types/documents'

const DB_NAME = 'crm_upload_queue'
const DB_VERSION = 1
const STORE_NAME = 'uploads'

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('jobId', 'jobId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

/**
 * Add item to upload queue
 */
export async function addToQueue(item: Omit<UploadQueueItem, 'id'>): Promise<string> {
  const db = await openDB()
  const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const queueItem: UploadQueueItem = {
    ...item,
    id,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(queueItem)

    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Get all queue items
 */
export async function getQueueItems(status?: UploadQueueItem['status']): Promise<UploadQueueItem[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    let request: IDBRequest

    if (status) {
      const index = store.index('status')
      request = index.getAll(status)
    } else {
      request = store.getAll()
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Update queue item
 */
export async function updateQueueItem(
  id: string,
  updates: Partial<UploadQueueItem>
): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

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

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Remove item from queue
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Get queue count
 */
export async function getQueueCount(status?: UploadQueueItem['status']): Promise<number> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    let request: IDBRequest

    if (status) {
      const index = store.index('status')
      request = index.count(status)
    } else {
      request = store.count()
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Clear completed items older than X days
 */
export async function clearOldItems(daysOld: number = 7): Promise<void> {
  const db = await openDB()
  const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('createdAt')

    const request = index.openCursor()

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result

      if (cursor) {
        const item: UploadQueueItem = cursor.value

        if (item.status === 'completed' && item.createdAt < cutoffDate) {
          cursor.delete()
        }

        cursor.continue()
      }
    }

    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
  })
}

/**
 * Get items by job ID
 */
export async function getQueueItemsByJob(jobId: string): Promise<UploadQueueItem[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('jobId')
    const request = index.getAll(jobId)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => db.close()
  })
}
