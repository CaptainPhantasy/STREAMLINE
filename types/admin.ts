import { Json } from './index'

export interface AccountSettings {
  name: string
  slug: string
  inboundEmailDomain: string | null
  googleReviewLink?: string | null
  settings: Json & {
    businessHours?: {
      open: string
      close: string
      timezone: string
    }
    branding?: {
      primaryColor: string
      logo: string
    }
  }
}

export interface AuditLog {
  id: string
  account_id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  changes?: Json | null // Database column name
  details?: Json | null // Alternative field name used in some contexts
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Relations
  user?: {
    id?: string
    full_name: string | null
    role?: string | null
  }
}

export interface AuditLogListResponse {
  logs: AuditLog[]
  total: number
  limit: number
  offset: number
}

