# Component & Architecture Reference

**Version:** 1.0
**Last Updated:** November 28, 2025
**Status:** ✅ PRODUCTION READY
**Domain:** Complete Codebase Inventory

---

## Overview

This document provides a comprehensive inventory of all components, routes, API endpoints, and utilities in the CRM-AI Pro platform.

**Consolidates:**
- All React components (120+) organized by domain
- Page routes (Desktop: 30+, Mobile: 15+)
- API endpoints (165 across 56 feature areas)
- Library utilities (90+ files)
- Custom hooks (5)
- Type definitions (17 files)

**Use Cases:**
- Component discovery and reuse
- Understanding application architecture
- API endpoint reference
- Developer onboarding

---

## Architecture Overview

```
CRM-AI-PRO/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Desktop dashboard routes
│   ├── m/                 # Mobile-optimized routes
│   └── api/               # API routes (165 endpoints)
├── components/            # React components (120+)
│   ├── ui/               # Base UI primitives
│   ├── mobile/           # Mobile-specific components
│   └── [domain]/         # Domain-specific components
├── hooks/                 # Custom React hooks (5)
├── lib/                   # Utilities and services (90+ files)
│   ├── llm/              # LLM integration layer
│   ├── supabase/         # Database clients
│   ├── offline/          # Offline sync
│   └── auth/             # RBAC permissions
├── types/                 # TypeScript definitions (17 files)
├── tests/                 # Test suites
│   ├── api/              # API tests (Vitest)
│   └── ui/               # UI tests (Playwright)
├── docker/               # Docker configuration
└── mcp-server/           # MCP server for AI tools
```

---

## UI Components

### Location: `components/`

### 1. Base UI Components (`components/ui/`)

