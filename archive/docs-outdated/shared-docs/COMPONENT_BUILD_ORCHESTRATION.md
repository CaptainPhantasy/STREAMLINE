# Component Build Orchestration - Master Plan

**Status:** 🚧 In Progress
**Start Date:** 2025-11-27
**Target Completion:** 5 Weeks (Parallel Execution)
**Total Components:** 51 Components

---

## Executive Summary

This document serves as the single source of truth for building 51 missing UI components across the CRM-AI-PRO system. The backend APIs (Phase 3) are complete and tested. This initiative focuses on building production-ready frontend components with proper TypeScript types, Supabase integration, role-based access control, and mobile-first responsive design.

---

## Component Inventory (51 Total)

### Priority 1: Estimates & Parts UI (5 Components) ✅ Backend Ready
**Agent:** Agent-1
**Location:** `components/estimates/`
**Dependencies:** Existing Supabase schema (`estimates`, `estimate_items`, `materials`)

1. **EstimateBuilderDialog.tsx** - Create/edit estimates with line items
   - Form with dynamic line item addition/removal
   - Auto-calculate totals (subtotal, tax, total)
   - Draft auto-save functionality
   - Role access: Sales, Owner, Admin
   - Status: ⏳ Pending

2. **EstimateListView.tsx** - List estimates with filters
   - Table view with sorting (date, status, contact, total)
   - Filter by status (draft/sent/viewed/accepted/rejected)
   - Filter by contact/job
   - Pagination (20 per page)
   - Status: ⏳ Pending

3. **EstimateDetailPanel.tsx** - View estimate details with conversion to job
   - Read-only estimate view with line items
   - "Convert to Job" button (Owner/Admin only)
   - PDF export button
   - Email estimate button
   - Status: ⏳ Pending

4. **PartsManagerDialog.tsx** - Add/edit materials on jobs
   - Search materials from inventory
   - Add custom materials (name, quantity, cost)
   - Update job material costs
   - Mobile + Desktop responsive
   - Status: ⏳ Pending

5. **EstimateStatusBadge.tsx** - Visual status indicator
   - Color-coded badges (draft=gray, sent=blue, viewed=purple, accepted=green, rejected=red)
   - Reusable component
   - Status: ⏳ Pending

---

### Priority 2: Document Management (5 Components)
**Agent:** Agent-2
**Location:** `components/documents/`
**Dependencies:** Supabase Storage bucket (`job-documents`), RLS policies

6. **DocumentUploadDialog.tsx** - Upload files (photos, PDFs, docs)
   - Drag-and-drop interface
   - File type validation (images, PDFs, docs)
   - Max file size 10MB
   - Progress indicator
   - Status: ⏳ Pending

7. **DocumentViewer.tsx** - Preview/download documents
   - Image preview with zoom
   - PDF viewer integration
   - Download button
   - Delete button (Admin/Owner only)
   - Status: ⏳ Pending

8. **DocumentList.tsx** - List attachments per job/contact
   - Grid view with thumbnails
   - Sort by date/type/name
   - Filter by type (photos/documents)
   - Bulk delete (Admin only)
   - Status: ⏳ Pending

9. **PhotoGallery.tsx** - Grid view of job photos with lightbox
   - Masonry grid layout
   - Lightbox modal on click
   - Swipe navigation (mobile)
   - Captions and metadata
   - Status: ⏳ Pending

10. **DocumentTypeIcon.tsx** - Visual file type indicators
    - Icon mapping (PDF, JPG, PNG, DOC, XLS)
    - Color-coded by type
    - Reusable component
    - Status: ⏳ Pending

---

### Priority 3: Notification Center (5 Components)
**Agent:** Agent-3
**Location:** `components/notifications/`
**Dependencies:** Supabase Realtime subscriptions, `notifications` table

11. **NotificationBell.tsx** - Header icon with unread count
    - Bell icon in header
    - Red badge with unread count
    - Real-time updates via Supabase Realtime
    - Dropdown trigger
    - Status: ⏳ Pending

