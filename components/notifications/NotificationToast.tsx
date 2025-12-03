/**
 * NotificationToast Component
 * Real-time toast notifications with auto-dismiss and action buttons
 */

'use client'

import React, { useEffect, useState, useRef } from 'react'
import { X, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notifications'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export interface NotificationToastProps {
  /** Notification to display */
  notification: Notification
  /** Auto-dismiss after milliseconds (0 = no auto-dismiss) */
  duration?: number
  /** Position of toast */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  /** Callback when dismissed */
  onDismiss?: (notificationId: string) => void
  /** Callback when action button is clicked */
  onAction?: (notification: Notification) => void
  /** Show action button */
  showAction?: boolean
  /** Action button text */
  actionText?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Get position classes for toast placement
 */
function getPositionClasses(position: string): string {
  const positions: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  return positions[position] || positions['top-right']
}

/**
 * NotificationToast - Real-time toast notification
 *
 * Displays a floating toast notification that can auto-dismiss.
 * Supports action buttons and click-to-navigate.
 *
 * @example
 * ```tsx
 * <NotificationToast
 *   notification={notification}
 *   duration={5000}
 *   position="top-right"
 *   showAction={true}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function NotificationToast({
  notification,
  duration = 5000,
  position = 'top-right',
  onDismiss,
  onAction,
  showAction = true,
  actionText = 'View',
  className
}: NotificationToastProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  const isMounted = useRef(true)

  // Auto-dismiss timer
  useEffect(() => {
    isMounted.current = true
    
    if (duration === 0) return

    const interval = setInterval(() => {
      if (!isMounted.current) return
      
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100))
        if (newProgress <= 0) {
          handleDismiss()
          return 0
        }
        return newProgress
      })
    }, 100)

    return () => {
      clearInterval(interval)
      isMounted.current = false
    }
  }, [duration])

  // Handle dismiss
  const handleDismiss = () => {
    if (!isMounted.current) return
    
    setIsVisible(false)
    setTimeout(() => {
      if (isMounted.current) {
        onDismiss?.(notification.id)
      }
    }, 150)
  }


  // Handle action button click
  const handleAction = () => {
    if (onAction) {
      onAction(notification)
    } else if (notification.action_url) {
      router.push(notification.action_url)
    }
    handleDismiss()
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed z-50 w-full max-w-sm',
        getPositionClasses(position),
        'animate-in slide-in-from-top-2 duration-300',
        !isVisible && 'animate-out slide-out-to-top-2',
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Progress bar */}
        {duration > 0 && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>

              {/* Action button */}
              {showAction && (notification.action_url || onAction) && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                    className="w-full"
                  >
                    {actionText}
                  </Button>
                </div>
              )}
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-6 w-6 p-0"
              onClick={handleDismiss}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * NotificationToastContainer - Container for managing multiple toasts
 */
export interface NotificationToastContainerProps {
  /** Array of notifications to display */
  notifications: Notification[]
  /** Maximum number of toasts to show at once */
  maxToasts?: number
  /** Position of toasts */
  position?: NotificationToastProps['position']
  /** Auto-dismiss duration */
  duration?: number
  /** Callback when a toast is dismissed */
  onDismiss?: (notificationId: string) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * NotificationToastContainer - Manages multiple toast notifications
 *
 * Displays multiple toast notifications in a queue, respecting maxToasts limit.
 *
 * @example
 * ```tsx
 * <NotificationToastContainer
 *   notifications={recentNotifications}
 *   maxToasts={3}
 *   position="top-right"
 *   duration={5000}
 * />
 * ```
 */
export function NotificationToastContainer({
  notifications,
  maxToasts = 3,
  position = 'top-right',
  duration = 5000,
  onDismiss,
  className
}: NotificationToastContainerProps) {
  const visibleNotifications = notifications.slice(0, maxToasts)

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index
          }}
        >
          <NotificationToast
            notification={notification}
            duration={duration}
            position={position}
            onDismiss={onDismiss}
            className={className}
          />
        </div>
      ))}
    </div>
  )
}


export default NotificationToast
