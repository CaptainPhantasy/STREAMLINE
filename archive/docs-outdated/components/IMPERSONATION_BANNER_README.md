# ImpersonationBanner Component

## Overview
The `ImpersonationBanner` component displays a prominent warning banner at the top of the screen when an Owner is viewing the system as another role (role impersonation feature).

## Component Location
**File:** `/components/admin/ImpersonationBanner.tsx`

## Purpose
This component provides visual feedback to the Owner that they are currently viewing the system from another role's perspective. It ensures:
- Clear awareness of impersonation mode
- Quick exit functionality
- Consistent visibility across all pages
- Professional warning appearance

## Features

### 1. Visual Design
- **Full-width banner** at the very top of the screen (above all content)
- **Warning gradient**: Orange to red gradient background (`from-orange-600 to-red-600`)
- **Animated warning icon**: Pulsing AlertTriangle icon from lucide-react
- **Role-specific icons**: Each role has a unique emoji icon
  - Admin: 🔧
  - Dispatcher: 📋
  - Tech: 🔨
  - Sales: 💼
- **High z-index**: `z-[100]` to ensure it appears above all content
- **Fixed positioning**: Stays at top when scrolling

### 2. Behavior
- **Auto-detection**: Automatically detects impersonation state from `localStorage`
- **Only shows when impersonating**: Hidden when `impersonatedRole` is null or 'owner'
- **Exit functionality**:
  - Clears `localStorage.impersonatedRole`
  - Redirects to `/admin/settings`
  - Reloads page to apply changes
- **Click-to-settings**: Clicking banner text navigates to settings
- **Keyboard accessible**: Full keyboard navigation support

### 3. Responsive Design
- **Desktop**: Full message with detailed subtext
- **Mobile**: Condensed message with shorter text
- **Icon button**: Exit button shows only icon on small screens

### 4. Accessibility
- **ARIA role**: `role="alert"`
- **Live region**: `aria-live="assertive"`
- **Descriptive labels**: All interactive elements have `aria-label`
- **High contrast**: White text on red/orange background
- **Keyboard focus**: Focus ring on interactive elements

## Usage

### Basic Implementation
```tsx
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'

export default function Layout({ children }) {
  return (
    <>
      <ImpersonationBanner />
      {/* Rest of your layout */}
      {children}
    </>
  )
}
```

### With Custom Styling
```tsx
<ImpersonationBanner className="shadow-2xl" />
```

## Integration Points

### Where to Add
The banner should be added to layout components that wrap the entire application:

1. **Main Dashboard Layout**: `/app/(dashboard)/layout.tsx`
2. **Root Layout**: `/app/layout.tsx` (if you want it everywhere)
3. **Mobile Layout**: `/app/m/layout.tsx` (for mobile views)

### Example: Dashboard Layout Integration
```tsx
// app/(dashboard)/layout.tsx
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'

export default function DashboardLayout({ children }) {
  return (
    <>
      <ImpersonationBanner />
      <AppShell>
        <header>...</header>
        <main>{children}</main>
      </AppShell>
    </>
  )
}
```

**Important:** If your layout uses `position: fixed` or `sticky` headers, you may need to add top padding to prevent overlap:

```tsx
// When banner is visible, add top padding
<header className="pt-[60px]"> {/* Adjust based on banner height */}
  {/* Header content */}
</header>
```

## State Management

### localStorage Key
The component reads from `localStorage.getItem('impersonatedRole')`

### Supported Values
- `null` or `undefined`: Not impersonating (banner hidden)
- `'owner'`: Normal owner view (banner hidden)
- `'admin'`: Viewing as Admin (banner shows)
- `'dispatcher'`: Viewing as Dispatcher (banner shows)
- `'tech'`: Viewing as Field Technician (banner shows)
- `'sales'`: Viewing as Sales Person (banner shows)

### Setting Impersonation State
```typescript
// Start impersonation
localStorage.setItem('impersonatedRole', 'tech')
window.location.reload()

// Stop impersonation
localStorage.removeItem('impersonatedRole')
window.location.reload()
```

## Styling Details

### Color Palette
- **Background**: `bg-gradient-to-r from-orange-600 to-red-600`
- **Text**: `text-white`
- **Exit Button**:
  - Background: `bg-white/10`
  - Hover: `hover:bg-white/20`
  - Border: `border-white/30`

### Spacing
- **Vertical padding**: `py-3` (0.75rem)
- **Horizontal padding**: `px-4` (1rem)
- **Gap between elements**: `gap-4` (1rem)

### Typography
- **Main message**: `font-bold text-sm sm:text-base`
- **Subtext**: `text-xs sm:text-sm opacity-90`

## Dependencies

### React Hooks
- `useState`: For managing component state
- `useEffect`: For checking localStorage on mount
- `useRouter` (Next.js): For navigation

### UI Components
- `Button` from `@/components/ui/button`
- `AlertTriangle` and `X` from `lucide-react`

### Installation
```bash
npm install lucide-react
```

## Testing Checklist

### Manual Testing
1. ✅ Set `localStorage.impersonatedRole = 'tech'` in browser console
2. ✅ Reload page - banner should appear
3. ✅ Click banner text - should navigate to `/admin/settings`
4. ✅ Click "Exit" button - should clear state and reload
5. ✅ Verify banner disappears after exiting
6. ✅ Test on mobile (responsive design)
7. ✅ Test keyboard navigation (Tab, Enter, Escape)
8. ✅ Test screen reader announcements

### Different Roles
Test with each role:
```javascript
// In browser console
localStorage.setItem('impersonatedRole', 'admin')
localStorage.setItem('impersonatedRole', 'dispatcher')
localStorage.setItem('impersonatedRole', 'tech')
localStorage.setItem('impersonatedRole', 'sales')
```

Verify each shows the correct icon and display name.

## Troubleshooting

### Banner Not Appearing
1. Check if `impersonatedRole` is set in localStorage
2. Verify the role is not 'owner' (which hides the banner)
3. Check browser console for JavaScript errors
4. Ensure the component is imported and rendered in your layout

### Banner Overlapping Content
1. Add top padding to your main content area
2. Adjust the `z-index` if other elements are covering it
3. Check if parent containers have `overflow: hidden`

### Exit Button Not Working
1. Verify localStorage is accessible (not in incognito mode with restrictions)
2. Check browser console for errors
3. Ensure the router is functioning properly

## Future Enhancements

### Potential Improvements
1. **Animation**: Slide-in animation when banner appears
2. **Dismissible**: Option to temporarily hide banner (with reminder)
3. **Session tracking**: Show how long impersonation has been active
4. **Audit log link**: Quick link to view impersonation audit logs
5. **Multi-role preview**: Switch between roles without exiting
6. **User impersonation**: Impersonate specific users, not just roles

### Advanced Features
```tsx
// Example: Extended banner with more features
<ImpersonationBanner
  showDuration={true}
  showAuditLink={true}
  allowRoleSwitch={true}
  onRoleChange={(newRole) => handleRoleChange(newRole)}
/>
```

## Related Files
- **Settings Page**: `/app/(dashboard)/admin/settings/page.tsx` (where impersonation is configured)
- **Role Routes**: `/lib/auth/role-routes.ts` (defines role types and routes)
- **Migration**: `/supabase/migrations/20251127_add_user_impersonation.sql` (database schema)

## Support
For questions or issues with this component, contact the development team or refer to the main project documentation.
