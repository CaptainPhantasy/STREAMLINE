<!-- 88456ee0-6904-4e83-9239-83fdf8062b9f b5154d6b-0a5f-4332-b534-981ff7992d82 -->
# Mobile Styling Parity & Navigation Implementation Plan

## Problem Analysis

**Current Issues:**

1. Mobile uses hardcoded blue colors (`bg-blue-600`, `text-blue-400`) instead of theme system
2. Desktop default is **Solaris** theme (light) with orange accent (#F97316)
3. BigButton has 60px min-height (too large for voice-first interaction)
4. No bottom navigation bar (users stuck on dashboard)
5. Missing quick workflow features that testers will likely request

## Theme System

**Available Themes:**

- **Solaris (Light)** - Default, orange accent `#F97316`
- **Opus (Dark)** - Dark theme alternative
- **Latte (Warm)** - Warm light theme
- **System** - Auto-detect based on OS preference
- **Ops** - IGNORE (being removed, don't use for mobile)

**Default:** Solaris (light theme)

## Implementation Strategy

### Phase 1: Styling Parity (Critical)

**Replace hardcoded blue with theme variables:**

1. **Update BigButton component** (`components/mobile/big-button.tsx`):

- Replace `bg-blue-600` with `bg-[var(--color-accent-primary)]` (Solaris orange)
- Replace all hardcoded colors with theme-aware classes
- Reduce `min-h-[60px]` to `min-h-[44px]` (standard touch target, not glove-sized)
- Use CSS variables: `var(--color-accent-primary)` for orange accent

2. **Update mobile pages** to use theme variables:

- `app/m/tech/dashboard/page.tsx` - Replace blue with theme colors
- `app/m/tech/job/[id]/page.tsx` - Replace blue accents
- `app/m/sales/dashboard/page.tsx` - Replace blue gradients
- `app/m/sales/briefing/[contactId]/page.tsx` - Replace blue accents
- `app/m/owner/dashboard/page.tsx` - Already mostly correct, verify
- `app/m/office/dashboard/page.tsx` - Replace blue buttons

3. **Update mobile layout** (`app/m/mobile-layout-client.tsx`):

- Ensure theme is applied (check `data-theme` attribute)
- Use theme background colors: `bg-theme-primary` instead of hardcoded `bg-gray-900`
- Default to Solaris theme if no preference set

4. **Update tech layout** (`app/m/tech/layout.tsx`):

- Replace `bg-blue-600` in sync indicator with `bg-[var(--color-accent-primary)]`
- Replace `bg-yellow-600` in offline indicator with theme warning color

**Files to modify:**

- `components/mobile/big-button.tsx` - Theme-aware colors, smaller size
- `app/m/tech/dashboard/page.tsx` - Theme colors
- `app/m/tech/job/[id]/page.tsx` - Theme colors
- `app/m/sales/dashboard/page.tsx` - Theme colors
- `app/m/sales/briefing/[contactId]/page.tsx` - Theme colors
- `app/m/office/dashboard/page.tsx` - Theme colors
- `app/m/mobile-layout-client.tsx` - Theme background
- `app/m/tech/layout.tsx` - Theme indicators

### Phase 2: Bottom Navigation (Critical)

**Create bottom navigation component:**

1. **Create component** (`components/mobile/bottom-nav.tsx`):

- Tech nav: Home, Jobs, Map, Profile
- Sales nav: Home, Leads, Meetings, Profile
- Use theme colors (orange accent from Solaris)
- Fixed position at bottom
- Active state highlighting with theme accent

2. **Create role-specific layouts:**

- `app/m/tech/layout.tsx` - Add TechBottomNav
- `app/m/sales/layout.tsx` - Add SalesBottomNav (create if missing)

3. **Create missing pages:**

- `app/m/tech/map/page.tsx` - Map view of assigned jobs
- `app/m/tech/profile/page.tsx` - Tech profile/settings
- `app/m/sales/leads/page.tsx` - Leads pipeline view
- `app/m/sales/profile/page.tsx` - Sales profile/settings

**Files to create:**

- `components/mobile/bottom-nav.tsx` - Bottom navigation component
- `app/m/sales/layout.tsx` - Sales-specific layout with nav
- `app/m/tech/map/page.tsx` - Tech map view
- `app/m/tech/profile/page.tsx` - Tech profile
- `app/m/sales/leads/page.tsx` - Sales leads
- `app/m/sales/profile/page.tsx` - Sales profile

**Files to modify:**

- `app/m/tech/layout.tsx` - Add TechBottomNav
- `app/m/mobile-layout-client.tsx` - Ensure proper padding for bottom nav

### Phase 3: Quick Workflow Improvements

**Anticipate test feedback and add:**

1. **Voice command indicator:**

- Add floating voice button on mobile pages
- Show "Tap to speak" or microphone icon
- Integrate with existing `useVoiceNavigation` hook
- Make voice interaction visible/prominent
- Use theme colors for button

2. **Back navigation:**

- Add back button to job/meeting detail pages (already exists in some)
- Ensure consistent back behavior

3. **Loading states:**

- Improve loading indicators (use theme colors)
- Add skeleton loaders for better UX

4. **Error handling:**

- Add toast notifications for errors
- Use theme colors for error states

5. **Quick actions:**

- Add "Call Customer" quick action on job pages
- Add "Navigate" quick action (already exists, verify styling)

**Files to modify:**

- `app/m/tech/job/[id]/page.tsx` - Add voice button, improve quick actions
- `app/m/sales/meeting/[id]/page.tsx` - Add voice button
- `app/m/tech/dashboard/page.tsx` - Add voice button
- `app/m/sales/dashboard/page.tsx` - Add voice button

**Files to create:**

- `components/mobile/voice-button.tsx` - Floating voice command button

### Phase 4: Theme Application

**Ensure mobile respects theme:**

1. **Check theme initialization:**

- Verify mobile layout applies theme from localStorage
- Default to Solaris (light theme) if no preference set
- Ensure `data-theme` attribute is set on mobile pages
- Support themes: "light" (Solaris), "dark" (Opus), "warm" (Latte), "system"
- Do NOT use "ops" theme
- Test theme switching works on mobile

2. **Mobile-specific theme considerations:**

- Ensure orange accent (#F97316) is visible in all themes
- Verify contrast ratios for accessibility
- Test on actual mobile devices
- Ensure theme variables work correctly across all supported themes

**Files to modify:**

- `app/m/layout.tsx` - Ensure theme script runs, defaults to Solaris
- `app/m/mobile-layout-client.tsx` - Apply theme classes

## Color Mapping Reference

**Theme System:**

- **Default: Solaris (Light)** - Orange accent `#F97316`
- **Alternatives: Opus (Dark), Latte (Warm), System (Auto)**
- **Ignore: Ops theme** (being removed)

**Solaris Theme (Default):**

- Primary accent: `#F97316` (Orange 500)
- CSS variable: `var(--color-accent-primary)` or `var(--light-accent-primary)`
- Theme attribute: `data-theme="light"` (Solaris)
- Tailwind utility: Use CSS variables directly: `bg-[var(--color-accent-primary)]`

**Replace these patterns:**

- `bg-blue-600` → `bg-[var(--color-accent-primary)]`
- `text-blue-400` → `text-[var(--color-accent-primary)]`
- `border-blue-500` → `border-[var(--color-accent-primary)]`
- `bg-gray-900` → `bg-theme-primary` or `bg-[var(--color-bg-primary)]`
- `text-white` → `text-theme-primary` or `text-[var(--color-text-primary)]`

**Mobile Theme Application:**

- Mobile should respect same theme system as desktop
- Default to Solaris (light theme) if no preference
- Use theme variables, not hardcoded colors
- Ensure theme switching works on mobile
- Support all themes except Ops

## Testing Checklist

- [ ] Mobile pages use orange accent (not blue) in Solaris theme
- [ ] Buttons are standard size (match desktop) with larger touch targets via padding
- [ ] Bottom navigation works and matches theme
- [ ] Voice button is visible and functional
- [ ] Theme switching works on mobile (Solaris, Opus, Latte, System)
- [ ] All pages are accessible via navigation
- [ ] Loading states use theme colors
- [ ] Error states use theme colors
- [ ] Default theme is Solaris (light)
- [ ] Ops theme is not used anywhere

## Success Criteria

1. Mobile styling matches desktop (Solaris theme

### To-dos

- [ ] Update BigButton component: replace blue with theme variables, reduce size from 60px to 44px
- [ ] Update tech dashboard page: replace hardcoded blue colors with theme variables
- [ ] Update tech job detail page: replace blue accents with theme colors
- [ ] Update sales dashboard: replace blue gradients with theme colors
- [ ] Update sales briefing page: replace blue accents with theme
- [ ] Update office dashboard: replace blue buttons with theme colors
- [ ] Update mobile layouts: use theme backgrounds and indicator colors
- [ ] Create bottom navigation component with theme colors
- [ ] Add bottom navigation to tech layout
- [ ] Create sales layout with bottom navigation
- [ ] Create tech map page showing assigned jobs on map
- [ ] Create tech profile/settings page
- [ ] Create sales leads pipeline page
- [ ] Create sales profile/settings page
- [ ] Create floating voice command button component
- [ ] Add voice button to tech and sales pages
- [ ] Verify theme initialization and switching works on mobile