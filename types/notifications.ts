import { Json } from './index'

export type NotificationType =
  | 'job_assigned'
  | 'job_status_changed'
  | 'message_received'
  | 'payment_received'
  | 'invoice_sent'
  | 'campaign_sent'
  | 'system'
  | string

export type NotificationEntityType = 'job' | 'message' | 'contact' | 'invoice' | 'payment' | string

export interface Notification {
  id: string
  account_id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type: NotificationEntityType | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  action_url: string | null
  metadata: Json
  created_at: string
}

export interface NotificationCreateRequest {
  userId: string
  type: NotificationType
  title: string
  message: string
  entityType?: NotificationEntityType
  entityId?: string
  actionUrl?: string
  metadata?: Json
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  limit: number
  offset: number
}

export interface NotificationDetailResponse {
  notification: Notification
}

export interface NotificationCreateResponse {
  success: true
  notification: Notification
}

export interface NotificationMarkReadResponse {
  success: true
  notification: Notification
}

