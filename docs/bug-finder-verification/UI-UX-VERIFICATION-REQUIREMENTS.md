# UI/UX Visual Verification Requirements

**Purpose**: Complete requirements for verifying the platform works from a HUMAN PERSPECTIVE

**CRITICAL**: Just because code works doesn't mean humans can see/use it. This verification is SEPARATE from functional verification.

---

## Why This Matters

- ✅ API connects → But can humans see the data?
- ✅ Component renders → But is text readable? (not white on white)
- ✅ Button exists → But is it visible and clickable?
- ✅ Form works → But can humans actually use it?
- ✅ Layout loads → But does it make sense visually?

**You must verify BOTH functional AND visual/UX aspects.**

---

## Visual Rendering Verification

### Text Visibility & Contrast
- [ ] **No white text on white background** (invisible text)
- [ ] **No black text on black background** (invisible text)
- [ ] **Text contrast meets WCAG AA minimum** (4.5:1 for normal text, 3:1 for large text)
- [ ] **Text is readable** (not too small, not too large)
- [ ] **Font colors are correct** (not default browser colors, not invisible)
- [ ] **Text is not obscured** (not behind images, not cut off)

### Color Usage
- [ ] **Colors are visible** (not transparent, not same as background)
- [ ] **Colors are correct** (match design system, not random)
- [ ] **Colors don't clash** (readable combinations)
- [ ] **Color-blind accessible** (not relying solely on color)
- [ ] **Background colors are correct** (not transparent, not wrong)

### Component Rendering
- [ ] **Components actually render** (not missing, not broken)
- [ ] **Components are visible** (not hidden, not transparent)
- [ ] **Components are positioned correctly** (not overlapping, not off-screen)
- [ ] **Components are sized correctly** (not too small, not too large)
- [ ] **Components load correctly** (not broken images, not missing icons)

