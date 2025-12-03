# ImpersonationBanner Integration Example

## Quick Start Integration

### Step 1: Import the Component
Add the import to your layout file:

```tsx
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
```

### Step 2: Add to Layout
Place the banner at the very top of your layout, before any other content:

```tsx
export default function DashboardLayout({ children }) {
  return (
    <>
      {/* Impersonation Banner - ALWAYS at the top */}
      <ImpersonationBanner />

      {/* Rest of your layout */}
      <AppShell>
        <header>...</header>
        <main>{children}</main>
      </AppShell>
    </>
  )
}
```

## Complete Integration Example

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

```tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/search/global-search'
import { UserMenu } from '@/components/dashboard/user-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
import { AppShell } from '@/components/layout/app-shell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      {/* ⚠️ IMPERSONATION BANNER - Must be first! */}
      <ImpersonationBanner />

      <AppShell>
        {/* Header with global search and user controls */}
        <header className="flex-none h-16 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between">
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto bg-theme-primary px-4">
          {children}
        </div>
      </AppShell>
    </>
  )
}
```

### Root Layout (`app/layout.tsx`)

If you want the banner to appear on all pages (including auth pages), add it to the root layout:

```tsx
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Global impersonation banner */}
        <ImpersonationBanner />

        {/* Rest of your app */}
        {children}
      </body>
    </html>
  )
}
```

### Mobile Layout (`app/m/layout.tsx`)

For mobile-optimized views:

```tsx
'use client'

import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
import { MobileNav } from '@/components/mobile/mobile-nav'

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Impersonation banner for mobile */}
      <ImpersonationBanner />

      {/* Mobile navigation */}
      <MobileNav />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

## Handling Fixed Headers

If your layout has a fixed header, you need to add top padding to prevent overlap:

### Option 1: CSS Class
```tsx
export default function DashboardLayout({ children }) {
  return (
    <>
      <ImpersonationBanner />

      {/* Add pt-[60px] when impersonation is active */}
      <div className="min-h-screen">
        <header className="fixed top-0 pt-[60px]">
          {/* Header content */}
        </header>
        <main className="pt-[60px]">{children}</main>
      </div>
    </>
  )
}
```

### Option 2: Dynamic Padding Hook
```tsx
'use client'

import { useEffect, useState } from 'react'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'

export default function DashboardLayout({ children }) {
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('impersonatedRole')
      setIsImpersonating(!!role && role !== 'owner')
    }
  }, [])

  return (
    <>
      <ImpersonationBanner />

      <div className={`min-h-screen ${isImpersonating ? 'pt-[60px]' : ''}`}>
        {children}
      </div>
    </>
  )
}
```

## Testing Your Integration

### 1. Set Impersonation Mode
Open your browser console and run:
```javascript
localStorage.setItem('impersonatedRole', 'tech')
location.reload()
```

### 2. Verify Banner Appears
- Banner should appear at the top of the screen
- Should show "IMPERSONATION MODE: Viewing as Field Technician"
- Should have a red/orange gradient background
- Should have a pulsing warning icon

### 3. Test Exit Functionality
- Click the "Exit" button
- Should redirect to `/admin/settings`
- Banner should disappear after reload

### 4. Test Banner Click
- Click anywhere on the banner text
- Should navigate to `/admin/settings`

### 5. Test Responsive Design
- Resize browser window to mobile size
- Banner should remain visible with condensed text
- Exit button should show only icon on small screens

## Troubleshooting

### Banner Not Showing
**Problem:** Banner doesn't appear after setting `impersonatedRole`

**Solutions:**
1. Check if you reloaded the page after setting localStorage
2. Verify the component is imported in your layout
3. Check browser console for errors
4. Ensure `impersonatedRole` is not set to 'owner'

```javascript
// Debug in console
console.log(localStorage.getItem('impersonatedRole'))
```

### Banner Overlapping Content
**Problem:** Banner covers other UI elements

**Solutions:**
1. Ensure banner has `position: fixed` and `z-[100]`
2. Add top padding to your main content
3. Check parent containers for `overflow: hidden`

```tsx
// Add padding to main content
<main className="pt-[60px]">{children}</main>
```

### Exit Button Not Working
**Problem:** Clicking Exit doesn't clear impersonation

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify localStorage is accessible
3. Ensure router is working properly

```javascript
// Manual exit in console
localStorage.removeItem('impersonatedRole')
location.reload()
```

## Advanced Usage

### Custom Styling
```tsx
<ImpersonationBanner className="shadow-2xl border-b-4 border-red-800" />
```

### Conditional Rendering
```tsx
{isOwner && <ImpersonationBanner />}
```

### With Animation
Add custom animation:
```tsx
import { motion } from 'framer-motion'

export function AnimatedImpersonationBanner() {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ImpersonationBanner />
    </motion.div>
  )
}
```

## Next Steps

After integrating the banner:

1. ✅ Test with each role (admin, dispatcher, tech, sales)
2. ✅ Verify mobile responsiveness
3. ✅ Test keyboard navigation
4. ✅ Test with screen readers
5. ✅ Add to all necessary layouts
6. ✅ Document for your team
7. ✅ Add to style guide

## Related Documentation
- [Component README](./IMPERSONATION_BANNER_README.md) - Full component documentation
- [Settings Page](../../app/(dashboard)/admin/settings/page.tsx) - Where impersonation is configured
- [Role Routes](../../lib/auth/role-routes.ts) - Role definitions and routes
