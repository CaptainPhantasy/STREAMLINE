# Mobile Workflows Analysis & Implementation Plan
## For Tech & Sales Mobile PWA

**Date:** November 27, 2025  
**Issue:** Only dashboard pages exist - navigation and additional pages need implementation

---

## 📋 Key Documents Found

1. **`UI_UX_ROLE_FLOWS.md`** - Complete workflow documentation (1053 lines)
   - Tech mobile flows (lines 333-433)
   - Sales mobile flows (lines 437-519)
   - Navigation patterns (lines 523-591)
   - UI/UX verification checklist

2. **`docs/USER_ROLE_PAGE_FLOWS_UIUX_VERIFICATION.md`** - Detailed page flows (1320 lines)
   - Tech role page flows (lines 133-193)
   - Sales role page flows (lines 196-247)
   - Mobile responsiveness requirements

3. **`shared-docs/mobile-pwa-swarm.md`** - Implementation status
   - Shows what was completed in Wave 1 & 2
   - Lists files created

---

## 🔍 Current State Analysis

### Pages That Exist ✅

**Tech Mobile:**
- ✅ `/app/m/tech/dashboard/page.tsx` - Dashboard (job list)
- ✅ `/app/m/tech/job/[id]/page.tsx` - Job details page

**Sales Mobile:**
- ✅ `/app/m/sales/dashboard/page.tsx` - Dashboard (meetings list)
- ✅ `/app/m/sales/briefing/[contactId]/page.tsx` - AI briefing page
- ✅ `/app/m/sales/meeting/[id]/page.tsx` - Meeting details page

### What's Missing ❌

1. **Navigation Components**
   - Bottom navigation bar (Tech & Sales)
   - Mobile layout with navigation
   - Breadcrumbs/back navigation

2. **Missing Pages/Features**
   - Tech: Map view of jobs
   - Tech: Profile/settings page
   - Sales: Lead management pages
   - Sales: Create new meeting page
   - Sales: Voice note page

3. **Navigation Links**
   - Dashboard pages have links, but navigation may not be working
   - Bottom nav not implemented
   - Missing route handlers

---

## 📱 Tech Mobile Workflow (From Documentation)

### Expected Flow:

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
  │   ├→ "View Map" (all my jobs) → /m/tech/map
  │   ├→ "Call Dispatch"
  │   └→ "Emergency SOS"
  │
  └→ Offline Mode
      ├→ Jobs cached locally
      ├→ Photos queued for upload
      └→ Sync when online
```

### Bottom Navigation (Expected):
```
┌─────────────────────────────────────────┐
│                                         │
│        [Job Content Here]               │
│                                         │
└─────────────────────────────────────────┘
  🏠 Home  📋 Jobs  🗺️ Map  👤 Profile
```

**Routes Needed:**
- `/m/tech/dashboard` ✅ (exists)
- `/m/tech/job/[id]` ✅ (exists)
- `/m/tech/map` ❌ (missing - shows all jobs on map)
- `/m/tech/profile` ❌ (missing - tech profile/settings)

---

## 💼 Sales Mobile Workflow (From Documentation)

### Expected Flow:

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

### Bottom Navigation (Expected):
```
┌─────────────────────────────────────────┐
│                                         │
│        [Lead Content Here]              │
│                                         │
└─────────────────────────────────────────┘
  🏠 Home  🎯 Leads  📅 Meetings  👤 Profile
