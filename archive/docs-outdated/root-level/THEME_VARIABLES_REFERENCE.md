# Theme Variables Quick Reference

**Purpose:** Quick lookup for CSS variables when replacing hardcoded colors in mobile pages

---

## Available Theme CSS Variables

### Backgrounds
```css
var(--color-bg-primary)      /* Main page background */
var(--color-bg-secondary)    /* Card/container background */
var(--color-bg-surface)      /* Input/surface background */
```

### Text
```css
var(--color-text-primary)    /* Main text color */
var(--color-text-secondary)  /* Secondary/muted text */
var(--color-text-subtle)     /* Subtle/disabled text */
```

### Borders
```css
var(--color-border)          /* Standard border color */
var(--color-border-primary)  /* Primary border (if exists) */
var(--color-border-secondary)/* Secondary border (if exists) */
```

### Accents
```css
var(--color-accent-primary)   /* Primary accent (orange/terracotta) */
var(--color-accent-secondary) /* Secondary accent (yellow/sand) */
```

---

## Theme Values by Theme

### Solaris (Light Theme) - Default
**Theme Setting:** `localStorage.setItem('theme', 'light')`

```css
--color-accent-primary: #F97316    /* Orange 500 */
--color-accent-secondary: #EAB308  /* Yellow 500 */
--color-bg-primary: (light)
--color-bg-secondary: (light)
--color-text-primary: (dark)
--color-text-secondary: (medium dark)
```

**Use Case:** Bright, professional, default theme

---

### Opus/Midnight (Dark Theme)
**Theme Setting:** `localStorage.setItem('theme', 'midnight')` or `'dark'`

```css
--color-accent-primary: #D97757    /* Terracotta */
--color-accent-secondary: #C5A289  /* Sand */
--color-bg-primary: #211F1E        /* Warm Charcoal */
--color-bg-secondary: #191817      /* Darker Sidebar */
--color-text-primary: #F0EFEA      /* Cream White */
--color-text-secondary: #9F9D96    /* Warm Grey */
```

**Use Case:** Dark mode, reduced eye strain

