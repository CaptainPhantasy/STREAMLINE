# Permission System - Extraction Guide

**How to copy this permission system to another project**

This permission system is designed to be **100% portable** and can be used in any React/Next.js project with minimal configuration.

---

## Quick Start (5 Minutes)

### Step 1: Copy Files

Copy these 4 core files to your new project:

```bash
# From this project to your new project
cp lib/types/permissions.ts        <new-project>/lib/types/
cp lib/auth/permissions.ts         <new-project>/lib/auth/
cp lib/auth/PermissionGate.tsx     <new-project>/lib/auth/
cp lib/hooks/usePermissions.ts     <new-project>/lib/hooks/
```

**Optional:** Copy examples for reference
```bash
cp lib/auth/PermissionGate.examples.tsx  <new-project>/lib/auth/
```

---

## Step 2: Configure Your Roles & Permissions

### Edit `/lib/types/permissions.ts`

Update the `Permission` type to match your app:

```typescript
export type Permission =
  // Your permissions here
  | 'view_dashboard'
  | 'edit_content'
  | 'delete_content'
  | 'manage_users'
  | 'export_data'
  // etc.
```

Update the `UserRole` type:

```typescript
export type UserRole = 'admin' | 'editor' | 'viewer' | 'guest'
```

---

## Step 3: Map Roles to Permissions

### Edit `/lib/auth/permissions.ts`

Update the `ROLE_PERMISSIONS` object:

```typescript
export const ROLE_PERMISSIONS: RolePermissionsMap = {
  admin: [
    'view_dashboard',
    'edit_content',
    'delete_content',
    'manage_users',
    'export_data',
  ],
  editor: [
    'view_dashboard',
    'edit_content',
  ],
  viewer: [
    'view_dashboard',
  ],
  guest: [
    // No permissions
  ],
}
```

---

## Step 4: Connect to Your Auth System

### Option A: Using Supabase (Like This Project)

No changes needed! The system already uses Supabase.

### Option B: Using NextAuth.js

Edit `/lib/auth/PermissionGate.tsx` and `/lib/hooks/usePermissions.ts`:

**Replace:**
```typescript
import { createClient } from '@/lib/supabase/client'
import { useImpersonation } from '@/lib/hooks/useImpersonation'

// ... Supabase user fetching code
```

**With:**
```typescript
import { useSession } from 'next-auth/react'

function useEffectiveUser(): UserWithRole | null {
  const { data: session } = useSession()

  if (!session?.user) return null

  return {
    id: session.user.id,
    role: session.user.role as UserRole,
    email: session.user.email || '',
    full_name: session.user.name || '',
  }
}
```

### Option C: Using Firebase Auth

```typescript
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

function useEffectiveUser(): UserWithRole | null {
  const [authUser] = useAuthState(auth)
  const [user, setUser] = useState<UserWithRole | null>(null)

  useEffect(() => {
    if (!authUser) {
      setUser(null)
      return
    }

    // Fetch user profile from Firestore
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', authUser.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setUser({
          id: authUser.uid,
          role: data.role as UserRole,
          email: authUser.email || '',
          full_name: data.full_name || '',
        })
      }
    }

    fetchProfile()
  }, [authUser])

  return user
}
```

### Option D: Using Clerk

```typescript
import { useUser } from '@clerk/nextjs'

function useEffectiveUser(): UserWithRole | null {
  const { user } = useUser()

  if (!user) return null

  return {
    id: user.id,
    role: user.publicMetadata.role as UserRole,
    email: user.primaryEmailAddress?.emailAddress || '',
    full_name: user.fullName || '',
  }
}
```

### Option E: Custom REST API

```typescript
import { useEffect, useState } from 'react'

function useEffectiveUser(): UserWithRole | null {
  const [user, setUser] = useState<UserWithRole | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser({
            id: data.user.id,
            role: data.user.role as UserRole,
            email: data.user.email,
            full_name: data.user.full_name,
          })
        }
      })
      .catch(console.error)
  }, [])

  return user
}
```

---

## Step 5: Use in Your Components

### Wrap Pages with PermissionGate

```tsx
// app/admin/page.tsx
import { PermissionGate } from '@/lib/auth/PermissionGate'

export default function AdminPage() {
  return (
    <PermissionGate requires="manage_users">
      <div>
        <h1>Admin Panel</h1>
        {/* Your admin UI */}
      </div>
    </PermissionGate>
  )
}
```

### Hide Buttons Based on Permission

```tsx
// components/UserCard.tsx
import { PermissionGate } from '@/lib/auth/PermissionGate'

export function UserCard({ user }) {
  return (
    <div>
      <h2>{user.name}</h2>

      <PermissionGate requires="delete_content">
        <button onClick={() => deleteUser(user.id)}>
          Delete
        </button>
      </PermissionGate>
    </div>
  )
}
```

### Check Permissions in Component Logic

```tsx
// components/Dashboard.tsx
import { usePermissions } from '@/lib/hooks/usePermissions'

export function Dashboard() {
  const { hasPermission, isAdmin } = usePermissions()

  const canExport = hasPermission('export_data')
  const showAdminPanel = isAdmin

  return (
    <div>
      <h1>Dashboard</h1>

      {canExport && (
        <button>Export Data</button>
      )}

      {showAdminPanel && (
        <AdminPanel />
      )}
    </div>
  )
}
```

---

## Step 6: Protect Your API Routes