12. **NotificationPanel.tsx** - Dropdown panel with notification list
    - Max 10 recent notifications
    - "See all" link to full page
    - Mark all as read button
    - Empty state
    - Status: ⏳ Pending

13. **NotificationItem.tsx** - Individual notification card
    - Icon based on type (job, estimate, message)
    - Time ago display
    - Click to navigate to related item
    - Mark as read on click
    - Status: ⏳ Pending

14. **NotificationSettings.tsx** - Configure notification preferences
    - Toggle email notifications per type
    - Toggle push notifications per type
    - Save preferences to user profile
    - Status: ⏳ Pending

15. **NotificationToast.tsx** - Real-time toast for urgent notifications
    - Toast notification for urgent updates
    - Auto-dismiss after 5 seconds
    - Action buttons (View, Dismiss)
    - Status: ⏳ Pending

---

### Priority 4: Quick Wins (8 Components)
**Agent:** Agent-4
**Location:** `components/ui/`
**Dependencies:** None (reusable primitives)

16. **EmptyState.tsx** - Reusable empty state component
    - Icon, title, description, action button
    - Variants for different contexts
    - Status: ⏳ Pending

17. **ConfirmationDialog.tsx** - Reusable confirmation modal
    - Title, message, confirm/cancel buttons
    - Destructive variant (red confirm button)
    - Status: ⏳ Pending

18. **DataTable.tsx** - Enhanced table with sorting/filtering
    - Column sorting
    - Search filter
    - Pagination
    - Row selection (checkboxes)
    - Status: ⏳ Pending

19. **StatusBadge.tsx** - Reusable status badge with variants
    - Color variants (success, warning, error, info)
    - Size variants (sm, md, lg)
    - Status: ⏳ Pending

20. **LoadingSpinner.tsx** - Branded loading indicator
    - Animated spinner with brand colors
    - Size variants
    - Overlay variant
    - Status: ⏳ Pending

21. **ErrorAlert.tsx** - Consistent error message display
    - Red alert with error icon
    - Dismiss button
    - Action button (retry, support)
    - Status: ⏳ Pending

22. **SearchInput.tsx** - Debounced search input with clear button
    - Debounced onChange (500ms)
    - Clear button (X icon)
    - Search icon
    - Status: ⏳ Pending

23. **DateRangePicker.tsx** - Date range selector for filters
    - Start/end date pickers
    - Preset ranges (Today, This Week, This Month)
    - Clear button
    - Status: ⏳ Pending

---

### Priority 5: Tech Mobile Components (5 Components)
**Agent:** Agent-5
**Location:** `components/tech/mobile/`
**Dependencies:** Mobile camera API, GPS API, offline storage

24. **JobPhotoUpload.tsx** - Mobile camera integration
    - Native camera access
    - Photo preview before upload
    - Geotag photos with GPS
    - Offline queue support
    - Status: ⏳ Pending

25. **QuickJobActions.tsx** - Big buttons (Start, Complete, Navigate)
    - Large touch-friendly buttons
    - "Start Job" (updates status to in_progress)
    - "Complete Job" (opens completion form)
    - "Navigate" (opens Google Maps)
    - Status: ⏳ Pending

26. **TimeClockCard.tsx** - Clock in/out widget
    - Clock in/out button
    - Display current time entry duration
    - Time log history
    - Offline support
    - Status: ⏳ Pending

27. **MaterialsQuickAdd.tsx** - Quick add parts on mobile
    - Simple form (name, quantity, cost)
    - Recent materials list
    - Offline queue support
    - Status: ⏳ Pending

28. **OfflineIndicator.tsx** - Show offline status banner
    - Banner at top when offline
    - "X items queued" counter
    - Sync status indicator
    - Status: ⏳ Pending

---

### Priority 6: Sales Mobile Components (5 Components)
**Agent:** Agent-6
**Location:** `components/sales/mobile/`
**Dependencies:** AI briefing API, voice recording API

