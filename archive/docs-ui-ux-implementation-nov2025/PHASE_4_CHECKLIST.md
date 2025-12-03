# Phase 4: Theme Application - Quick Checklist

**Use this checklist to track completion of Phase 4 tasks**

---

## Part 1: Theme Initialization

- [x] Theme script added to `app/m/layout.tsx`
- [x] Theme reads from `localStorage.getItem('theme')`
- [x] Theme sets `data-theme` attribute on HTML element
- [x] Default theme is "light" (Solaris)
- [x] Error handling with try-catch
- [x] Client-side verification in `mobile-layout-client.tsx`
- [x] Base layout uses `var(--color-bg-primary)`
- [x] Base layout uses `var(--color-text-primary)`
- [x] Bottom navigation uses theme variables

---

## Part 2: Color Replacement - IN PROGRESS

### High Priority: Blue Colors (Accent)

**Tech Pages:**
- [ ] `app/m/tech/layout.tsx` - Line 25 sync indicator
- [ ] `app/m/tech/dashboard/page.tsx` - Lines 59, 80-81, 130
- [ ] `app/m/tech/job/[id]/page.tsx` - Lines 474, 519, 693

**Sales Pages:**
- [ ] `app/m/sales/dashboard/page.tsx` - Lines 65, 82-83
- [ ] `app/m/sales/briefing/[contactId]/page.tsx` - Lines 70, 83, 100, 107, 208
- [ ] `app/m/sales/meeting/[id]/page.tsx` - Line 223

**Other Pages:**
- [ ] `app/m/owner/dashboard/page.tsx` - Lines 79, 181, 245
- [ ] `app/m/office/dashboard/page.tsx` - Lines 85, 222

### Medium Priority: Gray Colors (Backgrounds/Text)

- [ ] `app/m/tech/dashboard/page.tsx` - Backgrounds and text
- [ ] `app/m/tech/job/[id]/page.tsx` - Backgrounds and text
- [ ] `app/m/tech/map/page.tsx` - Backgrounds and text
- [ ] `app/m/tech/profile/page.tsx` - Backgrounds and text
- [ ] `app/m/sales/dashboard/page.tsx` - Backgrounds and text
- [ ] `app/m/sales/briefing/[contactId]/page.tsx` - Backgrounds and text
- [ ] `app/m/sales/meeting/[id]/page.tsx` - Backgrounds and text
- [ ] `app/m/sales/leads/page.tsx` - Backgrounds and text
- [ ] `app/m/sales/profile/page.tsx` - Backgrounds and text
- [ ] `app/m/owner/dashboard/page.tsx` - Backgrounds and text
- [ ] `app/m/office/dashboard/page.tsx` - Backgrounds and text

---

## Part 3: Testing

### Theme System Tests
- [ ] Clear cache: `rm -rf .next`
- [ ] Start dev server: `PORT=3002 npm run dev`
- [ ] Verify default theme is "light" (orange accent)
- [ ] Test theme switching in console
- [ ] Verify `data-theme` attribute on `<html>` element

### Visual Tests - Solaris (Light)
- [ ] `/m/tech/dashboard` - Orange accent, light bg
- [ ] `/m/tech/job/[id]` - Orange accent, light bg
- [ ] `/m/tech/map` - Orange accent, light bg
- [ ] `/m/tech/profile` - Orange accent, light bg
- [ ] `/m/sales/dashboard` - Orange accent, light bg
- [ ] `/m/sales/briefing/[contactId]` - Orange accent, light bg
- [ ] `/m/sales/meeting/[id]` - Orange accent, light bg
- [ ] `/m/sales/leads` - Orange accent, light bg
- [ ] `/m/sales/profile` - Orange accent, light bg
- [ ] Bottom nav - Orange active state

### Visual Tests - Opus (Dark)
- [ ] `/m/tech/dashboard` - Terracotta accent, dark bg
- [ ] `/m/sales/dashboard` - Terracotta accent, dark bg
- [ ] Bottom nav - Terracotta active state

