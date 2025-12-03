/**
 * Settings Type Definitions
 * Comprehensive types for all settings pages
 */

// ============================================================
// PROFILE SETTINGS
// ============================================================

export interface ProfileSettings {
  full_name: string
  email: string // Read-only
  phone?: string | null
  timezone: string
  language: string
  avatar_url?: string | null
}

export interface ProfileUpdateRequest {
  full_name?: string
  phone?: string | null
  timezone?: string
  language?: string
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  notification_types: {
    job_assigned: boolean
    job_completed: boolean
    invoice_overdue: boolean
    new_message: boolean
    tech_offline: boolean
    estimate_accepted: boolean
    estimate_rejected: boolean
    meeting_reminder: boolean
  }
  quiet_hours: {
    enabled: boolean
    start: string // HH:MM format
    end: string // HH:MM format
  }
}

// ============================================================
// COMPANY SETTINGS (Owner/Admin Only)
// ============================================================

export interface CompanySettings {
  company_name: string
  logo_url?: string | null
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  contact: {
    phone: string
    email: string
    website?: string | null
  }
  business_hours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  financial: {
    tax_rate: number // Percentage (e.g., 8.5 for 8.5%)
    currency: string // USD, EUR, GBP, etc.
    invoice_terms: number // Days (e.g., 30 for Net 30)
  }
}

// ============================================================
// INTEGRATION SETTINGS
// ============================================================

export interface IntegrationStatus {
  connected: boolean
  last_synced?: string | null
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  error_message?: string | null
  email?: string | null // Connected account email
}

export interface IntegrationSettings {
  gmail: IntegrationStatus
  google_calendar: IntegrationStatus
  outlook?: IntegrationStatus
  zapier?: IntegrationStatus
}

// ============================================================
// AUTOMATION SETTINGS (Admin Only)
// ============================================================

export interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: 'job_created' | 'job_completed' | 'invoice_overdue' | 'tech_offline' | 'message_received' | 'estimate_created'
    conditions?: Record<string, any>
  }
  action: {
    type: 'send_email' | 'send_sms' | 'assign_job' | 'create_notification' | 'update_status'
    config: Record<string, any>
  }
  enabled: boolean
  created_at: string
  updated_at: string
  account_id: string
}

export interface AutomationRuleTemplate {
  name: string
  description: string
  trigger: AutomationRule['trigger']
  action: AutomationRule['action']
  category: 'jobs' | 'invoices' | 'communications' | 'assignments'
}

// ============================================================
// AI PROVIDER SETTINGS (Admin Only)
// ============================================================

export interface AIProvider {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'local'
  api_key_encrypted: string
  models: string[]
  selected_model: string
  enabled: boolean
  priority: number // 1 = highest priority (primary), 2 = fallback, etc.
  rate_limits: {
    requests_per_minute: number
    tokens_per_minute: number
  }
  cost_tracking: {
    total_requests: number
    total_tokens: number
    estimated_cost: number
  }
}

export interface AIProviderConfig {
  providers: AIProvider[]
  fallback_enabled: boolean
  cost_limit_monthly?: number | null
  cache_enabled: boolean
}

// ============================================================
// SETTINGS API RESPONSES
// ============================================================

export interface SettingsAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================
// SHARED TYPES
// ============================================================

export type Timezone =
  | 'America/New_York'
  | 'America/Chicago'
  | 'America/Denver'
  | 'America/Los_Angeles'
  | 'America/Anchorage'
  | 'Pacific/Honolulu'
  | 'UTC'
  | 'Europe/London'
  | 'Europe/Paris'
  | 'Asia/Tokyo'
  | 'Australia/Sydney'

export type Language =
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'pt' // Portuguese

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'

// ============================================================
// COMPONENT PROPS
// ============================================================

export interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export interface SettingsRowProps {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

export interface SettingsToggleProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export interface SettingsInputProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'time'
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export interface SettingsSelectProps {
  label: string
  description?: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}
