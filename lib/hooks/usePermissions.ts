'use client'

/**
 * usePermissions Hook
 *
 * A reusable React hook for checking user permissions in components.
 * This hook can be extracted to any project with minimal configuration.
 *
 * @module lib/hooks/usePermissions
 */

import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
// import { useImpersonation } from '@/lib/hooks/useImpersonation' // Removed broken import
import type {
  UsePermissionsReturn,
  Permission,
  UserRole,
  UserWithRole,
} from '@/lib/types/permissions'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAllowedRole,
} from '@/lib/auth/permissions'

// ============================================================================
// HOOK: usePermissions
// ============================================================================

/**
 * usePermissions - Access user permissions and role-based checks
 *
 * @description
 * This hook provides a convenient way to check permissions in React components.
 * It automatically handles impersonation and returns memoized permission check functions.
 *
 * @returns UsePermissionsReturn - Object containing permission checking functions and user data
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasPermission, userRole, isOwner, loading } = usePermissions()
 *
 *   if (loading) return <Loader />
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {userRole}!</h1>
 *
 *       {hasPermission('manage_users') && (
 *         <Button>Manage Users</Button>
 *       )}
 *
 *       {isOwner && (
 *         <AdminPanel />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Check multiple permissions
 * function JobsList() {
 *   const { hasAnyPermission, hasAllPermissions } = usePermissions()
 *
 *   const canViewJobs = hasAnyPermission(['view_all_jobs', 'view_assigned_jobs'])
 *   const canEditAndDelete = hasAllPermissions(['edit_jobs', 'delete_jobs'])
 *
 *   if (!canViewJobs) {
 *     return <AccessDenied />
 *   }
 *
 *   return <JobsTable showDeleteButton={canEditAndDelete} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Check roles
 * function NavigationMenu() {
 *   const { isRole, isAdmin, isDispatcher } = usePermissions()
 *
 *   return (
 *     <nav>
 *       {isAdmin && <Link href="/admin">Admin</Link>}
 *       {isDispatcher && <Link href="/dispatch">Dispatch</Link>}
 *       {isRole(['tech', 'sales']) && <Link href="/mobile">Mobile</Link>}
 *     </nav>
 *   )
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  // const { isImpersonating, impersonatedUser, realUser } = useImpersonation() // Removed broken hook
  const isImpersonating = false // Placeholder
  const impersonatedUser = null // Placeholder
  const realUser = null // Placeholder
  const [authUser, setAuthUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  // ============================================================================
  // LOAD USER
  // ============================================================================

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      try {
        // Fetch from Supabase
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (mounted) {
            setAuthUser(null)
            setLoading(false)
          }
          return
        }

        // Get user profile with role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single()

        if (profileError || !userProfile) {
          console.error('Failed to fetch user profile:', profileError)
          // Try to get role from user metadata as fallback
          const userRole = user.user_metadata?.role || user.app_metadata?.role
          console.log('Using role from metadata as fallback:', userRole)

          if (mounted) {
            setAuthUser({
              id: user.id,
              role: userRole as UserRole || null,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            })
            setLoading(false)
          }
          return
        }

        if (mounted) {
          // Cleanup legacy impersonation if present
          if (typeof window !== 'undefined') {
            localStorage.removeItem('impersonatedRole')
          }

          setAuthUser({
            id: userProfile.id,
            role: userProfile.role as UserRole,
            email: user.email || '',  // Use email from auth user
            full_name: userProfile.full_name || user.user_metadata?.full_name || '',
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        if (mounted) {
          setAuthUser(null)
          setLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, []) // No dependencies needed anymore

  // ============================================================================
  // PERMISSION CHECK FUNCTIONS (MEMOIZED)
  // ============================================================================

  const permissionChecks = useMemo(() => {
    const userRole = authUser?.role || null

    return {
      /**
       * Check if user has a specific permission
       */
      hasPermission: (permission: Permission): boolean => {
        return hasPermission(userRole, permission)
      },

      /**
       * Check if user has ANY of the given permissions (OR logic)
       */
      hasAnyPermission: (permissions: Permission[]): boolean => {
        return hasAnyPermission(userRole, permissions)
      },

      /**
       * Check if user has ALL of the given permissions (AND logic)
       */
      hasAllPermissions: (permissions: Permission[]): boolean => {
        return hasAllPermissions(userRole, permissions)
      },

      /**
       * Check if user's role matches one of the given roles
       */
      isRole: (roles: UserRole | UserRole[]): boolean => {
        if (!userRole) return false
        const roleArray = Array.isArray(roles) ? roles : [roles]
        return isAllowedRole(userRole, roleArray)
      },
    }
  }, [authUser])

  // ============================================================================
  // ROLE CONVENIENCE BOOLEANS (MEMOIZED)
  // ============================================================================

  const roleChecks = useMemo(() => {
    const userRole = authUser?.role || null

    return {
      userRole: userRole,
      isOwner: userRole === 'owner',
      isAdmin: userRole === 'admin',
      isDispatcher: userRole === 'dispatcher',
      isTech: userRole === 'tech',
      isSales: userRole === 'sales',
      isCSR: userRole === 'csr',
    }
  }, [authUser])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    user: authUser,
    ...permissionChecks,
    ...roleChecks,
    loading,
  }
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * useIsOwner - Check if current user is an owner
 */
export function useIsOwner(): boolean {
  const { isOwner } = usePermissions()
  return isOwner
}

/**
 * useIsAdmin - Check if current user is an admin or owner
 */
export function useIsAdmin(): boolean {
  const { isOwner, isAdmin } = usePermissions()
  return isOwner || isAdmin
}

/**
 * useIsDispatcher - Check if current user is a dispatcher, admin, or owner
 */
export function useIsDispatcher(): boolean {
  const { isOwner, isAdmin, isDispatcher } = usePermissions()
  return isOwner || isAdmin || isDispatcher
}

/**
 * useCanManageUsers - Check if current user can manage users
 */
export function useCanManageUsers(): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission('manage_users')
}

/**
 * useCanViewAllJobs - Check if current user can view all jobs
 */
export function useCanViewAllJobs(): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission('view_all_jobs')
}

/**
 * useCanManageFinancials - Check if current user can manage financials
 */
export function useCanManageFinancials(): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission('manage_financials')
}

/**
 * useUserRole - Get current user's role
 */
export function useUserRole(): UserRole | null {
  const { userRole } = usePermissions()
  return userRole
}

// ============================================================================
// EXPORTS
// ============================================================================

export default usePermissions
