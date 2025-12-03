/**
 * Super Admin User Management Type Definitions
 *
 * Defines all types needed for comprehensive user management functionality
 * accessible only to Super Admin users (role: 'admin')
 *
 * @module lib/types/admin-user-management
 */

import { UserRole, Permission } from './permissions'

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

/**
 * Extended user interface for admin management
 */
export interface AdminUser {
  id: string
  account_id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  status: UserStatus
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  phone: string | null
  department: string | null
  is_active: boolean
  banned_until: string | null
  ban_reason: string | null
  email_verified: boolean
  two_factor_enabled: boolean

  // Additional fields from auth.users
  email_confirmed_at: string | null
  phone_confirmed_at: string | null

  // Activity tracking
  last_activity_at: string | null
  login_count: number
  failed_login_attempts: number
}

/**
 * User status enumeration
 */
export type UserStatus = 'active' | 'banned' | 'suspended' | 'pending'

/**
 * User creation request payload
 */
export interface CreateUserRequest {
  email: string
  password?: string
  full_name?: string
  role: UserRole
  phone?: string
  department?: string
  send_invite?: boolean
  account_id?: string // Only for Super Admin creating users across accounts
}

/**
 * User update request payload
 */
export interface UpdateUserRequest {
  full_name?: string
  role?: UserRole
  phone?: string
  department?: string
  is_active?: boolean
}

/**
 * User ban request payload
 */
export interface BanUserRequest {
  reason: string
  duration?: 'permanent' | 'temporal'
  days?: number // If temporal, number of days to ban
}

/**
 * Bulk operation types
 */
export interface BulkOperation {
  action: 'ban' | 'unban' | 'delete' | 'activate' | 'deactivate' | 'change_role'
  userIds: string[]
  payload?: {
    reason?: string
    duration?: 'permanent' | 'temporal'
    days?: number
    role?: UserRole
  }
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean
  total: number
  processed: number
  failed: number
  errors: Array<{
    userId: string
    error: string
  }>
  details?: {
    banned?: number
    unbanned?: number
    deleted?: number
    activated?: number
    deactivated?: number
    role_changed?: number
  }
}

// ============================================================================
// SEARCH AND FILTERING TYPES
// ============================================================================

/**
 * Search and filter parameters for user list
 */
export interface UserSearchParams {
  q?: string // General search query
  role?: UserRole | UserRole[]
  status?: UserStatus | UserStatus[]
  account_id?: string
  department?: string
  email_verified?: boolean
  two_factor_enabled?: boolean
  created_after?: string
  created_before?: string
  last_active_after?: string
  last_active_before?: string

  // Pagination
  page?: number
  limit?: number
  offset?: number

  // Sorting
  sort_by?: keyof AdminUser
  sort_order?: 'asc' | 'desc'
}

/**
 * Paginated user list response
 */
export interface UserListResponse {
  users: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    applied: Partial<UserSearchParams>
    available: {
      roles: Array<{ role: UserRole; count: number }>
      statuses: Array<{ status: UserStatus; count: number }>
      departments: Array<{ department: string; count: number }>
    }
  }
}

// ============================================================================
// IMPERSONATION TYPES
// ============================================================================

/**
 * Impersonation session data
 */
export interface ImpersonationSession {
  id: string
  admin_id: string
  target_user_id: string
  target_account_id: string
  created_at: string
  expires_at: string
  is_active: boolean
  reason: string | null
}

/**
 * Impersonation request payload
 */
export interface ImpersonationRequest {
  target_user_id: string
  reason?: string
  duration?: number // Duration in hours, defaults to 1
}

/**
 * Impersonation token data
 */
export interface ImpersonationToken {
  type: 'impersonation'
  admin_id: string
  target_user_id: string
  target_account_id: string
  expires_at: string
  session_id: string
}

// ============================================================================
// ACTIVITY LOGGING TYPES
// ============================================================================

/**
 * User activity log entry
 */
export interface UserActivityLog {
  id: string
  user_id: string
  action: UserActivityAction
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
  account_id: string

