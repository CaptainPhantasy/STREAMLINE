'use client'

/**
 * PermissionGate Component
 *
 * A reusable component for conditionally rendering UI based on user permissions.
 * This component can be extracted to any project with minimal configuration.
 *
 * @module lib/auth/PermissionGate
 */

import React from 'react'
import type {
  PermissionGateProps,
  UserWithRole,
  Permission,
  UserRole,
} from '@/lib/types/permissions'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAllowedRole,
} from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

// ============================================================================
// HELPER: Get effective user (real or impersonated)
// ============================================================================

/**
 * Hook to get the effective user considering impersonation
 *
 * @description
 * When impersonating, returns the impersonated user.
 * Otherwise returns the real authenticated user.
 * This ensures permission checks work correctly during impersonation.
 */
function useEffectiveUser(): UserWithRole | null {
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      if (data.user) {
        return {
          id: data.user.id,
          role: data.user.role as UserRole,
          email: data.user.email || '',
          full_name: data.user.full_name || '',
        }
      }
      return null
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false,
  })

  return user || null
}

// ============================================================================
// PERMISSION GATE COMPONENT
// ============================================================================

/**
 * PermissionGate - Conditionally render children based on user permissions
 *
 * @description
 * Wraps content and only renders it if the user has the required permissions.
 * Supports multiple permission checking strategies:
 * - Single permission: `requires="manage_users"`
 * - Any of multiple: `requiresAny={['edit_jobs', 'view_all_jobs']}`
 * - All of multiple: `requiresAll={['view_contacts', 'edit_contacts']}`
 * - Role-based: `allowedRoles={['owner', 'admin']}`
 *
 * @example
 * ```tsx
 * // Single permission
 * <PermissionGate requires="manage_users">
 *   <Button>Delete User</Button>
 * </PermissionGate>
 *
 * // Multiple roles
 * <PermissionGate allowedRoles={['owner', 'admin', 'dispatcher']}>
 *   <NavItem>Dispatch Map</NavItem>
 * </PermissionGate>
 *
 * // With fallback
 * <PermissionGate
 *   requires="view_financials"
 *   fallback={<div>Access Denied</div>}
 *   showFallback
 * >
 *   <FinancialDashboard />
 * </PermissionGate>
 *
 * // Any permission (OR logic)
 * <PermissionGate requiresAny={['edit_jobs', 'view_all_jobs']}>
 *   <JobsList />
 * </PermissionGate>
 *
 * // All permissions (AND logic)
 * <PermissionGate requiresAll={['view_contacts', 'edit_contacts']}>
 *   <ContactEditor />
 * </PermissionGate>
 * ```
 *
 * @param props - PermissionGateProps
 * @returns React component or null
 */
export function PermissionGate({
  children,
  requires,
  requiresAny,
  requiresAll,
  allowedRoles,
  fallback = null,
  showFallback = false,
  user: customUser,
  className,
}: PermissionGateProps) {
  // Get effective user (considering impersonation)
  const effectiveUser = useEffectiveUser()

  // Use custom user if provided, otherwise use effective user
  const user = customUser || effectiveUser

  // Check if any permissions are actually required
  const hasRequirements = 
    !!requires || 
    (requiresAny && requiresAny.length > 0) || 
    (requiresAll && requiresAll.length > 0) || 
    (allowedRoles && allowedRoles.length > 0)

  // If no permissions are required, render children immediately
  if (!hasRequirements) {
    // Wrap in div with className if provided
    if (className) {
      return <div className={className}>{children}</div>
    }
    return <>{children}</>
  }

  // If permissions are required but no user, show fallback or nothing
  if (!user) {
    return showFallback ? <>{fallback}</> : null
  }

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  // Admin users have full access - bypass all permission checks
  if (user.role === 'admin') {
    // Wrap in div with className if provided
    if (className) {
      return <div className={className}>{children}</div>
    }
    return <>{children}</>
  }

  let hasAccess = true

  // Check single required permission
  if (requires) {
    hasAccess = hasPermission(user.role, requires)
  }

  // Check "any of" permissions (OR logic)
  if (requiresAny && requiresAny.length > 0) {
    hasAccess = hasAccess && hasAnyPermission(user.role, requiresAny)
  }

  // Check "all of" permissions (AND logic)
  if (requiresAll && requiresAll.length > 0) {
    hasAccess = hasAccess && hasAllPermissions(user.role, requiresAll)
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = hasAccess && isAllowedRole(user.role, allowedRoles)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null
  }

  // Wrap in div with className if provided
  if (className) {
    return <div className={className}>{children}</div>
  }

  // Otherwise render children directly
  return <>{children}</>
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * OwnerOnly - Render only for owners
 */
export function OwnerOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGate allowedRoles={['owner']}>{children}</PermissionGate>
}

/**
 * AdminOnly - Render only for admins and owners
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGate allowedRoles={['owner', 'admin']}>{children}</PermissionGate>
}

/**
 * DispatcherOnly - Render only for dispatchers, admins, and owners
 */
export function DispatcherOnly({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate allowedRoles={['owner', 'admin', 'dispatcher']}>
      {children}
    </PermissionGate>
  )
}

/**
 * TechOnly - Render only for techs
 */
export function TechOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGate allowedRoles={['tech']}>{children}</PermissionGate>
}

/**
 * SalesOnly - Render only for sales reps
 */
export function SalesOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGate allowedRoles={['sales']}>{children}</PermissionGate>
}

/**
 * DesktopOnly - Render only for desktop users (owner, admin, dispatcher)
 */
export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate requiresAny={['desktop_only', 'desktop_and_mobile']}>
      {children}
    </PermissionGate>
  )
}

/**
 * MobileOnly - Render only for mobile users (tech, sales)
 */
export function MobileOnly({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate requiresAny={['mobile_only', 'desktop_and_mobile']}>
      {children}
    </PermissionGate>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PermissionGate

/**
 * Export all convenience components
 */
export {
  useEffectiveUser,
}
