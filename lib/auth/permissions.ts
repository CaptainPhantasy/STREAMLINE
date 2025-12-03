/**
 * Permission System - Core Logic
 *
 * Defines all permissions, role mappings, and permission checking functions.
 * This is a REUSABLE module that can be configured for any project.
 *
 * @module lib/auth/permissions
 */

import type {
  UserRole,
  Permission,
  RolePermissionsMap,
  PermissionChecker,
  AnyPermissionChecker,
  AllPermissionsChecker,
} from '@/lib/types/permissions'

// ============================================================================
// ROLE PERMISSIONS CONFIGURATION
// ============================================================================

/**
 * Default permission mappings for each role
 *
 * @description
 * This is the single source of truth for role-based permissions.
 * Customize this object to match your project's access control requirements.
 *
 * **Roles Overview:**
 * - **Admin**: Super Admin with full system access (highest role - only Douglas has this)
 * - **Owner**: Full system access (can do everything except super admin tasks)
 * - **Dispatcher**: Job assignment, dispatch operations, GPS tracking
 * - **Tech**: Field technicians, assigned jobs only, time/materials entry
 * - **Sales**: Sales representatives, leads, meetings, contacts, AI briefings
 */
export const ROLE_PERMISSIONS: RolePermissionsMap = {
  /**
   * ADMIN - Super Admin with full system access (highest role)
   */
  admin: [
    // User Management
    'manage_users',
    'view_users',
    'impersonate_users',

    // Job Management
    'view_all_jobs',
    'create_jobs',
    'edit_jobs',
    'delete_jobs',
    'assign_jobs',

    // Contact Management
    'view_contacts',
    'create_contacts',
    'edit_contacts',
    'delete_contacts',

    // Financial Management
    'manage_financials',
    'view_financials',
    'create_invoices',
    'edit_invoices',

    // Marketing
    'manage_marketing',
    'view_marketing',
    'send_campaigns',

    // Analytics & Reports
    'view_analytics',
    'view_reports',
    'export_reports',
    'view_estimates',
    'view_parts',

    // Dispatch & GPS
    'view_dispatch_map',
    'manage_dispatch',
    'view_gps',

    // Settings
    'manage_settings',
    'view_settings',

    // AI & Voice Features
    'voice_navigation_access',
    'predictive_analytics_view',

    // Advanced Features
    'equipment_management_advanced',
    'customer_insights_export',
  ],

  /**
   * OWNER - Full system access
   */
  owner: [
    // User Management
    'manage_users',
    'view_users',
    'impersonate_users',

    // Job Management
    'view_all_jobs',
    'create_jobs',
    'edit_jobs',
    'delete_jobs',
    'assign_jobs',

    // Contact Management
    'view_contacts',
    'create_contacts',
    'edit_contacts',
    'delete_contacts',

    // Financial Management
    'manage_financials',
    'view_financials',
    'create_invoices',
    'edit_invoices',

    // Marketing
    'manage_marketing',
    'view_marketing',
    'send_campaigns',

    // Analytics & Reports
    'view_analytics',
    'view_reports',
    'export_reports',
    'view_estimates',
    'view_parts',

    // Dispatch & GPS
    'view_dispatch_map',
    'manage_dispatch',
    'view_gps',

    // Settings
    'manage_settings',
    'view_settings',

    // AI & Voice Features
    'voice_navigation_access',
    'predictive_analytics_view',

    // Advanced Features
    'equipment_management_advanced',
    'customer_insights_export',
  ],

  /**
   * DISPATCHER - Dispatch operations and job assignment
   */
  dispatcher: [
    // Job Management
    'view_all_jobs',
    'create_jobs',
    'edit_jobs',
    'assign_jobs',

    // Contact Management
    'view_contacts',
    'create_contacts',
    'edit_contacts',

    // Analytics & Reports (limited)
    'view_analytics',
    'view_estimates',
    'view_parts',

    // Dispatch & GPS
    'view_dispatch_map',
    'manage_dispatch',
    'view_gps',

    // Settings
    'view_settings',

    // AI & Voice Features
    'voice_navigation_access',

    // Advanced Features (limited)
    'equipment_management_advanced',
  ],

  /**
   * TECH - Field technicians
   */
  tech: [
    // Job Management (assigned jobs only)
    'view_assigned_jobs',
    'edit_jobs',
    'create_jobs', // Can create job requests

    // Contact Management (view only)
    'view_contacts',

    // AI & Voice Features
    'voice_navigation_access',
  ],

  /**
   * SALES - Sales representatives
   */
  sales: [
    // Contact Management
    'view_contacts',
    'create_contacts',
    'edit_contacts',
    'view_estimates', // For sales to create/view their estimates

    // Marketing (view only)
    'view_marketing',

    // AI & Voice Features
    'voice_navigation_access',
  ],

  /**
   * CSR - Customer Service Representative
   */
  csr: [
    // Contact Management
    'view_contacts',
    'create_contacts',
    'edit_contacts',

    // Job Management (limited)
    'create_jobs',
    'view_all_jobs', // Can view all jobs to assist customers

    // Financial (view only for customer service)
    'view_financials',
    'view_estimates',
    'create_invoices',

    // Dispatch (view map to see tech locations)
    'view_dispatch_map',

    // AI & Voice Features
    'voice_navigation_access',
  ],
}

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if a user role has a specific permission
 *
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns true if the user has the permission, false otherwise
 *
 * @example
 * ```ts
 * hasPermission('owner', 'manage_users') // true
 * hasPermission('tech', 'manage_users') // false
 * hasPermission('admin', 'view_all_jobs') // true
 * ```
 */
