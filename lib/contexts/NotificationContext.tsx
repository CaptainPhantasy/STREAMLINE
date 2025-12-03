/**
 * NotificationContext
 * Provides notification state and real-time updates to entire app
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useNotifications, type UseNotificationsReturn } from '@/lib/hooks/useNotifications'
import type { Notification } from '@/types/notifications'

interface NotificationContextValue extends UseNotificationsReturn {
  showToast: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
  onShowToast?: (notification: Notification) => void
}

/**
 * NotificationProvider
 * Wraps app to provide notification state and real-time updates
 *
 * @example
 * ```tsx
 * <NotificationProvider onShowToast={showToastNotification}>
 *   <App />
 * </NotificationProvider>
 * ```
 */
export function NotificationProvider({
  children,
  onShowToast
}: NotificationProviderProps) {
  const notificationState = useNotifications({
    enabled: true,
    autoRefresh: false, // Disable auto-refresh to prevent spam
    onNewNotification: (notification) => {
      // Show toast when new notification arrives
      onShowToast?.(notification)
    },
    onError: (error) => {
      console.error('Notification error:', error)
    }
  })

  const showToast = (notification: Notification) => {
    onShowToast?.(notification)
  }

  const value: NotificationContextValue = {
    ...notificationState,
    showToast
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * useNotificationContext
 * Hook to access notification context
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotificationContext()
 * ```
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext)

  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }

  return context
}

export default NotificationContext