**Important:** Always validate permissions on the backend!

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hasPermission } from '@/lib/auth/permissions'

export async function DELETE(request: NextRequest) {
  // Get authenticated user (your auth system)
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check permission
  if (!hasPermission(user.role, 'delete_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with deletion
  // ...
}
```

---

## Optional: Remove Impersonation Support

If your project doesn't need user impersonation:

### Edit `/lib/auth/PermissionGate.tsx`

**Remove:**
```typescript
import { useImpersonation } from '@/lib/hooks/useImpersonation'

// In useEffectiveUser():
const { isImpersonating, impersonatedUser, realUser } = useImpersonation()

// Remove all impersonation logic
if (isImpersonating && impersonatedUser) { ... }
if (!isImpersonating && realUser) { ... }
```

**Replace with:**
```typescript
function useEffectiveUser(): UserWithRole | null {
  // Just return your auth system's user
  return yourAuthUser
}
```

### Edit `/lib/hooks/usePermissions.ts`

Same changes as above - remove impersonation logic.

---

## Testing

### Test Each Role

Create test users for each role and verify:

```typescript
// Test checklist
const testCases = [
  {
    role: 'admin',
    shouldSee: ['dashboard', 'users', 'settings'],
    shouldNotSee: [],
  },
  {
    role: 'editor',
    shouldSee: ['dashboard'],
    shouldNotSee: ['users', 'settings'],
  },
  {
    role: 'viewer',
    shouldSee: ['dashboard'],
    shouldNotSee: ['users', 'settings', 'edit-button'],
  },
]
```

### Manual Testing

1. Log in as each role
2. Verify correct navigation items appear
3. Verify correct buttons appear
4. Try accessing restricted pages (should be blocked)
5. Try calling restricted APIs (should return 403)

---

## Common Patterns

### Pattern 1: Hide Entire Page
```tsx
<PermissionGate requires="view_reports">
  <ReportsPage />
</PermissionGate>
```

### Pattern 2: Hide Specific Button
```tsx
<PermissionGate requires="delete_content">
  <DeleteButton />
</PermissionGate>
```

### Pattern 3: Check Multiple Permissions (OR)
```tsx
<PermissionGate requiresAny={['edit_content', 'delete_content']}>
  <EditTools />
</PermissionGate>
```

### Pattern 4: Check Multiple Permissions (AND)
```tsx
<PermissionGate requiresAll={['view_reports', 'export_data']}>
  <ExportButton />
</PermissionGate>
```

### Pattern 5: Role-Based Check
```tsx
<PermissionGate allowedRoles={['admin', 'editor']}>
  <AdminPanel />
</PermissionGate>
```

### Pattern 6: Show Fallback
```tsx
<PermissionGate
  requires="view_reports"
  fallback={<div>Access Denied</div>}
  showFallback
>
  <Reports />
</PermissionGate>
```

### Pattern 7: Programmatic Check
```tsx
const { hasPermission } = usePermissions()

const handleDelete = () => {
  if (!hasPermission('delete_content')) {
    alert('Permission denied')
    return
  }
  // Delete logic
}
```

---

## Troubleshooting

### Issue: "Cannot find module '@/lib/types/permissions'"

**Solution:** Make sure you copied all files and your tsconfig.json has path aliases configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Permission checks always return false

**Solution:** Verify your `ROLE_PERMISSIONS` mapping includes the permission for that role:

```typescript
// Check this in lib/auth/permissions.ts
export const ROLE_PERMISSIONS: RolePermissionsMap = {
  admin: [
    'your_permission_here', // Make sure this is listed!
  ],
}
```

### Issue: User role is undefined

**Solution:** Ensure your auth system is returning a `role` field on the user object. Update your user fetching logic to map your auth system's role field.

### Issue: Components not re-rendering when permissions change

**Solution:** The hooks use React state and should automatically re-render. Make sure you're not blocking re-renders elsewhere. Consider wrapping your app in a Context Provider if needed.

---

## Performance Tips

1. **Memoization:** Permission checks are already memoized in `usePermissions()`
2. **Avoid Over-Nesting:** Don't nest too many PermissionGates - combine checks when possible
3. **Use Convenience Hooks:** Use `useIsAdmin()` instead of `usePermissions().isAdmin` for simpler cases
4. **Backend Validation:** Always validate permissions on the backend for security

---

## Security Notes

⚠️ **Frontend permissions are NOT a security boundary**

- Users can bypass frontend checks by modifying code
- Always validate permissions on the backend/API routes
- Use database RLS (Row Level Security) for data access control
- Log permission checks for auditing

✅ **What frontend permissions ARE good for:**

- Improving UX by hiding unavailable features
- Reducing API calls for unauthorized actions
- Providing clear feedback about access levels

---

## Need Help?

See:
- `SWARM_2_COMPLETION_REPORT.md` - Full documentation
- `lib/auth/PermissionGate.examples.tsx` - 12 usage examples
- Original implementation in this project for reference

---

## Summary Checklist

- [ ] Copied 4 core files to new project
- [ ] Updated `Permission` type with your permissions
- [ ] Updated `UserRole` type with your roles
- [ ] Updated `ROLE_PERMISSIONS` mapping
- [ ] Connected to your auth system
- [ ] Tested with each role
- [ ] Added backend permission validation
- [ ] Deployed and verified in production

**Done!** You now have a complete permission system.