29. **LeadCard.tsx** - Mobile-optimized lead card
    - Contact info (name, phone, email)
    - Lead score badge
    - Quick actions (Call, Email, Schedule)
    - Swipe to mark as contacted
    - Status: ⏳ Pending

30. **MeetingBriefingView.tsx** - AI briefing mobile view
    - Display AI-generated briefing
    - Key talking points
    - Contact history summary
    - Refresh button
    - Status: ⏳ Pending

31. **QuickEstimateBuilder.tsx** - Simplified mobile estimate builder
    - Simplified estimate form
    - Pre-defined line item templates
    - Quick total calculator
    - Send via email/SMS
    - Status: ⏳ Pending

32. **VoiceNoteRecorder.tsx** - Voice note capture widget
    - Record button
    - Playback preview
    - Attach to contact/job
    - Transcription display (if available)
    - Status: ⏳ Pending

33. **ContactQuickActions.tsx** - Call/Email/Schedule buttons
    - Large touch-friendly buttons
    - "Call" (opens phone dialer)
    - "Email" (opens email composer)
    - "Schedule Meeting" (opens calendar)
    - Status: ⏳ Pending

---

### Priority 7: Dispatch Desktop Components (4 Components)
**Agent:** Agent-7
**Location:** `components/dispatch/`
**Dependencies:** Existing dispatch map, job assignment APIs

34. **JobAssignmentQueue.tsx** - Unassigned jobs sidebar
    - List of unassigned jobs
    - Drag-and-drop to assign to tech
    - Filter by priority/date
    - Auto-refresh every 30s
    - Status: ⏳ Pending

35. **TechAvailabilityCard.tsx** - Tech schedule/availability view
    - Tech name and photo
    - Current job status
    - Today's schedule summary
    - Availability status (available/busy/offline)
    - Status: ⏳ Pending

36. **RouteOptimizationPanel.tsx** - AI-suggested route optimization
    - Display optimized route for tech
    - Reorder jobs via drag-and-drop
    - "Apply Optimization" button
    - Estimated drive time savings
    - Status: ⏳ Pending

37. **DispatchNotifications.tsx** - Real-time dispatch alerts
    - Toast notifications for new jobs
    - Toast for tech status changes
    - Toast for urgent job updates
    - Sound alerts (toggle)
    - Status: ⏳ Pending

---

### Priority 8: Admin Components (4 Components)
**Agent:** Agent-8
**Location:** `components/admin/`
**Dependencies:** User management APIs, audit log table

38. **UserRoleEditor.tsx** - Visual role permission editor
    - Select user
    - Select role (Admin, Dispatcher, Sales, Tech, Owner)
    - Permission checkboxes
    - Save button
    - Status: ⏳ Pending

39. **AuditLogViewer.tsx** - Searchable audit log table
    - Table view of audit logs
    - Filter by user/action/date
    - Search by entity ID
    - Export to CSV
    - Status: ⏳ Pending

40. **AutomationRuleBuilder.tsx** - Visual automation builder
    - Trigger selection (job created, estimate accepted)
    - Action selection (send email, create task)
    - Condition builder (if status = X)
    - Save/test automation
    - Status: ⏳ Pending

41. **BillingDashboard.tsx** - Subscription/billing overview (Owner only)
    - Current plan display
    - Usage metrics (users, jobs, storage)
    - Upgrade/downgrade buttons
    - Payment history table
    - Status: ⏳ Pending

---

### Priority 9: Settings & Onboarding (10 Components)
**Agent:** Agent-9
**Location:** `components/settings/` and `components/onboarding/`
**Dependencies:** User profile APIs, company settings APIs

42. **SettingsLayout.tsx** - Tab-based settings shell
    - Tab navigation (Profile, Company, Notifications, Integrations)
    - Persistent layout
    - Breadcrumbs
    - Status: ⏳ Pending

43. **SettingsSection.tsx** - Reusable settings card
    - Card with title and description
    - Form fields container
    - Save/cancel buttons
    - Status: ⏳ Pending

44. **ProfileSettings.tsx** - User profile editor
    - Name, email, phone fields
    - Profile photo upload
    - Password change section
    - Save button
    - Status: ⏳ Pending

