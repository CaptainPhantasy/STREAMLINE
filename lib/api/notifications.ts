/**
 * Notification API Client
 * Reusable API functions for notification management
 */

import type {
  Notification,
  NotificationListResponse,
  NotificationCreateRequest,
  NotificationCreateResponse,
  NotificationMarkReadResponse,
} from '@/types/notifications'

/**
 * API Configuration
 */
export interface NotificationAPIConfig {
  baseUrl?: string
  headers?: Record<string, string>
  onError?: (error: Error) => void
}

/**
 * Notification API Client
 * Handles all notification-related API calls
 */
export class NotificationAPI {
  private baseUrl: string
  private headers: Record<string, string>
  private onError?: (error: Error) => void

  constructor(config: NotificationAPIConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/notifications'
    this.headers = config.headers || {}
    this.onError = config.onError
  }

  /**
   * Get all notifications for current user
   */
  async getNotifications(params: {
    isRead?: boolean
    type?: string
    limit?: number
    offset?: number
  } = {}): Promise<NotificationListResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params.isRead !== undefined) searchParams.set('isRead', String(params.isRead))
      if (params.type) searchParams.set('type', params.type)
      if (params.limit) searchParams.set('limit', String(params.limit))
      if (params.offset) searchParams.set('offset', String(params.offset))

      const response = await fetch(
        `${this.baseUrl}?${searchParams}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Get unread notifications only
   */
  async getUnreadNotifications(params: {
    limit?: number
    offset?: number
  } = {}): Promise<NotificationListResponse> {
    return this.getNotifications({ ...params, isRead: false })
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationMarkReadResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${notificationId}`,
        {
          method: 'PATCH',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Mark a notification as unread
   */
  async markAsUnread(notificationId: string): Promise<NotificationMarkReadResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${notificationId}`,
        {
          method: 'PATCH',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: false })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/read-all`,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${notificationId}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Create a notification (admin/owner only)
   */
  async createNotification(data: NotificationCreateRequest): Promise<NotificationCreateResponse> {
    try {
      const response = await fetch(
        this.baseUrl,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }
}

/**
 * Default instance for this project
 */
export const notificationAPI = new NotificationAPI({
  baseUrl: '/api/notifications',
  onError: (error) => {
    console.error('Notification API Error:', error)
  }
})

/**
 * Convenience functions using the default instance
 */
export const getNotifications = (params?: Parameters<NotificationAPI['getNotifications']>[0]) =>
  notificationAPI.getNotifications(params)

export const getUnreadNotifications = (params?: Parameters<NotificationAPI['getUnreadNotifications']>[0]) =>
  notificationAPI.getUnreadNotifications(params)

export const markNotificationAsRead = (notificationId: string) =>
  notificationAPI.markAsRead(notificationId)

export const markNotificationAsUnread = (notificationId: string) =>
  notificationAPI.markAsUnread(notificationId)

export const markAllNotificationsAsRead = () =>
  notificationAPI.markAllAsRead()

export const deleteNotification = (notificationId: string) =>
  notificationAPI.deleteNotification(notificationId)

export const createNotification = (data: NotificationCreateRequest) =>
  notificationAPI.createNotification(data)
