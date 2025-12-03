# CRM-AI Pro - Swarm Orchestration Master Plan

**Version:** 1.0
**Date:** 2025-11-27
**Objective:** Complete ALL features from MASTER_PRE_LAUNCH_REPORT.md with full functional integration

---

## Core Principles

### 1. Modular Component Architecture
Every component MUST be:
- ✅ **Extractable** - Can be copied to another project
- ✅ **Self-contained** - All dependencies declared via props/hooks
- ✅ **Configurable** - Behavior controlled via props, not hard-coded
- ✅ **TypeScript-first** - Full type safety with exported interfaces
- ✅ **Documented** - JSDoc comments explaining usage

### 2. Complete Functional Integration
Every component MUST:
- ✅ **Wire to APIs** - Real backend calls, no mock data
- ✅ **Integrate routing** - Added to navigation/sidebar where needed
- ✅ **Connect state** - Proper React state/context management
- ✅ **Respect permissions** - Wrapped in PermissionGate where needed
- ✅ **Handle errors** - Loading, error, and empty states
- ✅ **Be testable** - E2E flow verified working

### 3. Clean Separation of Concerns
```
/components/[feature]/         # UI Components (reusable)
/lib/api/[feature].ts          # API calls (reusable)
/lib/hooks/use-[feature].ts    # State management (reusable)
/lib/types/[feature].ts        # TypeScript types (reusable)
/app/[route]/page.tsx          # Page-level integration (project-specific)
```

---

## Architecture Patterns

### Pattern 1: Reusable Component Structure

```typescript
// components/[feature]/ComponentName.tsx

import { useComponentLogic } from '@/lib/hooks/use-component-logic'
import { ComponentProps } from '@/lib/types/component'

/**
 * ComponentName - Brief description
 *
 * @example
 * ```tsx
 * <ComponentName
 *   data={items}
 *   onAction={handleAction}
 *   config={{ theme: 'light' }}
 * />
 * ```
 */
export function ComponentName({
  data,
  onAction,
  config,
  className,
}: ComponentProps) {
  // Logic handled by custom hook
  const { state, handlers } = useComponentLogic({ data, config })

  return (
    <div className={cn('component-base', className)}>
      {/* Render logic */}
    </div>
  )
}

// Export types for external use
export type { ComponentProps }
```

### Pattern 2: API Layer (Reusable)

```typescript
// lib/api/feature.ts

export interface FeatureAPIConfig {
  baseUrl?: string
  headers?: Record<string, string>
}

export class FeatureAPI {
  constructor(private config: FeatureAPIConfig = {}) {}

  async getItems(params: GetItemsParams): Promise<Item[]> {
    const response = await fetch(`${this.config.baseUrl}/items`, {
      headers: this.config.headers,
    })
    return response.json()
  }
}

// For this project
export const featureAPI = new FeatureAPI({
  baseUrl: '/api/feature',
  headers: { /* project-specific */ }
})
```

### Pattern 3: Custom Hooks (Reusable)

```typescript
// lib/hooks/use-feature.ts

export interface UseFeatureOptions {
  enabled?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useFeature(options: UseFeatureOptions = {}) {
  const [state, setState] = useState<FeatureState>({
    data: null,
    loading: false,
    error: null
  })

  // Reusable logic
  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const data = await fetchFeatureData()
      setState({ data, loading: false, error: null })
      options.onSuccess?.(data)
    } catch (error) {
      setState({ data: null, loading: false, error })
      options.onError?.(error)
    }
  }

  return { ...state, fetchData, refetch: fetchData }
}
```

### Pattern 4: Page Integration (Project-Specific)

```typescript
// app/(dashboard)/feature/page.tsx

import { FeatureComponent } from '@/components/feature/FeatureComponent'
import { PermissionGate } from '@/lib/auth/PermissionGate'
import { useFeature } from '@/lib/hooks/use-feature'

export default function FeaturePage() {
  const { data, loading, error } = useFeature()

  return (
    <PermissionGate requires="view_feature">
      <FeatureComponent
        data={data}
        loading={loading}
        error={error}
      />
    </PermissionGate>
  )
}
```