45. **CompanySettings.tsx** - Company info editor
    - Company name, logo, address
    - Business hours
    - Tax settings
    - Save button
    - Status: ⏳ Pending

46. **NotificationPreferences.tsx** - Notification preferences panel
    - Email notification toggles
    - Push notification toggles
    - SMS notification toggles (future)
    - Save button
    - Status: ⏳ Pending

47. **OnboardingWizard.tsx** - Multi-step wizard shell
    - Step indicator (1/4, 2/4, etc.)
    - Next/back buttons
    - Skip option
    - Progress bar
    - Status: ⏳ Pending

48. **OnboardingStep.tsx** - Individual step component
    - Title and description
    - Content slot
    - Action buttons
    - Status: ⏳ Pending

49. **RoleSelectionStep.tsx** - Choose user role
    - Role cards (Admin, Dispatcher, Sales, Tech)
    - Role description
    - Select button
    - Status: ⏳ Pending

50. **IntegrationSetupStep.tsx** - Connect Gmail/MS365
    - OAuth connect buttons
    - Integration status display
    - Test connection button
    - Skip button
    - Status: ⏳ Pending

51. **OnboardingProgress.tsx** - Progress indicator
    - Circular progress bar
    - Step counter (3/4)
    - Percentage display
    - Status: ⏳ Pending

---

## Agent Assignments & Instructions

### Agent-1: Estimates UI (5 Components)
**Command:**
```
Build 5 production-ready estimate components with full CRUD operations, role-based access control, and PDF export functionality. Follow TypeScript strict mode, use Supabase client for data fetching, and implement optimistic UI updates.
```

**Success Criteria:**
- [ ] All 5 components built with TypeScript types
- [ ] Estimate CRUD operations functional
- [ ] Role-based access control enforced
- [ ] PDF export working
- [ ] Mobile responsive
- [ ] Unit tests for key functions

---

### Agent-2: Document Management (5 Components)
**Command:**
```
Build 5 document management components with Supabase Storage integration, file upload/download, and lightbox gallery. Implement drag-and-drop upload, file type validation, and mobile-optimized photo viewing.
```

**Success Criteria:**
- [ ] All 5 components built with TypeScript types
- [ ] File upload to Supabase Storage working
- [ ] File download working
- [ ] Lightbox gallery functional
- [ ] Drag-and-drop upload working
- [ ] Mobile responsive

---

### Agent-3: Notification Center (5 Components)
**Command:**
```
Build 5 notification components with Supabase Realtime integration for real-time updates. Implement unread count badge, notification panel, and toast notifications. Ensure proper cleanup of subscriptions.
```

**Success Criteria:**
- [ ] All 5 components built with TypeScript types
- [ ] Real-time notifications working
- [ ] Unread count badge updating
- [ ] Mark as read functionality
- [ ] Toast notifications working
- [ ] Subscription cleanup on unmount

---

### Agent-4: Quick Wins (8 Components)
**Command:**
```
Build 8 reusable UI primitives with variants and composability. These are building blocks for other components. Implement empty states, confirmation dialogs, data tables, badges, spinners, alerts, search inputs, and date pickers.
```

**Success Criteria:**
- [ ] All 8 components built with TypeScript types
- [ ] Variants implemented (size, color, state)
- [ ] Reusable and composable
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Mobile responsive
- [ ] Storybook examples (optional)

---

### Agent-5: Tech Mobile Components (5 Components)
**Command:**
```
Build 5 mobile-first components for field technicians with offline support, camera integration, GPS tagging, and large touch-friendly buttons. Implement offline queue for photos and time entries.
```

**Success Criteria:**
- [ ] All 5 components built with TypeScript types
- [ ] Camera access working (mobile)
- [ ] GPS tagging functional
- [ ] Offline queue implemented
- [ ] Large touch-friendly buttons (min 48px)
- [ ] Sync to server when online

---

