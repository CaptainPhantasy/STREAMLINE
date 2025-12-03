# SUPERADMIN Documentation

## Overview
The CRM-AI PRO application now includes a comprehensive SUPERADMIN system that grants complete access to all features across all tenants.

## Architecture

### 1. Permission System
- **Storage**: Permissions stored in `auth.users.raw_user_meta_data.permissions` as JSON array
- **Scope**: Application-wide, applies to all tenants
- **Future-Proof**: Automatic permission granting for new accounts and admins

### 2. SUPERADMIN Permissions (Full List)

#### User Management
- ✅ `manage_users` - Create, edit, delete, ban users
- ✅ `impersonate_users` - Login as any user

#### Job Management
- ✅ `view_all_jobs` - View all jobs across system
- ✅ `view_assigned_jobs` - View assigned jobs
- ✅ `create_jobs` - Create new jobs
- ✅ `edit_jobs` - Edit existing jobs
- ✅ `delete_jobs` - Delete jobs
- ✅ `assign_jobs` - Assign jobs to technicians

#### Financial & Estimates
- ✅ `view_estimates` - View all estimates
- ✅ `create_estimates` - Create new estimates
- ✅ `edit_estimates` - Edit estimates
- ✅ `view_financials` - Full financial access
- ✅ `manage_invoices` - Invoice management

#### System Resources
- ✅ `view_parts` - View parts inventory
- ✅ `manage_parts` - Manage parts
- ✅ `view_contacts` - View all contacts
- ✅ `create_contacts` - Create contacts
- ✅ `edit_contacts` - Edit contacts

#### Analytics & Reporting
- ✅ `view_analytics` - Full analytics access
- ✅ `view_reports` - View all reports

#### System Configuration
- ✅ `view_settings` - View system settings
- ✅ `manage_settings` - Modify system settings
- ✅ `manage_automation` - Configure automation rules
- ✅ `manage_llm_providers` - Manage AI providers
- ✅ `view_audit_log` - View system audit trail

#### Operations
- ✅ `manage_dispatch` - Dispatch operations
- ✅ `manage_marketing` - Marketing campaigns

### 3. Automatic Granting System

#### New Account Owners
- Automatically granted SUPERADMIN when account is created
- Trigger: `CREATE` on `public.accounts`
- Function: `grant_account_creator_permissions()`

#### Manual Granting
- Function: `grant_superuser_permissions(user_id)`
- Usage: Can be called from anywhere to grant SUPERADMIN to any user

### 4. Permission Templates

#### `get_owner_permissions()`
Returns complete SUPERADMIN permission array for owner role

#### `get_admin_permissions()`
Returns complete SUPERADMIN permission array for admin role

## Implementation Details

### Database Structure
```sql
-- auth.users.raw_user_meta_data example:
{
  "role": "admin",
  "permissions": [
    "manage_users",
    "view_all_jobs",
    // ... all permissions
  ],
  "full_name": "User Name",
  "account_id": "uuid"
}
```

### Permission Check Function
```typescript
// Example permission check
const hasPermission = (role: string, permission: string): boolean => {
  const userPermissions = authUser.raw_user_meta_data?.permissions || [];
  return userPermissions.includes(permission);
};
```

### Frontend Usage
```tsx
// PermissionGate component
<PermissionGate requires="manage_users">
  <Button>Delete User</Button>
</PermissionGate>

// Role-based rendering
{hasPermission(user.role, 'impersonate_users') && (
  <MenuItem onClick={() => impersonateUser(user)}>
    Impersonate User
  </MenuItem>
)}
```

## Future Considerations

### 1. Multi-Tenant Isolation
- Each tenant is isolated by `account_id`
- SUPERADMIN permissions apply within account context
- Cross-tenant admin requires additional configuration

### 2. Permission Inheritance
- Future enhancement: Role-based permission inheritance
- Example: Tech inherits from Dispatcher for viewing jobs

### 3. Audit Logging
- All permission-sensitive actions are logged
- Track who did what, when, and to whom

### 4. Dynamic Permissions
- System designed for easy permission additions
- New features can easily integrate with permission system

## Security Notes

1. **Authentication Required**: All permission checks require valid authentication
2. **Server-Side Validation**: Permissions validated on every API call
3. **Role Verification**: Role checked in both `auth.users` and `public.users`
4. **RLS Policies**: Row Level Security policies enforce data access

## Maintenance

### Adding New Permissions
1. Add permission to `get_admin_permissions()` function
2. Update permission documentation
3. Add to relevant `PermissionGate` components

### Granting SUPERADMIN
```sql
-- Single user
SELECT grant_superuser_permissions('user-uuid-here');

-- All users with admin role in an account
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{permissions}',
  get_admin_permissions()
)
WHERE raw_user_meta_data->>'role' = 'admin';
```

This system ensures complete control while maintaining security and scalability.