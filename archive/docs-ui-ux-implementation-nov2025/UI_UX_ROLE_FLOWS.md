# CRM-AI Pro - UI/UX Role Flows & Verification Guide

**Purpose:** This document maps out the complete user experience for each role, enabling the UI/UX team to verify that all intended flows are properly implemented.

**Last Updated:** 2025-01-27

---

## Table of Contents

1. [User Roles Overview](#user-roles-overview)
2. [Desktop vs Mobile Experience](#desktop-vs-mobile-experience)
3. [Role-Specific Page Flows](#role-specific-page-flows)
4. [Navigation Patterns](#navigation-patterns)
5. [Permission Matrix](#permission-matrix)
6. [UI/UX Verification Checklist](#uiux-verification-checklist)

---

## User Roles Overview

The system supports **5 user roles** with distinct workflows and access levels:

| Role | Primary Users | Main Interface | Default Landing Page |
|------|--------------|----------------|---------------------|
| **Owner** | Business owner | Desktop + Mobile PWA | Desktop: `/inbox`<br>Mobile: `/m/owner/dashboard` |
| **Admin** | Office manager, Admin staff | Desktop | `/inbox` |
| **Dispatcher** | Dispatch/scheduling staff | Desktop | `/dispatch/map` |
| **Tech** | Field technicians | Mobile PWA | `/m/tech/dashboard` |
| **Sales** | Sales representatives | Mobile PWA | `/m/sales/dashboard` |

---

## Desktop vs Mobile Experience

### Desktop Routes (`/` paths)

**Primary Users:** Owner, Admin, Dispatcher

**Route Structure:**
```
/
├── (auth)
│   └── /login                    # Authentication
│
├── (dashboard)
│   ├── /inbox                    # Main CRM inbox (email threads)
│   ├── /jobs                     # Job management list
│   ├── /contacts                 # Contact database
│   ├── /calendar                 # Schedule/calendar view
│   ├── /analytics                # Business analytics
│   │
│   ├── /finance
│   │   ├── /finance/dashboard    # Financial overview
│   │   └── /finance/payments     # Payment tracking
│   │
│   ├── /marketing
│   │   ├── /marketing/campaigns  # Marketing campaigns
│   │   ├── /marketing/email-templates
│   │   └── /marketing/tags       # Contact tagging
│   │
│   ├── /dispatch
│   │   └── /dispatch/map         # Real-time tech location map
│   │
│   ├── /tech
│   │   └── /tech/dashboard       # Desktop tech view (if needed)
│   │
│   ├── /admin
│   │   ├── /admin/users          # User management
│   │   ├── /admin/audit          # Audit logs
│   │   ├── /admin/automation     # Automation rules
│   │   ├── /admin/llm-providers  # AI provider config
│   │   └── /admin/settings       # System settings
│   │
│   └── /settings
│       └── /settings/integrations # Third-party integrations
│
└── /api/*                        # API endpoints
```

### Mobile PWA Routes (`/m/*` paths)

**Primary Users:** Tech, Sales, Owner (on mobile)

**Route Structure:**
```
/m/
├── /m/tech
│   ├── /m/tech/dashboard         # Tech's job list for the day
│   ├── /m/tech/job/[id]          # Individual job details (photos, notes, checklist)
│   └── /m/tech/layout.tsx        # Tech-specific mobile shell
│
├── /m/sales
│   ├── /m/sales/dashboard        # Sales pipeline/leads
│   ├── /m/sales/meeting/[id]     # Meeting details with AI briefing
│   └── /m/sales/briefing/[contactId] # Pre-meeting AI briefing
│
├── /m/office
│   └── /m/office/dashboard       # Dispatcher mobile view
│
├── /m/owner
│   └── /m/owner/dashboard        # Owner mobile overview
│
└── /m/layout.tsx                 # Shared mobile PWA shell
```

**Mobile PWA Features:**
- Offline-first architecture
- GPS location tracking
- Photo capture & upload
- Signature pad (for job completion)
- Voice navigation support
- Progressive Web App (installable)

---

## Role-Specific Page Flows

### 1. Owner Role

**Access Level:** Full system access

**Desktop Landing:** `/inbox`
**Mobile Landing:** `/m/owner/dashboard`

#### Desktop Flow (Owner)

```
Login → /inbox (Main Dashboard)
  │
  ├→ View all conversations/emails
  │   └→ Reply with AI-assisted drafts
  │
  ├→ /jobs (Job Management)
  │   ├→ View all jobs (any status)
  │   ├→ Create new jobs
  │   ├→ Assign techs
  │   ├→ Update job status
  │   └→ View job details with full history
  │
  ├→ /contacts (CRM)
  │   ├→ View all contacts
  │   ├→ Add/edit contacts
  │   ├→ View contact history (jobs, conversations)
  │   └→ Tag contacts for marketing
  │
  ├→ /analytics (Business Intelligence)
  │   ├→ Revenue reports
  │   ├→ Job completion rates
  │   ├→ Tech performance
  │   └→ Customer analytics
  │
  ├→ /finance/dashboard
  │   ├→ Revenue overview
  │   ├→ Outstanding invoices
  │   ├→ Payment tracking
  │   └→ /finance/payments (detailed payment history)
  │
  ├→ /marketing/campaigns
  │   ├→ Create campaigns
  │   ├→ Email templates
  │   ├→ Contact segmentation
  │   └→ Campaign analytics
  │
  ├→ /dispatch/map
  │   ├→ Real-time tech locations
  │   ├→ Drag-and-drop job assignment
  │   └→ Route optimization
  │
  ├→ /admin/*
  │   ├→ /admin/users (Create/manage users)
  │   ├→ /admin/audit (View all system activity)
  │   ├→ /admin/automation (Configure automation rules)
  │   ├→ /admin/llm-providers (Configure AI providers)
  │   └→ /admin/settings (System configuration)
  │
  └→ /settings/integrations
      ├→ Gmail integration
      ├→ Microsoft 365 integration
      └→ Calendar sync
```

#### Mobile Flow (Owner)

```
/m/owner/dashboard (Mobile Overview)
  │
  ├→ Today's KPIs
  │   ├→ Jobs completed
  │   ├→ Revenue today
  │   └→ Active techs
  │
  ├→ Quick Actions
  │   ├→ View today's jobs
  │   ├→ Check dispatch map
  │   └→ View unread conversations
  │
  └→ Escalations/Alerts
      └→ High-priority items requiring attention
```

**Key Features for Owner:**
- ✅ Full visibility into all operations
- ✅ Financial dashboards and reports
- ✅ User management (hire, fire, change roles)
- ✅ System configuration and integrations
- ✅ Marketing campaign creation
- ✅ Access to all customer conversations
- ✅ Can impersonate other roles (admin feature)

---

### 2. Admin Role

**Access Level:** High (similar to owner, no billing access)

**Desktop Landing:** `/inbox`
**Mobile Landing:** N/A (desktop-only role)

#### Desktop Flow (Admin)

```
Login → /inbox
  │
  ├→ All Owner desktop flows EXCEPT:
  │   ❌ Cannot delete owner account
  │   ❌ Cannot change owner role
  │   ❌ Limited billing/payment access
  │
  ├→ /jobs (Full access)
  ├→ /contacts (Full access)
  ├→ /analytics (Full access)
  ├→ /finance/dashboard (View-only or limited)
  ├→ /marketing (Full access)
  ├→ /dispatch/map (Full access)
  │
  └→ /admin/*
      ├→ /admin/users (Can manage non-owner users)
      ├→ /admin/audit (View audit logs)
      ├→ /admin/automation (Configure rules)
      └→ /admin/settings (Configure system)
```

**Key Features for Admin:**
- ✅ Manage jobs, contacts, conversations
- ✅ Create and assign work
- ✅ View analytics and reports
- ✅ Configure automation
- ✅ Manage techs and dispatchers
- ⚠️ Limited financial access
- ❌ Cannot manage owner account

---

### 3. Dispatcher Role

**Access Level:** Moderate (scheduling and dispatch focus)

**Desktop Landing:** `/dispatch/map`
**Mobile Landing:** `/m/office/dashboard`

#### Desktop Flow (Dispatcher)

```
Login → /dispatch/map (Primary Interface)
  │
  ├→ Real-Time Map View
  │   ├→ See all tech locations (GPS)
  │   ├→ See all scheduled jobs
  │   ├→ Drag-and-drop assign jobs to techs
  │   └→ View job details on map pins
  │
  ├→ /jobs
  │   ├→ View all jobs (not just assigned to them)
  │   ├→ Create new jobs
  │   ├→ Assign techs
  │   ├→ Update job schedules
  │   └→ Filter by status, tech, date
  │
  ├→ /contacts
  │   ├→ View contact list
  │   ├→ Add/edit contacts
  │   └→ View contact job history
  │
  ├→ /calendar
  │   ├→ Week/month view of scheduled jobs
  │   ├→ Tech availability
  │   └→ Drag-and-drop scheduling
  │
  └→ /inbox
      ├→ View customer conversations
      └→ Respond to scheduling requests
```

#### Mobile Flow (Dispatcher)

```
/m/office/dashboard
  │
  ├→ Today's Schedule
  │   ├→ List of all jobs
  │   └→ Tech assignments
  │
  ├→ Quick Actions
  │   ├→ Assign jobs
  │   ├→ Call techs
  │   └→ View map
  │
  └→ Alerts
      └→ Unassigned jobs
```

**Key Features for Dispatcher:**
- ✅ Real-time tech location tracking
- ✅ Drag-and-drop job assignment
- ✅ Schedule management (calendar view)
- ✅ View all jobs (not just assigned ones)
- ✅ Create jobs and contacts
- ✅ Respond to customer messages
- ❌ No admin/settings access
- ❌ No financial access
- ❌ No marketing access

**Dispatcher Permissions:**
```typescript
canViewAllJobs: true       // See all jobs, not just assigned
canManageUsers: false      // Cannot add/remove users
canClearEscalations: true  // Can handle escalations
```

---

### 4. Tech (Technician) Role

**Access Level:** Limited (field work focus)

**Desktop Landing:** `/tech/dashboard` (rarely used)
**Mobile Landing:** `/m/tech/dashboard` (PRIMARY)

#### Mobile Flow (Tech) - PRIMARY INTERFACE

```
/m/tech/dashboard (Today's Jobs)
  │
  ├→ Job List (Assigned to Me)
  │   ├→ Sort by scheduled time
  │   ├→ Color-coded by status
  │   └→ Swipe actions (start, complete, navigate)
  │
  ├→ Select Job → /m/tech/job/[id]
  │   │
  │   ├→ Job Details Card
  │   │   ├→ Customer info (name, address, phone)
  │   │   ├→ Job description/notes
  │   │   ├→ Scheduled time window
  │   │   └→ Special instructions
  │   │
  │   ├→ Actions
  │   │   ├→ "Navigate to Address" (Opens Maps)
  │   │   ├→ "Call Customer"
  │   │   ├→ "Start Job" → Updates status + captures GPS
  │   │   └→ "Mark Complete" → Capture signature + photos
  │   │
  │   ├→ Photo Gallery
  │   │   ├→ Take photos (before/after)
  │   │   ├→ Annotate photos
  │   │   └→ Auto-upload to cloud
  │   │
  │   ├→ Job Notes
  │   │   ├→ Add notes (voice or text)
  │   │   ├→ View past notes
  │   │   └→ Tag issues/materials used
  │   │
  │   ├→ Parts/Materials Used
  │   │   ├→ Add materials from list
  │   │   ├→ Quantity + cost
  │   │   └→ Auto-adds to invoice
  │   │
  │   ├→ Time Tracking
  │   │   ├→ Clock in/out
  │   │   ├→ Break timer
  │   │   └→ Automatic GPS verification
  │   │
  │   └→ Complete Job Workflow
  │       ├→ Review checklist (if configured)
  │       ├→ Capture customer signature
  │       ├→ Add final photos
  │       ├→ Add completion notes
  │       └→ Submit → Job status = "completed"
  │
  ├→ Quick Actions (Bottom Nav)
  │   ├→ "View Map" (all my jobs)
  │   ├→ "Call Dispatch"
  │   └→ "Emergency SOS"
  │
  └→ Offline Mode
      ├→ Jobs cached locally
      ├→ Photos queued for upload
      └→ Sync when online
```

**Tech Job Status Flow:**
```
scheduled → [Tech clicks "En Route"] → en_route
         ↓
[Tech clicks "Start Job" at location] → in_progress
         ↓
[Tech clicks "Complete" + signature] → completed
         ↓
[Office creates invoice] → invoiced
         ↓
[Payment received] → paid
```

**Key Features for Tech:**
- ✅ See only jobs assigned to them
- ✅ GPS location sharing (for dispatch tracking)
- ✅ Photo capture with compression
- ✅ Digital signature capture
- ✅ Offline-first (works without internet)
- ✅ Voice navigation support
- ✅ One-tap call customer/dispatch
- ❌ Cannot see other techs' jobs
- ❌ Cannot assign jobs
- ❌ No access to financials
- ❌ No access to admin features

**Tech Permissions:**
```typescript
canViewAllJobs: false      // Only see assigned jobs
canManageUsers: false      // Cannot manage users
isMobileRole: true         // Mobile-optimized interface
```

---

### 5. Sales Role

**Access Level:** Limited (sales focus)

**Desktop Landing:** N/A (mobile-only role)
**Mobile Landing:** `/m/sales/dashboard` (PRIMARY)

#### Mobile Flow (Sales)

```
/m/sales/dashboard (Sales Pipeline)
  │
  ├→ Leads List
  │   ├→ New leads (uncontacted)
  │   ├→ In progress (follow-up needed)
  │   ├→ Closed (won/lost)
  │   └→ Sort by priority/value
  │
  ├→ Select Contact → /m/sales/briefing/[contactId]
  │   │
  │   ├→ AI-Generated Briefing
  │   │   ├→ Contact background (past jobs, notes)
  │   │   ├→ Conversation history summary
  │   │   ├→ Recommended talking points
  │   │   └→ Pricing suggestions
  │   │
  │   ├→ Quick Actions
  │   │   ├→ "Call Contact"
  │   │   ├→ "Send Email"
  │   │   ├→ "Schedule Meeting"
  │   │   └→ "Create Job/Estimate"
  │   │
  │   └→ Meeting Notes
  │       ├→ Record meeting notes
  │       ├→ Voice transcription
  │       └→ Auto-save to CRM
  │
  ├→ Active Meeting → /m/sales/meeting/[id]
  │   │
  │   ├→ Meeting Details
  │   │   ├→ Contact info
  │   │   ├→ Meeting agenda
  │   │   └→ AI briefing
  │   │
  │   ├→ During Meeting
  │   │   ├→ Quick notes (voice/text)
  │   │   ├→ Access contact history
  │   │   ├→ Generate estimate
  │   │   └→ Schedule follow-up
  │   │
  │   └→ Post-Meeting
  │       ├→ Update lead status
  │       ├→ Create action items
  │       └→ AI summary of meeting
  │
  ├→ Today's Meetings
  │   ├→ Calendar view
  │   ├→ Meeting prep checklist
  │   └→ Travel time estimates
  │
  └→ Sales Analytics (Mobile)
      ├→ Today's calls/meetings
      ├→ This week's pipeline value
      └→ Conversion rate
```

**Key Features for Sales:**
- ✅ AI-powered meeting briefings
- ✅ Lead management and pipeline
- ✅ Quick access to contact history
- ✅ Mobile-optimized for field sales
- ✅ Voice note transcription
- ✅ Generate estimates on the fly
- ⚠️ Limited access to jobs (can create, can't complete)
- ❌ No access to financials
- ❌ No admin features

**Sales Permissions:**
```typescript
canViewAllJobs: false      // Only see jobs they created
canManageUsers: false      // Cannot manage users
isMobileRole: true         // Mobile-optimized interface
```

---

## Navigation Patterns

### Desktop Navigation (Sidebar)

**Location:** Left sidebar (always visible on desktop)

**Primary Navigation Items:**
```
┌─ Sidebar ────────────────────┐
│  [User Avatar]                │
│  [Company Name]               │
│  ─────────────────────        │
│  📥 Inbox                     │ ← Admin/Owner
│  📋 Jobs                      │ ← All Roles
│  👥 Contacts                  │ ← All Roles
│  📅 Calendar                  │ ← Dispatcher++
│  📊 Analytics                 │ ← Owner/Admin
│  💰 Finance                   │ ← Owner/Admin
│  📣 Marketing                 │ ← Owner/Admin
│  🗺️ Dispatch Map             │ ← Dispatcher++
│  ⚙️ Admin                     │ ← Owner/Admin
│  🔧 Settings                  │ ← All Roles
│  ─────────────────────        │
│  [Theme Toggle]               │
│  [User Menu]                  │
└───────────────────────────────┘
```

**Conditional Items:**
- **Inbox**: Only for Owner/Admin (main CRM interface)
- **Analytics**: Only for Owner/Admin
- **Finance**: Only for Owner/Admin (Admin may have limited access)
- **Marketing**: Only for Owner/Admin
- **Dispatch Map**: Dispatcher, Owner, Admin
- **Admin**: Only for Owner/Admin

### Mobile Navigation (Bottom Nav)

**Location:** Bottom navigation bar (thumb-friendly)

**Tech Bottom Nav:**
```
┌─────────────────────────────────────────┐
│                                         │
│        [Job Content Here]               │
│                                         │
└─────────────────────────────────────────┘
  🏠 Home  📋 Jobs  🗺️ Map  👤 Profile
```

**Sales Bottom Nav:**
```
┌─────────────────────────────────────────┐
│                                         │
│        [Lead Content Here]              │
│                                         │
└─────────────────────────────────────────┘
  🏠 Home  🎯 Leads  📅 Meetings  👤 Profile
```

### Breadcrumbs

**Desktop:** Used for deep navigation paths
```
Home > Jobs > Job #1234 > Edit
```

**Mobile:** Minimal (use back button instead)

---

## Permission Matrix

| Feature | Owner | Admin | Dispatcher | Tech | Sales |
|---------|-------|-------|------------|------|-------|
| **User Management** |
| Create users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ⚠️ (not owner) | ❌ | ❌ | ❌ |
| Change roles | ✅ | ⚠️ (not owner) | ❌ | ❌ | ❌ |
| **Jobs** |
| View all jobs | ✅ | ✅ | ✅ | ❌ | ❌ |
| View assigned jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create jobs | ✅ | ✅ | ✅ | ❌ | ✅ |
| Assign techs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update job status | ✅ | ✅ | ✅ | ✅ | ⚠️ (limited) |
| Complete jobs | ✅ | ✅ | ❌ | ✅ | ❌ |
| Delete jobs | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Contacts** |
| View contacts | ✅ | ✅ | ✅ | ⚠️ (job-related) | ✅ |
| Create contacts | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit contacts | ✅ | ✅ | ✅ | ❌ | ✅ |
| Delete contacts | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Finance** |
| View revenue | ✅ | ⚠️ (limited) | ❌ | ❌ | ❌ |
| Create invoices | ✅ | ✅ | ❌ | ❌ | ❌ |
| Mark invoices paid | ✅ | ✅ | ❌ | ❌ | ❌ |
| View payments | ✅ | ⚠️ (limited) | ❌ | ❌ | ❌ |
| **Analytics** |
| View dashboards | ✅ | ✅ | ❌ | ❌ | ⚠️ (sales only) |
| Export reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Marketing** |
| Create campaigns | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tag contacts | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Admin** |
| Configure system | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage integrations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure AI | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Dispatch** |
| View map | ✅ | ✅ | ✅ | ⚠️ (own location) | ⚠️ (own location) |
| Assign jobs on map | ✅ | ✅ | ✅ | ❌ | ❌ |
| Track techs | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Field Operations** |
| GPS tracking | ❌ | ❌ | ❌ | ✅ | ✅ |
| Photo capture | ❌ | ❌ | ❌ | ✅ | ⚠️ (limited) |
| Signature capture | ❌ | ❌ | ❌ | ✅ | ❌ |
| Offline mode | ❌ | ❌ | ❌ | ✅ | ✅ |

**Legend:**
- ✅ Full Access
- ⚠️ Limited/Conditional Access
- ❌ No Access

---

## UI/UX Verification Checklist

Use this checklist to verify that all role-based flows are correctly implemented.

### General (All Roles)

#### Authentication
- [ ] Login page loads at `/login`
- [ ] After login, user is redirected to their role-specific landing page
- [ ] Logout redirects to `/login`
- [ ] Session persists across page refreshes
- [ ] Invalid credentials show clear error message

#### Role-Based Routing
- [ ] Owner (desktop) → redirects to `/inbox`
- [ ] Owner (mobile) → redirects to `/m/owner/dashboard`
- [ ] Admin → redirects to `/inbox`
- [ ] Dispatcher (desktop) → redirects to `/dispatch/map`
- [ ] Dispatcher (mobile) → redirects to `/m/office/dashboard`
- [ ] Tech → redirects to `/m/tech/dashboard`
- [ ] Sales → redirects to `/m/sales/dashboard`

#### Navigation
- [ ] Desktop: Sidebar navigation displays correct items for role
- [ ] Mobile: Bottom navigation bar displays correct items for role
- [ ] Breadcrumbs show correct path on desktop
- [ ] Back button works correctly on mobile
- [ ] Active nav item is visually highlighted

#### Responsive Design
- [ ] Desktop layout works on screens ≥1024px
- [ ] Mobile layout works on screens ≤768px
- [ ] Tablet layout adapts appropriately (768px - 1024px)
- [ ] No horizontal scrolling on any screen size
- [ ] Touch targets are ≥44px on mobile

---

### Owner Role Verification

#### Desktop Access
- [ ] Can access `/inbox` (main dashboard)
- [ ] Can access `/jobs` (view/create/edit all jobs)
- [ ] Can access `/contacts` (full CRUD)
- [ ] Can access `/calendar`
- [ ] Can access `/analytics`
- [ ] Can access `/finance/dashboard`
- [ ] Can access `/finance/payments`
- [ ] Can access `/marketing/campaigns`
- [ ] Can access `/marketing/email-templates`
- [ ] Can access `/marketing/tags`
- [ ] Can access `/dispatch/map`
- [ ] Can access `/admin/users`
- [ ] Can access `/admin/audit`
- [ ] Can access `/admin/automation`
- [ ] Can access `/admin/llm-providers`
- [ ] Can access `/admin/settings`
- [ ] Can access `/settings/integrations`

#### Mobile Access
- [ ] Can access `/m/owner/dashboard`
- [ ] Dashboard shows today's KPIs
- [ ] Can drill down into jobs/contacts
- [ ] Can view escalations/alerts

#### Permissions
- [ ] Can create/edit/delete users (including other owners)
- [ ] Can change user roles
- [ ] Can view all financial data
- [ ] Can configure system settings
- [ ] Can manage integrations

---

### Admin Role Verification

#### Desktop Access
- [ ] Can access `/inbox`
- [ ] Can access `/jobs` (full access)
- [ ] Can access `/contacts` (full access)
- [ ] Can access `/calendar`
- [ ] Can access `/analytics`
- [ ] Can access `/finance/dashboard` (view-only or limited)
- [ ] Can access `/marketing/*` (full access)
- [ ] Can access `/dispatch/map`
- [ ] Can access `/admin/users` (cannot delete owner)
- [ ] Can access `/admin/audit`
- [ ] Can access `/admin/automation`
- [ ] Can access `/admin/settings`

#### Restrictions
- [ ] Cannot delete owner account
- [ ] Cannot change owner role
- [ ] Cannot access full financial reports (if configured)
- [ ] Sidebar does NOT show items they can't access

---

### Dispatcher Role Verification

#### Desktop Access
- [ ] Default landing page is `/dispatch/map`
- [ ] Can access `/jobs` (view all, create, assign)
- [ ] Can access `/contacts` (view/create/edit)
- [ ] Can access `/calendar`
- [ ] Can access `/inbox` (view/respond to messages)

#### Dispatch Map Features
- [ ] Map displays all tech locations (GPS markers)
- [ ] Map displays all scheduled jobs (pins)
- [ ] Can drag-and-drop jobs onto techs
- [ ] Can filter jobs by status
- [ ] Can filter jobs by tech
- [ ] Job details popup on map click
- [ ] Real-time updates when techs move

#### Mobile Access
- [ ] Can access `/m/office/dashboard`
- [ ] Shows today's schedule
- [ ] Can assign jobs on mobile
- [ ] Can view map on mobile

#### Restrictions
- [ ] Cannot access `/admin/*`
- [ ] Cannot access `/finance/*`
- [ ] Cannot access `/marketing/*`
- [ ] Cannot access `/analytics`
- [ ] Sidebar does NOT show restricted items

---

### Tech Role Verification

#### Mobile Primary Interface
- [ ] Default landing page is `/m/tech/dashboard`
- [ ] Dashboard shows only jobs assigned to this tech
- [ ] Jobs are sorted by scheduled time
- [ ] Jobs have color-coded status badges
- [ ] Can swipe jobs for quick actions

#### Job Detail Page (`/m/tech/job/[id]`)
- [ ] Customer info displays (name, address, phone)
- [ ] Job description/notes visible
- [ ] Scheduled time window shown
- [ ] Special instructions highlighted (if any)

#### Actions
- [ ] "Navigate to Address" button opens Maps app
- [ ] "Call Customer" button initiates phone call
- [ ] "Start Job" button updates status to `in_progress`
- [ ] "Start Job" captures GPS location
- [ ] "Mark Complete" button triggers completion workflow

#### Photo Capture
- [ ] Can take photos using device camera
- [ ] Photos are compressed before upload
- [ ] Can add captions to photos
- [ ] Can annotate photos (draw/highlight)
- [ ] Photos upload automatically when online
- [ ] Photos queue for upload when offline

#### Signature Capture
- [ ] Signature pad loads on job completion
- [ ] Can clear and re-sign
- [ ] Signature is saved as image
- [ ] Customer name can be typed below signature

#### Notes
- [ ] Can add text notes
- [ ] Can add voice notes (transcribed to text)
- [ ] Notes are timestamped
- [ ] Can view history of notes

#### Parts/Materials
- [ ] Can add materials used
- [ ] Can specify quantity
- [ ] Can specify unit cost (if known)
- [ ] Materials auto-add to invoice

#### Time Tracking
- [ ] Can clock in/out
- [ ] Break timer available
- [ ] GPS location captured on clock in/out
- [ ] Total time displayed

#### Offline Mode
- [ ] Jobs load when offline (cached)
- [ ] Can add notes offline
- [ ] Can take photos offline
- [ ] Changes sync when back online
- [ ] Visual indicator when offline

#### Bottom Navigation
- [ ] "Home" button returns to dashboard
- [ ] "Jobs" button shows job list
- [ ] "Map" button shows job locations
- [ ] "Profile" button shows tech profile/settings

#### Restrictions
- [ ] Cannot see jobs assigned to other techs
- [ ] Cannot assign jobs
- [ ] Cannot access financials
- [ ] Cannot access admin features
- [ ] Cannot create users

---

### Sales Role Verification

#### Mobile Primary Interface
- [ ] Default landing page is `/m/sales/dashboard`
- [ ] Shows leads pipeline
- [ ] Leads sorted by priority/status
- [ ] Can filter leads (new, in progress, closed)

#### Meeting Briefing (`/m/sales/briefing/[contactId]`)
- [ ] AI-generated briefing displays
- [ ] Shows contact background
- [ ] Shows conversation history summary
- [ ] Shows recommended talking points
- [ ] Shows pricing suggestions

#### Meeting Detail (`/m/sales/meeting/[id]`)
- [ ] Meeting details visible
- [ ] Contact info accessible
- [ ] Can take notes during meeting
- [ ] Can record voice notes
- [ ] Can generate estimates on the fly

#### Quick Actions
- [ ] "Call Contact" initiates phone call
- [ ] "Send Email" opens email composer
- [ ] "Schedule Meeting" opens calendar
- [ ] "Create Job/Estimate" opens creation form

#### Post-Meeting
- [ ] Can update lead status
- [ ] Can create action items
- [ ] AI meeting summary generated

#### Restrictions
- [ ] Cannot complete jobs (only create)
- [ ] Cannot access financials
- [ ] Cannot access admin features
- [ ] Cannot view other sales reps' leads (unless configured)

---

## Common UI/UX Issues to Check

### Navigation Issues
- [ ] Sidebar items don't disappear for restricted roles
- [ ] Mobile bottom nav shows wrong items
- [ ] Breadcrumbs link to inaccessible pages
- [ ] Back button causes errors

### Permission Issues
- [ ] Role can access pages they shouldn't
- [ ] Role cannot access pages they should
- [ ] Actions show that aren't permitted (e.g., "Delete" for dispatcher)
- [ ] Forms submit successfully but action fails

### Responsive Design Issues
- [ ] Desktop layout breaks on small screens
- [ ] Mobile layout wastes space on large screens
- [ ] Touch targets too small on mobile
- [ ] Text too small to read on mobile
- [ ] Horizontal scrolling required

### Mobile PWA Issues
- [ ] PWA doesn't install on mobile
- [ ] Offline mode doesn't work
- [ ] GPS location not captured
- [ ] Photos don't upload
- [ ] Signature pad doesn't work on touch

### Performance Issues
- [ ] Pages load slowly (>3 seconds)
- [ ] Map is laggy with multiple markers
- [ ] Photo uploads timeout
- [ ] Infinite scroll doesn't work

---

## Testing Scenarios by Role

### Owner Testing Scenarios

1. **Daily Operations**
   - [ ] Check inbox for new messages
   - [ ] Review today's jobs
   - [ ] Assign unassigned jobs
   - [ ] Check financial dashboard
   - [ ] View analytics

2. **User Management**
   - [ ] Create new tech user
   - [ ] Change dispatcher role to admin
   - [ ] Delete inactive user

3. **System Configuration**
   - [ ] Update company settings
   - [ ] Configure automation rule
   - [ ] Add integration (Gmail)

### Dispatcher Testing Scenarios

1. **Morning Dispatch**
   - [ ] Open `/dispatch/map`
   - [ ] Review all jobs for today
   - [ ] Assign jobs to techs
   - [ ] Optimize routes

2. **Real-Time Management**
   - [ ] Track tech locations on map
   - [ ] Reassign job to different tech
   - [ ] Create urgent job and assign immediately

3. **Customer Communication**
   - [ ] View inbox messages
   - [ ] Respond to scheduling request
   - [ ] Update customer on ETA

### Tech Testing Scenarios

1. **Morning Routine**
   - [ ] Open `/m/tech/dashboard`
   - [ ] Review today's jobs
   - [ ] Navigate to first job

2. **Job Execution**
   - [ ] Arrive at job location
   - [ ] Click "Start Job"
   - [ ] Take before photos
   - [ ] Complete work
   - [ ] Take after photos
   - [ ] Add notes about work done
   - [ ] Log materials used
   - [ ] Get customer signature
   - [ ] Mark job complete

3. **Offline Scenario**
   - [ ] Put device in airplane mode
   - [ ] Access job details (should work)
   - [ ] Take photos (should queue)
   - [ ] Add notes (should queue)
   - [ ] Go back online
   - [ ] Verify everything synced

### Sales Testing Scenarios

1. **Pre-Meeting Prep**
   - [ ] Open `/m/sales/dashboard`
   - [ ] Select lead for today's meeting
   - [ ] Open AI briefing
   - [ ] Review talking points

2. **During Meeting**
   - [ ] Take meeting notes
   - [ ] Record voice note
   - [ ] Generate estimate
   - [ ] Schedule follow-up

3. **Post-Meeting**
   - [ ] Update lead status
   - [ ] Create action items
   - [ ] Review AI meeting summary

---

## Verification Sign-Off

**UI/UX Team:** After completing verification, sign off below.

| Role | Flows Verified | Issues Found | Sign-Off |
|------|----------------|--------------|----------|
| Owner (Desktop) | ☐ | | |
| Owner (Mobile) | ☐ | | |
| Admin | ☐ | | |
| Dispatcher (Desktop) | ☐ | | |
| Dispatcher (Mobile) | ☐ | | |
| Tech (Mobile) | ☐ | | |
| Sales (Mobile) | ☐ | | |

**Date:** _____________

**Notes/Issues:**
```
[List any issues found during verification]
```

---

## Additional Resources

- **Role Routes Configuration:** `/lib/auth/role-routes.ts`
- **Permission Helpers:** `/lib/auth/role-routes.ts` (functions: `canManageUsers`, `canViewAllJobs`, etc.)
- **Desktop Layout:** `/app/(dashboard)/layout.tsx`
- **Mobile Layout:** `/app/m/layout.tsx`
- **Tech Mobile Layout:** `/app/m/tech/layout.tsx`

---

**End of UI/UX Role Flows Documentation**
