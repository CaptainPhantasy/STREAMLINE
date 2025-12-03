# Dispatch Map Dashboard - Agent Work Assignments

**Date:** 2025-11-27
**Status:** Ready for Parallel Execution
**Strategy:** Spawn specialized agents to complete all remaining phases simultaneously

---

## Execution Strategy

All Phase 3 and Phase 4 tasks will be executed in parallel by specialized agents. Each agent has a specific focus area and will work independently.

**Total Agents:** 9 specialized agents
**Execution Mode:** Parallel (all agents work simultaneously)
**Estimated Total Time:** 6-8 hours (parallelized from 40+ hours sequential)

---

## Agent 1: API Endpoints Specialist

**Focus:** Create all API endpoints for Phase 3 & 4

**Assigned Tasks:**
1. Create `GET /api/dispatch/jobs/active` - Fetch active jobs for map
2. Create `GET /api/dispatch/techs/[id]/activity` - Recent GPS logs per tech
3. Create `GET /api/dispatch/techs/[id]/stats` - Daily performance stats
4. Create `POST /api/dispatch/jobs/[id]/assign` - Assign tech to job
5. Create `GET /api/dispatch/stats` - All statistics data
6. Create `GET /api/dispatch/historical-gps` - Historical GPS logs
7. Create `POST /api/dispatch/auto-assign` - Auto-assign best tech

**Deliverables:**
- 7 API route files in `app/api/dispatch/`
- Type-safe request/response interfaces
- Error handling and validation
- Multi-tenant filtering (account_id)
- API documentation comments

**Files to Create:**
- `app/api/dispatch/jobs/active/route.ts`
- `app/api/dispatch/techs/[id]/activity/route.ts`
- `app/api/dispatch/techs/[id]/stats/route.ts`
- `app/api/dispatch/jobs/[id]/assign/route.ts`
- `app/api/dispatch/stats/route.ts`
- `app/api/dispatch/historical-gps/route.ts`
- `app/api/dispatch/auto-assign/route.ts`

**Estimated Time:** 5-6 hours

---

## Agent 2: TechDetailPanel Component Developer

**Focus:** Build comprehensive tech detail panel

**Assigned Tasks:**
1. Create `TechDetailPanel` component with full UI
2. Fetch and display tech activity (recent GPS logs)
3. Fetch and display tech stats (jobs completed, avg time)
4. Implement "Navigate to Tech" button
5. Implement "Assign Job" button trigger
6. Add contact tech button (phone/SMS)
7. Make mobile responsive (bottom sheet)
8. Add loading and error states

**Deliverables:**
- `components/dispatch/TechDetailPanel.tsx`
- Styled with shadcn/ui components
- Dark theme matching dashboard
- Type-safe props interface
- Unit tests (optional but recommended)

**Files to Create:**
- `components/dispatch/TechDetailPanel.tsx`

**Dependencies:**
- API endpoints (Agent 1)
- Distance calculations (already exists in `lib/utils/distance.ts`)

**Estimated Time:** 2-3 hours

---

## Agent 3: JobDetailPanel Component Developer

**Focus:** Build job detail panel with distance calculations

**Assigned Tasks:**
1. Create `JobDetailPanel` component with full UI
2. Display job information (address, status, customer)
3. Calculate and display distances to all available techs
4. Sort techs by distance (nearest first)
5. Implement "Assign Tech" button
6. Implement "Navigate to Job" button
7. Add color-coding for distance ranges
8. Make mobile responsive

**Deliverables:**
- `components/dispatch/JobDetailPanel.tsx`
- Distance calculation integration
- Tech recommendation list UI
- Type-safe props interface

**Files to Create:**
- `components/dispatch/JobDetailPanel.tsx`

**Dependencies:**
- API endpoints (Agent 1)
- Distance calculations (already exists)

**Estimated Time:** 2-3 hours

---

## Agent 4: TechListSidebar Component Developer

**Focus:** Build sidebar with filters and search

**Assigned Tasks:**
1. Create `TechListSidebar` component
2. Implement search input (filter by tech name)
3. Implement status filter chips (All, On Job, En Route, Idle, Offline)
4. Display tech list with status badges
5. Add sort options (name, status, distance)
6. Implement collapse/expand functionality
7. Add hover interactions (highlight marker)
8. Make mobile responsive (slide-out drawer)

**Deliverables:**
- `components/dispatch/TechListSidebar.tsx`
- Search and filter logic
- Collapsible sidebar with smooth animations
- Mobile drawer implementation

**Files to Create:**
- `components/dispatch/TechListSidebar.tsx`

**Dependencies:**
- None (uses existing tech data)