### Agent-6: Sales Mobile Components (5 Components)
**Command:**
```
Build 5 mobile-first components for sales reps with AI briefings, voice notes, quick estimate builder, and contact quick actions. Integrate with existing AI meeting briefing API.
```

**Success Criteria:**
- [ ] All 5 components built with TypeScript types
- [ ] AI briefing API integration working
- [ ] Voice recording functional (mobile)
- [ ] Quick estimate builder working
- [ ] Contact quick actions (call, email, schedule)
- [ ] Mobile responsive

---

### Agent-7: Dispatch Desktop Components (4 Components)
**Command:**
```
Build 4 desktop-optimized dispatch components with drag-and-drop job assignment, tech availability display, route optimization, and real-time alerts. Enhance existing dispatch map interface.
```

**Success Criteria:**
- [ ] All 4 components built with TypeScript types
- [ ] Drag-and-drop job assignment working
- [ ] Tech availability display accurate
- [ ] Route optimization suggestions working
- [ ] Real-time alerts functional
- [ ] Desktop-optimized layout

---

### Agent-8: Admin Components (4 Components)
**Command:**
```
Build 4 admin-only components for user management, audit logs, automation rules, and billing. Implement role permission editor, audit log viewer, automation builder, and billing dashboard.
```

**Success Criteria:**
- [ ] All 4 components built with TypeScript types
- [ ] User role editor functional (Owner/Admin only)
- [ ] Audit log viewer with filters working
- [ ] Automation rule builder functional
- [ ] Billing dashboard displaying usage (Owner only)
- [ ] Owner-only access enforced

---

### Agent-9: Settings & Onboarding (10 Components)
**Command:**
```
Build 10 settings and onboarding components for user profile editing, company settings, notification preferences, and first-time user onboarding wizard. Implement multi-step wizard with progress indicator.
```

**Success Criteria:**
- [ ] All 10 components built with TypeScript types
- [ ] Settings layout with tabs working
- [ ] Profile editor functional
- [ ] Company settings editor functional
- [ ] Notification preferences working
- [ ] Onboarding wizard functional with step navigation
- [ ] OAuth integration setup working

---

## Dependencies & Prerequisites

### Required Before Starting:
- [x] Supabase schema complete (estimates, materials, notifications)
- [x] Supabase Storage bucket configured (`job-documents`)
- [x] RLS policies configured
- [x] AI briefing API endpoint working
- [ ] Supabase Realtime enabled for notifications table
- [ ] OAuth credentials for Gmail/MS365 (for onboarding)

### Shared Components to Build First:
These should be built by Agent-4 FIRST as they are dependencies for other agents:
1. EmptyState.tsx
2. ConfirmationDialog.tsx
3. StatusBadge.tsx
4. LoadingSpinner.tsx
5. ErrorAlert.tsx

---

## Technical Requirements (All Agents)

### Code Standards:
- TypeScript strict mode enabled
- ESLint and Prettier configured
- No `any` types (use proper TypeScript types)
- Proper error handling with try/catch
- Loading states for all async operations
- Empty states for all lists

### Supabase Integration:
- Use `@/lib/supabase/client` for client-side queries
- Use `@/lib/supabase/server` for server-side queries
- Implement Row Level Security (RLS) checks
- Use Supabase Realtime for real-time updates
- Use Supabase Storage for file uploads

### UI/UX Requirements:
- Mobile-first responsive design
- Touch-friendly buttons (min 48px height on mobile)
- Loading spinners during data fetching
- Error messages with retry options
- Success toasts on actions
- Confirmation dialogs for destructive actions

### Accessibility:
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Color contrast compliance (WCAG AA)

### Testing:
- Unit tests for utility functions
- Integration tests for API calls (optional but recommended)
- Manual testing on mobile and desktop
- Cross-browser testing (Chrome, Safari, Firefox)

---

## Execution Plan

### Phase 1: Foundation (Week 1)
**Parallel Execution:**
- Agent-4 builds Quick Win components (dependencies for others)
- Agent-1 builds Estimates UI (backend ready)
- Agent-2 begins Document Management planning

