# User Role Page Flows - UI/UX Verification Guide

**Document Purpose:** UI/UX team verification of role-based page flows and feature access
**Date:** 2025-11-27
**Version:** 1.0
**Project:** CRM-AI-PRO with Dispatch Map Dashboard

---

## Table of Contents

1. [User Roles Overview](#user-roles-overview)
2. [Role-Based Access Matrix](#role-based-access-matrix)
3. [Tech Role - Page Flows](#tech-role---page-flows)
4. [Sales Role - Page Flows](#sales-role---page-flows)
5. [Dispatcher Role - Page Flows](#dispatcher-role---page-flows)
6. [Admin Role - Page Flows](#admin-role---page-flows)
7. [Owner Role - Page Flows](#owner-role---page-flows)
8. [Dispatch Map Dashboard Features](#dispatch-map-dashboard-features)
9. [UI Components Verification Checklist](#ui-components-verification-checklist)
10. [Mobile Responsiveness Requirements](#mobile-responsiveness-requirements)

---

## User Roles Overview

### 1. **Tech (Technician)**
**Primary Purpose:** Field work - complete jobs, capture signatures, take photos, log GPS

**Key Characteristics:**
- Mobile-first user (predominantly uses mobile PWA)
- Works in the field (on job sites)
- Needs offline functionality
- Captures photos, signatures, GPS data
- Views assigned jobs only

**Default Landing Page:** `/tech/dashboard`

---

### 2. **Sales**
**Primary Purpose:** Field sales - meet customers, log GPS, create estimates

**Key Characteristics:**
- Mobile-first user (uses mobile PWA)
- Works in the field (customer locations)
- Creates estimates and proposals
- Logs GPS data
- Views own leads/jobs

**Default Landing Page:** `/sales/dashboard`

---

### 3. **Dispatcher**
**Primary Purpose:** Coordinate field operations - assign jobs, track techs, monitor status

**Key Characteristics:**
- Desktop-first user (works from office)
- Monitors real-time tech locations
- Assigns jobs to techs
- Views analytics and performance metrics
- Needs overview of all field operations

**Default Landing Page:** `/dispatch/map` ⭐ NEW

---

### 4. **Admin**
**Primary Purpose:** Manage system, oversee operations, access all features

**Key Characteristics:**
- Desktop user
- Full system access
- Can view/edit all data
- Manages users and settings
- Views reports and analytics

**Default Landing Page:** `/inbox`

---

### 5. **Owner**
**Primary Purpose:** Business oversight, analytics, strategic decisions

**Key Characteristics:**
- Desktop user
- Full system access (same as admin)
- Focuses on high-level metrics
- Reviews financial reports
- Strategic decision making

**Default Landing Page:** `/inbox`

---

## Role-Based Access Matrix

| Feature/Page | Tech | Sales | Dispatcher | Admin | Owner |
|--------------|------|-------|------------|-------|-------|
| **Dashboard** |
| Tech Dashboard | ✅ | ❌ | ❌ | ✅ | ✅ |
| Sales Dashboard | ❌ | ✅ | ❌ | ✅ | ✅ |
| Dispatch Map | ❌ | ❌ | ✅ | ✅ | ✅ |
| Inbox | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Jobs** |
| View Own Jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Jobs | ❌ | ❌ | ✅ | ✅ | ✅ |
| Assign Jobs | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit Jobs | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Dispatch Features** ⭐ NEW |
| View Dispatch Map | ❌ | ❌ | ✅ | ✅ | ✅ |
| View All Tech Locations | ❌ | ❌ | ✅ | ✅ | ✅ |
| Assign Jobs to Techs | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Tech Details Panel | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Job Details Panel | ❌ | ❌ | ✅ | ✅ | ✅ |
| Use Auto-Assign | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Dispatch Stats | ❌ | ❌ | ✅ | ✅ | ✅ |
| Historical Playback | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Mobile PWA** |
| Job Details (Mobile) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Capture Signature | ✅ | ❌ | ❌ | ✅ | ✅ |
| Capture GPS | ✅ | ✅ | ❌ | ✅ | ✅ |
| Take Photos | ✅ | ✅ | ❌ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ❌ | ❌ | ❌ |
| **System Admin** |
| User Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reports | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## Tech Role - Page Flows

### Login Flow
```
1. User logs in at /auth/signin
2. System detects role = "tech"
3. Auto-redirect to /tech/dashboard
```

### Primary User Journey: Complete a Job

```
START: /tech/dashboard
  ↓
View Assigned Jobs List
  ↓
Click job → /m/tech/job/[job-id]
  ↓
Mobile PWA Job Details Page
  |
  ├─→ Capture Location (GPS logged automatically)
  ├─→ Take Photos (upload to storage)
  ├─→ Capture Signature (customer sign-off)
  ├─→ Update Job Status (en_route → in_progress → completed)
  ↓
Mark Job Complete
  ↓
Return to /tech/dashboard
END
```

### Tech Dashboard UI Elements
**Expected UI Components:**
- [ ] List of assigned jobs (today's schedule)
- [ ] Job status badges (scheduled, en_route, in_progress, completed)
- [ ] "Start Job" button per job
- [ ] Navigation to job details
- [ ] GPS location indicator (last captured)
- [ ] Profile/settings in header

### Mobile Job Details Page (`/m/tech/job/[id]`)
**Expected UI Components:**
- [ ] Job header (customer name, address)
- [ ] Job description
- [ ] Status selector dropdown
- [ ] "Capture Location" button (logs GPS)
- [ ] "Take Photo" button (opens camera)
- [ ] Photo gallery (uploaded photos)
- [ ] "Capture Signature" button (opens signature pad)
- [ ] Signature preview
- [ ] "Complete Job" button
- [ ] Offline indicator (shows when offline)
- [ ] Sync status (shows pending uploads)

**Mobile Responsiveness:**
- ✅ Touch-friendly buttons (min 44x44px)
- ✅ Large tap targets
- ✅ Bottom sheet/drawer UI
- ✅ Native camera integration
- ✅ Works in portrait and landscape

---

## Sales Role - Page Flows

### Login Flow
```
1. User logs in at /auth/signin
2. System detects role = "sales"
3. Auto-redirect to /sales/dashboard
```

### Primary User Journey: Meet Customer & Create Estimate

```
START: /sales/dashboard
  ↓
View Leads/Appointments
  ↓
Click lead → /m/sales/lead/[lead-id]
  ↓
Mobile PWA Lead Details Page
  |
  ├─→ Capture Location (GPS logged)
  ├─→ Take Photos (property photos)
  ├─→ Create Estimate
  ├─→ Email Estimate to Customer
  ↓
Convert Lead to Job (if sold)
  ↓
Return to /sales/dashboard
END
```

### Sales Dashboard UI Elements
**Expected UI Components:**
- [ ] List of leads/appointments
- [ ] Lead status (new, contacted, quoted, closed)
- [ ] "Create Estimate" button
- [ ] Today's appointments
- [ ] GPS location indicator
- [ ] Performance metrics (deals closed, revenue)

### Mobile Lead Details Page (`/m/sales/lead/[id]`)
**Expected UI Components:**
- [ ] Customer information
- [ ] Property address with map
- [ ] "Capture Location" button
- [ ] "Take Photos" button
- [ ] Photo gallery
- [ ] "Create Estimate" button
- [ ] Estimate form (services, pricing)
- [ ] "Email Estimate" button
- [ ] "Convert to Job" button

---

## Dispatcher Role - Page Flows ⭐ NEW

### Login Flow
```
1. User logs in at /auth/signin
2. System detects role = "dispatcher"
3. Auto-redirect to /dispatch/map ⭐ NEW DEFAULT ROUTE
```

### Primary User Journey: Monitor & Assign Jobs

```
START: /dispatch/map (auto-redirected on login)
  ↓
View Real-Time Map with Tech Locations
  |
  ├─→ View tech markers (color-coded by status)
  ├─→ View job markers (unassigned/active jobs)
  ├─→ View live stats (On Job, En Route, Idle, Offline)
  |
  ↓
OPTION A: Assign Job to Tech
  |
  ├─→ Click job marker → JobDetailPanel opens
  ├─→ View job details and customer info
  ├─→ See list of available techs with distances
  ├─→ Click "Assign" on tech → AssignTechDialog opens
  ├─→ Review tech details (distance, ETA, current status)
  ├─→ Confirm assignment
  ├─→ Toast notification: "Tech assigned successfully"
  ├─→ Job marker changes color (red → orange)
  ↓
OPTION B: View Tech Performance
  |
  ├─→ Click tech marker → TechDetailPanel opens
  ├─→ View tech stats (jobs completed, avg time, distance)
  ├─→ View recent activity timeline (GPS logs)
  ├─→ Click "Navigate to Tech" → Opens Google Maps
  ├─→ Click "Assign Job" → Opens job selection
  ├─→ Click "Call Tech" or "SMS Tech"
  ↓
OPTION C: Use Auto-Assign
  |
  ├─→ Click job marker → JobDetailPanel opens
  ├─→ Click "Assign Tech" button
  ├─→ AssignTechDialog opens
  ├─→ Click "Auto-Assign Best Tech" button
  ├─→ Algorithm calculates best match
  ├─→ Confirmation dialog shows:
  |     - Selected tech name
  |     - Distance (e.g., "3.2 miles")
  |     - ETA (e.g., "8 minutes")
  |     - Reason ("Closest available tech")
  ├─→ Confirm → Assignment complete
  ↓
OPTION D: View Analytics
  |
  ├─→ Expand DispatchStats section (top of page)
  ├─→ View 4 KPIs (Team Efficiency, Response Time, Utilization, Coverage)
  ├─→ View 4 charts (Jobs by Status, Tech Activity, Distance, Completion)
  ├─→ Change time range (Today/Week/Month)
  ├─→ Click "Export PDF" or "Export CSV"
  ↓
OPTION E: Historical Playback
  |
  ├─→ Click "Historical Playback" button
  ├─→ Select date/time range
  ├─→ Click "Load Data"
  ├─→ Use playback controls (play, pause, speed, scrubber)
  ├─→ Review tech movements and breadcrumb trails
  ├─→ Click "Exit to Live" to return to real-time
  ↓
END: Continuous monitoring loop
```

### Dispatch Map Page (`/dispatch/map`) - Main Interface ⭐ NEW

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: "Dispatch Map" | Stats | Refresh Button            │
├─────────────────────────────────────────────────────────────┤
│ Stats Bar (collapsible):                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │👥 Team   │ │🕐 Response│ │⚡ Util   │ │📍 Coverage│       │
│ │  4.2 ↑   │ │  12 min  │ │  75%     │ │  18.3mi  │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│ [Charts: Jobs by Status, Tech Activity, Distance, Rates]   │
├────────┬────────────────────────────────────┬──────────────┤
│ TECH   │        GOOGLE MAP                  │ MAP CONTROLS │
│ LIST   │                                    │              │
│ SIDEBAR│  ● Tech Markers (circles)          │  [⊞] Fit All │
│        │  📍 Job Markers (pins)             │  [🏢] Center │
│ Search │                                    │  [📍] Follow │
│ ─────  │  Real-time updates                 │  [🔄] Refresh│
│        │  Clicking marker opens panel →    │  [☰] Layers  │
│ Filter │                                    │  [⛶] Full    │
│ Chips  │                                    │              │
│        │                                    │              │
│ Tech   │                                    │              │
│ List   │                                    │              │
│ (10)   │                                    │              │
│        │                                    │              │
└────────┴────────────────────────────────────┴──────────────┘
│ Historical Playback Controls (bottom, optional)            │
│ [◀] [▶] [Play] [2x] [═════●══════] [Exit to Live]        │
└─────────────────────────────────────────────────────────────┘
```

**Panel Overlays (slide in from right):**
```
┌──────────────┐
│ TechDetail   │ ← Opens when tech marker clicked
│ Panel        │
│              │
│ [Photo]      │
│ John Smith   │
│ Status: Idle │
│              │
│ Current Job  │
│ Location     │
│ Stats        │
│ Activity     │
│ [Actions]    │
└──────────────┘

┌──────────────┐
│ JobDetail    │ ← Opens when job marker clicked
│ Panel        │
│              │
│ Job #123     │
│ Customer     │
│ Address      │
│              │
│ Available    │
│ Techs:       │
│ • John 3.2mi │
│ • Jane 5.1mi │
│ [Assign]     │
└──────────────┘
```

**Modal Dialogs:**
```
┌─────────────────────────────────────┐
│ Assign Tech to Job                  │
├─────────────────────────────────────┤
│ Job: Fix water heater               │
│ Address: 123 Main St                │
│                                     │
│ ☑ Show only available techs        │
│                                     │
│ Available Techs:                    │
│ ┌─────────────────────────────────┐ │
│ │ John Smith        3.2 mi  ~8min │ │
│ │ Status: Idle      [Assign]     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Jane Doe          5.1 mi  ~12min│ │
│ │ Status: Idle      [Assign]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Auto-Assign Best Tech] [Cancel]   │
└─────────────────────────────────────┘
```

### Dispatcher UI Components Checklist ⭐ NEW

**Main Map Interface:**
- [ ] Google Maps loads correctly
- [ ] Tech markers appear as circles with status colors:
  - 🟢 Green = On Job
  - 🔵 Blue = En Route
  - 🟡 Yellow = Idle
  - ⚪ Gray = Offline
- [ ] Job markers appear as pins with status colors:
  - 🔴 Red = Scheduled (unassigned)
  - 🟠 Orange = En Route
  - 🔵 Blue = In Progress
- [ ] Markers update in real-time (no page refresh)
- [ ] Stats bar shows correct counts (On Job, En Route, Idle, Offline)
- [ ] "Refresh" button works and shows timestamp

**TechListSidebar (Left):**
- [ ] Search box filters techs by name in real-time
- [ ] Status filter chips work (All, On Job, En Route, Idle, Offline)
- [ ] Filter chips show counts (e.g., "On Job (3)")
- [ ] Tech list displays all techs with GPS data
- [ ] Each tech card shows:
  - [ ] Tech name
  - [ ] Status badge
  - [ ] Current job (if applicable)
  - [ ] Last GPS timestamp
  - [ ] Distance to selected job (when job selected)
- [ ] Clicking tech pans map and opens TechDetailPanel
- [ ] Hovering tech highlights marker on map
- [ ] Sidebar is collapsible (desktop)
- [ ] Sidebar becomes drawer on mobile

**TechDetailPanel (Slides from right):**
- [ ] Opens when tech marker clicked
- [ ] Shows tech photo/avatar
- [ ] Shows tech name and role badge
- [ ] Shows status badge (color-coded)
- [ ] Shows current job card (if on job)
- [ ] Shows last location with timestamp
- [ ] Shows GPS accuracy (±Xm)
- [ ] Shows performance stats:
  - [ ] Jobs completed today
  - [ ] Average job time
  - [ ] Distance traveled
  - [ ] Hours worked today
- [ ] Shows recent activity timeline (last 5 GPS logs)
- [ ] "Navigate to Tech" button opens Google Maps
- [ ] "Assign Job" button opens job selection
- [ ] "Call Tech" button opens phone dialer
- [ ] "SMS Tech" button opens messaging
- [ ] Close button (X) works
- [ ] Mobile: appears as bottom sheet

**JobDetailPanel (Slides from right):**
- [ ] Opens when job marker clicked
- [ ] Shows job ID and description
- [ ] Shows customer name
- [ ] Shows address
- [ ] Shows status badge
- [ ] Shows priority badge (low/normal/high/urgent)
- [ ] Shows scheduled time
- [ ] Lists available techs sorted by distance
- [ ] Each tech shows:
  - [ ] Name and status
  - [ ] Distance with color-coding:
    - 🟢 Green < 5 miles
    - 🟡 Yellow 5-10 miles
    - 🟠 Orange 10-20 miles
    - 🔴 Red > 20 miles
  - [ ] ETA in minutes
  - [ ] "Assign" button
- [ ] "Navigate to Job" button opens Google Maps
- [ ] Close button works
- [ ] Mobile: appears as bottom sheet

**AssignTechDialog (Modal):**
- [ ] Opens when "Assign" button clicked
- [ ] Shows job details at top
- [ ] Shows "Show only available techs" checkbox
- [ ] Lists techs with:
  - [ ] Name, role, status
  - [ ] Current job (if any)
  - [ ] Distance to job
  - [ ] ETA
  - [ ] "Assign" button per tech
  - [ ] "Preview Route" button (opens Google Maps)
- [ ] "Auto-Assign Best Tech" button present
- [ ] Validation works:
  - [ ] Cannot assign offline tech (button disabled)
  - [ ] Warning for busy tech (confirmation dialog)
  - [ ] Warning for en_route tech (confirmation dialog)
- [ ] Success toast appears after assignment
- [ ] Error toast appears on failure
- [ ] Dialog closes after successful assignment
- [ ] Cancel button works

**Auto-Assign Confirmation Dialog:**
- [ ] Shows after clicking "Auto-Assign Best Tech"
- [ ] Displays selected tech name with badge
- [ ] Shows distance to job
- [ ] Shows ETA
- [ ] Shows algorithm score (0-200)
- [ ] Shows reason for selection
- [ ] "Confirm Assignment" button
- [ ] "Cancel" button
- [ ] Proceeds with assignment on confirm

**DispatchStats Dashboard (Collapsible section):**
- [ ] Expand/collapse button works (chevron icon)
- [ ] Time range buttons work (Today, Week, Month)
- [ ] 4 KPI cards display:
  - [ ] Team Efficiency (avg jobs/tech with trend)
  - [ ] Response Time (avg minutes, color-coded)
  - [ ] Utilization Rate (percentage)
  - [ ] Coverage Area (miles)
- [ ] 4 charts display:
  - [ ] Jobs by Status (donut chart)
  - [ ] Tech Activity Timeline (line chart)
  - [ ] Distance Traveled (bar chart)
  - [ ] Completion Rates (progress bars)
- [ ] Export PDF button works
- [ ] Export CSV button works
- [ ] Manual refresh button works
- [ ] Auto-refresh every 5 minutes
- [ ] Last updated timestamp visible
- [ ] Loading skeleton appears while fetching

**MapControls (Floating panel, top-right):**
- [ ] Zoom to Fit All button works (fits all markers)
- [ ] Center on Business button works (returns to center)
- [ ] Follow Mode toggle works (locks on selected tech)
- [ ] Refresh button works (reloads data)
- [ ] Layer toggles dropdown works:
  - [ ] Show/hide tech markers
  - [ ] Show/hide job markers
  - [ ] Show/hide traffic layer
  - [ ] Show/hide heatmap
- [ ] Fullscreen toggle works (ESC to exit)
- [ ] Tooltips appear on hover

**HistoricalPlayback (Bottom bar):**
- [ ] Date/time pickers work
- [ ] "Load Data" button fetches historical GPS
- [ ] Play button starts playback
- [ ] Pause button stops playback
- [ ] Skip forward/backward buttons work (5 min increments)
- [ ] Speed controls work (1x, 2x, 5x, 10x)
- [ ] Timeline scrubber is draggable
- [ ] Clicking timeline jumps to time
- [ ] Tech markers update positions during playback
- [ ] Breadcrumb trails appear showing paths
- [ ] Current timestamp displays
- [ ] "Exit to Live" button returns to real-time mode

**Real-Time Updates:**
- [ ] Tech markers move when GPS updated (no refresh)
- [ ] Job markers update when status changes (no refresh)
- [ ] Stats bar updates automatically
- [ ] Panels refresh when data changes
- [ ] Console logs show "📍 Real-time GPS update received"
- [ ] Console logs show "🔔 Job update received"

**Mobile Responsiveness (Dispatch Map):**
- [ ] Map fills screen on mobile
- [ ] TechListSidebar becomes hamburger menu + drawer
- [ ] TechDetailPanel becomes bottom sheet
- [ ] JobDetailPanel becomes bottom sheet
- [ ] AssignTechDialog is full-screen on mobile
- [ ] Stats dashboard stacks vertically
- [ ] Charts are readable on small screens
- [ ] All buttons are touch-friendly (44x44px min)
- [ ] Pinch to zoom works on map

---

## Admin Role - Page Flows

### Login Flow
```
1. User logs in at /auth/signin
2. System detects role = "admin"
3. Auto-redirect to /inbox
```

### Primary User Journey: Full System Access

```
START: /inbox
  |
  ├─→ Option A: Access Dispatch Map (same as Dispatcher)
  |     ↓
  |   Navigate to /dispatch/map
  |   [Full dispatcher functionality]
  |
  ├─→ Option B: Manage Users
  |     ↓
  |   Navigate to /admin/users
  |   View/edit/create users
  |   Assign roles
  |
  ├─→ Option C: View All Jobs
  |     ↓
  |   Navigate to /jobs
  |   View/edit all jobs (any tech)
  |
  ├─→ Option D: System Settings
  |     ↓
  |   Navigate to /admin/settings
  |   Configure system settings
  |
  └─→ Option E: Reports
        ↓
      View performance reports
      Export data
END
```

### Admin UI Expectations
- [ ] Access to all pages (no restrictions)
- [ ] Can view any user's data
- [ ] Can edit any record
- [ ] User management interface
- [ ] System settings access
- [ ] Full dispatch map access (same as dispatcher)

---

## Owner Role - Page Flows

### Login Flow
```
1. User logs in at /auth/signin
2. System detects role = "owner"
3. Auto-redirect to /inbox
```

### Primary User Journey: Business Oversight

```
START: /inbox
  |
  ├─→ Option A: View Dispatch Analytics
  |     ↓
  |   Navigate to /dispatch/map
  |   Expand DispatchStats dashboard
  |   Review KPIs and charts
  |   Export reports (PDF/CSV)
  |
  ├─→ Option B: Financial Reports
  |     ↓
  |   View revenue reports
  |   View job profitability
  |
  └─→ Option C: Strategic Decisions
        ↓
      Review high-level metrics
      Make business decisions
END
```

### Owner UI Expectations
- [ ] Same access as Admin
- [ ] Focus on analytics and reports
- [ ] High-level dashboard views
- [ ] Financial reports accessible
- [ ] Can access dispatch map for oversight

---

## Dispatch Map Dashboard Features

### Real-Time Tracking
**User Flow:**
```
1. Dispatcher logs in → auto-redirected to /dispatch/map
2. Map loads with Google Maps
3. Tech markers appear (circles, color-coded)
4. Job markers appear (pins, color-coded)
5. Stats bar shows counts (On Job: 3, En Route: 2, Idle: 5, Offline: 0)
6. Every few seconds: markers update position automatically
7. No page refresh needed
```

**Expected Behavior:**
- [ ] Tech moves → marker animates to new position
- [ ] Job status changes → marker color updates
- [ ] New GPS log → marker updates within 1 second
- [ ] Stats update automatically

### Job Assignment Workflow
**User Flow:**
```
1. Unassigned job appears as red pin on map
2. Dispatcher clicks red pin
3. JobDetailPanel slides in from right showing:
   - Job details (customer, address, description)
   - List of available techs sorted by nearest first
   - Distance (e.g., "3.2 mi") with color-coding
   - ETA (e.g., "8 minutes")
4. Dispatcher clicks "Assign" next to tech name
5. AssignTechDialog modal opens showing:
   - Job summary
   - Selected tech details
   - Confirmation button
6. Dispatcher clicks "Confirm Assignment"
7. API call assigns job to tech
8. Success toast: "Tech assigned successfully"
9. Job marker changes color: red → orange
10. Dialog closes
11. JobDetailPanel updates showing assigned tech
```

**Expected Behavior:**
- [ ] Assignment takes <500ms
- [ ] Toast notification appears
- [ ] Marker color changes immediately (optimistic update)
- [ ] If API fails, revert marker color and show error toast

### Auto-Assign Feature
**User Flow:**
```
1. Dispatcher opens JobDetailPanel for unassigned job
2. Clicks "Assign Tech" button
3. AssignTechDialog opens
4. Clicks "Auto-Assign Best Tech" button
5. Algorithm calculates (dry-run):
   - Filters eligible techs (idle, recent GPS)
   - Scores each tech (distance + performance + urgency)
   - Selects highest score
6. Confirmation dialog shows:
   - Selected tech: "John Smith"
   - Distance: "3.2 miles" with green indicator
   - ETA: "8 minutes"
   - Score: "145/200"
   - Reason: "Closest available tech with high performance rating"
7. Dispatcher reviews and clicks "Confirm Assignment"
8. API call assigns job
9. Success notification
```

**Expected Behavior:**
- [ ] Algorithm selects correct tech (nearest + best performance)
- [ ] Confirmation dialog shows clear reasoning
- [ ] Can cancel and manually select instead
- [ ] Handles edge cases (no available techs, all offline)

### Historical Playback
**User Flow:**
```
1. Dispatcher clicks "Historical Playback" button (or opens bottom panel)
2. Selects date range: Start: "2025-11-27 08:00", End: "2025-11-27 12:00"
3. Clicks "Load Data"
4. System fetches historical GPS logs (downsampled to 5-min intervals)
5. Map switches to playback mode:
   - Tech markers show positions at start time
   - Timeline appears at bottom
   - Current time: "08:00"
6. Clicks "Play" button
7. Tech markers animate along their paths
8. Breadcrumb trails appear behind each tech
9. Timeline scrubber moves showing current time
10. Clicks timeline to jump to specific time
11. Changes speed to 5x (faster playback)
12. Clicks "Pause" to stop
13. Clicks "Exit to Live" to return to real-time mode
```

**Expected Behavior:**
- [ ] Playback runs smoothly (60fps)
- [ ] Breadcrumbs show path traveled
- [ ] Timeline is accurate
- [ ] Speed controls work (1x, 2x, 5x, 10x)
- [ ] Exit returns to current time/data

---

## UI Components Verification Checklist

### Global UI Components (All Pages)

**Header/Navigation:**
- [ ] Logo visible
- [ ] User name/avatar in top-right
- [ ] Role badge displayed
- [ ] Logout button accessible
- [ ] Responsive on mobile (hamburger menu)

**Theme:**
- [ ] Dark mode applied throughout
- [ ] Consistent color scheme:
  - Background: gray-900
  - Cards: gray-800
  - Text: white/gray-100
  - Accent: blue-600
- [ ] High contrast for accessibility

**Loading States:**
- [ ] Skeleton loaders appear while fetching data
- [ ] Spinner icons on buttons during async actions
- [ ] Loading text ("Loading..." or similar)

**Error States:**
- [ ] Error messages are user-friendly
- [ ] Retry buttons available when appropriate
- [ ] Toast notifications for errors (red, auto-dismiss)

**Success States:**
- [ ] Toast notifications for success (green, auto-dismiss)
- [ ] Confirmation messages clear
- [ ] Visual feedback for actions (button press, etc.)

### Typography
- [ ] Headings are clear and hierarchical (h1, h2, h3)
- [ ] Body text is readable (16px minimum)
- [ ] Font weights used appropriately (bold for emphasis)
- [ ] Line height adequate for readability

### Spacing & Layout
- [ ] Consistent padding (p-4, p-6, etc.)
- [ ] Adequate margins between sections
- [ ] Cards have proper borders and shadows
- [ ] White space used effectively

### Colors & Status Indicators

**Tech Status Colors:**
- [ ] 🟢 Green (#10B981) = On Job
- [ ] 🔵 Blue (#3B82F6) = En Route
- [ ] 🟡 Yellow (#F59E0B) = Idle
- [ ] ⚪ Gray (#6B7280) = Offline

**Job Status Colors:**
- [ ] 🔴 Red = Scheduled (unassigned)
- [ ] 🟠 Orange = En Route
- [ ] 🔵 Blue = In Progress
- [ ] 🟢 Green = Completed

**Priority Colors:**
- [ ] Gray = Low
- [ ] Blue = Normal
- [ ] Orange = High
- [ ] Red = Urgent

### Buttons & Interactions

**Primary Buttons:**
- [ ] Blue background (#3B82F6)
- [ ] White text
- [ ] Hover state (darker blue)
- [ ] Disabled state (gray, cursor not-allowed)
- [ ] Loading state (spinner, disabled)

**Secondary Buttons:**
- [ ] Gray outline
- [ ] Transparent background
- [ ] Hover state (gray background)

**Icon Buttons:**
- [ ] Clear icons (from Lucide React)
- [ ] Tooltips on hover
- [ ] Appropriate size (w-4 h-4 for small, w-6 h-6 for large)

### Forms & Inputs

**Text Inputs:**
- [ ] Clear labels
- [ ] Placeholder text
- [ ] Border on focus (blue)
- [ ] Error state (red border + message)
- [ ] Clear/reset button (X icon)

**Dropdowns/Selects:**
- [ ] Chevron icon indicating dropdown
- [ ] Options clearly visible
- [ ] Selected option highlighted
- [ ] Search within dropdown (if many options)

**Checkboxes:**
- [ ] Clear checkmark when selected
- [ ] Label clickable
- [ ] Disabled state clear

**Date/Time Pickers:**
- [ ] Calendar icon
- [ ] Clear date format (MM/DD/YYYY or YYYY-MM-DD)
- [ ] Time format clear (12h or 24h)

### Modals & Dialogs

**Modal Dialogs (AssignTechDialog, Confirmations):**
- [ ] Dark overlay/backdrop
- [ ] Centered on screen
- [ ] Close button (X) in top-right
- [ ] Click outside to close (optional)
- [ ] ESC key closes dialog
- [ ] Focus trapped within dialog
- [ ] Actions at bottom (Cancel, Confirm)

**Panels (TechDetailPanel, JobDetailPanel):**
- [ ] Slides in from right (300ms animation)
- [ ] Close button (X) in top-right
- [ ] Scrollable content
- [ ] Fixed width (384px on desktop, full-width on mobile)
- [ ] Backdrop dims main content

**Bottom Sheets (Mobile):**
- [ ] Slides in from bottom
- [ ] Drag handle at top
- [ ] Max height 85vh
- [ ] Swipe down to close
- [ ] Backdrop overlay

### Cards

**Standard Cards:**
- [ ] Gray-800 background (dark mode)
- [ ] Rounded corners (rounded-lg)
- [ ] Padding (p-4 or p-6)
- [ ] Shadow for depth

**Stat Cards (KPIs):**
- [ ] Large number/value
- [ ] Label below number
- [ ] Icon in corner
- [ ] Trend indicator (↑↓) if applicable
- [ ] Gradient or solid background

### Badges

**Status Badges:**
- [ ] Small, rounded pills
- [ ] Color matches status (green/blue/yellow/gray/red)
- [ ] Text is uppercase or capitalized
- [ ] Padding (px-2 py-1)

**Role Badges:**
- [ ] Clear indication of role (Tech, Sales, Dispatcher, etc.)
- [ ] Color-coded or neutral

### Icons
- [ ] Consistent icon library (Lucide React)
- [ ] Appropriate size (w-4 h-4, w-5 h-5, w-6 h-6)
- [ ] Aligned with text
- [ ] Color matches context (gray, blue, etc.)

### Charts (DispatchStats)

**Donut Chart (Jobs by Status):**
- [ ] 5 segments (unassigned, scheduled, en_route, in_progress, completed)
- [ ] Color-coded by status
- [ ] Percentage labels
- [ ] Tooltips on hover

**Line Chart (Tech Activity Timeline):**
- [ ] X-axis: Time (hours)
- [ ] Y-axis: Active tech count
- [ ] Blue line
- [ ] Dashed grid
- [ ] Tooltips on hover

**Bar Chart (Distance Traveled):**
- [ ] X-axis: Tech names (rotated 45deg)
- [ ] Y-axis: Miles
- [ ] Green bars
- [ ] Labels on bars

**Progress Bars (Completion Rates):**
- [ ] Tech name on left
- [ ] Percentage on right
- [ ] Blue filled progress bar
- [ ] Gray background

---

## Mobile Responsiveness Requirements

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Mobile-Specific UI Patterns

**Navigation:**
- [ ] Hamburger menu (☰) instead of full nav
- [ ] Bottom navigation bar (for mobile PWA)
- [ ] Swipe gestures (back, drawer)

**Dispatch Map on Mobile:**
- [ ] TechListSidebar becomes hamburger + drawer
- [ ] Floating "Techs" button (fixed top-left)
- [ ] Drawer slides from left
- [ ] Map controls move to bottom-right (smaller)
- [ ] Stats dashboard stacks vertically (collapses by default)
- [ ] TechDetailPanel becomes bottom sheet (max 85vh)
- [ ] JobDetailPanel becomes bottom sheet
- [ ] AssignTechDialog is full-screen modal

**Touch Targets:**
- [ ] Minimum 44x44px for all interactive elements
- [ ] Adequate spacing between buttons (8px min)
- [ ] No hover states (rely on tap/press)

**Scrolling:**
- [ ] Smooth scrolling
- [ ] No horizontal scroll (unless intentional, like chart)
- [ ] Pull-to-refresh (where applicable)

**Orientation:**
- [ ] Portrait mode (primary)
- [ ] Landscape mode (supported, UI adjusts)

### Mobile PWA Features (Tech/Sales)

**Offline Functionality:**
- [ ] "Offline" indicator visible when disconnected
- [ ] Data cached for offline access
- [ ] Actions queued when offline
- [ ] Sync when connection restored
- [ ] "Pending uploads" indicator

**Native Features:**
- [ ] Camera access (photo capture)
- [ ] GPS/Location access
- [ ] Phone dialer (tel: links)
- [ ] SMS (sms: links)
- [ ] Native Google Maps app (navigation)

**Performance:**
- [ ] Fast load time (<3s)
- [ ] Smooth animations (60fps)
- [ ] No jank when scrolling
- [ ] Images lazy-loaded

---

## Testing Scenarios for UI/UX Team

### Scenario 1: Tech Completes a Job (Mobile PWA)
**Test Steps:**
1. Login as tech user
2. Navigate to assigned job
3. Capture GPS location
4. Take 2 photos
5. Capture customer signature
6. Mark job complete

**Expected UI:**
- GPS button shows "Location captured ✓"
- Photos appear in gallery
- Signature preview displays
- "Complete Job" button enabled
- Success toast on completion
- Return to dashboard, job marked complete

### Scenario 2: Dispatcher Assigns Job
**Test Steps:**
1. Login as dispatcher
2. Auto-redirect to /dispatch/map
3. Click unassigned job marker (red pin)
4. JobDetailPanel opens
5. Review available techs and distances
6. Click "Assign" on nearest tech
7. Confirm assignment

**Expected UI:**
- JobDetailPanel slides in smoothly
- Techs sorted by distance (nearest first)
- Distance color-coded (green for <5mi)
- AssignTechDialog modal appears
- Success toast on assignment
- Job marker changes red → orange
- Panel updates showing assigned tech

### Scenario 3: Dispatcher Uses Auto-Assign
**Test Steps:**
1. Login as dispatcher
2. Click unassigned job marker
3. Click "Assign Tech" button
4. Click "Auto-Assign Best Tech"
5. Review algorithm recommendation
6. Confirm assignment

**Expected UI:**
- Confirmation dialog shows:
  - Selected tech with SELECTED badge
  - Distance with color indicator
  - ETA calculation
  - Score (0-200)
  - Reason text
- Confirm button enabled
- Assignment proceeds on confirm
- Success notification

### Scenario 4: Dispatcher Views Analytics
**Test Steps:**
1. Login as dispatcher
2. Expand DispatchStats section
3. View KPIs (Team Efficiency, Response Time, Utilization, Coverage)
4. View charts
5. Change time range to "Week"
6. Export to PDF

**Expected UI:**
- Stats section expands smoothly
- 4 KPI cards display with correct data
- 4 charts render properly
- Time range buttons work
- PDF downloads with formatted report

### Scenario 5: Historical Playback
**Test Steps:**
1. Login as dispatcher
2. Open HistoricalPlayback component
3. Select date range (4 hours ago to now)
4. Load data
5. Click Play
6. Change speed to 5x
7. Pause
8. Drag timeline scrubber
9. Exit to live

**Expected UI:**
- Date/time pickers work
- GPS logs load successfully
- Tech markers animate smoothly
- Breadcrumb trails appear
- Timeline scrubber moves
- Speed controls work
- Exit returns to real-time data

### Scenario 6: Mobile Responsive - Dispatch Map
**Test Steps:**
1. Open dispatch map on mobile device
2. Test all features:
   - Hamburger menu for tech list
   - Marker clicks open bottom sheets
   - Assign dialog is full-screen
   - Stats dashboard stacks vertically
   - Map controls accessible

**Expected UI:**
- All features accessible on mobile
- Touch targets adequate (44x44px)
- No horizontal scroll
- Panels don't block critical UI
- Performance smooth (no lag)

---

## Accessibility Requirements

### Keyboard Navigation
- [ ] All interactive elements reachable by Tab key
- [ ] Focus visible (blue outline)
- [ ] Enter/Space activate buttons
- [ ] ESC closes modals/panels
- [ ] Arrow keys navigate lists/menus

### Screen Reader Support
- [ ] All images have alt text
- [ ] Buttons have aria-labels
- [ ] Form inputs have labels
- [ ] Status changes announced
- [ ] Error messages readable

### Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Interactive elements contrast ≥ 3:1
- [ ] Status not conveyed by color alone (use icons + text)

### Motion & Animation
- [ ] Animations can be disabled (prefers-reduced-motion)
- [ ] No flashing/strobing effects
- [ ] Auto-play can be paused

---

## Browser Compatibility

**Supported Browsers:**
- [ ] Chrome 90+ (desktop & mobile)
- [ ] Firefox 88+ (desktop)
- [ ] Safari 14+ (desktop & iOS)
- [ ] Edge 90+ (desktop)

**Not Supported:**
- Internet Explorer (deprecated)

---

## Performance Benchmarks

### Load Times
- [ ] Initial page load: <3 seconds
- [ ] Map load: <2 seconds
- [ ] Component render: <100ms
- [ ] API response: <500ms

### Real-Time Updates
- [ ] GPS update latency: <500ms
- [ ] Job update latency: <500ms
- [ ] Marker animation: 60fps

### User Interactions
- [ ] Button click response: <50ms
- [ ] Panel open animation: 300ms
- [ ] Modal open: <100ms
- [ ] Search filter: <50ms (instant)

---

## Sign-Off Checklist for UI/UX Team

### Phase 1 & 2 (Previously Verified)
- [ ] Static map loads correctly
- [ ] Tech markers display with status colors
- [ ] Real-time updates work (no refresh needed)
- [ ] Stats bar shows correct counts

### Phase 3 (New Features)
- [ ] TechDetailPanel renders correctly
- [ ] JobDetailPanel renders correctly
- [ ] TechListSidebar renders correctly
- [ ] AssignTechDialog renders correctly
- [ ] Job markers display on map
- [ ] Distance calculations accurate
- [ ] Job assignment workflow complete
- [ ] All panels mobile responsive

### Phase 4 (New Features)
- [ ] DispatchStats dashboard renders correctly
- [ ] All 4 KPIs display
- [ ] All 4 charts display
- [ ] MapControls panel functional
- [ ] Auto-assign algorithm works
- [ ] HistoricalPlayback component works
- [ ] Export PDF/CSV works
- [ ] Navigation links work

### Cross-Cutting Concerns
- [ ] All pages load without errors
- [ ] Role-based routing works correctly
- [ ] Authentication working
- [ ] Mobile responsive on all pages
- [ ] Dark theme applied consistently
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility compliant

---

## Issue Reporting Template

If UI/UX team finds issues, report using this template:

**Issue Title:** [Component/Page] - [Brief Description]

**Severity:** Critical / High / Medium / Low

**Role:** Tech / Sales / Dispatcher / Admin / Owner

**Page/Component:** e.g., /dispatch/map - TechDetailPanel

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots/Video:**
Attach screenshots or screen recording

**Browser/Device:**
e.g., Chrome 120 on MacOS, Safari on iPhone 14

**Additional Notes:**
Any other relevant information

---

## Documentation References

**For detailed technical information, refer to:**
1. `/docs/DISPATCH_MAP_PHASES_1-4_COMPLETE.md` - Complete technical documentation
2. `/DISPATCH_MAP_EXECUTIVE_SUMMARY.md` - Executive overview
3. `/shared-docs/dispatch-api-completion-report.md` - API documentation
4. `/shared-docs/agent-*-completion-report.md` - Component-specific details (12 reports)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Status:** Ready for UI/UX Verification
**Next Review:** After UI/UX team testing

---

*This document should be used by the UI/UX team to systematically verify that all user roles have correct page flows, all components render as intended, and all interactions work as designed. Mark checkboxes as verification proceeds.*
