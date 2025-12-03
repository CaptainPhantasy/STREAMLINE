# HANDOFF: Agent 1 → Agent 2
## Impersonation Feature - UI Components Phase

---

## What Agent 1 Completed ✅

### Core Infrastructure
1. **ImpersonationContext** (`lib/contexts/ImpersonationContext.tsx`)
   - Complete state management
   - localStorage persistence
   - Database integration
   - Security validation
   - Error handling

2. **useImpersonation Hook** (`lib/hooks/useImpersonation.ts`)
   - Easy context consumption
   - Fully typed
   - Documentation included

### Key Capabilities Available
```typescript
const {
  realUser,           // Owner performing impersonation
  impersonatedUser,   // User being impersonated
  isImpersonating,    // Boolean: is session active?
  sessionId,          // Database session ID
  startImpersonation, // Function: start impersonating
  stopImpersonation,  // Function: stop impersonating
  refreshImpersonation, // Function: refresh state
  isLoading,          // Boolean: async operation in progress
  error               // String: error message
} = useImpersonation()
```

---

## What Agent 2 Should Build 🔨

### Required Components

#### 1. **ImpersonationBanner** (Top Priority)
**Location**: `components/admin/ImpersonationBanner.tsx`

**Purpose**: Alert banner shown when impersonating

**Requirements**:
- Fixed position at top of screen
- Show impersonated user name and role
- Show real user (owner) name
- "Stop Impersonation" button
- Warning color (yellow/orange)
- High z-index to stay on top
- Should not be dismissable (always visible during impersonation)

**Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  IMPERSONATION MODE                                      │
│ Viewing as: Jane Tech (Tech)                                │
│ Real User: John Owner (Owner)                               │
│                                    [Stop Impersonation] ❌  │
└─────────────────────────────────────────────────────────────┘
```

#### 2. **UserSelector** (Second Priority)
**Location**: `components/admin/UserSelector.tsx`

**Purpose**: Dropdown to select user to impersonate

**Requirements**:
- Fetch users from same account
- Filter out Owners (cannot be impersonated)
- Filter out self (cannot impersonate yourself)
- Show: Name, Email, Role
- Search/filter capability
- Loading state while fetching
- Error state if fetch fails
- Only visible to Owner role

**API Endpoint**: Already exists at `/api/admin/impersonatable-users`

**Design**:
```
┌─────────────────────────────────────┐
│ Select User to Impersonate          │
├─────────────────────────────────────┤
│ 🔍 Search users...                  │
├─────────────────────────────────────┤
│ 👤 Jane Tech (Tech)                 │
│    jane@example.com                 │
├─────────────────────────────────────┤
│ 📞 Bob Sales (Sales)                │
│    bob@example.com                  │
├─────────────────────────────────────┤
│ 🚗 Alice Dispatcher (Dispatcher)    │
│    alice@example.com                │
└─────────────────────────────────────┘
```

#### 3. **ImpersonationDialog** (Third Priority)
**Location**: `components/admin/ImpersonationDialog.tsx`

**Purpose**: Modal/Dialog to initiate impersonation

**Requirements**:
- Contains UserSelector
- Confirm button
- Cancel button
- Warning message about audit logging
- Loading state during impersonation start
- Error display if start fails

**Design**:
```
┌───────────────────────────────────────┐
│ Start Impersonation                   │
├───────────────────────────────────────┤
│                                       │
│ Select a user to view the app as:    │
│                                       │
│ [UserSelector Component]              │
│                                       │
│ ⚠️  All actions will be logged        │
│                                       │
│          [Cancel]  [Start] →          │
└───────────────────────────────────────┘
```

#### 4. **ImpersonationTrigger** (Fourth Priority)
**Location**: `components/admin/ImpersonationTrigger.tsx`

**Purpose**: Button/menu item to open impersonation dialog

**Requirements**:
- Only visible to Owner role
- Opens ImpersonationDialog
- Should be in admin menu or header
- Clear icon/label
- Disabled if already impersonating

**Placement**: Add to `/app/(dashboard)/layout.tsx` header

---

## Integration Steps for Agent 2

### Step 1: Add Provider to Layout
```tsx
// app/(dashboard)/layout.tsx
import { ImpersonationProvider } from '@/lib/contexts/ImpersonationContext'

export default function DashboardLayout({ children }) {
  return (
    <ImpersonationProvider>
      {/* existing layout */}
      <ImpersonationBanner /> {/* Add this */}
      {children}
    </ImpersonationProvider>
  )
}
```

### Step 2: Use Hook in Components
```tsx
// components/admin/ImpersonationBanner.tsx
import { useImpersonation } from '@/lib/hooks/useImpersonation'