| Component | File | Purpose | Key Features |
|-----------|------|---------|--------------|
| Button | `button.tsx` | Styled button | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` variants |
| Card | `card.tsx` | Container component | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `StatCard` |
| Avatar | `avatar.tsx` | User profile picture | Image fallback, border styling, multiple sizes |
| Badge | `badge.tsx` | Status/tag labels | Color variants, accessible markup |
| Input | `input.tsx` | Text input field | Focus states, placeholder, file upload support |
| Select | `select.tsx` | Dropdown selector | Radix-based, keyboard navigation, group support |
| Dialog | `dialog.tsx` | Modal dialog | Overlay, portal, animation, header/footer helpers |
| Table | `table.tsx` | Data table | Responsive wrapper, row/cell components |
| Command Palette | `command-palette.tsx` | Global search | Keyboard nav, grouped actions, filtering, history |
| Bulk Action Toolbar | `bulk-action-toolbar.tsx` | Multi-select actions | Fixed bottom, selection count, destructive actions |
| Alert Dialog | `alert-dialog.tsx` | Confirmation dialog | Radix-based, dismissible |
| Toast/Toaster | `toast.tsx`, `toaster.tsx` | Notifications | Multiple toasts, auto-dismiss |
| Theme Toggle | `theme-toggle.tsx` | Dark/Light mode | Theme persistence |
| Floating Action Button | `floating-action-button.tsx` | Mobile action | Custom actions, mobile optimized |
| Checkbox | `checkbox.tsx` | Form checkbox | Radix-based |
| Separator | `separator.tsx` | Divider line | Radix-based |
| Tabs | `tabs.tsx` | Tab navigation | Radix-based |
| Scroll Area | `scroll-area.tsx` | Scrollable container | Radix-based |
| Dropdown Menu | `dropdown-menu.tsx` | Context menu | Radix-based |
| Progress | `progress.tsx` | Progress bar | Linear progress |
| Label | `label.tsx` | Form label | Accessible markup |
| Alert | `alert.tsx` | Alert message | Severity indicators |
| Textarea | `textarea.tsx` | Multi-line input | Resizable |
| Tooltip | `tooltip.tsx` | Hover tooltip | Radix-based |
| Sheet | `sheet.tsx` | Slide-out panel | Mobile drawer |
| Skeleton | `skeleton.tsx` | Loading placeholder | Animation |
| Context Menu | `context-menu.tsx` | Right-click menu | Radix-based |
| Places Autocomplete | `places-autocomplete.tsx` | Address autocomplete | Google Places integration |

---

### 2. Layout Components (`components/layout/`)

| Component | File | Purpose |
|-----------|------|---------|
| App Shell | `app-shell.tsx` | Main application wrapper with sidebar |
| Sidebar Navigation | `sidebar-nav.tsx` | Primary navigation with role-based visibility |
| Contacts Layout | `contacts-layout.tsx` | Sidebar + list + detail view |
| Jobs Layout | `jobs-layout.tsx` | Job management layout |
| Inbox Layout | `inbox-layout.tsx` | Conversation list + message view |
| Analytics Layout | `analytics-layout.tsx` | Dashboard-specific layout |

---

### 3. Admin Components (`components/admin/`)

| Component | File | Purpose |
|-----------|------|---------|
| User Dialog | `user-dialog.tsx` | Create/edit user accounts with role selection |
| Automation Rule Dialog | `automation-rule-dialog.tsx` | Workflow automation setup |
| LLM Provider Dialog | `llm-provider-dialog.tsx` | AI model configuration |
| Admin Error Boundary | `admin-error-boundary.tsx` | Admin-specific error handling |

---

### 4. Calendar Components (`components/calendar/`)

| Component | File | Purpose |
|-----------|------|---------|
| Calendar View | `calendar-view.tsx` | Interactive month/week calendar with React Query |
| Create Event Dialog | `create-event-dialog.tsx` | Add new calendar event |

---

### 5. Contacts Components (`components/contacts/`)

| Component | File | Purpose |
|-----------|------|---------|
| Add Contact Dialog | `add-contact-dialog.tsx` | Create new contact with Places autocomplete |
| Contact Detail Modal | `contact-detail-modal.tsx` | View/edit contact details |
| Contact Context Menu | `contact-context-menu.tsx` | Right-click actions |
| Contacts Filter Dialog | `contacts-filter-dialog.tsx` | Advanced contact search |

---

### 6. Dispatch Components (`components/dispatch/`) - **Core Feature**

| Component | File | Purpose | Key Features |
|-----------|------|---------|--------------|
| Tech List Sidebar | `TechListSidebar.tsx` | Filterable tech list | Search, status filter, sort, mobile collapsible |
| Assign Tech Dialog | `AssignTechDialog.tsx` | Assign job to tech | Route optimization, ETA calculation |
| Dispatch Stats | `DispatchStats.tsx` | KPI dashboard | Charts (Recharts), PDF export, time range filtering |
| Job Detail Panel | `JobDetailPanel.tsx` | Job information | Full details, status updates |
| Tech Detail Panel | `TechDetailPanel.tsx` | Tech profile | Real-time location, performance metrics |
| Map Controls | `MapControls.tsx` | Google Maps controls | Zoom/pan, layer toggles, traffic/heatmap |
| Job Selection Dialog | `JobSelectionDialog.tsx` | Job selection | Filtering |
| Historical Playback | `HistoricalPlayback.tsx` | Replay movements | Timeline scrubbing, speed control |

---

### 7. Documents & Photos (`components/documents/`)

| Component | File | Purpose |
|-----------|------|---------|
| Document Upload Dialog | `DocumentUploadDialog.tsx` | Multi-file upload with drag-and-drop |
| Document Viewer | `DocumentViewer.tsx` | PDF preview, image gallery |
| Photo Gallery | `PhotoGallery.tsx` | Photo grid with lightbox |
| Photo Capture Button | `PhotoCaptureButton.tsx` | Camera for mobile |
| Photo Upload Queue | `PhotoUploadQueue.tsx` | Offline support, batch upload |

---

### 8. Estimates Components (`components/estimates/`)

| Component | File | Purpose |
|-----------|------|---------|
| Estimate Builder Dialog | `EstimateBuilderDialog.tsx` | Create/edit estimates with Zod validation |
| Estimate Detail Panel | `EstimateDetailPanel.tsx` | View estimate details |
| Estimate List View | `EstimateListView.tsx` | List with filtering and export |

---

### 9. Jobs Components (`components/jobs/`) - **Core Feature**

| Component | File | Purpose |
|-----------|------|---------|
| Create Job Dialog | `create-job-dialog.tsx` | New job form with contact selection |
| Job Detail Modal | `job-detail-modal.tsx` | Complete job view |
| Job Context Menu | `job-context-menu.tsx` | Right-click actions |
| Generate Invoice Dialog | `generate-invoice-dialog.tsx` | Invoice creation from job |
| Materials Dialog | `materials-dialog.tsx` | Material/parts selection |
| Signature Capture | `signature-capture.tsx` | Digital signature pad |
| Bulk Assign Dialog | `bulk-assign-dialog.tsx` | Multi-job assignment |

---

### 10. Marketing Components (`components/marketing/`)

| Component | File | Purpose |
|-----------|------|---------|
| Campaign Editor Dialog | `campaign-editor-dialog.tsx` | Email campaign creation |
| Email Template Dialog | `email-template-dialog.tsx` | WYSIWYG template editor |
| Tag Selector | `tag-selector.tsx` | Tag selection for segmentation |

---

### 11. Mobile Components (`components/mobile/`)

| Component | File | Purpose |
|-----------|------|---------|
| Voice Button | `voice-button.tsx` | Voice command activation with pulse animation |
| Big Button | `big-button.tsx` | Large touch-optimized button |
| Bottom Navigation | `bottom-nav.tsx` | Mobile tab navigation |

---

### 12. Notifications Components (`components/notifications/`)

| Component | File | Purpose |
|-----------|------|---------|
| Notification Bell | `NotificationBell.tsx` | Icon with unread badge |
| Notification Panel | `NotificationPanel.tsx` | Dropdown list with filtering |
| Notification Item | `NotificationItem.tsx` | Single notification display |
| Notification Toast | `NotificationToast.tsx` | Auto-dismiss popup |

---

### 13. Onboarding Components (`components/onboarding/`)

| Component | File | Purpose |
|-----------|------|---------|
| Onboarding Wizard | `OnboardingWizard.tsx` | Multi-step guided flow with confetti |
| Onboarding Progress | `OnboardingProgress.tsx` | Progress indicator |
| Onboarding Step | `OnboardingStep.tsx` | Individual step component |
| Onboarding Tooltip | `OnboardingTooltip.tsx` | Contextual help |
| Onboarding Checklist | `OnboardingChecklist.tsx` | Task completion tracking |

---

### 14. Reports Components (`components/reports/`)

| Component | File | Purpose |
|-----------|------|---------|
| Report Builder Dialog | `ReportBuilderDialog.tsx` | Custom report creation |
| Report Export Button | `ReportExportButton.tsx` | PDF/CSV export |
| Report Filter Panel | `ReportFilterPanel.tsx` | Date/category filtering |
| Report Preview | `ReportPreview.tsx` | Charts and tables visualization |
| Report Template Selector | `ReportTemplateSelector.tsx` | Pre-built templates |

---

### 15. Sales Components (`components/sales/`) - **AI-Powered**

| Component | File | Purpose | Key Features |
|-----------|------|---------|--------------|
| AI Briefing Card | `AIBriefingCard.tsx` | **AI meeting prep** | Contact history, talking points, pricing suggestions |
| Lead Card | `LeadCard.tsx` | Lead information | Quick info, status, actions |
| Lead Pipeline View | `LeadPipelineView.tsx` | Kanban pipeline | Drag-drop, status stages |
| Meeting Note Capture | `MeetingNoteCapture.tsx` | Real-time notes | Dictation support |
| Meeting Summary AI | `MeetingSummaryAI.tsx` | **AI summary** | Transcription, key points, action items |
| Quick Estimate Builder | `QuickEstimateBuilder.tsx` | Fast estimates | Template-based |
| Pricing Suggestions | `PricingSuggestions.tsx` | **AI pricing** | Historical data analysis |
| Talking Points List | `TalkingPointsList.tsx` | Conversation starters | Customer context |
| Contact History Summary | `ContactHistorySummary.tsx` | Interaction history | Timeline view |

---

### 16. Tech/Field Components (`components/tech/`) - **Role-Specific**

| Component | File | Purpose | Key Features |
|-----------|------|---------|--------------|
| Job Completion Wizard | `JobCompletionWizard.tsx` | 5-step job closure | Photos, notes, materials, signature, sync |
| Tech Job Card | `TechJobCard.tsx` | Job card display | Status, quick actions, timer |
| Time Tracker | `time-tracker.tsx` | Work hours | Start/stop, break tracking |
| Time Clock Card | `TimeClockCard.tsx` | Clock in/out | Visual timer |
| Location Tracker | `location-tracker.tsx` | GPS tracking | Real-time, geofencing |
| Job Photo Gallery | `JobPhotoGallery.tsx` | Before/after photos | Gallery grid |
| Materials Quick Add | `MaterialsQuickAdd.tsx` | Fast material logging | Search, quantity |
| Quick Job Actions | `QuickJobActions.tsx` | Common buttons | Start, pause, complete |
| Voice Note Recorder | `VoiceNoteRecorder.tsx` | Audio notes | Transcription |
| Offline Queue Indicator | `OfflineQueueIndicator.tsx` | Sync status | Queue count, retry |

---

### 17. Voice & Navigation Components

| Component | File | Purpose |
|-----------|------|---------|
| Voice Agent Widget | `voice-agent/voice-agent-widget.tsx` | AI assistant interface |
| Voice Agent Overlay | `voice-agent-overlay.tsx` | Full-screen voice mode |
| Voice Navigation Bridge | `voice-navigation-bridge.tsx` | Voice command routing |
| Voice Conversation Provider | `voice-conversation-provider.tsx` | Voice context provider |

---

## Page Components (Routes)

### Location: `app/`

### 1. Authentication

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Entry point with loading screen |
| `/login` | `app/(auth)/login/page.tsx` | Email/password auth with role-based routing |

---

### 2. Desktop Dashboard Routes (`app/(dashboard)/`)

| Route | File | Purpose |
|-------|------|---------|
| `/inbox` | `inbox/page.tsx` | **Primary landing** - Universal communication hub |
| `/contacts` | `contacts/page.tsx` | Contact database with search, filter, bulk ops |
| `/jobs` | `jobs/page.tsx` | Job queue and status management |
| `/calendar` | `calendar/page.tsx` | Event scheduling and visualization |
| `/analytics` | `analytics/page.tsx` | Business analytics |
| `/estimates` | `estimates/page.tsx` | Service estimate management |
| `/estimates/[id]` | `estimates/[id]/page.tsx` | Individual estimate details |
| `/dispatch/map` | `dispatch/map/page.tsx` | **Real-time GPS tracking and assignment** |
| `/parts` | `parts/page.tsx` | Inventory management |
| `/reports` | `reports/page.tsx` | Custom and standard reports |

---

### 3. Role-Specific Desktop Routes

| Route | Role | Purpose |
|-------|------|---------|
| `/sales/dashboard` | Sales | Meetings, leads overview |
| `/tech/dashboard` | Tech | Today's jobs, quick stats |
| `/office/dashboard` | Dispatcher | Redirects to dispatch map |
| `/owner/dashboard` | Owner | Redirects to inbox |
| `/finance/dashboard` | All | Revenue metrics, outstanding invoices |
| `/finance/payments` | All | Payment processing |

---

### 4. Admin Routes (`app/(dashboard)/admin/`)

| Route | Purpose |
|-------|---------|
| `/admin/users` | User account administration |
| `/admin/settings` | Core configuration (business hours, branding) |
| `/admin/settings/ai` | AI/LLM provider configuration |
| `/admin/settings/automation` | Workflow automation rules |
| `/admin/settings/company` | Company information |
| `/admin/audit` | System audit trail |
| `/admin/automation` | Automation rule management |
| `/admin/llm-providers` | LLM provider list |

---

### 5. Marketing Routes

| Route | Purpose |
|-------|---------|
| `/marketing/campaigns` | Campaign management |
| `/marketing/campaigns/[id]` | Campaign editing and analytics |
| `/marketing/email-templates` | Template library |
| `/marketing/tags` | Tag management |

---

### 6. Settings Routes

| Route | Purpose |
|-------|---------|
| `/settings/profile` | User profile |
| `/settings/notifications` | Notification preferences |
| `/settings/integrations` | Third-party integrations |

---

### 7. Mobile Routes (`app/m/`)

#### Sales Mobile

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/m/sales/dashboard` | Sales rep dashboard | Greeting, next meeting, quick actions |
| `/m/sales/briefing/[contactId]` | **Pre-meeting intelligence** | Contact value, issues, history, talking points |
| `/m/sales/meeting/[id]` | Meeting recording | Audio capture, notes |
| `/m/sales/leads` | Leads management | Pipeline view |
| `/m/sales/profile` | Sales profile | Settings |