---

## Integration Checklist per Component

Each agent MUST complete ALL steps for their components:

### Phase 1: Build (Modular)
- [ ] Create TypeScript interfaces in `/lib/types/[feature].ts`
- [ ] Create API functions in `/lib/api/[feature].ts`
- [ ] Create custom hooks in `/lib/hooks/use-[feature].ts`
- [ ] Create UI component in `/components/[feature]/ComponentName.tsx`
- [ ] Add JSDoc documentation to all exports
- [ ] Export all types, hooks, and components

### Phase 2: Wire Up (Functional)
- [ ] Create/update API route handlers in `/app/api/[feature]/route.ts`
- [ ] Create page in `/app/(dashboard)/[route]/page.tsx`
- [ ] Add navigation link to sidebar/menu (if applicable)
- [ ] Wrap in PermissionGate with correct role/permission
- [ ] Connect to existing state management (if needed)
- [ ] Add error boundaries and loading states

### Phase 3: Test (Verification)
- [ ] Test API endpoint with curl/Postman
- [ ] Test component renders correctly
- [ ] Test all user interactions work
- [ ] Test permission system blocks unauthorized access
- [ ] Test error handling (network errors, validation)
- [ ] Test mobile responsiveness (if mobile component)
- [ ] Verify end-to-end flow works for target role

### Phase 4: Document (Handoff)
- [ ] Create `[COMPONENT]_INTEGRATION_REPORT.md`
- [ ] Document API endpoints used/created
- [ ] Document state management patterns
- [ ] Document props/configuration options
- [ ] Document how to extract for other projects
- [ ] List any dependencies or prerequisites

---

## Swarm Assignments

### Swarm 1: Critical Fixes & Foundation
**Priority:** 🔴 HIGHEST (blocks everything else)
**Timeline:** 2-3 hours
**Agents:** 2 agents in parallel

#### Agent 1A: Performance & Error Handling
**Tasks:**
1. Fix Contacts N+1 Query (`app/api/contacts/route.ts:218-237`)
2. Create `lib/utils/api-retry.ts` (reusable)
3. Create `components/admin/AdminErrorBoundary.tsx` (reusable)
4. Update all 5 admin pages with error handling
5. Test contacts API performance before/after

**Deliverables:**
- Contacts API: <300ms with tags ✅
- Admin pages: Retry + error feedback ✅
- Reusable error boundary component ✅

#### Agent 1B: Navigation & Routing
**Tasks:**
1. Create `/app/(dashboard)/sales/dashboard/page.tsx`
2. Create `/app/(dashboard)/office/dashboard/page.tsx`
3. Create `/app/(dashboard)/owner/dashboard/page.tsx`
4. Update `components/layout/sidebar-nav.tsx` with missing links
5. Delete test page
6. Verify all roles can access their dashboards

**Deliverables:**
- All dashboards accessible ✅
- Navigation links functional ✅
- Role-based routing works ✅

---

### Swarm 2: Permission System
**Priority:** 🔴 CRITICAL (required for all other components)
**Timeline:** 3-4 hours
**Agents:** 1 agent

**Tasks:**
1. Create `/lib/types/permissions.ts` (reusable types)
2. Create `/lib/auth/permissions.ts` (reusable permission definitions)
3. Create `/lib/auth/PermissionGate.tsx` (reusable component)
4. Create `/lib/hooks/usePermissions.ts` (reusable hook)
5. Update sidebar to use PermissionGate
6. Test all 5 roles see correct UI elements

**Deliverables:**
- PermissionGate component ✅
- All permissions defined ✅
- Sidebar respects permissions ✅
- Reusable permission system ✅

**Integration Points:**
- Used by: ALL future components
- APIs: Reads user role from session
- State: Uses existing auth context

---

### Swarm 3: Document Management System
**Priority:** 🟡 HIGH
**Timeline:** 1-2 days
**Agents:** 3 agents in parallel

#### Agent 3A: Photo Capture (Mobile)
**Components:**
1. `PhotoCaptureButton.tsx` - Camera integration
2. `PhotoCompressor.tsx` - Client-side compression
3. `PhotoUploadQueue.tsx` - Offline queue

