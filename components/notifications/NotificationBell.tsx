/**
 * NotificationBell Component
 * Header icon with unread count badge that opens notification panel
 */

'use client'

import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NotificationPanel } from './NotificationPanel'
import { useNotificationContext } from '@/lib/contexts/NotificationContext'

export interface NotificationBellProps {
  /** Additional CSS classes */
  className?: string
  /** Custom button variant */
  variant?: 'default' | 'ghost' | 'outline'
  /** Custom button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Show badge even when count is 0 */
  alwaysShowBadge?: boolean
  /** Maximum count to display (shows "99+" if exceeded) */
  maxCount?: number
  /** Enable sound on new notification */
  enableSound?: boolean
  /** Enable vibration on new notification (mobile) */
  enableVibration?: boolean
}

/**
 * NotificationBell - Header icon with unread count
 *
 * Displays a bell icon with an unread notification count badge.
 * Clicking opens the notification panel dropdown.
 *
 * @example
 * ```tsx
 * <NotificationBell
 *   variant="ghost"
 *   size="icon"
 *   maxCount={99}
 *   enableSound={true}
 * />
 * ```
 */
export function NotificationBell({
  className,
  variant = 'ghost',
  size = 'icon',
  alwaysShowBadge = false,
  maxCount = 99,
  enableSound = false,
  enableVibration = false
}: NotificationBellProps) {
  const { unreadCount } = useNotificationContext()
  const [isOpen, setIsOpen] = useState(false)

  // Format count for display
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString()
  const showBadge = alwaysShowBadge || unreadCount > 0

  // Play notification sound
  const playSound = () => {
    if (!enableSound) return

    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Fail silently if audio doesn't play
      })
    } catch (error) {
      // Fail silently
    }
  }

  // Trigger vibration
  const vibrate = () => {
    if (!enableVibration) return

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (error) {
      // Fail silently
    }
  }

  // Handle new notifications
  React.useEffect(() => {
    if (unreadCount > 0) {
      playSound()
      vibrate()
    }
  }, [unreadCount])

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative',
          isOpen && 'bg-accent'
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {showBadge && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1',
              'bg-red-500 text-white text-xs font-bold',
              'animate-in zoom-in duration-200'
            )}
            aria-label={`${unreadCount} unread notifications`}
          >
            {displayCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 h-5 w-5 animate-ping rounded-full bg-red-400 opacity-75"
            aria-hidden="true"
          />
        )}
      </Button>

      {/* Notification panel dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-screen max-w-sm',
              'animate-in slide-in-from-top-2 duration-200'
            )}
          >
            <NotificationPanel
              onClose={() => setIsOpen(false)}
              onNotificationClick={() => {
                // Keep panel open when clicking notifications
                // User can manually close or click backdrop
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