#### Tech Mobile

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/m/tech/dashboard` | Tech job management | Current job, today's schedule |
| `/m/tech/job/[id]` | **8-Stage Job Workflow** | Arrival, photos, work, satisfaction, review request, signature, done |
| `/m/tech/map` | GPS map | Navigation |
| `/m/tech/profile` | Tech profile | Settings |

**8-Stage Gate System:**
1. Arrival - GPS logging
2. Before Photos - Work area documentation
3. Work Complete - Confirmation
4. After Photos - Completed work documentation
5. Satisfaction Rating - 1-5 stars (escalates 1-3)
6. Review Request - Optional 5% discount
7. Signature - Digital customer signature
8. Done - Job completion

#### Owner Mobile

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/m/owner/dashboard` | Business overview | Revenue, ratings, team status, jobs progress |
| `/m/owner/reports` | Analytics | Mobile reporting |

#### Office Mobile

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/m/office/dashboard` | Escalation management | Queue, call log, SMS, team status |

---

## API Routes

### Location: `app/api/`
### Total: **165 endpoints across 56 feature areas**

### 1. Authentication (3 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/session` | GET | Retrieve current session |
| `/api/auth/signout` | POST | Sign out user |
| `/api/auth/callback` | GET | OAuth callback handler |

### 2. User Management (2 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/users` | GET, POST | List/create users (admin only) |
| `/api/users/[id]` | GET, PATCH, DELETE | CRUD operations |

