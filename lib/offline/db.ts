/**
 * Offline Database using Dexie.js (IndexedDB wrapper)
 * 
 * Stores data locally for offline-first mobile experience.
 * Syncs with Supabase when connection is restored.
 */

import Dexie, { Table } from 'dexie'

// Types for offline storage
export interface OfflineJob {
  id: string
  localId?: string // For jobs created offline
  accountId: string
  contactId?: string
  status: string
  description?: string
  scheduledStart?: string
  techAssignedId?: string
  syncStatus: 'synced' | 'pending' | 'conflict'
  lastModified: number
}

export interface OfflineGateCompletion {
  id: string
  localId?: string
  jobId: string
  stageName: string
  status: 'pending' | 'completed' | 'escalated'
  satisfactionRating?: number
  metadata: Record<string, unknown>
  completedAt?: string
  syncStatus: 'synced' | 'pending' | 'conflict'
  lastModified: number
}

export interface OfflinePhoto {
  id: string
  localId?: string
  jobId: string
  gateId?: string
  blobData: Blob // Store the actual image data
  storagePath?: string // Supabase path once uploaded
  metadata: Record<string, unknown>
  syncStatus: 'synced' | 'pending' | 'failed'
  lastModified: number
}

export interface OfflineGpsLog {
  id: string
  localId?: string
  jobId?: string
  latitude: number
  longitude: number
  accuracy?: number
  eventType: 'arrival' | 'departure' | 'checkpoint' | 'auto'
  metadata: Record<string, unknown>
  createdAt: string
  syncStatus: 'synced' | 'pending'
  lastModified: number
}

export interface SyncQueueItem {
  id: string
  table: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  attempts: number
  lastAttempt?: number
  error?: string
}

// Dexie database class
class CrmOfflineDB extends Dexie {
  jobs!: Table<OfflineJob>
  gateCompletions!: Table<OfflineGateCompletion>
  photos!: Table<OfflinePhoto>
  gpsLogs!: Table<OfflineGpsLog>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('crm-ai-pro-offline')
    
    this.version(1).stores({
      jobs: 'id, localId, accountId, status, syncStatus, lastModified',
      gateCompletions: 'id, localId, jobId, stageName, syncStatus, lastModified',
      photos: 'id, localId, jobId, gateId, syncStatus, lastModified',
      gpsLogs: 'id, localId, jobId, syncStatus, lastModified, createdAt',
      syncQueue: 'id, table, operation, attempts, lastAttempt',
    })
  }
}

// Singleton instance
let db: CrmOfflineDB | null = null

export function getOfflineDB(): CrmOfflineDB {
  if (!db) {
    db = new CrmOfflineDB()
  }
  return db
}

// Helper functions
export async function addToSyncQueue(
  table: string,
  operation: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  const db = getOfflineDB()
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    table,
    operation,
    data,
    attempts: 0,
  })
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = getOfflineDB()
  return db.syncQueue.where('attempts').below(5).toArray()
}

export async function markSynced(id: string): Promise<void> {
  const db = getOfflineDB()
  await db.syncQueue.delete(id)
}

export async function incrementSyncAttempt(id: string, error?: string): Promise<void> {
  const db = getOfflineDB()
  const item = await db.syncQueue.get(id)
  if (item) {
    await db.syncQueue.update(id, {
      attempts: item.attempts + 1,
      lastAttempt: Date.now(),
      error,
    })
  }
}

// Offline job operations
export async function saveJobOffline(job: OfflineJob): Promise<void> {
  const db = getOfflineDB()
  await db.jobs.put(job)
  if (job.syncStatus === 'pending') {
    await addToSyncQueue('jobs', job.localId ? 'create' : 'update', job)
  }
}

export async function getOfflineJobs(accountId: string): Promise<OfflineJob[]> {
  const db = getOfflineDB()
  return db.jobs.where('accountId').equals(accountId).toArray()
}

// Offline gate completion operations
export async function saveGateCompletionOffline(gate: OfflineGateCompletion): Promise<void> {
  const db = getOfflineDB()
  await db.gateCompletions.put(gate)
  if (gate.syncStatus === 'pending') {
    await addToSyncQueue('job_gates', gate.localId ? 'create' : 'update', gate)
  }
}

// Offline photo operations
export async function savePhotoOffline(photo: OfflinePhoto): Promise<void> {
  const db = getOfflineDB()
  await db.photos.put(photo)
  if (photo.syncStatus === 'pending') {
    await addToSyncQueue('job_photos', 'create', { ...photo, blobData: undefined })
  }
}

// Offline GPS log operations
export async function saveGpsLogOffline(log: OfflineGpsLog): Promise<void> {
  const db = getOfflineDB()
  await db.gpsLogs.put(log)
  if (log.syncStatus === 'pending') {
    await addToSyncQueue('gps_logs', 'create', log)
  }
}