**Estimated Time:** 3-4 hours

---

## Agent 5: Job Assignment Specialist

**Focus:** Build assignment dialog and integrate assignment flow

**Assigned Tasks:**
1. Create `AssignTechDialog` component
2. Display job details in dialog
3. Show tech selection list with distances/ETAs
4. Implement assignment confirmation
5. Add validation (can't assign busy tech)
6. Add success/error toast notifications
7. Integrate assignment API call
8. Update UI optimistically after assignment

**Deliverables:**
- `components/dispatch/AssignTechDialog.tsx`
- Assignment flow with confirmation
- Toast notification integration
- Optimistic UI updates

**Files to Create:**
- `components/dispatch/AssignTechDialog.tsx`

**Dependencies:**
- API endpoints (Agent 1)
- Distance calculations

**Estimated Time:** 2 hours

---

## Agent 6: Map Integration Specialist

**Focus:** Add job markers and integrate new components into map page

**Assigned Tasks:**
1. Update `app/(dashboard)/dispatch/map/page.tsx` to fetch jobs
2. Add job markers to map with status-based colors
3. Implement job marker click handler (open JobDetailPanel)
4. Add Supabase real-time subscription for job updates
5. Integrate TechDetailPanel, JobDetailPanel, TechListSidebar
6. Add state management (React Context or Zustand)
7. Handle marker interactions (hover, click, select)
8. Implement marker clustering for >20 markers

**Deliverables:**
- Updated `app/(dashboard)/dispatch/map/page.tsx`
- Job markers on map
- All panels integrated and functional
- Real-time job updates working
- State management solution

**Files to Modify:**
- `app/(dashboard)/dispatch/map/page.tsx`

**Files to Create:**
- `contexts/DispatchContext.tsx` (optional, if using Context)

**Dependencies:**
- All components (Agents 2-5)
- API endpoints (Agent 1)

**Estimated Time:** 4-5 hours

---

## Agent 7: Statistics Dashboard Developer

**Focus:** Build advanced statistics dashboard (Phase 4)

**Assigned Tasks:**
1. Create `DispatchStats` component
2. Build KPI cards (Team Efficiency, Response Time, Utilization, Coverage)
3. Implement charts (Jobs by Status, Tech Activity, Distance Traveled, Completion Rate)
4. Add time range selector (today, week, month)
5. Integrate with stats API endpoint
6. Add export functionality (PDF/CSV)
7. Make collapsible section above map
8. Style with dark theme

**Deliverables:**
- `components/dispatch/DispatchStats.tsx`
- KPI cards with trend indicators
- 4 charts using recharts or chart.js
- Export functionality
- Collapsible UI

**Files to Create:**
- `components/dispatch/DispatchStats.tsx`

**Dependencies:**
- Stats API endpoint (Agent 1)
- Chart library (install if needed)

**Estimated Time:** 4-5 hours

---

## Agent 8: Map Controls & Navigation Developer

**Focus:** Build map controls and navigation features (Phase 4)

**Assigned Tasks:**
1. Create `MapControls` component
2. Implement "Zoom to Fit All" button
3. Implement "Center on Business" button
4. Implement "Follow Mode" toggle
5. Implement layer toggles (techs, jobs, traffic, heatmap)
6. Add refresh button with timestamp
7. Add fullscreen toggle
8. Implement marker clustering
9. Add navigation links (Google Maps integration)
10. Add "Navigate to Tech" and "Navigate to Job" features

**Deliverables:**
- `components/dispatch/MapControls.tsx`
- All control buttons functional
- Marker clustering implemented
- Navigation URL generation utility
- Floating control panel UI

**Files to Create:**
- `components/dispatch/MapControls.tsx`
- `lib/dispatch/navigation.ts` (navigation URL utilities)

**Dependencies:**
- `@googlemaps/markerclusterer` package (install if needed)

**Estimated Time:** 3-4 hours

---

## Agent 9: Automation & Historical Playback Specialist

**Focus:** Build auto-assign algorithm and historical playback (Phase 4)

**Assigned Tasks:**
1. Create auto-assign algorithm in `lib/dispatch/auto-assign.ts`
2. Implement tech eligibility filtering
3. Implement scoring algorithm (distance, performance, urgency)
4. Create "Assign Nearest Tech" UI integration
5. Create `HistoricalPlayback` component
6. Implement playback controls (play, pause, speed, scrubber)
7. Fetch and render historical GPS logs
8. Add breadcrumb trail visualization
9. Optimize historical data loading (downsampling)

**Deliverables:**
- `lib/dispatch/auto-assign.ts` - Auto-assign algorithm
- `components/dispatch/HistoricalPlayback.tsx` - Playback UI
- Integration with AssignTechDialog
- Optimized historical GPS queries

**Files to Create:**
- `lib/dispatch/auto-assign.ts`
- `components/dispatch/HistoricalPlayback.tsx`

**Dependencies:**
- API endpoints (Agent 1)
- Distance calculations

**Estimated Time:** 5-6 hours

---

## Database Schema Agent (Agent 10)

**Focus:** Update database schema for new features

**Assigned Tasks:**
1. Add `latitude`, `longitude`, `geocoded_at` columns to `jobs` table
2. Create `geocode_cache` table
3. Create indexes for performance optimization
4. Write migration script
5. Test schema changes

**Deliverables:**
- Migration SQL file
- Index creation statements
- Rollback script (if needed)

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_add_job_locations.sql`

**Dependencies:**
- None (can run immediately)

**Estimated Time:** 1-2 hours

---

## Geocoding Integration Agent (Agent 11)

**Focus:** Integrate geocoding for job addresses

**Assigned Tasks:**
1. Create geocoding utility in `lib/dispatch/geocoding.ts`
2. Implement Google Maps Geocoding API integration
3. Add caching layer (check `geocode_cache` table first)
4. Add error handling and fallback
5. Integrate geocoding into job creation flow
6. Add batch geocoding for existing jobs

**Deliverables:**
- `lib/dispatch/geocoding.ts` - Geocoding utility
- Cached geocoding implementation
- Batch geocoding script

**Files to Create:**
- `lib/dispatch/geocoding.ts`
- `scripts/geocode-existing-jobs.ts`

**Dependencies:**
- Database schema (Agent 10)
- Google Maps API key (already configured)

**Estimated Time:** 2-3 hours

---

## Coordination & Integration Agent (Agent 12)

**Focus:** Ensure all pieces work together, fix integration issues

**Assigned Tasks:**
1. Review all agent deliverables
2. Test integration between components
3. Fix any TypeScript errors
4. Ensure consistent styling
5. Test real-time updates across all features
6. Verify mobile responsiveness
7. Run end-to-end tests
8. Create final comprehensive test checklist
9. Update documentation with any changes

**Deliverables:**
- Integration fixes
- Comprehensive testing report
- Updated documentation

**Dependencies:**
- All other agents complete

**Estimated Time:** 3-4 hours

---

## Execution Order

### Wave 1: Foundation (Parallel)
- **Agent 1** (API Endpoints) - Start immediately
- **Agent 10** (Database Schema) - Start immediately
- **Agent 11** (Geocoding) - Start immediately

### Wave 2: Components (Parallel, after Wave 1 API endpoints ready)
- **Agent 2** (TechDetailPanel)
- **Agent 3** (JobDetailPanel)
- **Agent 4** (TechListSidebar)
- **Agent 5** (AssignTechDialog)

### Wave 3: Integration (Parallel, after Wave 2 complete)
- **Agent 6** (Map Integration)
- **Agent 7** (Statistics Dashboard)
- **Agent 8** (Map Controls)
- **Agent 9** (Automation & Historical)

### Wave 4: Final Polish
- **Agent 12** (Coordination & Integration)

---

## Success Metrics

### Phase 3 Complete When:
- ✅ All components render without errors
- ✅ Job markers visible on map
- ✅ Distance calculations accurate
- ✅ Job assignment flow works end-to-end
- ✅ Real-time updates working
- ✅ Mobile responsive

### Phase 4 Complete When:
- ✅ Statistics dashboard shows all KPIs
- ✅ Map controls functional
- ✅ Auto-assign algorithm works
- ✅ Navigation links work
- ✅ Historical playback functional
- ✅ All performance targets met

---

## Communication Protocol

Each agent should:
1. **Start:** Post message indicating starting work
2. **Progress:** Post updates every 30-60 minutes
3. **Blockers:** Immediately report any blockers or dependency issues
4. **Complete:** Post completion message with deliverables list
5. **Review:** Request review from Coordination Agent

---

## Rollback Plan

If critical issues arise:
1. **Revert:** Each agent's work is in separate files - easy to revert
2. **Feature Flags:** Use environment variable to disable new features
3. **Incremental Deploy:** Deploy Phase 3 first, then Phase 4 after testing

---

## Final Deliverables

When all agents complete:
- ✅ Full Dispatch Map Dashboard (Phases 1-4)
- ✅ Comprehensive documentation
- ✅ Test coverage report
- ✅ Performance benchmarks
- ✅ User guide
- ✅ API documentation
- ✅ Deployment checklist

---

*Document Owner: Dispatch Map Implementation Coordinator*
*Last Updated: 2025-11-27*