export const hasPermission: PermissionChecker = (userRole, permission) => {
  if (!userRole) return false

  const role = userRole as UserRole
  const permissions = ROLE_PERMISSIONS[role]

  if (!permissions) return false

  return permissions.includes(permission)
}

/**
 * Check if a user role has ANY of the given permissions
 *
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns true if the user has at least one of the permissions
 *
 * @example
 * ```ts
 * hasAnyPermission('dispatcher', ['manage_users', 'view_all_jobs']) // true (has view_all_jobs)
 * hasAnyPermission('tech', ['manage_users', 'view_all_jobs']) // false (has neither)
 * ```
 */
export const hasAnyPermission: AnyPermissionChecker = (userRole, permissions) => {
  if (!userRole || !permissions || permissions.length === 0) return false

  return permissions.some((permission) => hasPermission(userRole, permission))
}

/**
 * Check if a user role has ALL of the given permissions
 *
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns true if the user has all of the permissions
 *
 * @example
 * ```ts
 * hasAllPermissions('owner', ['manage_users', 'view_all_jobs']) // true
 * hasAllPermissions('admin', ['manage_users', 'view_all_jobs']) // false (lacks manage_users)
 * ```
 */
export const hasAllPermissions: AllPermissionsChecker = (userRole, permissions) => {
  if (!userRole || !permissions || permissions.length === 0) return false

  return permissions.every((permission) => hasPermission(userRole, permission))
}

/**
 * Check if a user role matches one of the allowed roles
 *
 * @param userRole - The user's role
 * @param allowedRoles - Array of allowed roles
 * @returns true if the user's role is in the allowed roles
 *
 * @example
 * ```ts
 * isAllowedRole('owner', ['owner', 'admin']) // true
 * isAllowedRole('tech', ['owner', 'admin']) // false
 * ```
 */
export const isAllowedRole = (
  userRole: UserRole | string | null,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) return false

  return allowedRoles.includes(userRole as UserRole)
}

// ============================================================================
// ROLE-SPECIFIC HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role can manage other users
 */
export const canManageUsers = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'manage_users')
}

/**
 * Check if a role can view all jobs (not just assigned)
 */
export const canViewAllJobs = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'view_all_jobs')
}

/**
 * Check if a role can manage financial data
 */
export const canManageFinancials = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'manage_financials')
}