  // Admin context for actions performed by admin on behalf of user
  admin_id?: string
  admin_action?: boolean
}

/**
 * User activity actions
 */
export type UserActivityAction =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'profile_update'
  | 'role_change'
  | 'account_created'
  | 'account_deleted'
  | 'account_banned'
  | 'account_unbanned'
  | 'account_activated'
  | 'account_deactivated'
  | 'email_verified'
  | 'phone_verified'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'login_failed'
  | 'suspicious_activity'

/**
 * Activity log search parameters
 */
export interface ActivityLogParams {
  user_id?: string
  action?: UserActivityAction | UserActivityAction[]
  resource_type?: string
  admin_id?: string // Filter by admin who performed action
  account_id?: string
  created_after?: string
  created_before?: string

  // Pagination
  page?: number
  limit?: number

  // Sorting
  sort_order?: 'asc' | 'desc'
}

/**
 * Activity log response
 */
export interface ActivityLogResponse {
  logs: UserActivityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

/**
 * Audit log entry for admin actions
 */
export interface AdminAuditLog {
  id: string
  admin_id: string
  action: AdminAuditAction
  target_user_id?: string
  target_account_id?: string
  details: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string

  // Related resources
  affected_users?: string[]
  impersonation_session_id?: string
}

/**
 * Admin audit actions
 */
export type AdminAuditAction =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_banned'
  | 'user_unbanned'
  | 'user_activated'
  | 'user_deactivated'
  | 'role_changed'
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'bulk_operation'
  | 'password_reset'
  | 'email_verification_forced'
  | 'two_factor_reset'

/**
 * Audit log search parameters
 */
export interface AuditLogParams {
  admin_id?: string
  action?: AdminAuditAction | AdminAuditAction[]
  target_user_id?: string
  target_account_id?: string
  created_after?: string
  created_before?: string

  // Pagination
  page?: number
  limit?: number

  // Sorting
  sort_order?: 'asc' | 'desc'
}

// ============================================================================
// USER STATISTICS TYPES
// ============================================================================

/**
 * User statistics for admin dashboard
 */
export interface UserStatistics {
  total_users: number
  active_users: number
  banned_users: number
  suspended_users: number
  pending_users: number

  users_by_role: Array<{
    role: UserRole
    count: number
    percentage: number
  }>

  users_by_status: Array<{
    status: UserStatus
    count: number
    percentage: number
  }>

  users_by_department: Array<{
    department: string
    count: number
  }>

  new_users_this_period: number
  users_with_2fa: number
  users_verified_email: number

  activity_metrics: {
    logins_today: number
    logins_this_week: number
    logins_this_month: number
    active_today: number
    active_this_week: number
    active_this_month: number
  }

  security_metrics: {
    failed_login_attempts_today: number
    suspicious_activities_today: number
    accounts_locked_today: number
  }
}

/**
 * Statistics time period
 */
export type StatisticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year'

// ============================================================================
// API RESPONSE WRAPPER TYPES
// ============================================================================

/**
 * Standard API response wrapper for user management endpoints
 */
export interface AdminApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    timestamp: string
    request_id: string
    admin_id: string
  }
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  success: false
  error: 'Validation Error'
  validation_errors: Array<{
    field: string
    message: string
    code: string
  }>
}

// ============================================================================
// ADMIN USER MANAGEMENT CONFIG
// ============================================================================

/**
 * Admin user management configuration
 */
export interface AdminUserManagementConfig {
  features: {
    user_creation: boolean
    user_deletion: boolean
    role_management: boolean
    impersonation: boolean
    bulk_operations: boolean
    activity_logging: boolean
    audit_logging: boolean
  }

  limits: {
    max_impersonation_duration_hours: number
    max_bulk_operation_users: number
    max_search_results: number
    max_export_records: number
  }

  security: {
    require_reason_for_ban: boolean
    require_reason_for_impersonation: boolean
    log_all_admin_actions: boolean
    enable_suspicious_activity_detection: boolean
  }
}