### Layout & Positioning
- [ ] **Layout is correct** (things appear where they should)
- [ ] **No overlapping elements** (text doesn't overlap buttons, etc.)
- [ ] **No elements off-screen** (everything visible in viewport)
- [ ] **Spacing is correct** (not cramped, not too spread out)
- [ ] **Alignment is correct** (things line up properly)

---

## UI/UX Usability Verification

### Interactive Elements
- [ ] **Buttons are visible** (not hidden, not transparent)
- [ ] **Buttons are clickable** (not disabled when shouldn't be, not behind other elements)
- [ ] **Links are visible** (not same color as text, have underline or distinct color)
- [ ] **Links are clickable** (not disabled, not broken)
- [ ] **Form inputs are visible** (not hidden, not transparent)
- [ ] **Form inputs are usable** (can type in them, labels are visible)
- [ ] **Dropdowns work** (can open, can select, options visible)

### Navigation
- [ ] **Navigation is visible** (not hidden, not broken)
- [ ] **Navigation is usable** (can click links, can navigate)
- [ ] **Breadcrumbs work** (if present, clickable, visible)
- [ ] **Back buttons work** (if present, clickable, visible)
- [ ] **Menu items are visible** (not hidden, not transparent)

### Forms
- [ ] **Form labels are visible** (not hidden, not same color as background)
- [ ] **Form inputs are visible** (not hidden, not transparent)
- [ ] **Form validation messages are visible** (not hidden, readable)
- [ ] **Form submit buttons are visible** (not hidden, clickable)
- [ ] **Form error messages are visible** (not hidden, readable)

### Error States
- [ ] **Error messages are visible** (not hidden, not transparent)
- [ ] **Error messages are readable** (proper contrast, proper font size)
- [ ] **Error indicators are visible** (red borders, icons, etc.)
- [ ] **Loading states are visible** (spinners, progress bars, etc.)
- [ ] **Empty states are visible** (messages, placeholders, etc.)

---

## Responsive Design Verification

### Desktop (1920x1080, 1366x768)
- [ ] **Layout works correctly** (not broken, not cramped)
- [ ] **Text is readable** (not too small, not too large)
- [ ] **Components are visible** (not hidden, not off-screen)
- [ ] **Navigation works** (can navigate, links clickable)

### Tablet (768x1024)
- [ ] **Layout adapts correctly** (responsive breakpoints work)
- [ ] **Text doesn't overflow** (wraps correctly)
- [ ] **Components don't overlap** (spacing correct)
- [ ] **Navigation adapts** (hamburger menu if needed, etc.)

### Mobile (375x667, 414x896)
- [ ] **Layout adapts correctly** (mobile-first design works)
- [ ] **Text is readable** (not too small, wraps correctly)
- [ ] **Touch targets are large enough** (buttons/links at least 44x44px)
- [ ] **Navigation works** (mobile menu, swipe gestures if applicable)
- [ ] **Forms are usable** (inputs large enough, keyboard works)

---

## Accessibility Verification

### Keyboard Navigation
- [ ] **Can navigate with keyboard** (Tab key works)
- [ ] **Focus indicators are visible** (can see what's focused)
- [ ] **Focus order is logical** (Tab order makes sense)
- [ ] **Can activate with keyboard** (Enter/Space works)

### Screen Reader Compatibility
- [ ] **ARIA labels present** (if needed, for screen readers)
- [ ] **Alt text on images** (if images convey information)
- [ ] **Semantic HTML** (proper headings, landmarks, etc.)

### Visual Accessibility
- [ ] **Not relying solely on color** (icons, text, patterns also used)
- [ ] **Contrast meets WCAG AA** (4.5:1 for normal text)
- [ ] **Text can be resized** (browser zoom works)

---

## Testing Methodology

### Visual Inspection Process
1. **Render the page** (actually load it in browser/dev tools)
2. **Inspect visually** (look at it like a human would)
3. **Check contrast** (use browser dev tools to check contrast ratios)
4. **Check colors** (verify colors are visible, not transparent)
5. **Check layout** (verify things appear where they should)
6. **Test interactions** (click buttons, fill forms, navigate)
7. **Test responsive** (resize browser, test different screen sizes)
8. **Test accessibility** (keyboard navigation, focus indicators)

### Tools to Use
- **Browser Dev Tools**: Inspect elements, check contrast, test responsive
- **Color Contrast Checker**: Verify WCAG compliance
- **Screen Reader**: Test accessibility (if available)
- **Browser Zoom**: Test text resizing
- **Mobile Emulation**: Test responsive design

---

## Fix Process

When you find a visual/UX issue:

1. **Identify the issue** (what's wrong? white on white? missing component?)
2. **Find the code** (where is this rendered? what component? what CSS?)
3. **Fix the code** (update colors, fix CSS, fix component)
4. **Re-test visually** (render again, verify fix works)
5. **Document the fix** (what was wrong, what you fixed, how you fixed it)

---

## Critical Issues to Fix Immediately

These are show-stoppers - fix them immediately:

- ❌ **White text on white background** (invisible text)
- ❌ **Black text on black background** (invisible text)
- ❌ **Components not rendering** (missing, broken)
- ❌ **Buttons/links not clickable** (hidden, disabled incorrectly)
- ❌ **Forms not usable** (inputs hidden, labels missing)
- ❌ **Layout completely broken** (overlapping, off-screen)
- ❌ **No contrast** (text unreadable, WCAG fail)

---

## Verification Checklist

For EVERY page and component:

- [ ] Visually inspected (actually rendered and looked at)
- [ ] Text contrast verified (WCAG AA minimum)
- [ ] Colors verified (visible, correct)
- [ ] Components verified (render correctly, visible)
- [ ] Layout verified (correct, responsive)
- [ ] Usability verified (humans can use it)
- [ ] Accessibility verified (keyboard nav, focus)
- [ ] Responsive verified (desktop, tablet, mobile)
- [ ] All issues fixed (if any found)
- [ ] Fixes re-tested (verified fixes work)

---

**Remember**: Test from HUMAN PERSPECTIVE. Actually render and visually inspect. Don't just check if code works - check if humans can see and use it.

12:45:00 Dec 03, 2025