**Deliverables:**
- 8 Quick Win components
- 5 Estimates UI components
- Foundation for other agents

---

### Phase 2: Core Features (Week 2)
**Parallel Execution:**
- Agent-2 builds Document Management
- Agent-3 builds Notification Center
- Agent-5 builds Tech Mobile Components

**Deliverables:**
- 5 Document Management components
- 5 Notification Center components
- 5 Tech Mobile components

---

### Phase 3: User-Facing Features (Week 3)
**Parallel Execution:**
- Agent-6 builds Sales Mobile Components
- Agent-7 builds Dispatch Desktop Components
- Agent-8 builds Admin Components

**Deliverables:**
- 5 Sales Mobile components
- 4 Dispatch Desktop components
- 4 Admin components

---

### Phase 4: Polish & Onboarding (Week 4)
**Parallel Execution:**
- Agent-9 builds Settings & Onboarding
- All agents perform integration testing
- Bug fixes and refinements

**Deliverables:**
- 10 Settings & Onboarding components
- Integration test results
- Bug fix list

---

### Phase 5: QA & Deployment (Week 5)
**Sequential Execution:**
- End-to-end testing across all user roles
- Performance testing
- Accessibility audit
- Production deployment

**Deliverables:**
- QA test report
- Performance metrics
- Production deployment

---

## Success Metrics

### Completion Checklist:
- [ ] All 51 components built and functional
- [ ] All TypeScript types properly defined
- [ ] All Supabase integrations working
- [ ] All role-based access controls enforced
- [ ] Mobile responsive design verified on 3 devices
- [ ] Desktop layout verified on 2 screen sizes
- [ ] Cross-browser testing passed (Chrome, Safari, Firefox)
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Performance audit passed (Lighthouse score >90)
- [ ] End-to-end testing passed for all user roles
- [ ] Production deployment successful
- [ ] User acceptance testing completed

### Quality Gates:
Each agent must pass before moving to next phase:
- All components built
- TypeScript compilation successful (no errors)
- ESLint passing (no errors, warnings acceptable)
- Manual testing on mobile and desktop passed
- Code review completed
- Documentation updated

---

## Risk Mitigation

### Potential Blockers:
1. **Supabase Realtime not configured** - Agent-3 blocked
   - Mitigation: Configure before starting Agent-3
2. **OAuth credentials missing** - Agent-9 blocked on IntegrationSetupStep
   - Mitigation: Use mock OAuth flow for testing
3. **Mobile camera API issues** - Agent-5 blocked
   - Mitigation: Use file input fallback for testing
4. **Merge conflicts** - Multiple agents editing same files
   - Mitigation: Clear component boundaries, separate directories

### Contingency Plans:
- If agent fails, reassign to backup agent
- If dependency missing, implement mock/stub
- If timeline slips, reprioritize components (defer onboarding to Phase 6)

---

## Communication Protocol

### Agent Reporting:
Each agent must report:
1. Component completion status (built, tested, deployed)
2. Blockers encountered
3. Dependencies on other agents
4. Estimated completion time

### Daily Standup:
- Update this document with component status
- Report blockers
- Request help from other agents if needed

---

## Final Deliverables

### Code:
- 51 production-ready components in `/components/`
- TypeScript types in `/types/`
- API integration utilities in `/lib/`
- Unit tests in `/__tests__/`

### Documentation:
- Component API documentation (props, events)
- Usage examples
- Storybook stories (optional)
- Migration guide for existing pages

### Testing:
- Unit test coverage report
- Integration test results
- End-to-end test results
- Performance audit report
- Accessibility audit report

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0   | 2025-11-27 | Orchestrator | Initial master plan created |

---

**Next Steps:**
1. ✅ Master plan created
2. ⏳ Inspect codebase structure
3. ⏳ Launch Agent-4 (Quick Wins - dependencies)
4. ⏳ Launch Agent-1 (Estimates UI)
5. ⏳ Launch remaining agents in parallel

**Questions?** Contact project lead or update this document with clarifications.