### 3. Contacts Management (6 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/contacts/[id]` | GET, PATCH | Get/update contact |
| `/api/contacts/[id]/notes` | GET, POST | Contact notes |
| `/api/contacts/[id]/tags` | GET, POST | Tag management |
| `/api/contacts/[id]/tags/[tagId]` | DELETE | Remove tag |
| `/api/contacts/bulk` | POST | Bulk operations |
| `/api/contacts/bulk-tag` | POST | Bulk tag assignment |

### 4. Jobs Management (7 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/jobs/[id]` | GET, PATCH, DELETE | Job CRUD |
| `/api/jobs/[id]/assign` | PATCH | Assign tech (edge function) |
| `/api/jobs/[id]/location` | PATCH | Update location |
| `/api/jobs/[id]/upload-photo` | POST | Photo upload |
| `/api/jobs/bulk` | POST | Bulk operations |
| `/api/tech/jobs` | GET | Tech's assigned jobs |
| `/api/tech/jobs/[id]/status` | PATCH | Update job status |

### 5. Invoices & Payments (7 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/invoices` | GET, POST | Invoice management |
| `/api/invoices/[id]` | GET, PATCH, DELETE | Invoice CRUD |
| `/api/invoices/[id]/send` | POST | Email invoice (Resend) |
| `/api/invoices/[id]/mark-paid` | POST | Mark as paid |
| `/api/payments` | GET, POST | Payment management |
| `/api/payments/[id]` | GET, PATCH | Payment CRUD |
| `/api/finance/stats` | GET | Financial KPIs |