**API Integration:**
- Create `/app/api/photos/upload/route.ts`
- Create `/app/api/photos/[id]/route.ts`
- Use Supabase Storage for uploads

**Pages:**
- Integrate into `/app/m/tech/jobs/[id]/page.tsx`
- Add to job detail view

#### Agent 3B: Document Upload (Desktop)
**Components:**
1. `DocumentUploadDialog.tsx` - Multi-file uploader
2. `DocumentViewer.tsx` - PDF/image preview
3. `DocumentList.tsx` - List per job

**API Integration:**
- Use same `/app/api/photos/upload/route.ts` (rename to documents)
- Add document type filtering

**Pages:**
- Integrate into `/app/(dashboard)/jobs/[id]/page.tsx`

#### Agent 3C: Photo Gallery
**Components:**
1. `PhotoGallery.tsx` - Before/after grid (desktop)
2. `JobPhotoGallery.tsx` - Mobile photo viewer

**API Integration:**
- Create `/app/api/jobs/[id]/photos/route.ts`
- Filter by job_id

**Pages:**
- Add to job detail pages (desktop + mobile)

---

### Swarm 4: Notification System
**Priority:** 🟡 HIGH
**Timeline:** 1-2 days
**Agents:** 2 agents in parallel

#### Agent 4A: Notification Components
**Components:**
1. `NotificationBell.tsx` - Header icon with count
2. `NotificationPanel.tsx` - Dropdown list
3. `NotificationItem.tsx` - Individual card
4. `NotificationToast.tsx` - Real-time toasts

**API Integration:**
- Create `/app/api/notifications/route.ts` (GET, PUT)
- Create `/app/api/notifications/mark-read/route.ts`
- WebSocket subscriptions via Supabase Realtime

**Pages:**
- Integrate NotificationBell into header layout
- Add NotificationPanel to dropdown

#### Agent 4B: Notification Backend
**Tasks:**
1. Create `notifications` table migration
2. Create notification triggers:
   - Job assigned → notify Tech
   - Tech offline → notify Dispatcher
   - Invoice overdue → notify Owner
   - Meeting reminder → notify Sales (30 min before)
3. Setup Supabase Realtime subscriptions
4. Test WebSocket connections

**Deliverables:**
- Database triggers ✅
- Real-time notifications ✅
- Role-based notification filtering ✅

---

### Swarm 5: Mobile Tech Components
**Priority:** 🔴 CRITICAL (Tech users 100% mobile)
**Timeline:** 2-3 days
**Agents:** 4 agents in parallel

#### Agent 5A: Job Management
**Components:**
1. `TechJobCard.tsx` - Large job card
2. `QuickJobActions.tsx` - Big button bar
3. `JobCompletionWizard.tsx` - Step-by-step completion

**Integration:**
- Update `/app/m/tech/jobs/page.tsx` with TechJobCard
- Add completion wizard to job detail page
- Wire to existing job APIs

#### Agent 5B: Materials & Time
**Components:**
1. `MaterialsQuickAdd.tsx` - Fast materials entry
2. `TimeClockCard.tsx` - Clock in/out widget

**Integration:**
- Create `/app/api/materials/quick-add/route.ts`
- Create `/app/api/time-clock/route.ts`
- Add to tech dashboard

#### Agent 5C: Voice & Notes
**Components:**
1. `VoiceNoteRecorder.tsx` - Voice-to-text
2. `OfflineQueueIndicator.tsx` - Sync status

**Integration:**
- Use Web Speech API for voice
- Create offline queue in IndexedDB
- Add sync status to header

#### Agent 5D: Mobile UX Polish
**Components:**
- Large touch targets (60px minimum)
- Swipe gestures for job cards
- Pull-to-refresh for job list
- High contrast mode for sunlight

**Integration:**
- Update mobile layout CSS
- Add gesture handlers
- Test on iOS and Android

---

### Swarm 6: Mobile Sales & AI System
**Priority:** 🔴 CRITICAL (Core differentiator)
**Timeline:** 2-3 days
**Agents:** 4 agents in parallel

