/**
 * NotificationPanel Component
 * Dropdown panel showing list of notifications with filters
 */

'use client'

import React, { useState } from 'react'
import { Check, Trash2, Filter, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { NotificationItem } from './NotificationItem'
import { useNotificationContext } from '@/lib/contexts/NotificationContext'
import { Loader2 } from 'lucide-react'

export interface NotificationPanelProps {
  /** Callback when panel is closed */
  onClose?: () => void
  /** Callback when a notification is clicked */
  onNotificationClick?: (notificationId: string) => void
  /** Maximum height of the panel */
  maxHeight?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * NotificationPanel - Dropdown notification list
 *
 * Shows all notifications with filtering (all/unread) and bulk actions.
 * Includes infinite scroll for loading more notifications.
 *
 * @example
 * ```tsx
 * <NotificationPanel
 *   onClose={() => setOpen(false)}
 *   maxHeight="500px"
 * />
 * ```
 */
export function NotificationPanel({
  onClose,
  onNotificationClick,
  maxHeight = '500px',
  className
}: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotif
  } = useNotificationContext()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Filter notifications based on active tab
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.is_read)

  // Handle notification click
  const handleNotificationClick = (notificationId: string) => {
    onNotificationClick?.(notificationId)
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div
      className={cn(
        'bg-background border border-border rounded-lg shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <div className="px-4 pt-3 border-b border-border">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <ScrollArea
          className="overflow-y-auto"
          style={{ maxHeight }}
        >
          <TabsContent value="all" className="m-0 p-0">
            <NotificationList
              notifications={filteredNotifications}
              loading={loading}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotif}
            />
          </TabsContent>

          <TabsContent value="unread" className="m-0 p-0">
            <NotificationList
              notifications={filteredNotifications}
              loading={loading}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotif}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * NotificationList - Internal component for rendering notification list
 */
interface NotificationListProps {
  notifications: any[]
  loading: boolean
  onNotificationClick: (notificationId: string) => void
  onMarkAsRead: (notificationId: string) => Promise<void>
  onDelete: (notificationId: string) => Promise<void>
}

function NotificationList({
  notifications,
  loading,
  onNotificationClick,
  onMarkAsRead,
  onDelete
}: NotificationListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No notifications yet
        </p>
      </div>
    )
  }

  // Notification list
  return (
    <div className="p-2 space-y-1">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={() => onNotificationClick(notification.id)}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          showDelete={true}
        />
      ))}
    </div>
  )
}

export default NotificationPanel
