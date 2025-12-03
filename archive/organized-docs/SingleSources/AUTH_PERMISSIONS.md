# Auth & Permissions - Single Source of Truth

**Version:** 1.0
**Last Updated:** November 28, 2025 - 3:45 PM
**Status:** ✅ Production Ready
**Domain:** Authentication, Authorization, Multi-Tenant Security

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Permission Matrix](#permission-matrix)
4. [Role-Based Routing](#role-based-routing)
5. [Permission Gates (React Components)](#permission-gates-react-components)
6. [Multi-Tenant Architecture](#multi-tenant-architecture)
7. [Supabase RLS Policies](#supabase-rls-policies)
8. [Helper Functions Reference](#helper-functions-reference)
9. [API Authentication Pattern](#api-authentication-pattern)
10. [Security Best Practices](#security-best-practices)
11. [Testing & Validation](#testing--validation)

---

## Overview

CRM-AI-PRO implements a **comprehensive role-based access control (RBAC)** system with:

- **5 User Roles** with granular permissions
- **Multi-tenant data isolation** at the database level
- **Frontend permission gates** for UI rendering control
- **Backend authentication** with Supabase RLS policies
- **React hooks** for permission checking
- **Type-safe permissions** using TypeScript

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                      │
│  Supabase Auth (JWT tokens) + Session Management            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   AUTHORIZATION LAYER                        │
│  Role-Based Permissions + Multi-Tenant Isolation            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────────┐
│  Frontend Gates  │  API Middleware  │  Database RLS        │
│  (UI Control)    │  (Route Guard)   │  (Data Isolation)    │
└──────────────────┴──────────────────┴──────────────────────┘
```

---

## User Roles

### 1. **Owner**
- **Full system access** - can do everything
- **Platform:** Desktop and Mobile (`/` and `/m/owner/dashboard`)
- **User Management:** Create, edit, delete users + impersonation
- **Use Case:** Business owner with complete control

### 2. **Admin**
- **Management access** without impersonation
- **Platform:** Desktop only (`/inbox`)
- **User Management:** View users only (cannot manage)
- **Use Case:** Office manager, operations lead

### 3. **Dispatcher**
- **Dispatch operations** and job assignment
- **Platform:** Desktop only (`/dispatch/map`)
- **Limited Financials:** View only, no editing
- **Use Case:** Dispatcher coordinating field technicians

### 4. **Tech** (Technician)
- **Mobile-only** field operations
- **Platform:** Mobile only (`/m/tech/dashboard`)
- **Jobs:** View assigned jobs only
- **Use Case:** Field technician completing service calls

### 5. **Sales** (Sales Representative)
- **Mobile-only** sales operations
- **Platform:** Mobile only (`/m/sales/dashboard`)
- **Contacts & Leads:** Full CRUD access
- **Use Case:** Sales rep meeting customers, creating leads

---

## Permission Matrix

### Complete Permission List (33 Total)

| Permission | Owner | Admin | Dispatcher | Tech | Sales | Description |
|------------|-------|-------|------------|------|-------|-------------|
| **User Management** |
| `manage_users` | ✅ | ❌ | ❌ | ❌ | ❌ | Create, edit, delete users |
| `view_users` | ✅ | ✅ | ❌ | ❌ | ❌ | View user list |
| `impersonate_users` | ✅ | ❌ | ❌ | ❌ | ❌ | Impersonate other users |
| **Job Management** |
| `view_all_jobs` | ✅ | ✅ | ✅ | ❌ | ❌ | View all jobs in account |
| `view_assigned_jobs` | ❌ | ❌ | ❌ | ✅ | ❌ | View only assigned jobs |
| `create_jobs` | ✅ | ✅ | ✅ | ❌ | ❌ | Create new jobs |
| `edit_jobs` | ✅ | ✅ | ✅ | ✅ | ❌ | Edit job details |
| `delete_jobs` | ✅ | ✅ | ❌ | ❌ | ❌ | Delete jobs |
| `assign_jobs` | ✅ | ✅ | ✅ | ❌ | ❌ | Assign jobs to techs |
| **Contact Management** |
| `view_contacts` | ✅ | ✅ | ✅ | ✅ | ✅ | View contacts |
| `create_contacts` | ✅ | ✅ | ✅ | ❌ | ✅ | Create new contacts |
| `edit_contacts` | ✅ | ✅ | ✅ | ❌ | ✅ | Edit contact details |
| `delete_contacts` | ✅ | ✅ | ❌ | ❌ | ❌ | Delete contacts |
| **Financial Management** |
| `manage_financials` | ✅ | ✅ | ❌ | ❌ | ❌ | Manage financial data |
| `view_financials` | ✅ | ✅ | ❌ | ❌ | ❌ | View financial data |
| `create_invoices` | ✅ | ✅ | ❌ | ❌ | ❌ | Create invoices |
| `edit_invoices` | ✅ | ✅ | ❌ | ❌ | ❌ | Edit invoices |
| **Marketing** |
| `manage_marketing` | ✅ | ✅ | ❌ | ❌ | ❌ | Manage campaigns |
| `view_marketing` | ✅ | ✅ | ❌ | ❌ | ✅ | View marketing data |
| `send_campaigns` | ✅ | ✅ | ❌ | ❌ | ❌ | Send campaigns |
| **Analytics & Reports** |
| `view_analytics` | ✅ | ✅ | ✅ | ❌ | ❌ | View analytics |
| `view_reports` | ✅ | ✅ | ❌ | ❌ | ❌ | View reports |
| `export_reports` | ✅ | ✅ | ❌ | ❌ | ❌ | Export reports |
| `view_estimates` | ✅ | ✅ | ✅ | ❌ | ✅ | View estimates |
| `view_parts` | ✅ | ✅ | ✅ | ❌ | ❌ | View parts inventory |
| **Dispatch & GPS** |
| `view_dispatch_map` | ✅ | ✅ | ✅ | ❌ | ❌ | View dispatch map |
| `manage_dispatch` | ✅ | ✅ | ✅ | ❌ | ❌ | Manage dispatch |
| `view_gps` | ✅ | ✅ | ✅ | ❌ | ❌ | View GPS tracking |
| **Settings** |
| `manage_settings` | ✅ | ❌ | ❌ | ❌ | ❌ | Manage settings |
| `view_settings` | ✅ | ✅ | ✅ | ❌ | ❌ | View settings |
| **Platform Access** |
| `desktop_only` | ❌ | ✅ | ✅ | ❌ | ❌ | Desktop interface |
| `mobile_only` | ❌ | ❌ | ❌ | ✅ | ✅ | Mobile interface |
| `desktop_and_mobile` | ✅ | ❌ | ❌ | ❌ | ❌ | Both interfaces |

---

## Role-Based Routing

### Desktop Routes

```typescript
// lib/auth/role-routes.ts
export const ROLE_ROUTES: Record<UserRole, string> = {
  owner: '/inbox',           // Desktop inbox
  admin: '/inbox',           // Desktop inbox
  dispatcher: '/dispatch/map', // Dispatch map
  tech: '/tech/dashboard',   // Desktop fallback (redirects to mobile)
  sales: '/sales/dashboard', // Desktop fallback (redirects to mobile)
}
```

### Mobile Routes (PWA)

```typescript
export const MOBILE_ROUTES: Record<UserRole, string> = {
  owner: '/m/owner/dashboard',      // Owner mobile dashboard
  admin: '/inbox',                  // Admin stays on desktop
  dispatcher: '/m/office/dashboard', // Dispatcher mobile fallback
  tech: '/m/tech/dashboard',        // Tech mobile dashboard
  sales: '/m/sales/dashboard',      // Sales mobile dashboard
}
```

### Route Protection

**Middleware:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/middleware.ts`
- Handles session refresh
- Does NOT enforce role-based redirects (client-side handling)
- Passes authentication cookies to API routes

**Client-Side Routing:**
- `getRouteForRole(role)` - Desktop route
- `getMobileRouteForRole(role)` - Mobile route
- Auto-redirects based on platform detection

---

## Permission Gates (React Components)

### Core Component: `PermissionGate`

**Location:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/lib/auth/PermissionGate.tsx`

#### Basic Usage

```tsx
import { PermissionGate } from '@/lib/auth/PermissionGate'

// Single permission
<PermissionGate requires="manage_users">
  <Button>Delete User</Button>
</PermissionGate>

// Multiple roles
<PermissionGate allowedRoles={['owner', 'admin', 'dispatcher']}>
  <NavItem>Dispatch Map</NavItem>
</PermissionGate>

// With fallback
<PermissionGate
  requires="view_financials"
  fallback={<div>Access Denied</div>}
  showFallback
>
  <FinancialDashboard />
</PermissionGate>

// Any permission (OR logic)
<PermissionGate requiresAny={['edit_jobs', 'view_all_jobs']}>
  <JobsList />
</PermissionGate>

// All permissions (AND logic)
<PermissionGate requiresAll={['view_contacts', 'edit_contacts']}>
  <ContactEditor />
</PermissionGate>
```

#### Convenience Components

```tsx
// Pre-configured permission gates
import {
  OwnerOnly,        // Owner only
  AdminOnly,        // Owner + Admin
  DispatcherOnly,   // Owner + Admin + Dispatcher
  TechOnly,         // Tech only
  SalesOnly,        // Sales only
  DesktopOnly,      // Desktop users
  MobileOnly,       // Mobile users
} from '@/lib/auth/PermissionGate'

<OwnerOnly>
  <ImpersonationPanel />
</OwnerOnly>

<TechOnly>
  <JobCompletionForm />
</TechOnly>
```

### `usePermissions` Hook

**Location:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/lib/hooks/usePermissions.ts`

```tsx
import { usePermissions } from '@/lib/hooks/usePermissions'

function MyComponent() {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    userRole,
    isOwner,
    isAdmin,
    isDispatcher,
    isTech,
    isSales,
    loading,
  } = usePermissions()

  if (loading) return <Loader />

  return (
    <div>
      {hasPermission('manage_users') && <Button>Manage Users</Button>}
      {isOwner && <AdminPanel />}
      {hasAnyPermission(['edit_jobs', 'delete_jobs']) && <EditButton />}
    </div>
  )
}
```

### Convenience Hooks

```tsx
import {
  useIsOwner,
  useIsAdmin,
  useIsDispatcher,
  useCanManageUsers,
  useCanViewAllJobs,
  useCanManageFinancials,
  useUserRole,
} from '@/lib/hooks/usePermissions'

// Simple role checks
const isOwner = useIsOwner()
const canManageUsers = useCanManageUsers()
const userRole = useUserRole()
```

---

## Multi-Tenant Architecture

### Account Isolation Model

```
accounts (tenant)
   └── users (belongs to one account)
        └── contacts (belongs to account via user)
        └── jobs (belongs to account via user)
        └── conversations (belongs to account via user)
        └── meetings (belongs to account via user)
        └── invoices (belongs to account via user)
```

### Account Schema

```sql
-- accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- Tenant identifier
  inbound_email_domain TEXT,  -- e.g., reply.317plumber.com
  settings JSONB DEFAULT '{}'::jsonb,
  persona_config JSONB DEFAULT '{}'::jsonb,
  google_review_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- users table (ties users to accounts)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'dispatcher', 'tech', 'sales')),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(account_id, email) -- Users must have unique email per account
);
```

### Account Isolation Function

```sql
-- Helper function used by RLS policies
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID AS $$
  SELECT account_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;
```

### Multi-Tenant Data Flow

```
1. User authenticates → Supabase JWT token
2. Frontend fetches user profile → Gets account_id
3. All queries include account_id filter
4. RLS policies enforce account_id matching
5. Users can ONLY see data from their account
```

---

## Supabase RLS Policies

**Location:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/supabase/rls-policies.sql`

### RLS Enabled Tables (28 total)

All major tables have RLS enabled:
- `accounts`, `users`, `contacts`, `conversations`, `messages`
- `jobs`, `meetings`, `invoices`, `estimates`, `parts`
- `knowledge_docs`, `llm_providers`, `crmai_audit`
- `notifications`, `gps_logs`, `calendar_events`
- And more...

### Standard RLS Policy Pattern

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- CRUD policy (all operations)
CREATE POLICY "Users can manage contacts in own account"
  ON contacts FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());
```

### Role-Specific RLS Policy

```sql
-- Only owners/admins can manage LLM providers
CREATE POLICY "Admins can manage llm providers"
  ON llm_providers FOR ALL
  USING (
    account_id = get_user_account_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    account_id = get_user_account_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### Service Role Exceptions

```sql
-- Service role can insert audit logs (for Edge Functions)
CREATE POLICY "Service role can insert audit logs"
  ON crmai_audit FOR INSERT
  WITH CHECK (true);
```

⚠️ **WARNING:** Service role key bypasses ALL RLS policies. Use sparingly.

---

## Helper Functions Reference

### Core Permission Functions

**Location:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/lib/auth/permissions.ts`

```typescript
// Check single permission
hasPermission(userRole: UserRole, permission: Permission): boolean

// Check ANY of multiple permissions (OR)
hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean

// Check ALL permissions (AND)
hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean

// Check if role matches
isAllowedRole(userRole: UserRole, allowedRoles: UserRole[]): boolean
```

### Role-Specific Helpers

```typescript
// User management
canManageUsers(role: UserRole): boolean
canImpersonateUsers(role: UserRole): boolean

// Job management
canViewAllJobs(role: UserRole): boolean
canAssignJobs(role: UserRole): boolean

// Financial access
canManageFinancials(role: UserRole): boolean

// Platform access
canAccessDesktop(role: UserRole): boolean
canAccessMobile(role: UserRole): boolean
isMobileOnlyRole(role: UserRole): boolean
isDesktopOnlyRole(role: UserRole): boolean

// Other permissions
canViewDispatchMap(role: UserRole): boolean
canManageMarketing(role: UserRole): boolean
canExportReports(role: UserRole): boolean
```

### Utility Functions

```typescript
// Get all permissions for a role
getPermissionsForRole(role: UserRole): Permission[]

// Get human-readable descriptions
getPermissionDescription(permission: Permission): string
getRoleName(role: UserRole): string
```

---

## API Authentication Pattern

### Standard API Route Pattern

**Example:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/api/meetings/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export async function POST(request: Request) {
  // 1. Authenticate user
  const auth = await getAuthenticatedSession(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Create Supabase client with user session
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  // 3. Get user's account_id
  const { data: user } = await supabase
    .from('users')
    .select('account_id, role')
    .eq('id', auth.user.id)
    .single()

  if (!user?.account_id) {
    return NextResponse.json({ error: 'User account not found' }, { status: 400 })
  }

  // 4. Check permissions (optional)
  if (!hasPermission(user.role, 'create_jobs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 5. Perform query with account_id filter
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      account_id: user.account_id,  // Always include account_id
      // ... other fields
    })
    .select()
    .single()

  // 6. RLS policies automatically enforce account isolation
  return NextResponse.json({ data })
}
```

### Authentication Helper

**Location:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/lib/auth-helper.ts`

```typescript
// Returns authenticated user or null
export async function getAuthenticatedSession(request: Request): Promise<{
  user: { id: string; email?: string }
} | null>
```

### Account Access Validation

**Location:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/lib/auth/validate-account-access.ts`

```typescript
// Validate user belongs to account
export async function validateAccountAccess(
  userId: string,
  accountId: string
): Promise<boolean>
```

---

## Security Best Practices

### ✅ DO

1. **Always authenticate API routes**
   ```typescript
   const auth = await getAuthenticatedSession(request)
   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ```

2. **Always include account_id in queries**
   ```typescript
   const { data: user } = await supabase
     .from('users')
     .select('account_id')
     .eq('id', auth.user.id)
     .single()

   // Use user.account_id in all queries
   ```

3. **Rely on RLS policies**
   - RLS is the final security boundary
   - Even if frontend checks fail, RLS protects data

4. **Use authenticated Supabase client**
   ```typescript
   // Use ANON_KEY, not SERVICE_ROLE_KEY
   const supabase = createServerClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // ✅ Respects RLS
     { cookies: { ... } }
   )
   ```

5. **Validate permissions on backend**
   ```typescript
   if (!hasPermission(user.role, 'manage_users')) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
   }
   ```

### ❌ DON'T

1. **Never use service role in API routes** (unless absolutely necessary)
   ```typescript
   // ❌ BAD: Bypasses RLS
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!  // Bypasses ALL RLS
   )
   ```

2. **Never hardcode account IDs**
   ```typescript
   // ❌ BAD
   const accountId = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'

   // ✅ GOOD
   const accountId = user.account_id
   ```

3. **Never skip authentication**
   ```typescript
   // ❌ BAD (current temporary issue in jobs route)
   const auth = { user: { id: 'test-user' } }  // Mock auth

   // ✅ GOOD
   const auth = await getAuthenticatedSession(request)
   ```

4. **Never trust frontend-only permission checks**
   - Frontend checks are for UX only
   - Always validate on backend

5. **Never expose service role key to client**
   - Keep in server-side environment variables only
   - Never use in browser-accessible code

---

## Testing & Validation

### Multi-Tenant Isolation Test

```sql
-- Create two test accounts
INSERT INTO accounts (name, slug) VALUES ('Test Co 1', 'testco1');
INSERT INTO accounts (name, slug) VALUES ('Test Co 2', 'testco2');

-- Create users in each account
-- User A → Account 1
-- User B → Account 2

-- Verify User A cannot see Account 2 data
SELECT * FROM contacts WHERE account_id = 'account-2-id';  -- Should return empty

-- Verify User B cannot see Account 1 data
SELECT * FROM contacts WHERE account_id = 'account-1-id';  -- Should return empty
```

### Permission Testing

```typescript
// Test all roles
const testCases = [
  {
    role: 'owner',
    shouldHave: ['manage_users', 'view_all_jobs', 'impersonate_users'],
    shouldNotHave: [],
  },
  {
    role: 'tech',
    shouldHave: ['view_assigned_jobs', 'edit_jobs'],
    shouldNotHave: ['manage_users', 'view_all_jobs', 'delete_jobs'],
  },
  {
    role: 'sales',
    shouldHave: ['view_contacts', 'create_contacts', 'edit_contacts'],
    shouldNotHave: ['view_all_jobs', 'manage_users'],
  },
]

// Run tests
testCases.forEach(({ role, shouldHave, shouldNotHave }) => {
  shouldHave.forEach(permission => {
    expect(hasPermission(role, permission)).toBe(true)
  })
  shouldNotHave.forEach(permission => {
    expect(hasPermission(role, permission)).toBe(false)
  })
})
```

### Security Checklist

Before multi-tenant production:

- [ ] Remove all auth bypasses (`const auth = { user: { id: 'test-user' } }`)
- [ ] Remove service role from API routes (except where absolutely needed)
- [ ] Remove `DEFAULT_ACCOUNT_ID` fallbacks
- [ ] Audit all RLS policies (verify SELECT, INSERT, UPDATE, DELETE)
- [ ] Test with multiple tenant accounts
- [ ] Validate account_id in all API requests
- [ ] Add audit logging for cross-tenant access attempts
- [ ] Implement rate limiting
- [ ] Security penetration testing

---

## File Locations

### Core Files

```
lib/
├── types/
│   └── permissions.ts           # TypeScript types for permissions
├── auth/
│   ├── permissions.ts           # Permission logic & ROLE_PERMISSIONS map
│   ├── role-routes.ts           # Role-based routing config
│   ├── PermissionGate.tsx       # React permission gate component
│   ├── PermissionGate.examples.tsx  # Usage examples
│   └── validate-account-access.ts   # Account validation helper
├── hooks/
│   └── usePermissions.ts        # React hook for permissions
└── supabase/
    ├── client.ts                # Browser Supabase client
    └── server.ts                # Server Supabase client
```

### Supabase

```
supabase/
├── rls-policies.sql             # Row Level Security policies
├── schema.sql                   # Complete database schema
└── migrations/
    └── *.sql                    # Database migrations
```

### Middleware

```
middleware.ts                    # Next.js middleware (session refresh)
```

---

## Known Issues & TODOs

### Critical (Fix Before Multi-Tenant Production)

1. **Temporary Auth Bypass** in `/app/api/jobs/route.ts` (line 111-116)
   ```typescript
   // ❌ REMOVE THIS
   const auth = { user: { id: 'test-user' } }
   ```

2. **Service Role Usage** in some API routes
   - `/app/api/llm/route.ts` (line 96-97)
   - `/app/api/meetings/route.ts` (line 89)

3. **Hardcoded Account ID** in `/app/api/jobs/route.ts` (line 140)
   ```typescript
   // ❌ REMOVE THIS
   const accountId = process.env.DEFAULT_ACCOUNT_ID || 'fde73a6a...'
   ```

### Medium Priority

4. **Incomplete RLS Policies** on some tables
   - Verify all CRUD operations are protected
   - Test with different user accounts

5. **Missing Input Validation**
   - Add account_id validation middleware
   - Prevent account_id injection attacks

### Low Priority

6. **Rate Limiting** not implemented
7. **Audit Logging** incomplete
8. **Email Domain Validation** for multi-tenant email routing

---

## Migration Guide

### Adding a New Permission

1. **Add to type definition** (`lib/types/permissions.ts`)
   ```typescript
   export type Permission =
     // ...
     | 'new_permission'  // Add description
   ```

2. **Add to ROLE_PERMISSIONS** (`lib/auth/permissions.ts`)
   ```typescript
   export const ROLE_PERMISSIONS: RolePermissionsMap = {
     owner: [
       // ...
       'new_permission',
     ],
     // ... other roles
   }
   ```

3. **Add description** (`lib/auth/permissions.ts`)
   ```typescript
   export const getPermissionDescription = (permission: Permission): string => {
     const descriptions: Record<Permission, string> = {
       // ...
       new_permission: 'Description of new permission',
     }
   }
   ```

4. **Use in components**
   ```tsx
   <PermissionGate requires="new_permission">
     <NewFeature />
   </PermissionGate>
   ```

### Adding a New Role

1. **Update UserRole type** (`lib/types/permissions.ts`)
   ```typescript
   export type UserRole = 'owner' | 'admin' | 'dispatcher' | 'tech' | 'sales' | 'new_role'
   ```

2. **Add to ROLE_PERMISSIONS** (`lib/auth/permissions.ts`)
   ```typescript
   export const ROLE_PERMISSIONS: RolePermissionsMap = {
     // ...
     new_role: ['permission1', 'permission2'],
   }
   ```

3. **Add routing** (`lib/auth/role-routes.ts`)
   ```typescript
   export const ROLE_ROUTES: Record<UserRole, string> = {
     // ...
     new_role: '/new-role/dashboard',
   }
   ```

4. **Update database constraint**
   ```sql
   ALTER TABLE users
   DROP CONSTRAINT IF EXISTS users_role_check;

   ALTER TABLE users
   ADD CONSTRAINT users_role_check
   CHECK (role IN ('owner', 'admin', 'dispatcher', 'tech', 'sales', 'new_role'));
   ```

---

## Additional Resources

- **Extraction Guide:** `/lib/auth/PERMISSION_SYSTEM_EXTRACTION_GUIDE.md`
- **Multi-Tenant Security Assessment:** `/docs/MULTI_TENANT_SECURITY_ASSESSMENT.md`
- **Multi-Tenant Setup Procedure:** `/docs/MULTI_TENANT_SETUP_PROCEDURE.md`
- **Permission Gate Examples:** `/lib/auth/PermissionGate.examples.tsx`

---

## Version History

- **v1.0** (Nov 28, 2025): Initial comprehensive documentation
  - Consolidated 3 existing documents
  - Added complete permission matrix
  - Documented RLS policies
  - Added security best practices
  - Included migration guides

---

**Last Reviewed:** November 28, 2025
**Next Review:** When adding new roles or permissions
**Maintainer:** Development Team