#### Agent 6A: AI Briefing System ⭐ HIGHEST PRIORITY
**Components:**
1. `AIBriefingCard.tsx` - AI meeting prep card
2. `TalkingPointsList.tsx` - AI talking points
3. `ContactHistorySummary.tsx` - Past interactions

**API Integration:**
- Create `/app/api/ai/briefing/route.ts`
- Call existing LLM router
- Use RAG search for contact history

**Pages:**
- Add to `/app/m/sales/meetings/[id]/page.tsx`
- Add to contact detail view

#### Agent 6B: Lead Management
**Components:**
1. `LeadPipelineView.tsx` - Visual funnel
2. `LeadCard.tsx` - Mobile lead card

**Integration:**
- Create `/app/api/leads/pipeline/route.ts`
- Update `/app/m/sales/leads/page.tsx`

#### Agent 6C: Meeting Management
**Components:**
1. `MeetingNoteCapture.tsx` - Voice notes
2. `MeetingSummaryAI.tsx` - AI recap

**Integration:**
- Create `/app/api/meetings/notes/route.ts`
- Create `/app/api/ai/meeting-summary/route.ts`
- Add to meeting detail page

#### Agent 6D: Quick Estimate
**Components:**
1. `QuickEstimateBuilder.tsx` - Simplified mobile form
2. `PricingSuggestions.tsx` - AI pricing

**Integration:**
- Use existing Phase 3 estimate API
- Create `/app/api/ai/pricing/route.ts`
- Add to contact detail page

---

### Swarm 7: Reports & Analytics
**Priority:** 🟡 MEDIUM
**Timeline:** 2-3 days
**Agents:** 2 agents in parallel

#### Agent 7A: Report Components
**Components:**
1. `ReportTemplateSelector.tsx` - Choose templates
2. `ReportPreview.tsx` - Live preview with charts
3. `ReportExportButton.tsx` - PDF/Excel export
4. `ReportFilterPanel.tsx` - Date/filters

**Integration:**
- Create `/app/(dashboard)/reports/page.tsx`
- Add navigation link for Owner/Admin only

#### Agent 7B: Report Templates & API
**Tasks:**
1. Create `/app/api/reports/revenue/route.ts`
2. Create `/app/api/reports/job-performance/route.ts`
3. Create `/app/api/reports/customer/route.ts`
4. Create `/app/api/reports/tech-performance/route.ts`
5. Create `/app/api/reports/financial/route.ts`
6. Create `/app/api/reports/export/route.ts` (PDF/Excel)

**Deliverables:**
- 5 pre-built reports ✅
- Export to PDF/Excel ✅
- Charts with Recharts ✅

---

### Swarm 8: Phase 3 UI - Estimates & Parts
**Priority:** 🟡 HIGH (Backend exists, UI missing)
**Timeline:** 1-2 days
**Agents:** 2 agents in parallel

#### Agent 8A: Estimate Management
**Components:**
1. `EstimateBuilderDialog.tsx` - Create/edit estimates
2. `EstimateListView.tsx` - List all estimates
3. `EstimateDetailPanel.tsx` - View estimate details

**API Integration:**
- Wire to existing Phase 3 MCP tools
- Create `/app/api/estimates/route.ts` (wrapper)
- Create `/app/api/estimates/send/route.ts` (email)

**Pages:**
- Create `/app/(dashboard)/estimates/page.tsx`
- Add navigation link

#### Agent 8B: Parts Management
**Components:**
1. `PartsManagerDialog.tsx` - Add/edit parts
2. `PartsListView.tsx` - List all parts

**API Integration:**
- Create `/app/api/parts/route.ts`
- Link parts to jobs
- Track parts inventory

**Pages:**
- Create `/app/(dashboard)/parts/page.tsx`
- Add to job creation flow

---

### Swarm 9: Settings Pages
**Priority:** 🟢 MEDIUM
**Timeline:** 2-3 days
**Agents:** 2 agents in parallel

#### Agent 9A: User Settings
**Pages:**
1. `ProfileSettings.tsx` - User profile
2. `NotificationPreferences.tsx` - Notification settings
3. Integrate into `/app/(dashboard)/settings/page.tsx`