### Visual Tests - Latte (Warm)
- [ ] `/m/tech/dashboard` - Burnt orange accent, warm bg
- [ ] `/m/sales/dashboard` - Burnt orange accent, warm bg

### Visual Tests - System
- [ ] Auto-detects OS preference
- [ ] Dark OS → Midnight theme
- [ ] Light OS → Light theme

---

## Part 4: Verification

### Grep Verification
- [ ] No blue colors remain: `grep -rn "bg-blue-\|text-blue-\|border-blue-" app/m/`
- [ ] No hardcoded grays: `grep -rn "bg-gray-[789]00" app/m/`
- [ ] Theme variables used: `grep -rn "var(--color-" app/m/`

### Console Verification
- [ ] No theme-related errors in browser console
- [ ] No React hydration warnings
- [ ] No CSS variable warnings

### Component Verification
- [ ] Loading spinners use theme accent
- [ ] Status badges use theme accent
- [ ] Buttons use theme accent
- [ ] Icons use theme accent
- [ ] Cards use theme backgrounds
- [ ] Text uses theme colors

---

## Part 5: Documentation

- [x] `MOBILE_IMPLEMENTATION_SUMMARY.md` - Complete overview
- [x] `PHASE_4_VERIFICATION_REPORT.md` - Detailed verification
- [x] `HARDCODED_COLORS_INVENTORY.md` - Line-by-line inventory
- [x] `THEME_VARIABLES_REFERENCE.md` - Quick lookup guide
- [x] `PHASE_4_FINAL_SUMMARY.md` - Executive summary
- [x] `PHASE_4_CHECKLIST.md` - This file

---

## Part 6: Optional Enhancements

### Voice Button
- [ ] Verify if voice functionality is needed on mobile
- [ ] Create `components/mobile/voice-button.tsx` (if needed)
- [ ] Add to all mobile pages (if needed)
- [ ] Document as desktop-only (if not needed)

### Theme Switcher UI
- [ ] Add theme selector to `/m/tech/profile`
- [ ] Add theme selector to `/m/sales/profile`
- [ ] Options: Light, Dark, Warm, System
- [ ] Persist selection to localStorage
- [ ] Update theme without page reload (optional)

### Ops Theme Cleanup
- [ ] Verify ops theme is unused
- [ ] Remove from `app/globals.css` (if unused)
- [ ] Document if it should remain

---

## Part 7: Production Deployment

### Pre-Deployment
- [ ] All color replacements complete
- [ ] All tests passed
- [ ] Cache cleared: `rm -rf .next`
- [ ] Production build succeeds: `npm run build`
- [ ] Local production test: `npm run start`

### Vercel Deployment
- [ ] Build command: `rm -rf .next && next build`
- [ ] Install command: `npm install --legacy-peer-deps`
- [ ] Environment variables verified
- [ ] Deployment succeeds
- [ ] Production site tested in all themes

---

## Completion Status

**Infrastructure:** 100% Complete
**Color Replacement:** 0% Complete
**Testing:** 0% Complete
**Documentation:** 100% Complete

**Overall Phase 4 Completion:** ~30%

**Next Steps:** Begin systematic color replacement using `HARDCODED_COLORS_INVENTORY.md`

---

## Quick Commands

```bash
# Clear cache
rm -rf .next

# Start dev server
PORT=3002 npm run dev

# Find remaining blue colors
grep -rn "bg-blue-\|text-blue-\|border-blue-" app/m/

# Find remaining gray colors
grep -rn "bg-gray-[789]00" app/m/

# Test theme switching (in browser console)
localStorage.setItem('theme', 'light'); location.reload()
localStorage.setItem('theme', 'dark'); location.reload()
localStorage.setItem('theme', 'warm'); location.reload()
localStorage.setItem('theme', 'system'); location.reload()
```

---

**Last Updated:** November 28, 2025
**Status:** Infrastructure complete, color replacement pending
