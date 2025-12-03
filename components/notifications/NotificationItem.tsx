/**
 * NotificationItem Component
 * Individual notification card with icon, timestamp, and actions
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Briefcase,
  DollarSign,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notifications'
import { Button } from '@/components/ui/button'

export interface NotificationItemProps {
  /** Notification data */
  notification: Notification
  /** Callback when notification is clicked */
  onClick?: (notification: Notification) => void
  /** Callback when mark as read is clicked */
  onMarkAsRead?: (notificationId: string) => void
  /** Callback when delete is clicked */
  onDelete?: (notificationId: string) => void
  /** Show delete button */
  showDelete?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    job_assigned: <Briefcase className="h-5 w-5" />,
    job_status_changed: <Briefcase className="h-5 w-5" />,
    tech_offline: <AlertCircle className="h-5 w-5" />,
    invoice_overdue: <DollarSign className="h-5 w-5" />,
    invoice_sent: <DollarSign className="h-5 w-5" />,
    payment_received: <CheckCircle className="h-5 w-5" />,
    meeting_reminder: <Calendar className="h-5 w-5" />,
    message_received: <Mail className="h-5 w-5" />,
    campaign_sent: <Mail className="h-5 w-5" />,
    system: <Info className="h-5 w-5" />
  }

  return icons[type] || <Bell className="h-5 w-5" />
}

/**
 * Get color scheme for notification type
 */
function getNotificationColor(type: string): string {
  const colors: Record<string, string> = {
    job_assigned: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    job_status_changed: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    tech_offline: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    invoice_overdue: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    invoice_sent: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    payment_received: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    meeting_reminder: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    message_received: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    campaign_sent: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    system: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
  }

  return colors[type] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
}

/**
 * NotificationItem - Individual notification card
 *
 * Displays a single notification with icon, title, message, and timestamp.
 * Supports clicking to navigate to related page and marking as read.
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   notification={notification}
 *   onClick={(notif) => router.push(notif.action_url)}
 *   onMarkAsRead={markAsRead}
 *   showDelete={true}
 * />
 * ```
 */
export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  showDelete = false,
  className
}: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type)
  const colorScheme = getNotificationColor(notification.type)

  // Format timestamp
  const timestamp = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true
  })

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    onClick?.(notification)

    // Mark as read when clicked (if not already read)
    if (!notification.is_read) {
      onMarkAsRead?.(notification.id)
    }
  }

  const content = (
    <div
      className={cn(
        'relative flex gap-3 p-4 rounded-lg border transition-colors cursor-pointer',
        notification.is_read
          ? 'bg-background border-border hover:bg-accent/50'
          : 'bg-accent/30 border-border hover:bg-accent/50',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any)
        }
      }}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-full', colorScheme)}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium',
              !notification.is_read && 'font-semibold'
            )}
          >
            {notification.title}
          </h4>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mark as read/unread */}
            {!notification.is_read && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(notification.id)
                }}
                title="Mark as read"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {/* Delete */}
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(notification.id)
                }}
                title="Delete notification"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2">
          {timestamp}
        </p>

        {/* Unread indicator dot */}
        {!notification.is_read && (
          <div
            className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500"
            aria-label="Unread"
          />
        )}
      </div>
    </div>
  )

  // Wrap in Link if action_url is provided
  if (notification.action_url) {
    return (
      <Link href={notification.action_url} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export default NotificationItem
