# Mobile to Desktop Migration Plan

## Overview
This document outlines the plan to consolidate all mobile-specific pages (`/m/*`) into the standard desktop pages, ensuring all features work beautifully on desktop, tablet, and mobile devices using responsive design.

## Current State

### Mobile Pages to Migrate
1. **Tech** (`/m/tech/`)
   - dashboard, job, jobs, map, profile
   
2. **Sales** (`/m/sales/`)
   - briefing, dashboard, estimates, lead, leads, meeting, meetings, profile, voice-note
   
3. **Owner** (`/m/owner/`)
   - dashboard, reports, schedule
   
4. **Office** (`/m/office/`)
   - dashboard

### Existing Desktop Pages
1. **Tech** (`/tech/`)
   - dashboard, jobs
   
2. **Sales** (`/sales/`)
   - dashboard
   
3. **Owner** (`/owner/`)
   - dashboard

## Feature Analysis

### Mobile-Specific Components (To Be Removed)
- `components/mobile/voice-button.tsx` - Voice interaction button
- `components/mobile/mobile-sidebar.tsx` - Mobile hamburger sidebar
- `components/mobile/bottom-nav.tsx` - Bottom navigation bar
- `components/mobile/big-button.tsx` - Large touch-friendly buttons

### Features Already in Desktop Pages
- ✅ Dashboard stats and metrics
- ✅ Job/meeting lists
- ✅ Contact information
- ✅ Search and filtering
- ✅ Quick actions
- ✅ Real-time updates

### Missing Features to Add to Desktop Pages

#### Sales Pages Needed
- `/sales/leads` - Lead management (currently only in mobile)
- `/sales/meetings` - Meeting management (currently only in mobile)
- `/sales/briefing/[id]` - Pre-meeting briefing (currently only in mobile)
- `/sales/meeting/[id]` - Active meeting page (currently only in mobile)
- `/sales/estimates` - Estimates management (currently only in mobile)
- `/sales/profile` - Sales rep profile (currently only in mobile)

#### Tech Pages Needed
- `/tech/map` - Tech location map (currently only in mobile)
- `/tech/job/[id]` - Individual job detail page (currently only in mobile)
- `/tech/profile` - Tech profile (currently only in mobile)

#### Owner Pages Needed
- `/owner/reports` - Business reports (currently only in mobile)
- `/owner/schedule` - Schedule management (currently only in mobile)

#### Office Pages Needed
- `/office/dashboard` - Office/dispatcher dashboard (currently only in mobile)

## Migration Strategy

### Phase 1: Create Missing Desktop Pages
Create all missing pages in the standard `(dashboard)` layout with responsive design:

1. **Sales subpages**: leads, meetings, briefing/[id], meeting/[id], estimates, profile
2. **Tech subpages**: map, job/[id], profile  
3. **Owner subpages**: reports, schedule
4. **Office pages**: dashboard

### Phase 2: Update Routing
1. Update `lib/auth/role-routes.ts` - Remove `MOBILE_ROUTES`
2. Update `components/layout/sidebar-nav.tsx` - Already done ✅
3. Update all internal links from `/m/*` to standard routes
4. Update API routes if any are mobile-specific

### Phase 3: Testing
1. User tests all migrated features on desktop
2. User tests all migrated features on tablet
3. User tests all migrated features on mobile browser
4. Verify all functionality works correctly

### Phase 4: Cleanup
1. Delete `app/m/` directory entirely
2. Delete `components/mobile/` directory
3. Remove mobile-specific routing logic
4. Remove mobile-specific CSS/styling
5. Update service worker to remove mobile routes
6. Clean up any mobile-specific documentation

## Responsive Design Approach

All pages will use:
- **Desktop (>1024px)**: Full sidebar, multi-column layouts, hover states
- **Tablet (768-1024px)**: Collapsible sidebar, 2-column layouts
- **Mobile (<768px)**: Hidden sidebar (hamburger menu), single column, touch-friendly buttons

CSS will use Tailwind responsive prefixes:
- `md:` for tablet breakpoint
- `lg:` for desktop breakpoint
- Touch-friendly sizing by default (min 44px tap targets)

## Next Steps

1. ✅ Audit complete - documented all mobile pages
2. **CURRENT**: Create missing desktop pages with responsive design
3. Update all routing references
4. User testing phase
5. Remove mobile code after confirmation

---

**Status**: Ready to begin Phase 1 - Creating missing desktop pages
**Estimated Pages to Create**: ~15 new pages
**Estimated Time**: 2-3 hours of development + testing time
