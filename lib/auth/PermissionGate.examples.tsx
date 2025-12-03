/**
 * PermissionGate Usage Examples
 *
 * This file contains comprehensive examples of how to use the permission system.
 * Use these examples as a reference when implementing permission checks in your components.
 *
 * @module lib/auth/PermissionGate.examples
 */

import React from 'react'
import {
  PermissionGate,
  OwnerOnly,
  AdminOnly,
  DispatcherOnly,
  TechOnly,
  SalesOnly,
  DesktopOnly,
  MobileOnly,
} from '@/lib/auth/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'

// ============================================================================
// EXAMPLE 1: Basic Permission Checks
// ============================================================================

/**
 * Example 1: Hide/show UI elements based on single permission
 */
export function Example1_BasicPermission() {
  return (
    <div>
      <h1>User Management</h1>

      {/* Only show "Delete User" button to users with manage_users permission */}
      <PermissionGate requires="manage_users">
        <button className="btn-danger">Delete User</button>
      </PermissionGate>

      {/* Only show "View Users" link to users with view_users permission */}
      <PermissionGate requires="view_users">
        <a href="/users">View All Users</a>
      </PermissionGate>
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Role-Based Checks
// ============================================================================

/**
 * Example 2: Show UI elements based on user roles
 */
export function Example2_RoleBasedAccess() {
  return (
    <nav>
      {/* Show admin panel only to owners and admins */}
      <PermissionGate allowedRoles={['owner', 'admin']}>
        <a href="/admin">Admin Panel</a>
      </PermissionGate>

      {/* Show dispatch map to dispatchers, admins, and owners */}
      <PermissionGate allowedRoles={['owner', 'admin', 'dispatcher']}>
        <a href="/dispatch/map">Dispatch Map</a>
      </PermissionGate>

      {/* Show mobile dashboard only to techs and sales */}
      <PermissionGate allowedRoles={['tech', 'sales']}>
        <a href="/m/dashboard">Mobile Dashboard</a>
      </PermissionGate>
    </nav>
  )
}

// ============================================================================
// EXAMPLE 3: Multiple Permission Checks (OR Logic)
// ============================================================================

/**
 * Example 3: Show content if user has ANY of the given permissions
 */
export function Example3_AnyPermission() {
  return (
    <div>
      {/* Show jobs list if user can view all jobs OR view assigned jobs */}
      <PermissionGate requiresAny={['view_all_jobs', 'view_assigned_jobs']}>
        <div>
          <h2>Jobs List</h2>
          <p>Your jobs appear here</p>
        </div>
      </PermissionGate>

      {/* Show contact editor if user can create OR edit contacts */}
      <PermissionGate requiresAny={['create_contacts', 'edit_contacts']}>
        <button>Edit Contact</button>
      </PermissionGate>
    </div>
  )
}

// ============================================================================
// EXAMPLE 4: Multiple Permission Checks (AND Logic)
// ============================================================================

/**
 * Example 4: Show content only if user has ALL of the given permissions
 */
export function Example4_AllPermissions() {
  return (
    <div>
      {/* Show advanced editor only if user can both view and edit */}
      <PermissionGate requiresAll={['view_contacts', 'edit_contacts']}>
        <div>
          <h2>Advanced Contact Editor</h2>
          <p>Full editing capabilities</p>
        </div>
      </PermissionGate>

      {/* Show financial export only if user can view and export */}
      <PermissionGate requiresAll={['view_financials', 'export_reports']}>
        <button>Export Financial Report</button>
      </PermissionGate>
    </div>
  )
}

// ============================================================================
// EXAMPLE 5: With Fallback Content
// ============================================================================

/**
 * Example 5: Show custom message when permission is denied
 */
export function Example5_WithFallback() {
  return (
    <div>
      <h1>Financial Dashboard</h1>

      <PermissionGate
        requires="view_financials"
        fallback={
          <div className="alert alert-warning">
            <p>You don't have permission to view financial data.</p>
            <p>Contact your administrator for access.</p>
          </div>
        }
        showFallback
      >
        <div>
          <h2>Revenue Overview</h2>
          <p>$123,456 this month</p>
        </div>
      </PermissionGate>
    </div>
  )
}

// ============================================================================
// EXAMPLE 6: Using Convenience Components
// ============================================================================

/**
 * Example 6: Use pre-built convenience components for common roles
 */
export function Example6_ConvenienceComponents() {
  return (
    <div>
      {/* Owner-only content */}
      <OwnerOnly>
        <div className="owner-panel">
          <h2>Owner Settings</h2>
          <button>Manage Billing</button>
        </div>
      </OwnerOnly>

      {/* Admin-only content (owners + admins) */}
      <AdminOnly>
        <div className="admin-panel">
          <h2>Admin Tools</h2>
          <button>View Logs</button>
        </div>
      </AdminOnly>

      {/* Dispatcher content */}
      <DispatcherOnly>
        <div className="dispatcher-panel">
          <h2>Dispatch Controls</h2>
          <button>Auto-Assign Jobs</button>
        </div>
      </DispatcherOnly>

      {/* Tech-only content */}
      <TechOnly>
        <div className="tech-panel">
          <h2>My Jobs</h2>
          <button>Clock In</button>
        </div>
      </TechOnly>

      {/* Sales-only content */}
      <SalesOnly>
        <div className="sales-panel">
          <h2>My Leads</h2>
          <button>Schedule Meeting</button>
        </div>
      </SalesOnly>
    </div>
  )
}

// ============================================================================
// EXAMPLE 7: Platform-Specific Content
// ============================================================================

/**
 * Example 7: Show different content for desktop vs mobile users
 */
export function Example7_PlatformSpecific() {
  return (
    <div>
      {/* Desktop-only features */}
      <DesktopOnly>
        <div className="desktop-features">
          <h2>Desktop Dashboard</h2>
          <button>⌘K Command Palette</button>
          <button>Advanced Analytics</button>
        </div>
      </DesktopOnly>

      {/* Mobile-only features */}
      <MobileOnly>
        <div className="mobile-features">
          <h2>Mobile Dashboard</h2>
          <button>Quick Actions</button>
          <button>Clock In/Out</button>
        </div>
      </MobileOnly>
    </div>
  )
}

// ============================================================================
// EXAMPLE 8: Using the usePermissions Hook
// ============================================================================

/**
 * Example 8: Programmatic permission checks in component logic
 */
export function Example8_UsePermissionsHook() {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    userRole,
    isOwner,
    isAdmin,
    loading,
  } = usePermissions()

  if (loading) {
    return <div>Loading...</div>
  }

  // Use permission checks in conditional logic
  const canDeleteUsers = hasPermission('manage_users')
  const canViewJobs = hasAnyPermission(['view_all_jobs', 'view_assigned_jobs'])
  const canFullyManageContacts = hasAllPermissions(['view_contacts', 'edit_contacts', 'delete_contacts'])
  const isManagementRole = isRole(['owner', 'admin', 'dispatcher'])

  return (
    <div>
      <h1>Welcome, {userRole}!</h1>

      {/* Use boolean in JSX */}
      {canDeleteUsers && (
        <button>Delete User</button>
      )}

      {/* Use in component props */}
      <JobsList
        showAllJobs={canViewJobs}
        enableFullEdit={canFullyManageContacts}
      />

      {/* Use in conditional rendering */}
      {isOwner ? (
        <OwnerDashboard />
      ) : isAdmin ? (
        <AdminDashboard />
      ) : isManagementRole ? (
        <ManagementDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 9: Nested Permission Gates
// ============================================================================

/**
 * Example 9: Combine multiple permission checks with nesting
 */
export function Example9_NestedGates() {
  return (
    <div>
      <h1>Settings</h1>

      {/* First check: Can user view settings? */}
      <PermissionGate requires="view_settings">
        <div className="settings-panel">
          <h2>System Settings</h2>

          {/* Nested check: Can user manage settings? */}
          <PermissionGate requires="manage_settings">
            <button>Edit Settings</button>
            <button>Reset to Default</button>
          </PermissionGate>

          {/* Another nested check: Owner-only danger zone */}
          <OwnerOnly>
            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <button className="btn-danger">Delete Account</button>
            </div>
          </OwnerOnly>
        </div>
      </PermissionGate>
    </div>
  )
}

// ============================================================================
// EXAMPLE 10: Dynamic Permission Checks
// ============================================================================

/**
 * Example 10: Check permissions dynamically based on data
 */
export function Example10_DynamicChecks() {
  const { hasPermission } = usePermissions()

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', permission: null },
    { label: 'Jobs', href: '/jobs', permission: 'view_all_jobs' as const },
    { label: 'Contacts', href: '/contacts', permission: 'view_contacts' as const },
    { label: 'Financials', href: '/finance', permission: 'view_financials' as const },
    { label: 'Settings', href: '/settings', permission: 'manage_settings' as const },
  ]

  return (
    <nav>
      {menuItems.map((item) => {
        // Skip items user doesn't have permission for
        if (item.permission && !hasPermission(item.permission)) {
          return null
        }

        return (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

// ============================================================================
// EXAMPLE 11: Protecting Actions (not just UI)
// ============================================================================

/**
 * Example 11: Use permission checks in event handlers
 */
export function Example11_ProtectActions() {
  const { hasPermission } = usePermissions()

  const handleDeleteUser = (userId: string) => {
    // Always check permission before executing sensitive actions
    if (!hasPermission('manage_users')) {
      alert('You do not have permission to delete users')
      return
    }

    // Proceed with deletion
    console.log('Deleting user:', userId)
  }

  const handleExportReport = () => {
    if (!hasPermission('export_reports')) {
      alert('You do not have permission to export reports')
      return
    }

    // Proceed with export
    console.log('Exporting report...')
  }

  return (
    <div>
      <button onClick={() => handleDeleteUser('user-123')}>
        Delete User
      </button>

      <button onClick={handleExportReport}>
        Export Report
      </button>
    </div>
  )
}

// ============================================================================
// EXAMPLE 12: Combining with Custom Logic
// ============================================================================

/**
 * Example 12: Combine permission checks with custom business logic
 */
export function Example12_CustomLogic() {
  const { hasPermission, isOwner, userRole } = usePermissions()
  const [jobData, setJobData] = React.useState({ status: 'open', assignedTo: 'user-123' })
  const currentUserId = 'user-456'

  // Custom logic: Can edit if user has edit_jobs permission OR is assigned tech
  const canEditJob = hasPermission('edit_jobs') || jobData.assignedTo === currentUserId

  // Custom logic: Can delete only if job is not completed AND user has permission
  const canDeleteJob = jobData.status !== 'completed' && hasPermission('delete_jobs')

  // Custom logic: Show admin notes only to management
  const showAdminNotes = isOwner || userRole === 'admin' || userRole === 'dispatcher'

  return (
    <div>
      <h1>Job Details</h1>

      {canEditJob && (
        <button>Edit Job</button>
      )}

      {canDeleteJob && (
        <button className="btn-danger">Delete Job</button>
      )}

      {showAdminNotes && (
        <div className="admin-notes">
          <h3>Internal Notes</h3>
          <p>Visible only to management</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MOCK COMPONENTS (for examples above)
// ============================================================================

function JobsList(props: { showAllJobs: boolean; enableFullEdit: boolean }) {
  return <div>Jobs List Component</div>
}

function OwnerDashboard() {
  return <div>Owner Dashboard</div>
}

function AdminDashboard() {
  return <div>Admin Dashboard</div>
}

function ManagementDashboard() {
  return <div>Management Dashboard</div>
}

function UserDashboard() {
  return <div>User Dashboard</div>
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export all examples
 */
export const examples = {
  Example1_BasicPermission,
  Example2_RoleBasedAccess,
  Example3_AnyPermission,
  Example4_AllPermissions,
  Example5_WithFallback,
  Example6_ConvenienceComponents,
  Example7_PlatformSpecific,
  Example8_UsePermissionsHook,
  Example9_NestedGates,
  Example10_DynamicChecks,
  Example11_ProtectActions,
  Example12_CustomLogic,
}

export default examples