### 6. Conversations & Messaging (5 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/conversations` | GET, POST | Conversation list/create |
| `/api/conversations/[id]` | GET, PATCH | Conversation details |
| `/api/conversations/[id]/messages` | GET, POST | Messages |
| `/api/conversations/[id]/notes` | GET, POST | Internal notes |
| `/api/send-message` | POST | Send email/SMS |

### 7. Email Integrations (6 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/integrations/gmail/authorize` | GET | Gmail OAuth URL |
| `/api/integrations/gmail/callback` | GET | Gmail callback |
| `/api/integrations/gmail/send` | POST | Send via Gmail |
| `/api/integrations/gmail/status` | GET | Gmail status |
| `/api/integrations/microsoft/authorize` | GET | Microsoft OAuth |
| `/api/integrations/microsoft/callback` | GET | Microsoft callback |

### 8. AI & LLM Features (8 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/llm/route` | POST | Multi-model LLM router |
| `/api/llm/health` | GET | Provider health check |
| `/api/llm/metrics` | GET | Usage metrics |
| `/api/ai/briefing` | POST | **AI sales briefing** |
| `/api/ai/draft` | POST | **AI email draft with RAG** |
| `/api/ai/suggestions` | GET | AI suggestions |
| `/api/ai/pricing` | GET | **AI pricing recommendations** |
| `/api/ai/meeting-summary` | POST | **AI meeting summary** |

