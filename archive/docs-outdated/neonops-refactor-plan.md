# CRM-AI PRO NeonOps Design System Refactor Plan

**Status**: In Progress  
**Design System**: CRM-AI PRO NeonOps v2.0.1  
**Target**: Complete cyberpunk neon-glow aesthetic with dark backgrounds and circuit board textures

## Design System Overview

### Key Characteristics
- **Dark backgrounds**: Deep blue/black (#001528, #002a50, rgba(0, 20, 40, 0.8))
- **Neon glows**: Cyan (#00E5FF), Green (#39FF14)
- **Circuit board textures**: Overlay patterns with opacity 0.4
- **High contrast**: White text on dark, glowing accents
- **Self-illuminated elements**: Box shadows with neon glow effects

### Color Palette
- **Neon Blue**: #00E5FF (glow300), #00B8D4 (glow500), #008BA3 (glow700)
- **Neon Green**: #39FF14 (glow300), #37C856 (glow500)
- **Dark Backgrounds**: rgba(0, 20, 40, 0.8), #001528, #002a50
- **Neutral**: #FFFFFF, #000000

### Effects
- **Shadows**: Neon blue/green glows (0 0 10px #00E5FF, etc.)
- **Filters**: drop-shadow(0 0 8px #00E5FF)
- **Textures**: Circuit board SVG patterns

## Task Breakdown

### Wave 1: Foundation (Dependencies)
1. **Tailwind Config** - Update colors, add custom shadows/effects
2. **Global CSS** - Add CSS variables, circuit board patterns, neon utilities
3. **Design Tokens** - Create TypeScript constants from JSON

### Wave 2: Core Components (Parallel)
4. **Button Component** - Neon glow variants
5. **Card Component** - Dark backgrounds, neon borders
6. **Input Components** - Dark theme with glow focus states
7. **Badge Component** - Neon accent styling

### Wave 3: Layout Components (Parallel)
8. **Dashboard Layout** - Dark sidebar, neon accents
9. **Auth Layout** - Dark background, neon branding
10. **Page Headers** - Neon title styling

### Wave 4: Page Refactors (Parallel)
11. **Inbox Page** - Dark panels, neon accents
12. **Jobs Page** - Dark cards, neon metrics
13. **Contacts Page** - Dark theme, neon highlights
14. **Analytics Page** - Dark charts, neon data points
15. **Finance Pages** - Dark dashboards
16. **Marketing Pages** - Dark campaigns/templates
17. **Admin Pages** - Dark admin panels
18. **Settings Pages** - Dark settings UI

### Wave 5: Special Components (Parallel)
19. **Loading Screen** - Dark background, neon logo
20. **User Menu** - Dark dropdown, neon accents
21. **Navigation** - Dark sidebar, neon active states
22. **Search Components** - Dark search bars

## Success Criteria
- All pages use dark backgrounds (#001528 or darker)
- All interactive elements have neon glow effects
- Circuit board textures visible on feature icons
- Consistent neon blue/green accent colors
- High contrast white text on dark backgrounds
- All shadows use neon glow effects

## Coordination Notes
- Use CSS variables for colors: `var(--neonBlue-glow300)`
- Circuit board pattern: SVG overlay with opacity 0.4
- All components should support dark theme by default
- Maintain accessibility (WCAG AA contrast ratios)