#### Agent 9B: Admin Settings
**Pages:**
1. `CompanySettings.tsx` - Company info
2. `IntegrationSettings.tsx` - Gmail/Calendar
3. `AutomationSettings.tsx` - Automation rules
4. Add tabs to `/app/(dashboard)/admin/settings/page.tsx`

**All settings pages:**
- Reusable form components
- Real API integration
- Role-based visibility

---

### Swarm 10: Onboarding System
**Priority:** 🟢 LOW (Nice to have)
**Timeline:** 1-2 days
**Agents:** 1 agent

**Components:**
1. `OnboardingWizard.tsx` - Multi-step wizard
2. `OnboardingStep.tsx` - Individual step component
3. `OnboardingProgress.tsx` - Progress indicator

**Database:**
- Create `user_onboarding_status` table
- Track completion per user

**Flows:**
1. Owner onboarding (7 steps)
2. Tech onboarding (5 steps)
3. Sales onboarding (5 steps)

**Integration:**
- Show on first login
- Skip if already completed
- Allow restart from settings

---

## Coordination & State Management

### Shared State Architecture

```typescript
// lib/contexts/AppContext.tsx (already exists - agents should use)
// Provides: user, account, permissions

// lib/contexts/NotificationContext.tsx (Swarm 4 creates)
// Provides: notifications, unreadCount, markAsRead()

// lib/contexts/OfflineContext.tsx (Swarm 5 creates)
// Provides: isOffline, queuedActions, syncStatus
```

### API Response Format (Standard)

```typescript
// All APIs should return this format
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

### Error Handling (Standard)

```typescript
// All components should handle these states
interface ComponentState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}
```

---

## Testing Requirements

### Per Component Testing
Each agent must test:
1. ✅ Component renders
2. ✅ API calls work
3. ✅ User interactions trigger correct actions
4. ✅ Loading states display
5. ✅ Error states display
6. ✅ Empty states display
7. ✅ Permissions respected

### Integration Testing
After each swarm completes:
1. ✅ End-to-end flow works for target role
2. ✅ Navigation works
3. ✅ Data persists correctly
4. ✅ Mobile responsive (if mobile component)
5. ✅ Offline works (if offline component)

---

## Success Criteria

### Per Component
- [ ] Component file exists and exports types
- [ ] API integration complete and tested
- [ ] Page/route exists and accessible
- [ ] Navigation link added (if applicable)
- [ ] Permissions enforced
- [ ] Error handling implemented
- [ ] Documentation written
- [ ] Integration report submitted

### Per Swarm
- [ ] All components functional
- [ ] End-to-end workflow tested
- [ ] Integration points documented
- [ ] Handoff report submitted
- [ ] Ready for next swarm to build on

### Overall Project
- [ ] All 32 missing components built
- [ ] All critical fixes applied
- [ ] All pages linked and accessible
- [ ] All 5 roles fully functional
- [ ] Mobile UX optimized
- [ ] AI features working
- [ ] Reports functional
- [ ] Settings complete
- [ ] 98%+ feature completion

---

## Agent Handoff Protocol

When an agent completes their tasks:

1. **Create Integration Report:**
   - `[SWARM_NAME]_COMPLETION_REPORT.md`
   - List all files created/modified
   - Document API endpoints
   - Document integration points
   - Document testing results
   - Document any blockers/issues

2. **Update Master Checklist:**
   - Mark completed tasks in this document

3. **Notify Dependencies:**
   - Tag which swarms can now proceed
   - Document what they need to know

---

## Deployment Strategy

### Development Branch (Current)
- All work happens on `development` branch
- Test as we build
- Clear `.next/` cache after package changes

### Staging Deployment
- After each swarm completes, deploy to staging
- Test end-to-end workflows
- Verify no regressions

### Production Deployment
- After ALL swarms complete
- Full QA pass
- Deploy to `main` branch (auto-deploys to Railway)

---

**END OF ORCHESTRATION MASTER**

*Next Step: Deploy all swarms in parallel*