### 9. Campaigns (7 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/campaigns` | GET, POST | Campaign management |
| `/api/campaigns/[id]` | GET, PATCH, DELETE | Campaign CRUD |
| `/api/campaigns/[id]/send` | POST | Send campaign |
| `/api/campaigns/[id]/pause` | POST | Pause campaign |
| `/api/campaigns/[id]/resume` | POST | Resume campaign |
| `/api/campaigns/[id]/recipients` | GET, POST | Recipients |
| `/api/campaigns/[id]/recipients/[contactId]` | DELETE | Remove recipient |

### 10. Meetings (2 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/meetings` | GET, POST | Meeting management |
| `/api/meetings/[id]` | GET, PATCH, DELETE | Meeting CRUD with AI analysis |

### 11. Analytics & Reports (6 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/analytics/dashboard` | GET | Dashboard metrics |
| `/api/analytics/jobs` | GET | Job analytics |
| `/api/analytics/contacts` | GET | Contact analytics |
| `/api/analytics/revenue` | GET | Revenue analytics |
| `/api/reports` | GET, POST | Report generation |
| `/api/finance/stats` | GET | Finance statistics |

### 12. Role-Based Dashboards (4 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/office/stats` | GET | Office manager stats |
| `/api/office/clearances` | GET, POST | Background clearances |
| `/api/sales/briefing/[contactId]` | GET | **Sales briefing** |
| `/api/owner/stats` | GET | Owner KPIs |

### 13. Webhooks (2 routes)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/webhooks/stripe` | POST | Stripe payment webhooks |
| `/api/webhooks/elevenlabs` | POST | Voice webhooks |

### Additional API Categories

- **Calendar**: `/api/calendar/events`, `/api/calendar/sync`
- **Email Templates**: `/api/email-templates`, `/api/email-templates/[id]`, `/api/email-templates/[id]/preview`
- **Contact Tags**: `/api/contact-tags`, `/api/contact-tags/[id]`
- **Call Logs**: `/api/call-logs`, `/api/call-logs/[id]`
- **Job Photos**: `/api/job-photos`, `/api/job-photos/[id]`
- **Job Materials**: `/api/job-materials`, `/api/job-materials/[id]`
- **Automation Rules**: `/api/automation-rules`, `/api/automation-rules/[id]`
- **LLM Providers**: `/api/llm-providers`, `/api/llm-providers/[id]`
- **Notifications**: `/api/notifications/[id]`
- **Search**: `/api/search`
- **Export**: `/api/export/contacts`, `/api/export/jobs`
- **GPS**: `/api/gps`
- **Schedule**: `/api/schedule/optimize`
- **Voice**: `/api/voice-command`

---

## Library Utilities

### Location: `lib/`

### 1. Supabase Clients (`lib/supabase/`)

| File | Purpose |
|------|---------|
| `client.ts` | Browser-side Supabase client |
| `server.ts` | Server-side client with cookie handling |

### 2. LLM Integration (`lib/llm/`) - **Enterprise-Grade**

#### Cache Layer
| File | Purpose |
|------|---------|
| `cache/memory-cache.ts` | TTL-based in-memory cache |
| `cache/redis-cache.ts` | Redis distributed cache |
| `cache/provider-cache.ts` | Provider config caching |

#### Metrics
| File | Purpose |
|------|---------|
| `metrics/collector.ts` | Request/success/failure tracking |
| `metrics/instrumented-provider.ts` | Provider instrumentation |

#### Rate Limiting
| File | Purpose |
|------|---------|
| `rate-limiting/token-bucket.ts` | Token bucket algorithm |
| `rate-limiting/rate-limiter.ts` | Per-account limits (10 req/sec) |

#### Resilience Patterns
| File | Purpose |
|------|---------|
| `resilience/circuit-breaker.ts` | Fail-fast on repeated failures |
| `resilience/retry.ts` | Exponential backoff with jitter |
| `resilience/resilient-provider.ts` | Combined resilience wrapper |

#### Error Handling
| File | Purpose |
|------|---------|
| `errors/base.ts` | Base LLM error class |
| `errors/provider-errors.ts` | Provider-specific errors |
| `errors/handler.ts` | Error recovery strategies |

