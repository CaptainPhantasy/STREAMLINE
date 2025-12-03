# ImpersonationBanner Visual Preview

## Desktop View (Large Screen)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  🔨 IMPERSONATION MODE: Viewing as Field Technician              [EXIT]  │
│     All actions are logged. Click here or use Exit button to return to       │
│     Owner view.                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Colors:**
- Background: Orange-to-red gradient (`from-orange-600 to-red-600`)
- Text: White
- Icon: Pulsing animation (AlertTriangle from lucide-react)
- Shadow: Elevated shadow for depth

**Dimensions:**
- Height: ~60px (varies with content)
- Width: Full viewport width (100vw)
- Position: Fixed at top (z-index: 100)

---

## Tablet View (Medium Screen)

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️  📋 IMPERSONATION MODE: Viewing as Dispatcher       [EXIT] │
│     All actions are logged. Click to exit or return to         │
│     Settings.                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Responsive Changes:**
- Slightly smaller padding
- Condensed subtext
- Same visual prominence

---

## Mobile View (Small Screen)

```
┌──────────────────────────────────────────────────┐
│  ⚠️  💼 IMPERSONATION MODE: Viewing as    [✕]   │
│     Sales Person                                 │
│     Click to exit or return to Settings          │
└──────────────────────────────────────────────────┘
```

**Mobile Optimizations:**
- Role name wraps to second line if needed
- Exit button shows only "✕" icon (no text)
- Shorter message text
- Maintains full width and prominence

---

## Role-Specific Examples

### Admin Role
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️  🔧 IMPERSONATION MODE: Viewing as Admin             [EXIT]  │
│     All actions are logged. Click here or use Exit button to     │
│     return to Owner view.                                         │
└──────────────────────────────────────────────────────────────────┘
```

### Dispatcher Role
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️  📋 IMPERSONATION MODE: Viewing as Dispatcher        [EXIT]  │
│     All actions are logged. Click here or use Exit button to     │
│     return to Owner view.                                         │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Role
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️  🔨 IMPERSONATION MODE: Viewing as Field Technician  [EXIT]  │
│     All actions are logged. Click here or use Exit button to     │
│     return to Owner view.                                         │
└──────────────────────────────────────────────────────────────────┘
```

### Sales Role
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️  💼 IMPERSONATION MODE: Viewing as Sales Person      [EXIT]  │
│     All actions are logged. Click here or use Exit button to     │
│     return to Owner view.                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Interactive States

### Default State
- Background: Orange-to-red gradient
- Icon: Pulsing slowly
- Exit button: Semi-transparent white

### Hover State (Banner Text)
- Opacity: 90%
- Cursor: Pointer
- Shows focus ring on keyboard focus

### Hover State (Exit Button)
- Background: More opaque white (`bg-white/20`)
- Border: Brighter white (`border-white/50`)
- Cursor: Pointer

### Focus State (Keyboard Navigation)
- Focus ring: 2px white ring with 50% opacity
- Clear visual indicator for accessibility

---

## Color Specifications

### Background Gradient
```css
background: linear-gradient(to right, #ea580c, #dc2626);
/* from-orange-600 to-red-600 */
```

### Text Colors
```css
color: #ffffff; /* White text */
opacity: 0.9; /* For subtext */
```

### Button Colors
```css
background: rgba(255, 255, 255, 0.1);
border: rgba(255, 255, 255, 0.3);

/* Hover */
background: rgba(255, 255, 255, 0.2);
border: rgba(255, 255, 255, 0.5);
```

### Icon
```css
/* AlertTriangle icon */
width: 1.25rem; /* 20px */
height: 1.25rem; /* 20px */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## Layout Context

### Banner Position in Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ImpersonationBanner (fixed, top-0, z-100)                   │
├─────────────────────────────────────────────────────────────┤
│ Header (navigation, search, user menu)                      │
├─────────────────────────────────────────────────────────────┤
│ Sidebar (if applicable)  │  Main Content Area              │
│                           │                                  │
│                           │                                  │
│                           │                                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Layout Details:**
- Banner is **above** all other content
- Uses `position: fixed` to stay at top when scrolling
- Does **not** push content down (overlays)
- Main content may need top padding to avoid being hidden

---

## Animation Details

### Icon Pulse Animation
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Duration:** 2 seconds
**Easing:** Cubic bezier (0.4, 0, 0.6, 1)
**Iterations:** Infinite

### Hover Transition
```css
transition: opacity 0.3s ease-in-out;
```

**Duration:** 300ms
**Easing:** Ease-in-out

---

## Accessibility Features

### Visual Indicators
- ✅ High contrast (white on red/orange)
- ✅ Large, bold text
- ✅ Animated warning icon
- ✅ Clear exit button

### Keyboard Navigation
- ✅ Tab to focus banner
- ✅ Enter to navigate to settings
- ✅ Tab to exit button
- ✅ Enter to exit impersonation

### Screen Reader Support
- ✅ `role="alert"` for immediate announcement
- ✅ `aria-live="assertive"` for priority
- ✅ `aria-label` on all interactive elements
- ✅ Descriptive text for context

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### CSS Features Used
- CSS Grid
- Flexbox
- Gradients
- Transitions
- Fixed positioning
- Z-index layering

### JavaScript Features
- localStorage
- useEffect hook
- useRouter (Next.js)
- useState hook

---

## Print Preview

When printing the page, the banner should:
- **Not appear** (use `@media print { display: none; }` if needed)
- Ensure it doesn't waste ink
- Doesn't affect page layout when printed

**CSS for print (if needed):**
```css
@media print {
  .impersonation-banner {
    display: none !important;
  }
}
```

---

## Dark Mode / Theme Compatibility

The banner uses **fixed colors** (orange/red gradient) regardless of theme:
- This ensures high visibility
- Creates a universal "warning" appearance
- Consistent across all themes (warm, midnight, light, dark, ops)

**Reasoning:**
- Warning banners should be **immediately recognizable**
- Should not blend into any theme
- Orange/red universally signals "caution"

---

## Final Visual Summary

### Key Visual Elements
1. **Warning Icon** (⚠️): Pulsing, left side
2. **Role Icon** (🔧/📋/🔨/💼): Next to mode text
3. **Bold Title**: "IMPERSONATION MODE: Viewing as [Role]"
4. **Subtext**: Instructions for exiting
5. **Exit Button**: Right-aligned, white on transparent

### Visual Hierarchy
1. **Primary**: Role name and impersonation status (bold, large)
2. **Secondary**: Instructions/subtext (smaller, 90% opacity)
3. **Action**: Exit button (clear, accessible)

### Design Philosophy
- **Impossible to miss**: Bright colors, top position, full width
- **Clear purpose**: Immediate understanding of impersonation
- **Easy exit**: One-click return to normal view
- **Professional**: Clean, polished, production-ready