**Note:** There are TWO dark themes in the codebase:
- `dark` - Uses terracotta accent (#D97757)
- `midnight` - Uses blue accent (#3B82F6)

Currently mobile uses `dark` theme when user selects dark mode.

---

### Latte (Warm Theme)
**Theme Setting:** `localStorage.setItem('theme', 'warm')`

```css
--color-accent-primary: #EA580C    /* Burnt Orange */
--color-accent-secondary: #0F766E  /* Deep Teal */
--color-bg-primary: #FDF8F5        /* Warm Cream Base */
--color-bg-secondary: #F5EBE0      /* Sand Secondary */
--color-text-primary: #422006      /* Dark Bronze Text */
--color-text-secondary: #78350F    /* Medium Bronze */
```

**Use Case:** Warm, cozy, coffee-shop aesthetic

---

### System (Auto-Detect)
**Theme Setting:** `localStorage.setItem('theme', 'system')`

```css
/* Auto-detects OS preference using prefers-color-scheme */
Light OS → Uses light theme values
Dark OS → Uses midnight theme values
```

**Use Case:** Respect user's system preference

---

## Tailwind Usage Examples

### Replace Hardcoded Colors

**Blue Accent → Theme Accent:**
```typescript
// OLD
className="bg-blue-600"
// NEW
className="bg-[var(--color-accent-primary)]"

// OLD
className="text-blue-400"
// NEW
className="text-[var(--color-accent-primary)]"

// OLD
className="border-blue-500"
// NEW
className="border-[var(--color-accent-primary)]"
```

**Gray Background → Theme Background:**
```typescript
// OLD
className="bg-gray-900"
// NEW
className="bg-[var(--color-bg-primary)]"

// OLD
className="bg-gray-800"
// NEW
className="bg-[var(--color-bg-secondary)]"
```

**White/Gray Text → Theme Text:**
```typescript
// OLD
className="text-white"
// NEW
className="text-[var(--color-text-primary)]"

// OLD
className="text-gray-300"
// NEW
className="text-[var(--color-text-secondary)]"

// OLD
className="text-gray-400"
// NEW
className="text-[var(--color-text-subtle)]"
```

---

### Opacity Modifiers

Tailwind's opacity modifiers work with CSS variables:

```typescript
// 10% opacity
className="bg-[var(--color-accent-primary)]/10"

// 50% opacity
className="bg-[var(--color-accent-primary)]/50"

// 80% opacity
className="text-[var(--color-accent-primary)]/80"
```

**Common Use Cases:**
- Status badges: `bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]`
- Subtle backgrounds: `bg-[var(--color-bg-secondary)]/50`
- Muted text: `text-[var(--color-text-primary)]/60`

---

### Hover and Active States

```typescript
// Hover state
className="hover:bg-[var(--color-bg-secondary)]"

// Active state
className="active:bg-[var(--color-accent-primary)]"

// Focus state
className="focus:border-[var(--color-accent-primary)]"

// Combined
className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] active:bg-[var(--color-accent-primary)]/10"
```

---

### Gradients

```typescript
// OLD
className="bg-gradient-to-br from-blue-900/80 to-purple-900/80"

// NEW
className="bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20"
```

---

## Common Patterns

### Loading Spinner
```typescript
// OLD
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />

// NEW
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

### Status Badge (in_progress, en_route, active)
```typescript
// OLD
className="bg-blue-900 text-blue-400 px-3 py-1 rounded-full text-xs"

// NEW
className="bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] px-3 py-1 rounded-full text-xs"
```

### Card/Container
```typescript
// OLD
className="bg-gray-800 border border-gray-700 rounded-lg p-4"

// NEW
className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4"
```

### Button (Primary)
```typescript
// OLD
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"

// NEW
className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white px-4 py-2 rounded-lg"
```

### Button (Secondary/Ghost)
```typescript
// OLD
className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"

// NEW
className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
```

### Icon (Accent Color)
```typescript
// OLD
<MapPin className="w-6 h-6 text-blue-400" />

// NEW
<MapPin className="w-6 h-6 text-[var(--color-accent-primary)]" />
```

### Link
```typescript
// OLD
className="text-blue-400 hover:text-blue-300 underline"

// NEW
className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]/80 underline"
```

---

## Testing Color Changes

### Browser DevTools
1. Open page in browser
2. Right-click → Inspect Element
3. Find the element with theme variable
4. In Styles panel, see computed color value
5. Verify color changes when theme changes

### Test All Themes
```javascript
// In browser console:

// Test Solaris (Light) - Orange accent
localStorage.setItem('theme', 'light')
location.reload()

// Test Opus (Dark) - Terracotta accent
localStorage.setItem('theme', 'dark')
location.reload()

// Test Latte (Warm) - Burnt orange accent
localStorage.setItem('theme', 'warm')
location.reload()

// Test System (Auto-detect)
localStorage.setItem('theme', 'system')
location.reload()
```

### Verify Colors
**Solaris (Light):**
- Accent should be bright orange (#F97316)
- Background should be light/white
- Text should be dark

**Opus (Dark):**
- Accent should be terracotta/coral (#D97757)
- Background should be dark charcoal
- Text should be cream/white

**Latte (Warm):**
- Accent should be burnt orange (#EA580C)
- Background should be warm cream
- Text should be dark bronze

---

## Edge Cases

### When NOT to Use Theme Variables

**White Text on Accent Background:**
```typescript
// This is OK - white on colored background
className="bg-[var(--color-accent-primary)] text-white"
```

**Black Icons on Light Background:**
```typescript
// This is OK - specific icon color requirement
className="bg-white text-black"
```

**Success/Error/Warning Colors:**
```typescript
// These can stay hardcoded (semantic colors)
className="bg-green-500"   // Success
className="bg-red-500"     // Error
className="bg-yellow-500"  // Warning
className="bg-gray-500"    // Neutral/Disabled
```

**Special Gradients:**
```typescript
// If a specific gradient is part of branding, it's OK
className="bg-gradient-to-r from-orange-500 to-red-500"
```

---

## Variable Availability Check

If unsure if a variable exists, check in browser DevTools:

```javascript
// Get computed styles of root element
const root = document.documentElement
const styles = getComputedStyle(root)

// Check if variable exists
styles.getPropertyValue('--color-accent-primary')  // Should return color value
```

---

## Summary

**Most Common Replacements:**
1. `bg-blue-600` → `bg-[var(--color-accent-primary)]`
2. `text-blue-400` → `text-[var(--color-accent-primary)]`
3. `bg-gray-900` → `bg-[var(--color-bg-primary)]`
4. `bg-gray-800` → `bg-[var(--color-bg-secondary)]`
5. `text-white` → `text-[var(--color-text-primary)]`
6. `text-gray-300` → `text-[var(--color-text-secondary)]`
7. `border-gray-700` → `border-[var(--color-border)]`

**Quick Test:**
After replacement, switch between themes and verify colors change appropriately.

**Reference:**
Full theme definitions are in `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/globals.css`