### 3. Email Integrations

#### Gmail (`lib/gmail/`)
| File | Purpose |
|------|---------|
| `auth.ts` | OAuth 2.0 authentication |
| `service.ts` | Email sending via Gmail API |
| `sync.ts` | Email synchronization |
| `encryption.ts` | AES-256-GCM token encryption |
| `contact-extractor.ts` | Contact extraction from emails |

#### Microsoft (`lib/microsoft/`)
| File | Purpose |
|------|---------|
| `auth.ts` | MSAL OAuth authentication |
| `service.ts` | Microsoft Graph API |
| `sync.ts` | Outlook synchronization |

### 4. Offline Sync (`lib/offline/`) - **Mobile-First**

| File | Purpose |
|------|---------|
| `db.ts` | Dexie.js IndexedDB wrapper |
| `sync-service.ts` | Background sync with retry |
| `queue.ts` | Sync queue management |

**Offline Data Types:**
- `OfflineJob` - Jobs created/edited offline
- `OfflineGateCompletion` - Job stage completions
- `OfflinePhoto` - Photos with blob data
- `OfflineGpsLog` - GPS tracking events

### 5. Dispatch Utilities (`lib/dispatch/`)

| File | Purpose |
|------|---------|
| `auto-assign.ts` | Nearest tech assignment algorithm |
| `geocoding.ts` | Address to coordinates with caching |
| `navigation.ts` | Google Maps navigation URLs |

**Auto-Assign Scoring:**
- Distance: 0-100 points (closer = higher)
- Performance: +5 per job completed today
- GPS freshness: Bonus for recent data
- Urgency: 50 points urgent, 25 high priority
- Workload: 20 points for idle techs

### 6. Auth & Permissions (`lib/auth/`) - **RBAC**

| File | Purpose |
|------|---------|
| `permissions.ts` | Role-based permission system |
| `role-routes.ts` | Role-specific routing |
| `validate-account-access.ts` | Account access validation |
| `PermissionGate.tsx` | React permission gate component |

**Roles & Access:**

| Role | Desktop | Mobile | Key Permissions |
|------|---------|--------|-----------------|
| Owner | Full | Full | All CRUD, user management |
| Admin | Full | No | Management, no user creation |
| Dispatcher | Dispatch | Dashboard | Assign jobs, view GPS |
| Tech | No | Full | Own jobs, location tracking |
| Sales | No | Full | Contacts, estimates, marketing |

### 7. GPS Tracking (`lib/gps/`)

| File | Purpose |
|------|---------|
| `tracker.ts` | Geolocation with offline support |

**Features:**
- High accuracy mode
- Periodic sync (5 min intervals)
- Offline IndexedDB storage
- Arrival/departure logging
- Haversine distance calculation

### 8. General Utilities

| File | Purpose |
|------|---------|
| `utils.ts` | Tailwind `cn()` merge utility |
| `audit.ts` | Database audit logging |
| `query-params.ts` | URL parameter handling |
| `keyboard-shortcuts.ts` | Keyboard event handling |
| `toast.ts` | Toast notification wrapper |
| `design-tokens.ts` | Design system tokens |
| `theme-manager.ts` | Theme management |

---

## Custom Hooks

### Location: `hooks/`

### 1. `useQueryParam`

```typescript
useQueryParam<T extends string>(key: string, defaultValue?: T)
```
- Type-safe URL query parameter management
- Supports push/replace navigation modes

### 2. `useQueryParamWithFallback`

```typescript
useQueryParamWithFallback<T>(primaryKey: string, fallbackKeys: string[], defaultValue?: T)
```
- Backward-compatible URL parameters
- Useful for parameter name migrations

### 3. `useModalState`

```typescript
useModalState(paramKey: string, options?: { onOpen?, onClose? })
```
- Modal state synchronized with URL
- Deep linking support
- Returns: `{ isOpen, modalId, open, close, toggle }`

### 4. `useDebounce`

```typescript
useDebounce<T>(value: T, delay: number = 300): T
```
- Value debouncing with configurable delay
- Common use: search inputs, form validation

### 5. `useVoiceNavigation`