/**
 * Check if a role can impersonate other users (owner only)
 */
export const canImpersonateUsers = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'impersonate_users')
}

/**
 * Check if a role can assign jobs to techs
 */
export const canAssignJobs = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'assign_jobs')
}

/**
 * Check if a role can view the dispatch map
 */
export const canViewDispatchMap = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'view_dispatch_map')
}

/**
 * Check if a role can manage marketing campaigns
 */
export const canManageMarketing = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'manage_marketing')
}

/**
 * Check if a role can export reports
 */
export const canExportReports = (role: UserRole | string | null): boolean => {
  return hasPermission(role, 'export_reports')
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

/**
 * Get all permissions for a role
 *
 * @param role - The user's role
 * @returns Array of all permissions the role has
 *
 * @example
 * ```ts
 * getPermissionsForRole('tech')
 * // ['view_assigned_jobs', 'edit_jobs', 'view_contacts']
 * ```
 */
export const getPermissionsForRole = (role: UserRole | string | null): Permission[] => {
  if (!role) return []
  return ROLE_PERMISSIONS[role as UserRole] || []
}

/**
 * Get a human-readable description of a permission
 *
 * @param permission - The permission to describe
 * @returns Human-readable description
 */
export const getPermissionDescription = (permission: Permission): string => {
  const descriptions: Record<Permission, string> = {
    // User Management
    manage_users: 'Create, edit, and delete users',
    view_users: 'View user list',
    impersonate_users: 'Impersonate other users',

    // Job Management
    view_all_jobs: 'View all jobs in the account',
    view_assigned_jobs: 'View only assigned jobs',
    create_jobs: 'Create new jobs',
    edit_jobs: 'Edit job details',
    delete_jobs: 'Delete jobs',
    assign_jobs: 'Assign jobs to technicians',

    // Contact Management
    view_contacts: 'View contacts',
    create_contacts: 'Create new contacts',
    edit_contacts: 'Edit contact details',
    delete_contacts: 'Delete contacts',

    // Financial Management
    manage_financials: 'Manage financial data',
    view_financials: 'View financial data',
    create_invoices: 'Create invoices',
    edit_invoices: 'Edit invoices',

    // Marketing
    manage_marketing: 'Manage marketing campaigns',
    view_marketing: 'View marketing data',
    send_campaigns: 'Send marketing campaigns',

    // Analytics & Reports
    view_analytics: 'View analytics dashboard',
    view_reports: 'View reports',
    export_reports: 'Export reports',

    // Dispatch & GPS
    view_dispatch_map: 'View dispatch map',
    manage_dispatch: 'Manage dispatch operations',
    view_gps: 'View GPS tracking',

    // Estimates & Parts
    view_estimates: 'View and manage estimates',
    view_parts: 'View and manage parts inventory',

    // Settings
    manage_settings: 'Manage system settings',
    view_settings: 'View settings',

    // AI & Voice Features
    voice_navigation_access: 'Access voice navigation commands',
    predictive_analytics_view: 'View predictive analytics insights',

    // Advanced Features
    equipment_management_advanced: 'Advanced equipment management',
    customer_insights_export: 'Export customer insights data',
  }

  return descriptions[permission] || permission
}

/**
 * Get a human-readable role name
 *
 * @param role - The role
 * @returns Human-readable role name
 */
export const getRoleName = (role: UserRole | string | null): string => {
  if (!role) return 'Unknown'

  const roleNames: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    dispatcher: 'Dispatcher',
    tech: 'Technician',
    sales: 'Sales Representative',
    csr: 'Customer Service Representative',
  }

  return roleNames[role as UserRole] || role
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export all permission checking functions
 */
export const permissionChecks = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAllowedRole,
  canManageUsers,
  canViewAllJobs,
  canManageFinancials,
  canImpersonateUsers,
  canAssignJobs,
  canViewDispatchMap,
  canManageMarketing,
  canExportReports,
  getPermissionsForRole,
  getPermissionDescription,
  getRoleName,
}

export default permissionChecks
