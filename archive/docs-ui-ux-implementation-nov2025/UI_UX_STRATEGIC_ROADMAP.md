# CRM-AI Pro - UI/UX Strategic Roadmap
**Comprehensive Role-Based Component Architecture & Implementation Guide**

**Version:** 1.0
**Date:** 2025-11-27
**Purpose:** Strategic framework defining UI/UX structure, component-role mapping, and implementation priorities for all user types

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Chain of Thought Analysis](#chain-of-thought-analysis)
3. [Current State Assessment](#current-state-assessment)
4. [Component-Role Matrix](#component-role-matrix)
5. [Role-Based UI/UX Architecture](#role-based-uiux-architecture)
6. [Future Feature Integration Plan](#future-feature-integration-plan)
7. [Permission-Aware Component Design](#permission-aware-component-design)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Design System Guidelines](#design-system-guidelines)
10. [Testing & Validation Strategy](#testing--validation-strategy)
11. [Success Metrics](#success-metrics)

---

## Executive Summary

### Purpose
This document serves as the **single source of truth** for UI/UX architecture in CRM-AI Pro, defining how components, permissions, and user roles interact to create optimal experiences for 5 distinct user types.

### Key Findings

**Current State:**
- ✅ **92 components** built across 20 categories
- ⚠️ **Only 15% verified** through testing (14/92 components)
- ⚠️ **60% production-ready** (missing critical features)
- ✅ **5 user roles** clearly defined with permissions
- ⚠️ **No explicit component-role mapping** exists
- ✅ **Phase 3 backend** complete (estimates, parts, email)
- ⚠️ **Phase 3 UI** incomplete (no estimate builder, minimal parts UI)

**Critical Gaps:**
1. **Payment Processing** - No payment gateway UI
2. **Document Management** - No file upload/viewer components
3. **Notification Center** - No notification system
4. **Report Builder** - No visual report creation
5. **Settings Layouts** - Inconsistent settings UI
6. **Onboarding** - No user onboarding flow

**Strategic Priorities:**
1. Build **50 missing components** (identified in component gap analysis)
2. Create **Component-Role Matrix** (map 92 components to 5 roles)
3. Implement **permission-aware rendering** (hide unauthorized components)
4. Develop **mobile-first components** for Tech/Sales roles
5. Complete **Phase 3 UI** (estimates, parts management)
6. Achieve **95% test coverage** (test 78 untested components)

### Impact Assessment

| User Role | Current Experience | Target Experience | Gap Score |
|-----------|-------------------|-------------------|-----------|
| **Owner** | 75% - Missing analytics, reports | 100% - Full visibility & control | 🟡 Medium |
| **Admin** | 80% - Good core features | 95% - Minor enhancements | 🟢 Low |
| **Dispatcher** | 90% - Excellent map system | 95% - Add route optimization | 🟢 Low |
| **Tech** | 60% - Basic mobile, missing offline | 100% - Full PWA experience | 🔴 High |
| **Sales** | 45% - No AI briefing UI | 100% - AI-powered mobile CRM | 🔴 Critical |

**Overall System Maturity:** 70% (Good foundation, needs polish)

---

## Chain of Thought Analysis

### Reasoning Process

#### 1. Component Inventory Analysis
**Observation:** 92 components exist but only 14 verified through testing.

**Reasoning:**
- Components were built incrementally by different agents
- Focus was on building features, not on systematic testing
- Dispatch system (Phase 3) is exception - thoroughly tested and documented
- This pattern suggests: **agent-built components are high quality, but integration testing is missing**

**Conclusion:** Components are likely functional, but need end-to-end testing to verify API integration, error handling, and edge cases.

**Action:** Prioritize testing existing components over building new ones (unless critical gap).

---

#### 2. Role-Permission-Component Disconnect
**Observation:** Clear role definitions exist (UI_UX_ROLE_FLOWS.md) and 92 components exist (COMPONENTS_INSPECTION_REPORT.md), but no mapping between them.

**Reasoning:**
- Permission checks happen at route level (`/lib/auth/role-routes.ts`)
- Components render regardless of user permissions
- A Tech could theoretically see "Assign Job" button (if they accessed the page)
- This creates:
  - **Security risk:** UI exposes actions users can't perform
  - **UX confusion:** Users see disabled/error-prone actions
  - **Maintenance burden:** Developers must remember to hide components manually

**Conclusion:** Need **permission-aware component wrapper** that automatically hides unauthorized components based on role.

**Action:** Create `<PermissionGate>` component and Component-Role Matrix.

---

#### 3. Mobile-Desktop UX Paradigm Split
**Observation:**
- Desktop users: Owner, Admin, Dispatcher (data-dense, multi-tasking)
- Mobile users: Tech, Sales (single-task focus, offline-first)
- Only 1 mobile-specific component exists (`big-button.tsx`)

**Reasoning:**
- Current approach: Make desktop components responsive
- Better approach: Build role-specific mobile components
- Tech needs: Large touch targets, offline queue, photo capture, GPS
- Sales needs: AI briefing cards, voice notes, quick estimates
- Desktop needs: Data tables, multi-panel layouts, keyboard shortcuts

**Conclusion:** Responsive design is insufficient - need **dedicated mobile component library** for Tech/Sales.

**Action:** Build 15 mobile-specific components (listed in implementation plan).

---

#### 4. Phase 3 Backend-Frontend Gap
**Observation:** Phase 3 added 10 MCP tools (estimates, parts, email) but minimal UI.

**Reasoning:**
- Backend built by Agent-1, Agent-2, Agent-3 (tools-first approach)
- No corresponding UI agent assignments
- Sales role needs estimate builder on mobile
- Office roles need parts management on desktop
- Email parts list exists but no preview UI

**Conclusion:** **Phase 3 is only 40% complete** - backend works but users can't access it easily.

**Action:** Prioritize Phase 3 UI components (estimate builder, parts manager) as they have ROI-ready backend.

---

#### 5. Feature Completeness vs User Need Priority
**Observation:** 6 major feature categories missing (payments, documents, notifications, reports, settings, onboarding).

**Reasoning:**
- Which features block user workflows?
  - **Document Management:** Tech can't upload job photos efficiently (CRITICAL)
  - **Notifications:** Dispatcher misses urgent job updates (HIGH)
  - **Onboarding:** New users get lost (MEDIUM)
  - **Reports:** Owner wants analytics but can export data (MEDIUM)
  - **Settings:** Users can function but UX is poor (LOW)
  - **Payments:** Not yet implemented in backend (LOW - future phase)

**Conclusion:** Not all gaps are equal - prioritize by **workflow impact**, not feature completeness.

**Action:** Build Document Management → Notifications → Onboarding → Reports → Settings → Payments (in that order).

---

### Key Strategic Insights

1. **Quality Over Quantity:** 92 components with 15% testing < 50 components with 95% testing
2. **Role-Specific UX:** One size does NOT fit all - Tech needs different UX than Owner
3. **Permission-First Design:** Hide what users can't use, don't just disable it
4. **Mobile-First for Field:** Tech and Sales are mobile-only - invest in mobile components
5. **Complete the Circle:** Phase 3 backend is useless without UI - finish what's started

---

## Current State Assessment

### Component Inventory (92 Total)

| Category | Count | Verified | Needs Testing | Production Ready |
|----------|-------|----------|---------------|------------------|
| UI Primitives | 28 | 2 | 26 | 🟡 70% |
| Jobs | 7 | 1 | 6 | 🟡 60% |
| Tech | 2 | 1 | 1 | 🟢 80% |
| Contacts | 4 | 0 | 4 | 🟡 50% |
| Marketing | 3 | 0 | 3 | 🟡 50% |
| Integrations | 2 | 0 | 2 | 🟡 50% |
| Conversations | 3 | 0 | 3 | 🟡 50% |
| Calendar | 1 | 0 | 1 | 🟡 50% |
| Templates | 1 | 0 | 1 | 🟡 50% |
| Dashboard | 3 | 0 | 3 | 🟡 50% |
| Inbox | 1 | 0 | 1 | 🟡 50% |
| Admin | 3 | 0 | 3 | 🟡 50% |
| Export | 1 | 0 | 1 | 🟡 50% |
| Search | 2 | 0 | 2 | 🟡 50% |
| Filters | 2 | 0 | 2 | 🟡 50% |
| Layout | 6 | 1 | 5 | 🟢 75% |
| Voice Agent | 2 | 1 | 1 | 🟢 90% |
| Dispatch | 16 | 7 | 2 | 🟢 95% |
| Mobile | 1 | 1 | 0 | 🟢 100% |
| Core | 5 | 0 | 5 | 🟡 60% |
| **TOTAL** | **92** | **14 (15%)** | **78** | **60%** |

### Strengths

1. ✅ **Excellent Dispatch System** - Real-time map, GPS tracking, 95%+ test coverage
2. ✅ **Solid UI Foundation** - shadcn/ui components, consistent theming
3. ✅ **Voice AI Integration** - ElevenLabs widget production-ready
4. ✅ **Mobile Components** - Location tracker, signature pad, big buttons working
5. ✅ **Phase 3 Backend** - Estimates, parts, email tools fully functional

### Weaknesses

1. ⚠️ **Low Test Coverage** - Only 15% of components verified
2. ⚠️ **Missing Critical Features** - Payments, documents, notifications, reports, settings, onboarding
3. ⚠️ **No Component-Role Mapping** - Unclear which components serve which roles
4. ⚠️ **Phase 3 UI Gap** - Backend exists but no estimate builder or parts manager UI
5. ⚠️ **Mobile Component Gap** - Only 1 mobile-specific component despite 2 mobile-only roles
6. ⚠️ **Inconsistent Documentation** - Dispatch excellent, others minimal

---

## Component-Role Matrix

### Purpose
Map all 92 existing components to the 5 user roles to understand who uses what.

### Legend
- ✅ **Primary User** - Core workflow component for this role
- 🔵 **Secondary User** - Occasionally used by this role
- ⚪ **No Access** - Should not see this component
- 🔒 **View Only** - Can see but limited interaction

---

### UI Components (28)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| button, input, select, textarea | ✅ | ✅ | ✅ | ✅ | ✅ | Universal primitives |
| dialog, sheet, alert-dialog | ✅ | ✅ | ✅ | ✅ | ✅ | Universal modals |
| card, badge, avatar | ✅ | ✅ | ✅ | ✅ | ✅ | Universal display |
| table | ✅ | ✅ | ✅ | ⚪ | 🔵 | Desktop data-heavy views |
| tabs | ✅ | ✅ | ✅ | 🔵 | 🔵 | Desktop navigation |
| dropdown-menu | ✅ | ✅ | ✅ | 🔵 | 🔵 | Desktop primarily |
| context-menu | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop-only (right-click) |
| toast, toaster | ✅ | ✅ | ✅ | ✅ | ✅ | Universal notifications |
| skeleton | ✅ | ✅ | ✅ | ✅ | ✅ | Universal loading |
| tooltip | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop-only (hover) |
| theme-toggle | ✅ | ✅ | ✅ | ✅ | ✅ | Universal |
| command-palette | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop power users |
| keyboard-shortcuts-help | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop only |
| bulk-action-toolbar | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop multi-select |
| smart-suggestions | ✅ | ✅ | 🔵 | ⚪ | ✅ | AI-powered suggestions |
| floating-action-button | ⚪ | ⚪ | ⚪ | ✅ | ✅ | Mobile-only |

---

### Jobs Components (7)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| create-job-dialog | ✅ | ✅ | ✅ | ⚪ | ✅ | Create jobs |
| job-detail-modal | ✅ | ✅ | ✅ | 🔵 | 🔵 | View/edit (desktop) |
| job-context-menu | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop right-click actions |
| bulk-assign-dialog | ✅ | ✅ | ✅ | ⚪ | ⚪ | Assign multiple jobs |
| materials-dialog | ✅ | ✅ | 🔵 | ✅ | ⚪ | Add materials/parts |
| generate-invoice-dialog | ✅ | ✅ | ⚪ | ⚪ | ⚪ | Finance action |
| signature-capture | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | Tech job completion |

---

### Tech Components (2)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| location-tracker | 🔵 | 🔵 | 🔵 | ✅ | 🔵 | GPS capture (primarily Tech) |
| time-tracker | 🔵 | 🔵 | ⚪ | ✅ | ⚪ | Clock in/out |

---

### Contacts Components (4)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| add-contact-dialog | ✅ | ✅ | ✅ | ⚪ | ✅ | Create contacts |
| contact-detail-modal | ✅ | ✅ | ✅ | 🔒 | ✅ | View/edit contact |
| contact-context-menu | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop actions |
| contacts-filter-dialog | ✅ | ✅ | ✅ | ⚪ | 🔵 | Advanced filtering |

---

### Marketing Components (3)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| campaign-editor-dialog | ✅ | ✅ | ⚪ | ⚪ | ⚪ | Marketing campaigns |
| email-template-dialog | ✅ | ✅ | ⚪ | ⚪ | ⚪ | Email templates |
| tag-selector | ✅ | ✅ | ⚪ | ⚪ | 🔵 | Contact tagging |

---

### Integrations Components (2)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| gmail-connection | ✅ | ✅ | ⚪ | ⚪ | ⚪ | OAuth integration |
| microsoft-connection | ✅ | ✅ | ⚪ | ⚪ | ⚪ | OAuth integration |

---

### Conversations Components (3)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| conversation-context-menu | ✅ | ✅ | 🔵 | ⚪ | ⚪ | Email actions |
| email-quick-actions | ✅ | ✅ | 🔵 | ⚪ | ⚪ | Reply/archive |
| calendar-integration | ✅ | ✅ | ✅ | ⚪ | ✅ | Schedule meetings |

---

### Admin Components (3)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| user-dialog | ✅ | ✅ | ⚪ | ⚪ | ⚪ | User management |
| automation-rule-dialog | ✅ | ✅ | ⚪ | ⚪ | ⚪ | Automation config |
| llm-provider-dialog | ✅ | ✅ | ⚪ | ⚪ | ⚪ | AI provider config |

---

### Dispatch Components (16)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| TechListSidebar | ✅ | ✅ | ✅ | ⚪ | ⚪ | Tech list with filters |
| TechDetailPanel | ✅ | ✅ | ✅ | ⚪ | ⚪ | Tech info panel |
| JobDetailPanel | ✅ | ✅ | ✅ | ⚪ | ⚪ | Job info on map |
| AssignTechDialog | ✅ | ✅ | ✅ | ⚪ | ⚪ | Assign job to tech |
| MapControls | ✅ | ✅ | ✅ | ⚪ | ⚪ | Zoom/pan controls |
| DispatchStats | ✅ | ✅ | ✅ | ⚪ | ⚪ | Real-time stats |
| HistoricalPlayback | ✅ | ✅ | ✅ | ⚪ | ⚪ | GPS history playback |
| All other dispatch components | ✅ | ✅ | ✅ | ⚪ | ⚪ | Dispatch map system |

---

### Voice Agent Components (2)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| voice-agent-widget | ✅ | ✅ | ✅ | 🔵 | 🔵 | ElevenLabs integration |
| voice-agent-overlay | ✅ | ✅ | ✅ | 🔵 | 🔵 | Voice UI overlay |

---

### Mobile Components (1)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| big-button | ⚪ | ⚪ | ⚪ | ✅ | ✅ | Large touch targets |

---

### Layout Components (6)

| Component | Owner | Admin | Dispatcher | Tech | Sales | Notes |
|-----------|-------|-------|------------|------|-------|-------|
| app-shell | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop layout |
| sidebar-nav | ✅ | ✅ | ✅ | ⚪ | ⚪ | Desktop sidebar |
| jobs-layout | ✅ | ✅ | ✅ | ⚪ | ⚪ | Jobs page layout |
| contacts-layout | ✅ | ✅ | ✅ | ⚪ | ⚪ | Contacts page layout |
| analytics-layout | ✅ | ✅ | ⚪ | ⚪ | ⚪ | Analytics page |
| inbox-layout | ✅ | ✅ | ⚪ | ⚪ | ⚪ | Inbox page |

---

### Component-Role Summary

| Role | Primary Components | Secondary Components | No Access |
|------|-------------------|---------------------|-----------|
| **Owner** | 85 components | 7 components | 0 (full access) |
| **Admin** | 82 components | 7 components | 3 (billing-related) |
| **Dispatcher** | 65 components | 12 components | 15 (admin, marketing) |
| **Tech** | 15 components | 8 components | 69 (desktop-heavy) |
| **Sales** | 18 components | 10 components | 64 (admin, finance) |

**Key Insight:** Tech and Sales use only 15-18 components each, yet we have 92 total. This confirms the need for role-specific component libraries.

---

## Role-Based UI/UX Architecture

### Design Philosophy

**Core Principle:** "Show only what the user can do, in the way they need to do it."

Each role has distinct:
- **Context of Use** - Where and when they use the system
- **Primary Tasks** - What they accomplish most often
- **Information Needs** - What data they need to see
- **Interaction Patterns** - How they interact (mouse, touch, voice)

---

### 1. Owner Role - Executive Command Center

#### Context of Use
- **Device:** Desktop (primary), Mobile (monitoring)
- **Location:** Office, home, occasionally field
- **Session Duration:** Hours (extended sessions)
- **Multitasking:** High (multiple tabs, windows)

#### Primary Tasks
1. Monitor business health (KPIs, revenue, job completion)
2. Review and respond to critical escalations
3. Make strategic decisions (hiring, pricing, marketing)
4. Oversee all operations (jobs, techs, finances)
5. Configure system (users, integrations, automation)

#### UI/UX Architecture

**Desktop Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] CRM-AI Pro                    [Search] [🔔] [Avatar] │
├─────┬───────────────────────────────────────────────────────┤
│     │  DASHBOARD VIEW (Default: /inbox)                     │
│ 📥  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│ In  │  │ Today's KPIs │  │ Revenue      │  │ Jobs       │  │
│ box │  │              │  │              │  │            │  │
│     │  │ $5,240       │  │ $124k (MTD)  │  │ 18 Active  │  │
│ 📋  │  └──────────────┘  └──────────────┘  └────────────┘  │
│ Job │                                                        │
│     │  ┌────────────────────────────────────────────────┐  │
│ 👥  │  │ Critical Alerts                                │  │
│ Con │  │ • 3 overdue invoices                          │  │
│ tac │  │ • 1 tech marked unavailable                   │  │
│     │  │ • 2 customer complaints                       │  │
│ 📊  │  └────────────────────────────────────────────────┘  │
│ Ana │                                                        │
│ lyt │  [Recent Conversations] [Upcoming Jobs] [Revenue]    │
│     │                                                        │
│ 💰  │  ⌘K for quick actions                               │
│ Fin │                                                        │
│     │                                                        │
│ 📣  │                                                        │
│ Mar │                                                        │
│ ket │                                                        │
│     │                                                        │
│ 🗺️  │                                                        │
│ Dis │                                                        │
│ pat │                                                        │
│     │                                                        │
│ ⚙️  │                                                        │
│ Adm │                                                        │
│ in  │                                                        │
└─────┴───────────────────────────────────────────────────────┘
```

**Component Priorities:**
1. **KPI Dashboard Cards** - Revenue, jobs, tech utilization
2. **Alert/Escalation Panel** - Critical issues requiring attention
3. **Quick Action Palette** (⌘K) - Fast access to any action
4. **Multi-view Layout** - Split screen for email + job details
5. **Financial Reports** - Revenue charts, outstanding invoices
6. **Analytics Dashboards** - Business intelligence charts

**Mobile Interface:**
```
┌─────────────────────────────┐
│ CRM-AI Pro    [🔔] [Avatar] │
├─────────────────────────────┤
│                             │
│  Today's Performance        │
│  ┌───────────┬───────────┐  │
│  │ Revenue   │ Jobs      │  │
│  │ $5,240    │ 18 Active │  │
│  └───────────┴───────────┘  │
│                             │
│  ⚠️ Critical Alerts (5)     │
│  • 3 overdue invoices       │
│  • 1 tech unavailable       │
│  • 2 complaints             │
│                             │
│  Quick Actions              │
│  [View Jobs] [Check Map]    │
│  [Review Inbox]             │
│                             │
└─────────────────────────────┘
  🏠 Home  📊 Stats  ⚙️ Settings
```

**Key UX Patterns:**
- **Dashboard-First:** Always land on high-level overview
- **Drill-Down Navigation:** Click metrics to see details
- **Keyboard Shortcuts:** Power user efficiency (⌘K, ⌘J, etc.)
- **Multi-Panel Layouts:** Side-by-side job + customer info
- **Real-Time Updates:** WebSocket for live KPI changes
- **Customizable Dashboards:** Drag-and-drop widget arrangement

#### Components Needed (Owner-Specific)

**Existing:**
- ✅ All 92 existing components available

**Missing:**
- [ ] `OwnerDashboard.tsx` - Executive KPI dashboard
- [ ] `EscalationPanel.tsx` - Critical alerts panel
- [ ] `RevenueDashboard.tsx` - Financial overview
- [ ] `BillingDashboard.tsx` - Subscription management
- [ ] `BusinessAnalytics.tsx` - BI charts and insights
- [ ] `UserManagementPanel.tsx` - Quick user admin

---

### 2. Admin Role - Operations Manager

#### Context of Use
- **Device:** Desktop only
- **Location:** Office
- **Session Duration:** Full workday (8+ hours)
- **Multitasking:** Very high (managing conversations, jobs, dispatch)

#### Primary Tasks
1. Manage customer conversations (inbox triage)
2. Create and schedule jobs
3. Coordinate with dispatch
4. Handle customer requests and complaints
5. Generate invoices
6. Configure system settings

#### UI/UX Architecture

**Desktop Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] CRM-AI Pro                    [Search] [🔔] [Avatar] │
├─────┬───────────────────────────────────────────────────────┤
│     │  INBOX VIEW (Default landing)                         │
│ 📥  │  ┌─────────────────┬─────────────────────────────┐   │
│ In  │  │ Conversations   │ Thread: John Smith          │   │
│ box │  │                 │                             │   │
│ ← │  │ [Search...]     │ From: john@example.com      │   │
│     │  │                 │ Re: Kitchen sink repair     │   │
│ 📋  │  │ • John Smith    │                             │   │
│ Job │  │   Kitchen sink  │ [Message content...]        │   │
│ s   │  │   2 hours ago   │                             │   │
│     │  │                 │ [Quick Actions]             │   │
│ 👥  │  │ • Mary Johnson  │ [Reply] [Create Job]        │   │
│ Con │  │   Follow-up     │ [Schedule Call]             │   │
│ tac │  │   5 hours ago   │                             │   │
│ ts  │  │                 │                             │   │
│     │  │ • Bob Williams  │                             │   │
│ 📅  │  │   Estimate req  │                             │   │
│ Cal │  │   1 day ago     │                             │   │
│     │  │                 │                             │   │
│ 📊  │  └─────────────────┴─────────────────────────────┘   │
│ Ana │                                                        │
│     │  [Unread: 12] [Flagged: 3] [Today's Jobs: 8]        │
│ 📣  │                                                        │
│ Mar │                                                        │
│ ket │                                                        │
│     │                                                        │
│ 🗺️  │                                                        │
│ Dis │                                                        │
│ pat │                                                        │
│     │                                                        │
│ ⚙️  │                                                        │
│ Set │                                                        │
│ tin │                                                        │
│ gs  │                                                        │
└─────┴───────────────────────────────────────────────────────┘
```

**Component Priorities:**
1. **Inbox View** - Email/conversation management (Gmail-like)
2. **Quick Action Bar** - Reply, Create Job, Schedule, etc.
3. **Job Management Table** - List, filter, assign jobs
4. **Contact Quick Access** - Fast lookup and edit
5. **Invoice Generator** - Create invoices from jobs
6. **Settings Panels** - System configuration

**Key UX Patterns:**
- **Inbox-First:** CRM conversations are primary interface
- **Quick Actions:** One-click create job from email
- **Keyboard Navigation:** Gmail-style shortcuts (j/k, e, r)
- **Smart Suggestions:** AI-powered reply drafts
- **Bulk Operations:** Multi-select for batch actions
- **Context Switching:** Easy jump between inbox → jobs → contacts

#### Components Needed (Admin-Specific)

**Existing:**
- ✅ Inbox layout, conversation components
- ✅ Job management components
- ✅ Contact management components

**Missing:**
- [ ] `InboxUnreadCounter.tsx` - Persistent unread count
- [ ] `QuickJobCreator.tsx` - Minimal job creation from inbox
- [ ] `InvoiceGenerator.tsx` - Generate invoice UI
- [ ] `BulkEmailActions.tsx` - Archive/tag multiple threads

---

### 3. Dispatcher Role - Real-Time Operations Hub

#### Context of Use
- **Device:** Desktop (large screen preferred), Mobile (backup)
- **Location:** Dispatch office
- **Session Duration:** Full shift (8+ hours)
- **Multitasking:** Extreme (monitoring map, phones, messages)

#### Primary Tasks
1. Monitor real-time tech locations on map
2. Assign jobs to available techs
3. Optimize routes and schedules
4. Handle urgent job requests
5. Communicate with techs (calls, messages)
6. Track job status changes

#### UI/UX Architecture

**Desktop Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Dispatch Map                  [Search] [🔔] [Avatar] │
├─────┬───────────────────────────────────────────────────────┤
│     │  ┌──────────────────────────────────────────┐        │
│ All │  │                                          │        │
│ (12)│  │                                          │        │
│     │  │              🗺️ MAP VIEW                │        │
│ ✅  │  │                                          │        │
│ On  │  │     📍 Tech 1 (en route)                │        │
│ Job │  │     📍 Tech 2 (on job)                  │        │
│ (4) │  │     📍 Tech 3 (idle)                    │        │
│     │  │                                          │        │
│ 🚗  │  │     📌 Job 1 (scheduled)                │        │
│ En  │  │     📌 Job 2 (scheduled)                │        │
│ Rou │  │     📌 Job 3 (unassigned) ⚠️            │        │
│ (2) │  │                                          │        │
│     │  │                                          │        │
│ 😴  │  │                                          │        │
│ Idl │  │  [+] [-] [Current Traffic] [Satellite]  │        │
│ e   │  └──────────────────────────────────────────┘        │
│ (3) │                                                       │
│     │  ┌────────────────────────────────────────┐         │
│ 📵  │  │ Unassigned Jobs (3)                    │         │
│ Off │  │ • Kitchen repair - John Smith - 2pm    │         │
│ lin │  │ • Leak fix - Mary J. - URGENT          │         │
│ e   │  │ • Install - Bob W. - 4pm               │         │
│ (3) │  └────────────────────────────────────────┘         │
│     │                                                       │
│ [+] │  ┌────────────────────────────────────────┐         │
│ Job │  │ Dispatch Stats                         │         │
│     │  │ • Jobs today: 18 (12 done, 6 active)  │         │
└─────┴  │ • Avg completion: 2.1 hrs             │         │
         │ • Tech utilization: 87%               │         │
         └────────────────────────────────────────┘         │
```

**Component Priorities:**
1. **Dispatch Map** (PRIMARY) - Real-time tech locations and jobs
2. **Tech List Sidebar** - Filter/search techs, see status
3. **Unassigned Job Queue** - Drag-and-drop to assign
4. **Job Detail Panel** - Quick view job info on map click
5. **Dispatch Stats** - Real-time metrics
6. **Route Optimization** - AI-suggested assignments

**Key UX Patterns:**
- **Map-First:** Map is always visible and primary focus
- **Drag-and-Drop Assignment:** Drag job onto tech marker
- **Real-Time Updates:** WebSocket for live tech locations
- **Visual Status Indicators:** Color-coded markers (idle=green, on job=blue, offline=gray)
- **Minimal Clicks:** Assign job in 1-2 clicks
- **Urgent Job Alerts:** Red flash for urgent/SOS jobs

**Mobile Interface (Backup):**
```
┌─────────────────────────────┐
│ Dispatch      [🔔] [Avatar] │
├─────────────────────────────┤
│                             │
│  📊 Today's Status          │
│  • 18 jobs (12 ✅ 6 active) │
│  • 12 techs (9 active)      │
│                             │
│  ⚠️ Unassigned Jobs (3)     │
│  • Leak fix - URGENT        │
│  • Kitchen repair - 2pm     │
│  • Install - 4pm            │
│                             │
│  [View Map] [Assign Jobs]   │
│                             │
└─────────────────────────────┘
  🏠 Home  🗺️ Map  📋 Jobs
```

#### Components Needed (Dispatcher-Specific)

**Existing:**
- ✅ Complete dispatch map system (16 components)
- ✅ TechListSidebar, JobDetailPanel, AssignTechDialog

**Missing:**
- [ ] `UnassignedJobQueue.tsx` - Drag-and-drop job queue
- [ ] `RouteOptimizationPanel.tsx` - AI route suggestions
- [ ] `TechAvailabilityCalendar.tsx` - Tech schedule view
- [ ] `DispatchAlertToast.tsx` - Urgent job notifications
- [ ] `JobReassignmentDialog.tsx` - Quick reassign UI

---

### 4. Tech Role - Mobile-First Field Worker

#### Context of Use
- **Device:** Mobile phone ONLY (PWA)
- **Location:** Field (vehicles, customer sites)
- **Session Duration:** Intermittent (check-in between jobs)
- **Environment:** Outdoor, gloves, sun glare, one-handed use

#### Primary Tasks
1. View today's assigned jobs
2. Navigate to job location
3. Start job (clock in, capture GPS)
4. Take before/after photos
5. Add notes and materials used
6. Get customer signature
7. Complete job

#### UI/UX Architecture

**Mobile Interface (PRIMARY):**
```
┌─────────────────────────────┐
│ Tech Dashboard      [Menu]  │
├─────────────────────────────┤
│                             │
│  Today's Jobs (4)           │
│                             │
│  ┌─────────────────────────┐│
│  │ 🔵 IN PROGRESS          ││
│  │ Kitchen Sink Repair     ││
│  │ John Smith              ││
│  │ 📍 123 Main St          ││
│  │ Started: 20 mins ago    ││
│  │                         ││
│  │ [📸 PHOTOS] [✅ DONE]   ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ ⏰ SCHEDULED - 2:00 PM  ││
│  │ Leak Fix                ││
│  │ Mary Johnson            ││
│  │ 📍 456 Oak Ave          ││
│  │                         ││
│  │ [🗺️ NAVIGATE] [▶️ START]││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ ⏰ SCHEDULED - 4:00 PM  ││
│  │ Install                 ││
│  │ Bob Williams            ││
│  │ 📍 789 Pine Rd          ││
│  │                         ││
│  │ [🗺️ NAVIGATE] [▶️ START]││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
  🏠 Home  📋 Jobs  📍 Map  👤 Me
```

**Job Detail Page:**
```
┌─────────────────────────────┐
│ ← Job #1234                 │
├─────────────────────────────┤
│                             │
│  Kitchen Sink Repair        │
│  📍 123 Main St, Boston     │
│  👤 John Smith              │
│  📞 (555) 123-4567          │
│                             │
│  Description:               │
│  Replace leaking kitchen    │
│  sink. Customer reports     │
│  water pooling under sink.  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📸 TAKE PHOTOS        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📝 ADD NOTES          │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🔧 ADD MATERIALS      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ✍️ GET SIGNATURE      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ✅ MARK COMPLETE      │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**Component Priorities:**
1. **Big Button Components** - 60px+ touch targets
2. **Job Card** - Large, glanceable job info
3. **Photo Capture** - Native camera integration
4. **Signature Pad** - Touch-friendly signature capture
5. **GPS Location Tracker** - Auto-capture location
6. **Offline Queue** - Work offline, sync later
7. **One-Tap Actions** - Navigate, Call, Start, Complete

**Key UX Patterns:**
- **Large Touch Targets:** Minimum 60px for glove use
- **High Contrast:** Readable in bright sunlight
- **Offline-First:** All job data cached locally
- **Minimal Input:** Voice notes, photo capture, one-tap buttons
- **Progressive Workflow:** Start → Work → Capture → Sign → Complete
- **GPS Auto-Capture:** Location saved automatically
- **Photo Compression:** Optimize for slow connections
- **Swipe Gestures:** Swipe card to navigate, call, complete

#### Components Needed (Tech-Specific)

**Existing:**
- ✅ big-button.tsx
- ✅ signature-capture.tsx
- ✅ location-tracker.tsx

**Missing (CRITICAL):**
- [ ] `TechJobCard.tsx` - Large job card with status
- [ ] `JobPhotoCapture.tsx` - Camera integration with compression
- [ ] `JobPhotoGallery.tsx` - View before/after photos
- [ ] `QuickJobActions.tsx` - Big button action bar
- [ ] `MaterialsQuickAdd.tsx` - Fast add materials on mobile
- [ ] `VoiceNoteRecorder.tsx` - Voice-to-text notes
- [ ] `TimeClockCard.tsx` - Clock in/out widget
- [ ] `OfflineQueueIndicator.tsx` - Show pending sync items
- [ ] `JobChecklistMobile.tsx` - Task checklist for job
- [ ] `CustomerContactCard.tsx` - One-tap call/message
- [ ] `NavigationButton.tsx` - One-tap open Maps
- [ ] `JobCompletionWizard.tsx` - Step-by-step completion flow

---

### 5. Sales Role - AI-Powered Mobile CRM

#### Context of Use
- **Device:** Mobile phone ONLY (PWA)
- **Location:** Field (customer offices, coffee shops, car)
- **Session Duration:** Intermittent (before/during/after meetings)
- **Environment:** Professional settings, one-handed use

#### Primary Tasks
1. Prepare for meetings (AI briefing)
2. Take meeting notes
3. Generate estimates on the fly
4. Schedule follow-ups
5. Update lead status
6. Review sales pipeline

#### UI/UX Architecture

**Mobile Interface (PRIMARY):**
```
┌─────────────────────────────┐
│ Sales Pipeline      [Menu]  │
├─────────────────────────────┤
│                             │
│  [Search leads...]          │
│                             │
│  🔥 Hot Leads (3)           │
│                             │
│  ┌─────────────────────────┐│
│  │ 🎯 MEETING TODAY 2PM    ││
│  │ John Smith              ││
│  │ Kitchen Renovation      ││
│  │ Est. Value: $15,000     ││
│  │                         ││
│  │ [📋 BRIEFING] [📞 CALL] ││
│  └─────────────────────────┘│
│                             │
│  🔄 In Progress (5)         │
│                             │
│  ┌─────────────────────────┐│
│  │ 📧 Follow-up Due        ││
│  │ Mary Johnson            ││
│  │ Bathroom Remodel        ││
│  │ Est. Value: $8,500      ││
│  │                         ││
│  │ [💬 EMAIL] [📅 SCHEDULE]││
│  └─────────────────────────┘│
│                             │
│  📊 This Week               │
│  • 8 meetings               │
│  • $45k pipeline            │
│  • 3 closed ($12k)          │
│                             │
└─────────────────────────────┘
  🏠 Home  🎯 Leads  📅 Meet  👤 Me
```

**AI Briefing Page (CRITICAL FEATURE):**
```
┌─────────────────────────────┐
│ ← Meeting Briefing          │
├─────────────────────────────┤
│                             │
│  John Smith                 │
│  Kitchen Renovation         │
│  Meeting: Today 2:00 PM     │
│                             │
│  🤖 AI Summary              │
│  ┌─────────────────────────┐│
│  │ • New customer          ││
│  │ • Referred by Mary J.   ││
│  │ • Budget: $10-15k       ││
│  │ • Timeline: 2 months    ││
│  │ • Pain point: Old sink  ││
│  └─────────────────────────┘│
│                             │
│  💡 Talking Points          │
│  • Mention Mary's referral  │
│  • Highlight quick timeline │
│  • Suggest premium fixtures │
│                             │
│  💰 Pricing Suggestions     │
│  • Budget option: $9,500    │
│  • Standard: $12,000        │
│  • Premium: $15,500         │
│                             │
│  📜 Past Conversations (2)  │
│  • Initial inquiry email    │
│  • Phone call summary       │
│                             │
│  ┌───────────────────────┐  │
│  │ 📞 CALL CUSTOMER      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📝 START MEETING      │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**During Meeting:**
```
┌─────────────────────────────┐
│ ← Meeting: John Smith       │
├─────────────────────────────┤
│                             │
│  🎙️ Recording...            │
│                             │
│  Notes:                     │
│  ┌─────────────────────────┐│
│  │ Customer wants...       ││
│  │                         ││
│  │ [Voice input active]    ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  Quick Actions:             │
│  ┌───────────────────────┐  │
│  │ 💰 CREATE ESTIMATE    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📅 SCHEDULE FOLLOW-UP │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📋 VIEW BRIEFING      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ✅ END MEETING        │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**Component Priorities:**
1. **AI Briefing Card** (CRITICAL) - Pre-meeting intelligence
2. **Lead Pipeline View** - Visual sales funnel
3. **Meeting Note Capture** - Voice-to-text notes
4. **Quick Estimate Builder** - Simplified estimate creation
5. **Follow-Up Scheduler** - One-tap schedule next step
6. **Contact Quick Actions** - Call, Email, Text buttons

**Key UX Patterns:**
- **AI-First:** Briefing before every meeting
- **Voice-Enabled:** Hands-free note-taking
- **Context-Aware:** Show relevant info based on meeting stage
- **Quick Actions:** Minimize typing, maximize tapping
- **Pipeline View:** Visual representation of leads
- **Smart Suggestions:** AI recommends next steps
- **One-Tap Estimates:** Generate quote in 2 minutes

#### Components Needed (Sales-Specific)

**Existing:**
- ✅ big-button.tsx
- ⚠️ Meeting page exists but missing AI briefing UI

**Missing (CRITICAL):**
- [ ] `AIBriefingCard.tsx` - AI-generated meeting prep
- [ ] `LeadPipelineView.tsx` - Visual sales funnel
- [ ] `LeadCard.tsx` - Mobile lead card with status
- [ ] `MeetingNoteCapture.tsx` - Voice-to-text notes
- [ ] `QuickEstimateBuilder.tsx` - Simplified estimate form
- [ ] `TalkingPointsList.tsx` - AI-suggested talking points
- [ ] `PricingSuggestions.tsx` - AI-recommended pricing
- [ ] `ContactHistorySummary.tsx` - Past interactions summary
- [ ] `MeetingSummaryAI.tsx` - AI-generated meeting recap
- [ ] `FollowUpScheduler.tsx` - Schedule next action
- [ ] `SalesMetricsCard.tsx` - Weekly pipeline stats
- [ ] `VoiceNoteRecorder.tsx` - Voice note capture (shared with Tech)

---

## Future Feature Integration Plan

### Overview

The following 6 feature categories are missing and need to be designed with role-specific variants:

1. **Document Upload/Viewer**
2. **Notification Center**
3. **Report Builder**
4. **Settings Layouts**
5. **Onboarding Wizard**
6. **Payment Processing** (Future Phase)

---

### 1. Document Management System

#### Business Need
- Techs need to upload job photos efficiently
- Office needs to attach estimates, invoices, contracts to jobs
- Customers need to view/download documents
- Compliance requires document retention

#### Role-Based Requirements

**Tech (Mobile):**
- Take photos using device camera
- Compress images before upload (save bandwidth)
- Queue photos for upload when offline
- Attach photos to specific job
- No need to view/download documents

**Sales (Mobile):**
- Take photos of property/damage
- Attach photos to estimates
- View past job photos during briefing
- Limited document management

**Dispatcher/Admin (Desktop):**
- Upload files (PDF estimates, contracts, invoices)
- View all documents for a job
- Download/print documents
- Organize documents by type
- Email documents to customers

**Owner (Desktop/Mobile):**
- Full access to all documents
- Search across all documents
- Archive old documents
- Set document retention policies

#### Component Architecture

```
DocumentManagement/
├── DocumentUploadDialog.tsx       # Desktop file upload
├── DocumentViewer.tsx             # Desktop preview/download
├── DocumentList.tsx               # List attachments per job
├── DocumentTypeIcon.tsx           # Visual file type indicators
├── PhotoGallery.tsx              # Grid view with lightbox
├── Mobile/
│   ├── PhotoCaptureButton.tsx    # Native camera integration
│   ├── PhotoUploadQueue.tsx      # Offline queue indicator
│   ├── PhotoCompressor.tsx       # Client-side compression
│   └── PhotoGallery.tsx          # Mobile photo viewer
└── Shared/
    ├── DocumentPreview.tsx        # PDF/image preview
    └── DocumentDownloadButton.tsx # Download with progress
```

#### Implementation Strategy

**Phase 1 (Week 1-2):** Tech Photo Upload
- [ ] PhotoCaptureButton.tsx - Camera integration
- [ ] PhotoCompressor.tsx - Compress to max 1MB
- [ ] PhotoUploadQueue.tsx - Offline queue
- [ ] Upload to Supabase Storage bucket
- [ ] Link photos to jobs table

**Phase 2 (Week 3):** Desktop Document Management
- [ ] DocumentUploadDialog.tsx - Multi-file upload
- [ ] DocumentList.tsx - List documents per job
- [ ] DocumentViewer.tsx - PDF preview
- [ ] DocumentTypeIcon.tsx - File type indicators

**Phase 3 (Week 4):** Gallery & Organization
- [ ] PhotoGallery.tsx - Before/after grid view
- [ ] DocumentSearch.tsx - Search across documents
- [ ] DocumentArchival.tsx - Archive old documents

#### Database Schema

```sql
-- New table: documents
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- 'photo', 'pdf', 'invoice', 'estimate', 'contract'
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL, -- Supabase Storage path
  thumbnail_path text, -- For images
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now(),
  metadata jsonb, -- {is_before_photo: true, camera_model: "iPhone 12", gps_location: {...}}
  CONSTRAINT valid_document_type CHECK (document_type IN ('photo', 'pdf', 'invoice', 'estimate', 'contract', 'other'))
);

-- RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their account"
  ON documents FOR SELECT
  USING (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can upload documents to their account"
  ON documents FOR INSERT
  WITH CHECK (account_id = (SELECT account_id FROM users WHERE id = auth.uid()));
```

#### Permission Matrix

| Role | Upload | View | Download | Delete | Archive |
|------|--------|------|----------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dispatcher | ✅ | ✅ | ✅ | ⚠️ (own) | ❌ |
| Tech | ✅ (photos) | 🔒 (job-related) | ❌ | ⚠️ (own) | ❌ |
| Sales | ✅ (photos) | 🔒 (lead-related) | ❌ | ⚠️ (own) | ❌ |

---

### 2. Notification Center

#### Business Need
- Dispatcher needs urgent job alerts (tech marked unavailable, SOS)
- Owner needs escalation notifications (overdue invoices, complaints)
- All users need real-time updates (job assigned, status changed)
- Reduce reliance on email for internal notifications

#### Role-Based Requirements

**All Roles:**
- See unread notification count
- Mark notifications as read
- Click notification to navigate to relevant page
- Configure notification preferences

**Dispatcher:**
- **Critical:** Tech status changes (unavailable, SOS)
- **High:** Unassigned jobs, urgent jobs
- **Medium:** Job status changes, customer requests

**Owner:**
- **Critical:** Financial alerts (overdue invoices, large expenses)
- **High:** Customer complaints, tech issues
- **Medium:** Daily/weekly reports

**Tech:**
- **Critical:** Job assigned to me
- **High:** Job rescheduled, job cancelled
- **Medium:** Dispatcher messages

**Sales:**
- **Critical:** Meeting reminder (30 min before)
- **High:** Lead status change, new lead assigned
- **Medium:** Follow-up reminders

#### Component Architecture

```
Notifications/
├── NotificationBell.tsx           # Header icon with unread count
├── NotificationPanel.tsx          # Dropdown panel with list
├── NotificationItem.tsx           # Individual notification card
├── NotificationSettings.tsx       # Configure preferences
├── NotificationToast.tsx          # Real-time toast (urgent)
└── NotificationEmptyState.tsx     # "No notifications" state
```

#### Notification Types

```typescript
enum NotificationType {
  JOB_ASSIGNED = 'job_assigned',           // Tech
  JOB_STATUS_CHANGED = 'job_status_changed', // Dispatcher
  TECH_UNAVAILABLE = 'tech_unavailable',   // Dispatcher (urgent)
  TECH_SOS = 'tech_sos',                   // Dispatcher (critical)
  INVOICE_OVERDUE = 'invoice_overdue',     // Owner
  CUSTOMER_COMPLAINT = 'customer_complaint', // Owner, Admin
  MEETING_REMINDER = 'meeting_reminder',   // Sales
  NEW_LEAD = 'new_lead',                   // Sales
  UNASSIGNED_JOB = 'unassigned_job',       // Dispatcher
  ESTIMATE_VIEWED = 'estimate_viewed',     // Sales, Owner
  ESTIMATE_ACCEPTED = 'estimate_accepted', // Sales, Owner, Admin
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  read: boolean;
  action_url?: string; // Navigate to this URL on click
  created_at: string;
  expires_at?: string; // Auto-dismiss after this time
}
```

#### Implementation Strategy

**Phase 1 (Week 1):** Infrastructure
- [ ] Database table: `notifications`
- [ ] WebSocket subscription for real-time updates
- [ ] NotificationBell.tsx with unread count
- [ ] NotificationPanel.tsx dropdown

**Phase 2 (Week 2):** Notification Triggers
- [ ] Job assigned → notify Tech
- [ ] Job status changed → notify Dispatcher
- [ ] Tech marked unavailable → notify Dispatcher
- [ ] Invoice overdue → notify Owner
- [ ] Meeting reminder → notify Sales (30 min before)

**Phase 3 (Week 3):** Settings & Preferences
- [ ] NotificationSettings.tsx - Enable/disable types
- [ ] Email vs in-app preferences
- [ ] Notification sound settings
- [ ] Do Not Disturb mode

#### Database Schema

```sql
-- New table: notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id),
  user_id uuid REFERENCES users(id), -- Recipient
  type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Index for fast queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());
```

---

### 3. Report Builder

#### Business Need
- Owner needs custom business reports (revenue by tech, job type, time period)
- Owner needs visual charts (trend lines, bar charts, pie charts)
- Owner needs exportable reports (PDF, Excel)
- Reduce manual report creation in Excel

#### Role-Based Requirements

**Owner:**
- Create custom reports (select dimensions, metrics, filters)
- Save report templates for reuse
- Schedule automated reports (email daily/weekly)
- Export to PDF, Excel, CSV
- View pre-built report templates

**Admin:**
- View existing reports (read-only)
- Export reports
- No ability to create custom reports

**Other Roles:**
- No access to report builder

#### Component Architecture

```
ReportBuilder/
├── ReportBuilderDialog.tsx        # Visual report builder
├── ReportTemplateSelector.tsx     # Pre-built templates
├── ReportFilterPanel.tsx          # Date range, filters
├── ReportDataSelector.tsx         # Choose dimensions/metrics
├── ReportChartBuilder.tsx         # Configure chart type
├── ReportPreview.tsx              # Live preview
├── ReportExportButton.tsx         # Export to PDF/Excel/CSV
├── ReportScheduler.tsx            # Schedule automated reports
└── ReportList.tsx                 # Saved reports
```

#### Pre-Built Report Templates

1. **Revenue Report**
   - Total revenue by month
   - Revenue by tech
   - Revenue by job type
   - Year-over-year comparison

2. **Job Performance Report**
   - Jobs completed by tech
   - Average job duration
   - Job completion rate
   - Jobs by status

3. **Customer Report**
   - New customers by month
   - Repeat customer rate
   - Customer lifetime value
   - Customer satisfaction (if survey implemented)

4. **Tech Performance Report**
   - Jobs per tech
   - Average job time
   - Customer ratings
   - Tech utilization rate

5. **Financial Report**
   - Outstanding invoices
   - Aging report (30/60/90 days)
   - Payment collection rate
   - Profit margin by job type

#### Implementation Strategy

**Phase 1 (Week 1-2):** Pre-Built Templates
- [ ] ReportTemplateSelector.tsx
- [ ] Implement 5 pre-built templates
- [ ] ReportPreview.tsx with charts
- [ ] ReportExportButton.tsx (PDF, Excel)

**Phase 2 (Week 3):** Custom Report Builder
- [ ] ReportBuilderDialog.tsx
- [ ] ReportDataSelector.tsx (choose metrics)
- [ ] ReportFilterPanel.tsx (date range, filters)
- [ ] Save custom reports

**Phase 3 (Week 4):** Automation
- [ ] ReportScheduler.tsx
- [ ] Email reports daily/weekly
- [ ] Automated PDF generation

#### Chart Library

Use **Recharts** for React-based charting:
- Line charts (trend over time)
- Bar charts (comparison)
- Pie charts (distribution)
- Area charts (stacked metrics)

---

### 4. Settings Layouts

#### Business Need
- Inconsistent settings UX across the app
- No centralized settings page
- Users can't find where to configure system
- Need role-specific settings pages

#### Role-Based Requirements

**Owner:**
- Company settings (name, logo, address)
- User management
- Integrations (Gmail, MS365)
- Billing/subscription
- Automation rules
- AI provider config

**Admin:**
- Company settings (limited)
- User management (limited)
- Integrations

**Dispatcher:**
- Personal profile
- Notification preferences

**Tech:**
- Personal profile
- Notification preferences
- GPS tracking on/off

**Sales:**
- Personal profile
- Notification preferences
- AI briefing preferences

#### Component Architecture

```
Settings/
├── SettingsLayout.tsx             # Tab-based settings shell
├── SettingsSection.tsx            # Reusable settings card
├── SettingsSidebar.tsx            # Left nav for settings categories
├── Pages/
│   ├── ProfileSettings.tsx        # Personal profile
│   ├── CompanySettings.tsx        # Company info (Owner/Admin)
│   ├── UserManagement.tsx         # User list and roles (Owner/Admin)
│   ├── IntegrationSettings.tsx   # Third-party integrations
│   ├── NotificationPreferences.tsx # Notification config
│   ├── BillingSettings.tsx        # Subscription (Owner only)
│   ├── AutomationSettings.tsx     # Automation rules (Owner/Admin)
│   ├── AIProviderSettings.tsx     # LLM config (Owner/Admin)
│   ├── AppearanceSettings.tsx     # Theme, dark mode
│   └── SecuritySettings.tsx       # Password, 2FA
└── Shared/
    ├── SettingsToggle.tsx          # On/off toggle
    ├── SettingsInput.tsx           # Text input
    └── SettingsSaveButton.tsx      # Save changes button
```

#### Settings URL Structure

```
/settings
├── /settings/profile              # All roles
├── /settings/company              # Owner, Admin
├── /settings/users                # Owner, Admin
├── /settings/integrations         # Owner, Admin
├── /settings/notifications        # All roles
├── /settings/billing              # Owner only
├── /settings/automation           # Owner, Admin
├── /settings/ai-providers         # Owner, Admin
├── /settings/appearance           # All roles
└── /settings/security             # All roles
```

#### Implementation Strategy

**Phase 1 (Week 1):** Settings Shell
- [ ] SettingsLayout.tsx - Tab-based layout
- [ ] SettingsSidebar.tsx - Left nav
- [ ] SettingsSection.tsx - Reusable card

**Phase 2 (Week 2):** Core Settings Pages
- [ ] ProfileSettings.tsx
- [ ] NotificationPreferences.tsx
- [ ] AppearanceSettings.tsx
- [ ] SecuritySettings.tsx

**Phase 3 (Week 3):** Admin Settings Pages
- [ ] CompanySettings.tsx
- [ ] UserManagement.tsx
- [ ] IntegrationSettings.tsx

**Phase 4 (Week 4):** Advanced Settings
- [ ] BillingSettings.tsx (Owner only)
- [ ] AutomationSettings.tsx
- [ ] AIProviderSettings.tsx

---

### 5. Onboarding Wizard

#### Business Need
- New users get lost in the system
- No guided setup for new accounts
- Owner needs help connecting integrations
- Reduce support tickets for basic setup

#### Role-Based Requirements

**New Account (Owner):**
1. Welcome screen
2. Company info setup
3. Connect email (Gmail/MS365)
4. Invite team members
5. Create first job
6. Tour of key features

**New Team Member (Admin/Dispatcher):**
1. Welcome screen
2. Profile setup
3. Tour of their role-specific features
4. Quick start guide

**New Field Worker (Tech):**
1. Welcome screen
2. Download mobile PWA
3. Enable GPS permissions
4. Practice capturing signature
5. Practice taking photos

**New Sales Rep (Sales):**
1. Welcome screen
2. Download mobile PWA
3. Connect calendar
4. Practice AI briefing
5. Practice creating estimate

#### Component Architecture

```
Onboarding/
├── OnboardingWizard.tsx           # Multi-step wizard shell
├── OnboardingStep.tsx             # Individual step component
├── OnboardingProgress.tsx         # Progress indicator
├── Steps/
│   ├── WelcomeStep.tsx            # Welcome message
│   ├── RoleSelectionStep.tsx      # Choose role (for new users)
│   ├── CompanyInfoStep.tsx        # Company details (Owner)
│   ├── IntegrationSetupStep.tsx   # Connect Gmail/MS365
│   ├── InviteTeamStep.tsx         # Invite users (Owner)
│   ├── ProfileSetupStep.tsx       # Personal profile
│   ├── PermissionsStep.tsx        # Request GPS/Camera (Mobile)
│   ├── FeatureTourStep.tsx        # Interactive feature tour
│   └── CompletionStep.tsx         # Onboarding complete
└── FeatureTour/
    ├── TourTooltip.tsx             # Spotlight tooltip
    ├── TourOverlay.tsx             # Dim background
    └── TourSteps.tsx               # Tour step config
```

#### Onboarding Flow (Owner)

```
Step 1: Welcome
  "Welcome to CRM-AI Pro! Let's get you set up."
  [Next]

Step 2: Company Info
  - Company name
  - Industry
  - Company size
  - Time zone
  [Next]

Step 3: Connect Email
  "Connect your email to manage customer conversations"
  [Connect Gmail] [Connect Microsoft 365] [Skip for now]

Step 4: Invite Team
  "Add your team members"
  - Email addresses (comma-separated)
  - Assign roles (Owner, Admin, Dispatcher, Tech, Sales)
  [Send Invites] [Skip for now]

Step 5: Create First Job
  "Let's create your first job"
  - Customer name
  - Job description
  - Scheduled date
  [Create Job]

Step 6: Feature Tour
  "Here's a quick tour of key features"
  - Inbox (highlight sidebar item)
  - Jobs (highlight)
  - Dispatch Map (highlight)
  - Voice Agent (highlight)
  [Start Tour] [Skip]

Step 7: Complete
  "You're all set! 🎉"
  "Here are some next steps:"
  - Customize your dashboard
  - Set up automation rules
  - Explore analytics
  [Go to Dashboard]
```

#### Implementation Strategy

**Phase 1 (Week 1):** Wizard Infrastructure
- [ ] OnboardingWizard.tsx - Multi-step wizard
- [ ] OnboardingStep.tsx - Step component
- [ ] OnboardingProgress.tsx - Progress bar
- [ ] Database: `user_onboarding_status` table

**Phase 2 (Week 2):** Owner Onboarding
- [ ] WelcomeStep.tsx
- [ ] CompanyInfoStep.tsx
- [ ] IntegrationSetupStep.tsx
- [ ] InviteTeamStep.tsx
- [ ] CompletionStep.tsx

**Phase 3 (Week 3):** Role-Specific Onboarding
- [ ] Tech onboarding flow (mobile)
- [ ] Sales onboarding flow (mobile)
- [ ] Dispatcher onboarding flow

**Phase 4 (Week 4):** Feature Tour
- [ ] TourTooltip.tsx - Spotlight overlay
- [ ] Define tour steps for each role
- [ ] Interactive tour (click to advance)

#### Database Schema

```sql
-- Track onboarding progress
CREATE TABLE user_onboarding_status (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) UNIQUE,
  onboarding_complete boolean DEFAULT false,
  steps_completed jsonb DEFAULT '[]', -- ['welcome', 'company_info', 'email_integration']
  skipped_steps jsonb DEFAULT '[]',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

### 6. Payment Processing (Future Phase)

#### Business Need (Deferred)
- Currently not in scope
- Future phase: Accept customer payments
- Integrate with Stripe/Square
- Automate invoice payment
- Track payment status

#### Components Needed (Future)
- [ ] PaymentGatewaySetup.tsx
- [ ] PaymentMethodSelector.tsx
- [ ] PaymentDialog.tsx
- [ ] InvoicePaymentButton.tsx
- [ ] PaymentHistory.tsx

**Note:** This feature is deferred to a future phase as it requires significant backend work (Stripe/Square integration, PCI compliance, payment reconciliation).

---

## Permission-Aware Component Design

### Problem Statement

Currently, permission checks happen at the **route level** but not at the **component level**. This creates issues:

1. **Security Risk:** Components render even if user lacks permission (API calls fail but UI shows)
2. **Poor UX:** Users see buttons/actions they can't perform
3. **Maintenance Burden:** Developers must manually hide components based on role

### Solution: Permission-Aware Component Wrapper

Create a `<PermissionGate>` component that automatically hides unauthorized components.

#### Component Implementation

```typescript
// lib/auth/PermissionGate.tsx

import { useUser } from '@/lib/auth/useUser';
import { canManageUsers, canViewAllJobs, isMobileRole } from '@/lib/auth/role-routes';

interface PermissionGateProps {
  children: React.ReactNode;
  requires?: 'manage_users' | 'view_all_jobs' | 'manage_financials' | 'manage_marketing' | 'desktop_only' | 'mobile_only';
  allowedRoles?: Array<'owner' | 'admin' | 'dispatcher' | 'tech' | 'sales'>;
  fallback?: React.ReactNode; // Show this if permission denied
  showFallback?: boolean; // Show fallback vs hide completely
}

export function PermissionGate({
  children,
  requires,
  allowedRoles,
  fallback = null,
  showFallback = false
}: PermissionGateProps) {
  const { user } = useUser();

  if (!user) {
    return showFallback ? fallback : null;
  }

  // Check by specific permission
  if (requires) {
    let hasPermission = false;

    switch (requires) {
      case 'manage_users':
        hasPermission = canManageUsers(user.role);
        break;
      case 'view_all_jobs':
        hasPermission = canViewAllJobs(user.role);
        break;
      case 'manage_financials':
        hasPermission = ['owner', 'admin'].includes(user.role);
        break;
      case 'manage_marketing':
        hasPermission = ['owner', 'admin'].includes(user.role);
        break;
      case 'desktop_only':
        hasPermission = !isMobileRole(user.role);
        break;
      case 'mobile_only':
        hasPermission = isMobileRole(user.role);
        break;
    }

    if (!hasPermission) {
      return showFallback ? fallback : null;
    }
  }

  // Check by allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return showFallback ? fallback : null;
  }

  return <>{children}</>;
}
```

#### Usage Examples

**Example 1: Hide "Delete User" button from non-owners**

```tsx
<PermissionGate requires="manage_users">
  <Button onClick={deleteUser}>Delete User</Button>
</PermissionGate>
```

**Example 2: Show different content based on role**

```tsx
<PermissionGate
  allowedRoles={['owner', 'admin']}
  fallback={<p>You don't have access to financial data.</p>}
  showFallback={true}
>
  <RevenueDashboard />
</PermissionGate>
```

**Example 3: Desktop-only component**

```tsx
<PermissionGate requires="desktop_only">
  <CommandPalette /> {/* ⌘K palette only for desktop users */}
</PermissionGate>
```

**Example 4: Role-specific navigation items**

```tsx
// Sidebar navigation
<nav>
  <NavItem href="/inbox">Inbox</NavItem>
  <NavItem href="/jobs">Jobs</NavItem>
  <NavItem href="/contacts">Contacts</NavItem>

  <PermissionGate allowedRoles={['owner', 'admin', 'dispatcher']}>
    <NavItem href="/dispatch/map">Dispatch Map</NavItem>
  </PermissionGate>

  <PermissionGate allowedRoles={['owner', 'admin']}>
    <NavItem href="/analytics">Analytics</NavItem>
    <NavItem href="/finance">Finance</NavItem>
    <NavItem href="/marketing">Marketing</NavItem>
  </PermissionGate>

  <PermissionGate requires="manage_users">
    <NavItem href="/admin">Admin</NavItem>
  </PermissionGate>
</nav>
```

#### Permission Constants

Define all permissions in `/lib/auth/permissions.ts`:

```typescript
// lib/auth/permissions.ts

export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  CREATE_USERS: 'create_users',
  DELETE_USERS: 'delete_users',
  CHANGE_ROLES: 'change_roles',

  // Jobs
  VIEW_ALL_JOBS: 'view_all_jobs',
  CREATE_JOBS: 'create_jobs',
  ASSIGN_JOBS: 'assign_jobs',
  DELETE_JOBS: 'delete_jobs',
  COMPLETE_JOBS: 'complete_jobs',

  // Financials
  VIEW_FINANCIALS: 'view_financials',
  MANAGE_INVOICES: 'manage_invoices',
  MANAGE_PAYMENTS: 'manage_payments',

  // Marketing
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  MANAGE_TEMPLATES: 'manage_templates',

  // Admin
  MANAGE_INTEGRATIONS: 'manage_integrations',
  MANAGE_AUTOMATION: 'manage_automation',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Dispatch
  VIEW_DISPATCH_MAP: 'view_dispatch_map',
  ASSIGN_ON_MAP: 'assign_on_map',

  // Device-specific
  DESKTOP_ONLY: 'desktop_only',
  MOBILE_ONLY: 'mobile_only',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-Permission Matrix
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],
  admin: [
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.VIEW_ALL_JOBS,
    PERMISSIONS.CREATE_JOBS,
    PERMISSIONS.ASSIGN_JOBS,
    PERMISSIONS.COMPLETE_JOBS,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.MANAGE_INVOICES,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_AUTOMATION,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_DISPATCH_MAP,
    PERMISSIONS.ASSIGN_ON_MAP,
    PERMISSIONS.DESKTOP_ONLY,
  ],
  dispatcher: [
    PERMISSIONS.VIEW_ALL_JOBS,
    PERMISSIONS.CREATE_JOBS,
    PERMISSIONS.ASSIGN_JOBS,
    PERMISSIONS.VIEW_DISPATCH_MAP,
    PERMISSIONS.ASSIGN_ON_MAP,
    PERMISSIONS.DESKTOP_ONLY,
  ],
  tech: [
    PERMISSIONS.COMPLETE_JOBS,
    PERMISSIONS.MOBILE_ONLY,
  ],
  sales: [
    PERMISSIONS.CREATE_JOBS,
    PERMISSIONS.MOBILE_ONLY,
  ],
};

// Helper function to check permission
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}
```

#### Advanced Usage: Permission-Aware Hooks

```typescript
// lib/auth/usePermissions.ts

import { useUser } from './useUser';
import { hasPermission, Permission } from './permissions';

export function usePermissions() {
  const { user } = useUser();

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const canAny = (...permissions: Permission[]): boolean => {
    return permissions.some(permission => can(permission));
  };

  const canAll = (...permissions: Permission[]): boolean => {
    return permissions.every(permission => can(permission));
  };

  return { can, canAny, canAll };
}
```

**Usage in components:**

```tsx
function JobDetailModal({ job }) {
  const { can } = usePermissions();

  return (
    <Dialog>
      <DialogTitle>{job.title}</DialogTitle>
      <DialogContent>
        {/* Job details */}
      </DialogContent>
      <DialogFooter>
        {can(PERMISSIONS.ASSIGN_JOBS) && (
          <Button onClick={assignJob}>Assign Tech</Button>
        )}
        {can(PERMISSIONS.DELETE_JOBS) && (
          <Button variant="destructive" onClick={deleteJob}>Delete Job</Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
```

---

## Implementation Roadmap

### Overview

Phased implementation plan with priorities, dependencies, and estimated effort.

### Timeline: 12 Weeks (3 Months)

---

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Build critical missing components and permission infrastructure

#### Week 1: Permission System & Document Management

**Tasks:**
- [ ] Implement PermissionGate component
- [ ] Define all permissions in permissions.ts
- [ ] Update all existing components to use PermissionGate
- [ ] Build Document Management (Tech Photo Upload)
  - [ ] PhotoCaptureButton.tsx
  - [ ] PhotoCompressor.tsx
  - [ ] PhotoUploadQueue.tsx
  - [ ] Database: documents table
  - [ ] Supabase Storage bucket setup

**Deliverables:**
- ✅ Permission-aware component rendering
- ✅ Tech can upload job photos
- ✅ Photos compressed and uploaded to cloud

**Testing:**
- [ ] Verify components hidden for unauthorized roles
- [ ] Test photo upload on iOS and Android
- [ ] Test offline photo queue

---

#### Week 2: Estimates UI (Phase 3 Completion)

**Tasks:**
- [ ] EstimateBuilderDialog.tsx - Create/edit estimates
- [ ] EstimateListView.tsx - List estimates with filters
- [ ] EstimateDetailPanel.tsx - View estimate details
- [ ] EstimateStatusBadge.tsx - Visual status indicator
- [ ] PartsManagerDialog.tsx - Add materials to jobs
- [ ] Integrate with existing Phase 3 MCP tools

**Deliverables:**
- ✅ Sales can create estimates on mobile
- ✅ Office can manage estimates on desktop
- ✅ Estimate → Job conversion UI complete

**Testing:**
- [ ] Test estimate creation flow (Sales mobile)
- [ ] Test estimate approval and conversion to job
- [ ] Verify parts/materials sync with job

---

### Phase 2: Mobile Enhancement (Weeks 3-4)

**Goal:** Build mobile-first components for Tech and Sales

#### Week 3: Tech Mobile Components

**Tasks:**
- [ ] TechJobCard.tsx - Large job card with status
- [ ] JobPhotoGallery.tsx - View before/after photos
- [ ] QuickJobActions.tsx - Big button action bar
- [ ] MaterialsQuickAdd.tsx - Fast add materials
- [ ] VoiceNoteRecorder.tsx - Voice-to-text notes
- [ ] TimeClockCard.tsx - Clock in/out widget
- [ ] OfflineQueueIndicator.tsx - Show pending sync
- [ ] JobCompletionWizard.tsx - Step-by-step completion

**Deliverables:**
- ✅ Tech mobile experience fully optimized
- ✅ Offline-first PWA functionality complete
- ✅ Voice notes and photo capture polished

**Testing:**
- [ ] Test full job workflow (start → work → complete)
- [ ] Test offline mode (airplane mode)
- [ ] Test in bright sunlight (outdoor visibility)
- [ ] Test with gloves (touch targets)

---

#### Week 4: Sales Mobile Components

**Tasks:**
- [ ] AIBriefingCard.tsx - AI-generated meeting prep
- [ ] LeadPipelineView.tsx - Visual sales funnel
- [ ] LeadCard.tsx - Mobile lead card with status
- [ ] MeetingNoteCapture.tsx - Voice-to-text notes
- [ ] QuickEstimateBuilder.tsx - Simplified estimate form
- [ ] TalkingPointsList.tsx - AI-suggested talking points
- [ ] PricingSuggestions.tsx - AI-recommended pricing
- [ ] ContactHistorySummary.tsx - Past interactions
- [ ] MeetingSummaryAI.tsx - AI meeting recap
- [ ] FollowUpScheduler.tsx - Schedule next action

**Deliverables:**
- ✅ Sales mobile CRM complete
- ✅ AI briefing fully functional
- ✅ Quick estimate creation on mobile

**Testing:**
- [ ] Test AI briefing generation (API integration)
- [ ] Test meeting note capture (voice-to-text)
- [ ] Test estimate creation on mobile
- [ ] Verify contact history accuracy

---

### Phase 3: Core Features (Weeks 5-7)

**Goal:** Build notification system and document management

#### Week 5: Notification Center

**Tasks:**
- [ ] Database: notifications table
- [ ] WebSocket real-time notifications
- [ ] NotificationBell.tsx - Header icon with count
- [ ] NotificationPanel.tsx - Dropdown list
- [ ] NotificationItem.tsx - Individual notification
- [ ] NotificationToast.tsx - Real-time toast
- [ ] NotificationSettings.tsx - Configure preferences
- [ ] Implement notification triggers:
  - [ ] Job assigned → Tech
  - [ ] Tech unavailable → Dispatcher
  - [ ] Invoice overdue → Owner
  - [ ] Meeting reminder → Sales

**Deliverables:**
- ✅ Real-time notification system
- ✅ Role-specific notifications
- ✅ Configurable preferences

**Testing:**
- [ ] Test WebSocket real-time updates
- [ ] Test notification triggers
- [ ] Test unread count accuracy

---

#### Week 6: Document Management (Desktop)

**Tasks:**
- [ ] DocumentUploadDialog.tsx - Multi-file upload
- [ ] DocumentViewer.tsx - PDF preview
- [ ] DocumentList.tsx - List documents per job
- [ ] DocumentTypeIcon.tsx - File type indicators
- [ ] PhotoGallery.tsx - Before/after grid view
- [ ] DocumentDownloadButton.tsx - Download with progress

**Deliverables:**
- ✅ Office can upload estimates, contracts, invoices
- ✅ Office can view all job documents
- ✅ Document organization by type

**Testing:**
- [ ] Test multi-file upload
- [ ] Test PDF preview rendering
- [ ] Test document download

---

#### Week 7: Report Builder (Pre-Built Templates)

**Tasks:**
- [ ] ReportTemplateSelector.tsx - Template chooser
- [ ] Implement 5 pre-built report templates:
  - [ ] Revenue Report
  - [ ] Job Performance Report
  - [ ] Customer Report
  - [ ] Tech Performance Report
  - [ ] Financial Report
- [ ] ReportPreview.tsx - Live preview with charts
- [ ] ReportExportButton.tsx - Export to PDF/Excel
- [ ] Integrate Recharts for visualizations

**Deliverables:**
- ✅ Owner can generate 5 pre-built reports
- ✅ Reports exportable to PDF and Excel
- ✅ Visual charts (line, bar, pie)

**Testing:**
- [ ] Test each report template
- [ ] Test PDF generation
- [ ] Test Excel export
- [ ] Verify chart accuracy

---

### Phase 4: Settings & Onboarding (Weeks 8-10)

**Goal:** Improve user experience with settings and onboarding

#### Week 8: Settings Layouts

**Tasks:**
- [ ] SettingsLayout.tsx - Tab-based shell
- [ ] SettingsSection.tsx - Reusable card
- [ ] SettingsSidebar.tsx - Left nav
- [ ] ProfileSettings.tsx - Personal profile
- [ ] NotificationPreferences.tsx - Notification config
- [ ] AppearanceSettings.tsx - Theme, dark mode
- [ ] SecuritySettings.tsx - Password, 2FA

**Deliverables:**
- ✅ Centralized settings page
- ✅ All roles can configure profile
- ✅ Consistent settings UX

**Testing:**
- [ ] Test settings save/load
- [ ] Test role-based settings visibility

---

#### Week 9: Admin Settings Pages

**Tasks:**
- [ ] CompanySettings.tsx - Company info
- [ ] UserManagement.tsx - User list and roles
- [ ] IntegrationSettings.tsx - Third-party integrations
- [ ] AutomationSettings.tsx - Automation rules
- [ ] AIProviderSettings.tsx - LLM config

**Deliverables:**
- ✅ Owner can configure company settings
- ✅ Owner can manage users and roles
- ✅ Owner can configure integrations

**Testing:**
- [ ] Test user creation and role assignment
- [ ] Test integration OAuth flow
- [ ] Test automation rule creation

---

#### Week 10: Onboarding Wizard

**Tasks:**
- [ ] OnboardingWizard.tsx - Multi-step wizard
- [ ] OnboardingStep.tsx - Step component
- [ ] OnboardingProgress.tsx - Progress bar
- [ ] Database: user_onboarding_status table
- [ ] Implement Owner onboarding flow (7 steps)
- [ ] Implement Tech onboarding flow (5 steps)
- [ ] Implement Sales onboarding flow (5 steps)

**Deliverables:**
- ✅ New users guided through setup
- ✅ Role-specific onboarding flows
- ✅ Onboarding completion tracking

**Testing:**
- [ ] Test Owner onboarding end-to-end
- [ ] Test Tech mobile onboarding
- [ ] Test Sales mobile onboarding
- [ ] Test skip functionality

---

### Phase 5: Testing & Polish (Weeks 11-12)

**Goal:** Test all 78 untested components and polish UX

#### Week 11: Component Testing

**Tasks:**
- [ ] Test all 28 UI primitive components
- [ ] Test all 7 job components
- [ ] Test all 4 contact components
- [ ] Test all 3 marketing components
- [ ] Test all 3 conversation components
- [ ] Test all 3 admin components
- [ ] Document test results

**Deliverables:**
- ✅ 95%+ test coverage
- ✅ All critical paths verified
- ✅ Test documentation

**Testing:**
- [ ] Unit tests for utility functions
- [ ] Integration tests for API calls
- [ ] E2E tests for critical workflows

---

#### Week 12: UX Polish & Refinement

**Tasks:**
- [ ] Fix bugs identified in testing
- [ ] Improve loading states
- [ ] Improve error messages
- [ ] Add empty states for all lists
- [ ] Improve mobile responsiveness
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Performance optimization (lazy loading, code splitting)

**Deliverables:**
- ✅ Production-ready system
- ✅ All bugs fixed
- ✅ Accessibility compliant

**Testing:**
- [ ] Final QA pass
- [ ] User acceptance testing
- [ ] Performance testing (Lighthouse)

---

### Summary: 12-Week Roadmap

| Phase | Weeks | Focus | Deliverables |
|-------|-------|-------|-------------|
| **Phase 1** | 1-2 | Foundation | Permission system, Photo upload, Estimates UI |
| **Phase 2** | 3-4 | Mobile | Tech components, Sales components, AI briefing |
| **Phase 3** | 5-7 | Core Features | Notifications, Documents, Reports |
| **Phase 4** | 8-10 | UX Improvement | Settings, Onboarding, Admin tools |
| **Phase 5** | 11-12 | Testing & Polish | Test 78 components, Fix bugs, Optimize |

**Total Effort:** 12 weeks (3 months) with 1 full-time developer

**Alternative:** 6 weeks with 2 developers working in parallel

---

## Design System Guidelines

### Purpose
Ensure consistent UI/UX across all components and roles.

### Design Tokens

#### Colors

```css
/* From globals.css - Already defined */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%; /* Blue */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%; /* Red */
  --destructive-foreground: 210 40% 98%;
  --success: 142 76% 36%; /* Green */
  --warning: 38 92% 50%; /* Orange */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... */
}
```

#### Status Colors

```typescript
// Status color mapping
export const STATUS_COLORS = {
  // Job status
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  en_route: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',

  // Tech status
  idle: 'bg-green-500',
  on_job: 'bg-blue-500',
  offline: 'bg-gray-400',

  // Estimate status
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',

  // Notification severity
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white',
} as const;
```

#### Typography

```css
/* Font families */
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;

/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

#### Spacing

```css
/* Spacing scale (Tailwind default) */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

#### Touch Targets (Mobile)

```css
/* Minimum touch target sizes */
--touch-target-minimum: 44px;  /* WCAG AAA */
--touch-target-comfortable: 60px; /* For glove use */
--touch-target-large: 80px; /* Primary actions */
```

### Component Patterns

#### Button Variants

```tsx
// Desktop buttons (normal size)
<Button variant="default">Default</Button>
<Button variant="primary">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>

// Mobile buttons (large touch targets)
<BigButton variant="primary" icon={<Check />} label="Start Job" />
<BigButton variant="success" icon={<Check />} label="Complete" />
<BigButton variant="warning" icon={<AlertCircle />} label="Report Issue" />
<BigButton variant="danger" icon={<X />} label="Cancel Job" />
```

#### Card Patterns

```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Job #1234</CardTitle>
    <CardDescription>Kitchen Sink Repair</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>

// Mobile job card (large, glanceable)
<TechJobCard
  job={job}
  onNavigate={handleNavigate}
  onStart={handleStart}
  onComplete={handleComplete}
/>
```

#### Status Badges

```tsx
// Job status
<StatusBadge status="scheduled">Scheduled</StatusBadge>
<StatusBadge status="in_progress">In Progress</StatusBadge>
<StatusBadge status="completed">Completed</StatusBadge>

// Estimate status
<EstimateStatusBadge status="draft">Draft</EstimateStatusBadge>
<EstimateStatusBadge status="sent">Sent</EstimateStatusBadge>
<EstimateStatusBadge status="accepted">Accepted</EstimateStatusBadge>
```

#### Empty States

```tsx
<EmptyState
  icon={<Inbox />}
  title="No jobs yet"
  description="Create your first job to get started"
  action={
    <Button onClick={handleCreateJob}>
      Create Job
    </Button>
  }
/>
```

#### Loading States

```tsx
// Skeleton loading
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>

// Spinner loading
<LoadingSpinner size="lg" />
```

### Role-Specific Design Guidelines

#### Desktop (Owner, Admin, Dispatcher)

**Layout:**
- Sidebar navigation (always visible)
- Multi-column layouts
- Dense information display
- Keyboard shortcuts

**Interaction:**
- Hover states for tooltips
- Right-click context menus
- Drag-and-drop
- Keyboard navigation (Tab, Enter, Esc)

**Typography:**
- Base font size: 14px
- Comfortable for extended reading

**Spacing:**
- Tighter spacing (4px, 8px, 12px)
- More content per screen

---

#### Mobile (Tech, Sales)

**Layout:**
- Bottom navigation bar
- Single-column layouts
- Large, glanceable information
- Thumb-zone optimization

**Interaction:**
- Large touch targets (60px+)
- Swipe gestures
- One-tap actions
- Voice input

**Typography:**
- Base font size: 16px (prevent zoom on iOS)
- Large headings for outdoor visibility

**Spacing:**
- Generous spacing (16px, 24px, 32px)
- Less content per screen

**Colors:**
- High contrast for sunlight readability
- Bold status indicators

---

### Accessibility Guidelines

#### WCAG AAA Compliance

**Color Contrast:**
- Text: 7:1 minimum contrast ratio
- Large text (18px+): 4.5:1 minimum
- UI controls: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip links for navigation

**Screen Reader Support:**
- Semantic HTML (button, nav, main, aside)
- ARIA labels for icons
- ARIA live regions for dynamic content
- Alt text for images

**Touch Targets:**
- Minimum 44x44px (WCAG AAA)
- Comfortable spacing between targets
- No overlapping tap areas

#### Implementation

```tsx
// Good: Semantic button with ARIA label
<button
  aria-label="Delete job"
  onClick={handleDelete}
  className="min-h-[44px] min-w-[44px]"
>
  <Trash className="h-5 w-5" />
</button>

// Good: Focus visible
<Button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Submit
</Button>

// Good: Live region for dynamic updates
<div aria-live="polite" aria-atomic="true">
  {notifications.length} new notifications
</div>
```

---

## Testing & Validation Strategy

### Testing Pyramid

```
           /\
          /  \  E2E Tests (10%)
         /____\
        /      \  Integration Tests (30%)
       /________\
      /          \  Unit Tests (60%)
     /____________\
```

### Unit Tests (60% of tests)

**Scope:** Individual functions, hooks, utilities

**Tools:**
- Jest
- React Testing Library
- MSW (Mock Service Worker) for API mocking

**Examples:**

```typescript
// Test permission helper
describe('hasPermission', () => {
  it('should return true for owner with any permission', () => {
    expect(hasPermission('owner', PERMISSIONS.MANAGE_USERS)).toBe(true);
    expect(hasPermission('owner', PERMISSIONS.DELETE_JOBS)).toBe(true);
  });

  it('should return false for tech with manage_users', () => {
    expect(hasPermission('tech', PERMISSIONS.MANAGE_USERS)).toBe(false);
  });
});

// Test component rendering
describe('StatusBadge', () => {
  it('should render correct color for job status', () => {
    const { container } = render(<StatusBadge status="completed">Completed</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });
});
```

**Coverage Target:** 80%+ for utility functions and hooks

---

### Integration Tests (30% of tests)

**Scope:** Component integration with API, state management

**Tools:**
- React Testing Library
- MSW for API mocking
- Testing Library User Events

**Examples:**

```typescript
// Test job creation flow
describe('CreateJobDialog', () => {
  it('should create job and close dialog on submit', async () => {
    const { user } = renderWithAuth(<CreateJobDialog open={true} />, { role: 'admin' });

    await user.type(screen.getByLabelText('Customer Name'), 'John Smith');
    await user.type(screen.getByLabelText('Job Description'), 'Kitchen repair');
    await user.click(screen.getByRole('button', { name: 'Create Job' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
```

**Coverage Target:** 70%+ for component interactions

---

### E2E Tests (10% of tests)

**Scope:** Critical user workflows end-to-end

**Tools:**
- Playwright or Cypress

**Critical Workflows to Test:**

1. **Owner: Create Job and Assign Tech**
   - Login as owner
   - Navigate to Jobs
   - Create new job
   - Assign tech
   - Verify job appears in tech's list

2. **Tech: Complete Job Workflow**
   - Login as tech (mobile)
   - View today's jobs
   - Start job
   - Take photos
   - Add notes
   - Get signature
   - Mark complete
   - Verify job status updated

3. **Sales: Create Estimate Workflow**
   - Login as sales (mobile)
   - View AI briefing
   - Create estimate
   - Send to customer
   - Verify estimate created

4. **Dispatcher: Assign Job on Map**
   - Login as dispatcher
   - Open dispatch map
   - Drag job onto tech
   - Verify job assigned

**Coverage Target:** Cover all critical paths (20-30 tests)

---

### Testing Checklist (78 Untested Components)

#### UI Components (26 remaining)
- [ ] input, select, textarea
- [ ] checkbox, label
- [ ] dialog, sheet, alert-dialog
- [ ] card, badge, avatar
- [ ] table, tabs
- [ ] dropdown-menu, context-menu
- [ ] toast, toaster
- [ ] separator, scroll-area
- [ ] skeleton, tooltip
- [ ] theme-toggle
- [ ] keyboard-shortcuts-help
- [ ] bulk-action-toolbar
- [ ] smart-suggestions
- [ ] floating-action-button

#### Jobs Components (6 remaining)
- [ ] create-job-dialog
- [ ] job-detail-modal
- [ ] job-context-menu
- [ ] bulk-assign-dialog
- [ ] materials-dialog
- [ ] generate-invoice-dialog

#### Other Categories (46 remaining)
- [ ] All contacts components (4)
- [ ] All marketing components (3)
- [ ] All integrations components (2)
- [ ] All conversations components (3)
- [ ] All calendar components (1)
- [ ] All templates components (1)
- [ ] All dashboard components (3)
- [ ] All inbox components (1)
- [ ] All admin components (3)
- [ ] All export components (1)
- [ ] All search components (2)
- [ ] All filters components (2)
- [ ] Layout components (5 remaining)
- [ ] Voice agent overlay (1 remaining)
- [ ] Dispatch components (2 remaining)
- [ ] All core components (5)

---

### Manual Testing Checklist

#### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile Device Testing
- [ ] iOS Safari (iPhone 12+)
- [ ] Chrome Mobile (Android 10+)
- [ ] Test in landscape and portrait
- [ ] Test offline mode (airplane mode)

#### Accessibility Testing
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader (NVDA, VoiceOver)
- [ ] High contrast mode
- [ ] 200% zoom level

#### Performance Testing
- [ ] Lighthouse score (90+ performance)
- [ ] Bundle size analysis
- [ ] Lazy loading verification
- [ ] WebSocket connection stability

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### Development Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| **Component Test Coverage** | 15% | 95% | 12 weeks |
| **Production Readiness** | 60% | 100% | 12 weeks |
| **Missing Components** | 50 | 0 | 12 weeks |
| **Bug Count (Critical)** | Unknown | 0 | 12 weeks |
| **Lighthouse Performance** | Unknown | 90+ | 12 weeks |

#### User Experience Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time to Complete Job (Tech)** | <5 minutes | Track from "Start" to "Complete" |
| **Time to Create Estimate (Sales)** | <3 minutes | Track from open dialog to submit |
| **Time to Assign Job (Dispatcher)** | <30 seconds | Track from drag to confirm |
| **User Onboarding Completion Rate** | >80% | Track wizard completion |
| **Daily Active Users (Tech)** | >90% | Track login frequency |
| **Mobile Offline Success Rate** | >95% | Track sync failures |

#### Business Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Jobs Completed per Day** | +20% | Compare before/after mobile improvements |
| **Estimate Conversion Rate** | >40% | Track accepted estimates ÷ total estimates |
| **Customer Response Time** | <2 hours | Track time from message to reply |
| **Invoice Payment Time** | <30 days | Track invoice date to payment date |

---

### Monitoring & Analytics

#### Application Monitoring

**Tools:**
- **Sentry:** Error tracking and performance monitoring
- **Vercel Analytics:** Page load times, Core Web Vitals
- **PostHog:** User behavior analytics

**What to Track:**
- API error rates (target: <1%)
- Page load times (target: <2 seconds)
- Component render times
- WebSocket connection stability
- Database query performance

#### User Analytics

**What to Track:**
- Most-used features by role
- Feature adoption rates
- User session duration
- Page navigation patterns
- Drop-off points in workflows

---

## Appendix

### A. Related Documentation

- **Phase 1 Summary:** `PHASE_1_COMPLETION_SUMMARY.md`
- **Phase 2 Summary:** `PHASE_2_COMPLETION_SUMMARY.md`
- **Phase 3 Summary:** `PHASE_3_COMPLETION_SUMMARY.md`
- **Components Report:** `COMPONENTS_INSPECTION_REPORT.md`
- **UI/UX Role Flows:** `UI_UX_ROLE_FLOWS.md`
- **Role Routes:** `/lib/auth/role-routes.ts`
- **Database Schema:** `supabase/mobile-pwa-ACTUAL-schema.sql`

### B. Component Gap Analysis Summary

**Total Components Needed:** 142
- **Existing:** 92 (60% verified, 78 need testing)
- **Missing:** 50 (35% of total)

**Priority Breakdown:**
- **Critical (Build Immediately):** 20 components
- **High (Build Soon):** 15 components
- **Medium (Nice to Have):** 10 components
- **Low (Future):** 5 components

### C. Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix UI)
- Recharts (charts/graphs)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Next.js API Routes
- MCP Tools (Claude Code SDK)
- ElevenLabs Conversational AI

**Mobile:**
- Progressive Web App (PWA)
- Service Workers (offline)
- Native APIs (Camera, GPS, Contacts)

**Testing:**
- Jest + React Testing Library
- Playwright (E2E)
- MSW (API mocking)

**Deployment:**
- Vercel (frontend)
- Supabase (backend)
- GitHub Actions (CI/CD)

### D. Glossary

**MCP:** Model Context Protocol - SDK for building AI agent tools
**PWA:** Progressive Web App - Installable mobile web app
**RLS:** Row-Level Security - Database security policy
**shadcn/ui:** Component library built on Radix UI
**WebSocket:** Real-time bidirectional communication protocol
**COT:** Chain of Thought - Reasoning methodology

---

## Document Control

**Version:** 1.0
**Date:** 2025-11-27
**Author:** Claude Code Agent
**Approved By:** [Pending]
**Next Review:** [Upon Phase 1 completion]

**Change Log:**
- v1.0 (2025-11-27): Initial strategic roadmap created

---

**END OF UI/UX STRATEGIC ROADMAP**