```typescript
useVoiceNavigation(accountId?: string)
```
- ElevenLabs voice command integration
- Supabase Realtime subscription
- Web Speech API support
- Returns: `{ isListening, startListening, stopListening }`

---

## Type Definitions

### Location: `types/`

### Core Types (`index.ts`)

```typescript
// Main Entities
Account { id, name, slug, inbound_email_domain, settings, created_at }
User { id, account_id, full_name, role, avatar_url }
Contact { id, account_id, email, phone, first_name, last_name, address }
Conversation { id, status, subject, channel, last_message_at, assigned_to, ai_summary }
Message { id, direction, sender_type, body_text, body_html, is_internal_note }
Job { id, status, scheduled_start, tech_assigned_id, description, total_amount }

// Job Status Flow
'lead' → 'scheduled' → 'en_route' → 'in_progress' → 'completed' → 'invoiced' → 'paid'
```

### Domain Types

| File | Entities | Purpose |
|------|----------|---------|
| `invoices.ts` | Invoice, InvoiceStatus | Billing management |
| `payments.ts` | Payment, PaymentStatus, PaymentMethod | Payment processing |
| `campaigns.ts` | Campaign, CampaignRecipient | Email campaigns |
| `email-templates.ts` | EmailTemplate, EmailTemplateType | Template management |
| `contact-tags.ts` | ContactTag, ContactTagAssignment | Tagging system |
| `call-logs.ts` | CallLog, CallDirection, CallStatus | Call tracking |
| `job-photos.ts` | JobPhoto | Photo attachments |
| `job-materials.ts` | JobMaterial, MaterialUnit | Material tracking |
| `analytics.ts` | JobAnalytics, ContactAnalytics, RevenueAnalytics, DashboardStats | Reporting |
| `reports.ts` | Report, ReportType | Report generation |
| `notifications.ts` | Notification, NotificationType | User notifications |
| `automation.ts` | AutomationRule, AutomationTrigger, AutomationAction | Workflow automation |
| `tech.ts` | Location, TechJobStats, TimeEntry | Field operations |
| `admin.ts` | AccountSettings, AuditLog | Administration |
| `dispatch.ts` | TechLocation, JobLocation, DispatchStats, TechStatus | Real-time dispatch |
| `search.ts` | SearchResultJob, SearchResultContact, SearchResultConversation | Search results |

---

## Summary Statistics

### Components
| Category | Count |
|----------|-------|
| **UI Primitives** | 30 |
| **Layout** | 6 |
| **Domain-Specific** | 45+ |
| **Mobile-Optimized** | 15+ |
| **Voice-Enabled** | 5 |
| **AI-Powered** | 8 |
| **Total Components** | **120+** |

### Routes
| Category | Count |
|----------|-------|
| **Desktop Pages** | 30+ |
| **Mobile Pages** | 15+ |
| **API Endpoints** | **165** |
| **Feature Areas** | 56 |

### Code Organization
| Category | Files |
|----------|-------|
| **Lib Utilities** | 90+ |
| **Custom Hooks** | 5 |
| **Type Definitions** | 17 |
| **MCP Tools** | 18 |

### Key Features
- **5 User Roles**: Owner, Admin, Dispatcher, Tech, Sales
- **8-Stage Tech Workflow**: Mobile job completion gates
- **4 AI Features**: Briefing, pricing, drafting, meeting summary
- **3 LLM Providers**: OpenAI, Anthropic, Google
- **2 Email Integrations**: Gmail, Microsoft 365
- **Offline Support**: IndexedDB + Background Sync
- **Real-time**: Supabase Realtime subscriptions
- **Voice**: ElevenLabs + Web Speech API

---

## Architecture Patterns

### State Management
- React Hooks (`useState`, `useEffect`, `useCallback`)
- React Query for server state caching
- Context API for global state (Notifications, Voice)
- React Hook Form + Zod for form validation

### Styling
- Tailwind CSS with design tokens
- Class Variance Authority (CVA) for variants
- CSS Variables for theming

### Security
- Role-Based Access Control (RBAC)
- AES-256-GCM encryption for OAuth tokens
- Stripe webhook signature verification
- Rate limiting per account

### Resilience
- Circuit breaker pattern
- Exponential backoff retry
- Token bucket rate limiting
- Health checks and failover

---

*Generated: November 28, 2025*
*CRM-AI Pro v0.1.0*