```

**Routes Needed:**
- `/m/sales/dashboard` ✅ (exists)
- `/m/sales/briefing/[contactId]` ✅ (exists)
- `/m/sales/meeting/[id]` ✅ (exists)
- `/m/sales/meeting/new` ❌ (missing - create new meeting)
- `/m/sales/voice-note` ❌ (missing - quick voice memo)
- `/m/sales/leads` ❌ (missing - leads pipeline view)
- `/m/sales/profile` ❌ (missing - sales profile/settings)

---

## 🚨 Critical Missing Components

### 1. Bottom Navigation Bar
**Location:** Should be in `/app/m/layout.tsx` or role-specific layouts

**Tech Bottom Nav:**
- 🏠 Home → `/m/tech/dashboard`
- 📋 Jobs → `/m/tech/dashboard` (same, but could filter)
- 🗺️ Map → `/m/tech/map` (NEW - shows jobs on map)
- 👤 Profile → `/m/tech/profile` (NEW)

**Sales Bottom Nav:**
- 🏠 Home → `/m/sales/dashboard`
- 🎯 Leads → `/m/sales/leads` (NEW - leads pipeline)
- 📅 Meetings → `/m/sales/dashboard` (filtered to meetings)
- 👤 Profile → `/m/sales/profile` (NEW)

### 2. Mobile Layout with Navigation
**File:** `/app/m/layout.tsx` or `/app/m/tech/layout.tsx` and `/app/m/sales/layout.tsx`

**Should Include:**
- Bottom navigation bar
- Header with back button (when not on dashboard)
- Offline indicator
- Sync status indicator

### 3. Missing Pages

**Tech:**
- `/app/m/tech/map/page.tsx` - Map view of all assigned jobs
- `/app/m/tech/profile/page.tsx` - Tech profile and settings

**Sales:**
- `/app/m/sales/leads/page.tsx` - Leads pipeline view
- `/app/m/sales/meeting/new/page.tsx` - Create new meeting
- `/app/m/sales/voice-note/page.tsx` - Quick voice memo
- `/app/m/sales/profile/page.tsx` - Sales profile and settings

---

## 📝 Implementation Checklist

### Phase 1: Navigation Infrastructure
- [ ] Create bottom navigation component (`components/mobile/bottom-nav.tsx`)
- [ ] Update `/app/m/layout.tsx` to include bottom nav
- [ ] Create role-specific layouts if needed:
  - [ ] `/app/m/tech/layout.tsx` (with tech bottom nav)
  - [ ] `/app/m/sales/layout.tsx` (with sales bottom nav)
- [ ] Add back button to header (when not on dashboard)
- [ ] Test navigation between pages

### Phase 2: Missing Tech Pages
- [ ] Create `/app/m/tech/map/page.tsx`
  - Shows all assigned jobs on map
  - Click job to navigate to job details
  - GPS location tracking
- [ ] Create `/app/m/tech/profile/page.tsx`
  - Tech profile info
  - Settings (notifications, GPS, etc.)
  - Logout button

### Phase 3: Missing Sales Pages
- [ ] Create `/app/m/sales/leads/page.tsx`
  - Leads pipeline (new, in progress, closed)
  - Filter by status
  - Click lead to view details/briefing
- [ ] Create `/app/m/sales/meeting/new/page.tsx`
  - Form to create new meeting
  - Select contact
  - Set date/time
  - Add notes
- [ ] Create `/app/m/sales/voice-note/page.tsx`
  - Voice recording interface
  - Transcription
  - Save to notes
- [ ] Create `/app/m/sales/profile/page.tsx`
  - Sales profile info
  - Settings
  - Logout button

### Phase 4: Enhanced Features
- [ ] Add offline indicator to all pages
- [ ] Add sync status indicator
- [ ] Implement swipe gestures (if needed)
- [ ] Add pull-to-refresh on dashboards
- [ ] Test all navigation flows

---

## 🔗 Key Documentation References

### Primary Workflow Documents:
1. **`UI_UX_ROLE_FLOWS.md`** (lines 333-519)
   - Complete Tech mobile flow (lines 340-400)
   - Complete Sales mobile flow (lines 444-500)
   - Navigation patterns (lines 523-591)

2. **`docs/USER_ROLE_PAGE_FLOWS_UIUX_VERIFICATION.md`**
   - Tech role page flows (lines 133-193)
   - Sales role page flows (lines 196-247)
   - Mobile responsiveness (lines 991-1050)

### Implementation Status:
3. **`shared-docs/mobile-pwa-swarm.md`**
   - Shows what was completed
   - Lists files created

---

## 🎯 Next Steps

1. **Immediate:** Review current dashboard pages to ensure links work
2. **Priority 1:** Implement bottom navigation bar
3. **Priority 2:** Create missing pages (map, profile, leads, etc.)
4. **Priority 3:** Test complete navigation flows
5. **Priority 4:** Add offline/sync indicators

---

## 📊 Current vs Expected

| Feature | Tech | Sales | Status |
|---------|------|-------|--------|
| Dashboard | ✅ | ✅ | Complete |
| Job/Meeting Details | ✅ | ✅ | Complete |
| AI Briefing | N/A | ✅ | Complete |
| Bottom Navigation | ❌ | ❌ | **MISSING** |
| Map View | ❌ | N/A | **MISSING** |
| Profile/Settings | ❌ | ❌ | **MISSING** |
| Leads Pipeline | N/A | ❌ | **MISSING** |
| Create Meeting | N/A | ❌ | **MISSING** |
| Voice Notes | N/A | ❌ | **MISSING** |

---

**Summary:** The core dashboard and detail pages exist, but navigation infrastructure (bottom nav) and several supporting pages are missing. The workflow documentation is comprehensive and provides clear specifications for what needs to be built.

