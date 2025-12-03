/**
 * Permission System Type Definitions
 *
 * Defines all permission-related types for role-based access control.
 * This is a REUSABLE module that can be extracted to other projects.
 *
 * @module lib/types/permissions
 */

// ============================================================================
// USER ROLES
// ============================================================================

/**
 * All available user roles in the system
 * Admin is the highest role with full access
 */
export type UserRole = 'admin' | 'owner' | 'dispatcher' | 'tech' | 'sales' | 'csr'

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * All available permissions in the system
 *
 * @description
 * Permissions are granular access controls that can be checked independently.
 * Add new permissions here as the system grows.
 */
export type Permission =
  // User Management
  | 'manage_users'        // Create, edit, delete users
  | 'view_users'          // View user list
  | 'impersonate_users'   // Impersonate other users (owner only)

  // Job Management
  | 'view_all_jobs'       // View all jobs in account
  | 'view_assigned_jobs'  // View only assigned jobs
  | 'create_jobs'         // Create new jobs
  | 'edit_jobs'           // Edit job details
  | 'delete_jobs'         // Delete jobs
  | 'assign_jobs'         // Assign jobs to techs

  // Contact Management
  | 'view_contacts'       // View contacts
  | 'create_contacts'     // Create new contacts
  | 'edit_contacts'       // Edit contact details
  | 'delete_contacts'     // Delete contacts

  // Financial Management
  | 'manage_financials'   // View and manage financial data
  | 'view_financials'     // View financial data (read-only)
  | 'create_invoices'     // Create invoices
  | 'edit_invoices'       // Edit invoices

  // Marketing
  | 'manage_marketing'    // Manage campaigns and templates
  | 'view_marketing'      // View marketing data
  | 'send_campaigns'      // Send marketing campaigns

  // Analytics & Reports
  | 'view_analytics'      // View analytics dashboard
  | 'view_reports'        // View reports
  | 'export_reports'      // Export reports

  // Dispatch & GPS
  | 'view_dispatch_map'   // View dispatch map
  | 'manage_dispatch'     // Manage dispatch operations
  | 'view_gps'            // View GPS tracking

  // Settings
  | 'manage_settings'     // Manage system settings
  | 'view_settings'       // View settings

  // AI & Voice Features
  | 'voice_navigation_access'     // Access voice navigation commands
  | 'predictive_analytics_view'   // View predictive analytics insights

  // Advanced Features
  | 'equipment_management_advanced' // Advanced equipment management
  | 'customer_insights_export'     // Export customer insights data

// ============================================================================
// PERMISSION GROUPS
// ============================================================================

/**
 * Grouped permissions for easier management
 *
 * @description
 * Permission groups allow assigning multiple permissions at once.
 * Useful for creating permission presets or templates.
 */
export interface PermissionGroup {
  name: string
  description: string
  permissions: Permission[]
}

// ============================================================================
// ROLE PERMISSIONS MAP
// ============================================================================

/**
 * Maps each role to its allowed permissions
 *
 * @description
 * This defines what permissions each role has by default.
 * Can be customized per project.
 */
export type RolePermissionsMap = Record<UserRole, Permission[]>

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Function type for checking if a user has a permission
 */
export type PermissionChecker = (
  userRole: UserRole | string | null,
  permission: Permission
) => boolean

/**
 * Function type for checking if a user has any of the given permissions
 */
export type AnyPermissionChecker = (
  userRole: UserRole | string | null,
  permissions: Permission[]
) => boolean

/**
 * Function type for checking if a user has all of the given permissions
 */
export type AllPermissionsChecker = (
  userRole: UserRole | string | null,
  permissions: Permission[]
) => boolean

// ============================================================================
// USER WITH ROLE
// ============================================================================

/**
 * Minimal user interface for permission checking
 *
 * @description
 * This is the minimum user data needed for permission checks.
 * Adapt this interface to match your user model.
 */
export interface UserWithRole {
  id: string
  role: UserRole
  email?: string
  full_name?: string
}

// ============================================================================
// PERMISSION CONTEXT
// ============================================================================

/**
 * Context value for permission system
 *
 * @description
 * Provides permission checking functions and user data.
 */
export interface PermissionContextValue {
  user: UserWithRole | null
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  isRole: (role: UserRole | UserRole[]) => boolean
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for PermissionGate component
 */
export interface PermissionGateProps {
  /**
   * React children to render if permission check passes
   */
  children: React.ReactNode

  /**
   * Single permission required to view children
   */
  requires?: Permission

  /**
   * Multiple permissions (user must have ANY of these)
   */
  requiresAny?: Permission[]

  /**
   * Multiple permissions (user must have ALL of these)
   */
  requiresAll?: Permission[]

  /**
   * Allowed roles (alternative to permission-based checking)
   */
  allowedRoles?: UserRole[]

  /**
   * Fallback content to render if permission check fails
   * @default null (renders nothing)
   */
  fallback?: React.ReactNode

  /**
   * Whether to show fallback content when permission is denied
   * @default false (renders nothing)
   */
  showFallback?: boolean

  /**
   * Custom user object (if not using context)
   */
  user?: UserWithRole | null

  /**
   * Custom className for wrapper (if needed)
   */
  className?: string
}

/**
 * Return type for usePermissions hook
 */
export interface UsePermissionsReturn extends PermissionContextValue {
  userRole: UserRole | null
  isOwner: boolean
  isAdmin: boolean
  isDispatcher: boolean
  isTech: boolean
  isSales: boolean
  isCSR: boolean
  loading: boolean
}
