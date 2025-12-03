/**
 * Sync Service - Background sync for offline data
 * 
 * Automatically syncs pending changes when online.
 * Uses exponential backoff for retries.
 */

import { 
  getOfflineDB, 
  getPendingSyncItems, 
  markSynced, 
  incrementSyncAttempt,
  type SyncQueueItem 
} from './db'

type SyncStatus = 'idle' | 'syncing' | 'error'

class SyncService {
  private status: SyncStatus = 'idle'
  private syncInterval: NodeJS.Timeout | null = null
  private listeners: Set<(status: SyncStatus) => void> = new Set()

  /**
   * Start the background sync service
   */
  start(intervalMs: number = 30000): void {
    if (this.syncInterval) return
    
    // Sync immediately on start
    this.sync()
    
    // Then sync periodically
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync()
      }
    }, intervalMs)

    // Sync when coming back online
    window.addEventListener('online', this.handleOnline)
  }

  /**
   * Stop the background sync service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    window.removeEventListener('online', this.handleOnline)
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.status
  }

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    const items = await getPendingSyncItems()
    return items.length
  }

  /**
   * Force a sync now
   */
  async sync(): Promise<void> {
    if (this.status === 'syncing' || !navigator.onLine) return

    this.setStatus('syncing')
    
    try {
      const items = await getPendingSyncItems()
      
      for (const item of items) {
        try {
          await this.syncItem(item)
          await markSynced(item.id)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          await incrementSyncAttempt(item.id, errorMsg)
          console.error(`Sync failed for ${item.table}:`, error)
        }
      }
      
      this.setStatus('idle')
    } catch (error) {
      console.error('Sync service error:', error)
      this.setStatus('error')
    }
  }

  private handleOnline = (): void => {
    // Small delay to ensure connection is stable
    setTimeout(() => this.sync(), 1000)
  }

  private setStatus(status: SyncStatus): void {
    this.status = status
    this.listeners.forEach(listener => listener(status))
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    const endpoint = this.getEndpoint(item.table)
    
    switch (item.operation) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        })
        break
        
      case 'update':
        await fetch(`${endpoint}/${item.data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        })
        break
        
      case 'delete':
        await fetch(`${endpoint}/${item.data.id}`, {
          method: 'DELETE',
        })
        break
    }
  }

  private getEndpoint(table: string): string {
    const endpoints: Record<string, string> = {
      jobs: '/api/tech/jobs',
      job_gates: '/api/tech/gates',
      job_photos: '/api/photos',
      gps_logs: '/api/gps',
    }
    return endpoints[table] || `/api/${table}`
  }
}

// Singleton instance
export const syncService = new SyncService()

// React hook for sync status
export function useSyncStatus(): { status: SyncStatus; pendingCount: number } {
  // This would be implemented with useState/useEffect in a real component
  // For now, return the current status
  return {
    status: syncService.getStatus(),
    pendingCount: 0,
  }
}

