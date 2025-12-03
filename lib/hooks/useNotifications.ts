/**
 * useNotifications Hook
 * Manages notification state with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/api/notifications'
import type { Notification } from '@/types/notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface UseNotificationsOptions {
  enabled?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  onNewNotification?: (notification: Notification) => void
  onError?: (error: Error) => void
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotif: (notificationId: string) => Promise<void>
}

/**
 * useNotifications - Manage notifications with real-time updates
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications({
 *   onNewNotification: (notif) => {
 *     showToast(notif.title, notif.message)
 *   }
 * })
 * ```
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    enabled = true,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    onNewNotification,
    onError
  } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Fetch notifications from API with debouncing
   */
  const fetchNotifications = useCallback(async () => {
    if (!enabled) return

    // Prevent rapid-fire calls with a simple timestamp check
    const now = Date.now()
    const lastFetch = (globalThis as any).__lastNotificationFetch || 0
    const minFetchInterval = 1000 // 1 second minimum between fetches
    
    if (now - lastFetch < minFetchInterval) {
      console.log('[Notifications] Skipping rapid fetch')
      return
    }
    
    (globalThis as any).__lastNotificationFetch = now

    setLoading(true)
    setError(null)

    try {
      const response = await getNotifications({ limit: 50, offset: 0 })
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [enabled, onError])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)

      // Optimistically update UI
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      // Revert on error
      await fetchNotifications()
    }
  }, [fetchNotifications, onError])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead()

      // Update UI
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      // Revert on error
      await fetchNotifications()
    }
  }, [fetchNotifications, onError])

  /**
   * Delete notification
   */
  const deleteNotif = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)

      // Update UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Update unread count if the deleted notification was unread
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      // Revert on error
      await fetchNotifications()
    }
  }, [notifications, fetchNotifications, onError])

  /**
   * Setup real-time subscriptions
   */
  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      // Subscribe to notifications for current user
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification

            // Add to notifications list
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)

            // Trigger callback
            onNewNotification?.(newNotification)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification

            // Update notification in list
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )

            // Recalculate unread count
            setNotifications(current => {
              const newUnreadCount = current.filter(n => !n.is_read).length
              setUnreadCount(newUnreadCount)
              return current
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const deletedNotification = payload.old as Notification

            // Remove from list
            setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id))

            // Update unread count if deleted notification was unread
            if (!deletedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    })

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, onNewNotification])

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (!enabled || !autoRefresh) return

    refreshIntervalRef.current = setInterval(() => {
      fetchNotifications()
    }, refreshInterval)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [enabled, autoRefresh, refreshInterval, fetchNotifications])

  /**
   * Initial fetch on mount with aggressive debouncing
   */
  useEffect(() => {
    if (!enabled) return

    // Use a longer delay and shared debouncing to prevent spam
    const DEBOUNCE_DELAY = 2000 // 2 seconds
    const now = Date.now()
    const globalKey = '__notificationFetchDebounce'
    const lastFetch = (globalThis as any)[globalKey] || 0
    
    if (now - lastFetch < DEBOUNCE_DELAY) {
      console.log('[Notifications] Skipping fetch due to global debounce')
      return
    }
    
    (globalThis as any)[globalKey] = now

    const timeoutId = setTimeout(() => {
      fetchNotifications()
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timeoutId)
  }, [enabled, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotif
  }
}