export function ImpersonationBanner() {
  const {
    isImpersonating,
    impersonatedUser,
    realUser,
    stopImpersonation,
    isLoading
  } = useImpersonation()

  if (!isImpersonating) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-500 p-4 z-50">
      {/* Banner content */}
    </div>
  )
}
```

### Step 3: Fetch Impersonatable Users
```tsx
// Use existing API endpoint
const response = await fetch('/api/admin/impersonatable-users')
const { users } = await response.json()
```

### Step 4: Start Impersonation
```tsx
const { startImpersonation, error } = useImpersonation()

const handleStart = async (userId: string) => {
  try {
    await startImpersonation(userId)
    // Success - banner will appear
  } catch (err) {
    // Error - show error message
  }
}
```

### Step 5: Stop Impersonation
```tsx
const { stopImpersonation } = useImpersonation()

const handleStop = async () => {
  try {
    await stopImpersonation()
    // Success - banner disappears
  } catch (err) {
    // Error - show error message
  }
}
```

---

## API Endpoints Available

### GET `/api/admin/impersonatable-users`
**Purpose**: Get list of users that can be impersonated
**Auth**: Owner only
**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "jane@example.com",
      "full_name": "Jane Tech",
      "role": "tech"
    }
  ]
}
```

### POST `/api/admin/impersonate`
**Note**: NOT NEEDED - Use `startImpersonation()` from hook instead
**Reason**: Hook handles everything internally

### POST `/api/admin/stop-impersonate`
**Note**: NOT NEEDED - Use `stopImpersonation()` from hook instead
**Reason**: Hook handles everything internally

---

## Styling Guidelines

### Colors
- Banner: `bg-yellow-100` border `border-yellow-500`
- Warning icon: `text-yellow-600`
- Stop button: `bg-red-500 hover:bg-red-600`
- Text: `text-gray-800`

### Components
- Use existing UI components from `components/ui/`
- Use Tailwind CSS for styling
- Make responsive (mobile-friendly)
- Follow existing design system

### Icons
- Warning: ⚠️ or Lucide `AlertTriangle`
- User: 👤 or Lucide `User`
- Stop: ❌ or Lucide `X`
- Search: 🔍 or Lucide `Search`

---

## Testing Checklist for Agent 2

- [ ] Banner only shows when impersonating
- [ ] Banner shows correct user info
- [ ] Stop button works correctly
- [ ] UserSelector fetches users correctly
- [ ] Cannot select Owners
- [ ] Cannot select self
- [ ] Dialog opens/closes correctly
- [ ] Start impersonation works
- [ ] Loading states display
- [ ] Error messages display
- [ ] Mobile responsive
- [ ] Trigger only visible to Owners

---

## Security Notes

1. **Role Check**: Always verify user is Owner before showing UI
2. **Server Validation**: Hook already validates on server (don't duplicate)
3. **Audit Trail**: All actions automatically logged (no extra code needed)
4. **Error Handling**: Show user-friendly errors from hook

---

## Files to Create (Agent 2)

```
components/admin/ImpersonationBanner.tsx      (Priority 1)
components/admin/UserSelector.tsx             (Priority 2)
components/admin/ImpersonationDialog.tsx      (Priority 3)
components/admin/ImpersonationTrigger.tsx     (Priority 4)
```

---

## Files to Modify (Agent 2)

```
app/(dashboard)/layout.tsx                    (Add provider + banner)
```

---

## Example Implementation Starter

```tsx
// components/admin/ImpersonationBanner.tsx
'use client'

import { useImpersonation } from '@/lib/hooks/useImpersonation'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
  const {
    isImpersonating,
    impersonatedUser,
    realUser,
    stopImpersonation,
    isLoading
  } = useImpersonation()

  if (!isImpersonating) return null

  const handleStop = async () => {
    try {
      await stopImpersonation()
    } catch (error) {
      console.error('Failed to stop impersonation:', error)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-500 p-3 z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <div>
          <div className="font-semibold text-gray-900">
            IMPERSONATION MODE
          </div>
          <div className="text-sm text-gray-700">
            Viewing as: <strong>{impersonatedUser?.full_name}</strong> ({impersonatedUser?.role})
            {' • '}
            Real User: <strong>{realUser?.full_name}</strong>
          </div>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleStop}
        disabled={isLoading}
      >
        <X className="h-4 w-4 mr-1" />
        Stop Impersonation
      </Button>
    </div>
  )
}
```

---

## Questions? Check These Files

1. **Hook Usage**: `lib/hooks/useImpersonation.ts`
2. **Context Details**: `lib/contexts/ImpersonationContext.tsx`
3. **Database Schema**: `supabase/migrations/20251127_add_user_impersonation.sql`
4. **Agent 1 Report**: `AGENT_1_COMPLETION_REPORT.md`

---

**Agent 1**: Complete ✓
**Agent 2**: Ready to Start 🚀
**Focus**: Build UI components for impersonation
**Deadline**: Next phase

Good luck, Agent 2! 🎉
