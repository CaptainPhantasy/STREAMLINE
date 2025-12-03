'use client'

import { useState } from 'react'
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OfflineQueueIndicatorProps } from '@/lib/types/tech-mobile'

/**
 * OfflineQueueIndicator - Show pending offline actions
 *
 * Features:
 * - Connection status indicator
 * - Pending items count
 * - Manual sync button
 * - Last synced time
 * - Auto-sync when back online
 * - Expandable queue details
 *
 * @example
 * ```tsx
 * <OfflineQueueIndicator
 *   queueItems={pendingActions}
 *   onSync={syncQueue}
 *   autoSync
 * />
 * ```
 */
export function OfflineQueueIndicator({
  queueItems,
  onSync,
  onViewQueue,
  autoSync = true,
  className,
}: OfflineQueueIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Listen for online/offline events
  useState(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (autoSync && queueItems.length > 0) {
        handleSync()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  const pendingCount = queueItems.filter((item) => item.syncStatus === 'pending').length
  const syncingCount = queueItems.filter((item) => item.syncStatus === 'syncing').length
  const failedCount = queueItems.filter((item) => item.syncStatus === 'failed').length

  const handleSync = async () => {
    if (!isOnline || !onSync || isSyncing) return

    setIsSyncing(true)
    try {
      await onSync()
      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      job_start: 'Job Started',
      job_complete: 'Job Completed',
      photo_upload: 'Photo Upload',
      material_add: 'Material Added',
      time_clock: 'Time Clock',
      voice_note: 'Voice Note',
    }
    return labels[type] || type
  }

  // Don't show if queue is empty and online
  if (queueItems.length === 0 && isOnline) {
    return null
  }

  return (
    <>
      {/* Compact Indicator */}
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'w-full h-14 px-4 rounded-xl',
          'flex items-center justify-between',
          'transition-all active:scale-95',
          isOnline
            ? pendingCount > 0
              ? 'bg-amber-900/50 border-2 border-amber-500'
              : 'bg-green-900/50 border-2 border-green-500'
            : 'bg-red-900/50 border-2 border-red-500',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Cloud className="w-5 h-5 text-white" />
          ) : (
            <CloudOff className="w-5 h-5 text-white" />
          )}
          <div className="text-left">
            <div className="font-bold text-white text-sm">
              {isOnline ? 'Online' : 'Offline Mode'}
            </div>
            {pendingCount > 0 && (
              <div className="text-xs text-gray-300">
                {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
              </div>
            )}
            {lastSyncTime && pendingCount === 0 && (
              <div className="text-xs text-gray-300">
                Last synced: {formatTime(lastSyncTime)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {failedCount > 0 && (
            <div className="px-2 py-1 rounded-full bg-red-600 text-xs font-bold">
              {failedCount} failed
            </div>
          )}
          {syncingCount > 0 && (
            <RefreshCw className="w-4 h-4 animate-spin" />
          )}
        </div>
      </button>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-gray-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Cloud className="w-6 h-6 text-green-500" />
                ) : (
                  <CloudOff className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">Sync Queue</h3>
                  <p className="text-sm text-gray-400">
                    {isOnline ? 'Connected' : 'Offline - Changes will sync when online'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center active:bg-gray-600"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {pendingCount}
                </div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {syncingCount}
                </div>
                <div className="text-xs text-gray-400">Syncing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {failedCount}
                </div>
                <div className="text-xs text-gray-400">Failed</div>
              </div>
            </div>

            {/* Queue Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {queueItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-bold">All synced!</p>
                  <p className="text-sm">No pending actions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-xl p-4 border-2',
                        item.syncStatus === 'pending' && 'bg-amber-900/30 border-amber-700',
                        item.syncStatus === 'syncing' && 'bg-blue-900/30 border-blue-700',
                        item.syncStatus === 'failed' && 'bg-red-900/30 border-red-700',
                        item.syncStatus === 'synced' && 'bg-green-900/30 border-green-700'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-white">
                            {getTypeLabel(item.type)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-bold uppercase',
                            item.syncStatus === 'pending' && 'bg-amber-600',
                            item.syncStatus === 'syncing' && 'bg-blue-600',
                            item.syncStatus === 'failed' && 'bg-red-600',
                            item.syncStatus === 'synced' && 'bg-green-600'
                          )}
                        >
                          {item.syncStatus}
                        </div>
                      </div>

                      {item.lastError && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-red-400">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{item.lastError}</span>
                        </div>
                      )}

                      {item.retryCount > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          Retry attempts: {item.retryCount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-800 p-4 border-t border-gray-700 space-y-3">
              {isOnline && pendingCount > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={cn(
                    'w-full h-14 rounded-xl',
                    'flex items-center justify-center gap-3',
                    'font-bold text-lg',
                    'transition-all active:scale-95',
                    'disabled:opacity-50',
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  <RefreshCw className={cn('w-5 h-5', isSyncing && 'animate-spin')} />
                  {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
                </button>
              )}

              {onViewQueue && (
                <button
                  onClick={() => {
                    setIsExpanded(false)
                    onViewQueue()
                  }}
                  className="w-full h-12 rounded-xl bg-gray-700 hover:bg-gray-600 font-bold text-sm transition-all active:scale-95"
                >
                  VIEW FULL HISTORY
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * CompactSyncStatus - Minimal sync indicator for header
 */
export function CompactSyncStatus({
  pendingCount,
  isOnline,
  onClick,
}: {
  pendingCount: number
  isOnline: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-full',
        isOnline
          ? pendingCount > 0
            ? 'bg-amber-600'
            : 'bg-green-600'
          : 'bg-red-600'
      )}
    >
      {isOnline ? (
        <Cloud className="w-5 h-5 text-white" />
      ) : (
        <CloudOff className="w-5 h-5 text-white" />
      )}
      {pendingCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-gray-900 text-xs font-bold flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </div>
      )}
    </button>
  )
}

export type { OfflineQueueIndicatorProps }
