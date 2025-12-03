# Dispatch Map Dashboard - Phase 3 Implementation Spec

**Date:** 2025-11-27
**Status:** Ready for Implementation
**Dependencies:** Phase 1 & 2 Complete ✅

---

## Overview

Phase 3 adds interactive features to the dispatch map dashboard, including detailed panels for techs and jobs, sidebar with filters, job assignment interface, and job markers on the map.

## Goals

1. **Enhanced Tech Details** - Rich panel with job history, stats, contact info
2. **Job Visibility** - Show unassigned and assigned jobs on map
3. **Distance Calculations** - Show distance from tech to job
4. **Assignment Interface** - Allow dispatchers to assign techs to jobs
5. **Filtering & Search** - Sidebar to filter techs by status, search by name

---

## Component Architecture

### 1. TechDetailPanel Component

**Location:** `components/dispatch/TechDetailPanel.tsx`

**Purpose:** Displays comprehensive tech information when marker clicked

**Props:**
```typescript
interface TechDetailPanelProps {
  tech: TechLocation
  onClose: () => void
  onAssignJob: (techId: string) => void
  onNavigate: (lat: number, lng: number) => void
}
```

**Features:**
- Tech name, photo, role, status
- Current job details (if on job)
- Last known location with timestamp
- GPS accuracy indicator
- "Navigate to Tech" button (opens Google Maps)
- "Assign Job" button
- Recent activity timeline (last 5 GPS logs)
- Stats: jobs completed today, average job time
- Contact tech button (opens phone/SMS)

**Design:**
- Slide-in panel from right (mobile: bottom sheet)
- Dark theme to match dashboard
- Uses shadcn/ui Card, Badge, Button components
- Smooth transitions

**API Endpoints Needed:**
- GET `/api/dispatch/techs/[id]/activity` - Recent GPS logs
- GET `/api/dispatch/techs/[id]/stats` - Daily stats

---

### 2. JobDetailPanel Component

**Location:** `components/dispatch/JobDetailPanel.tsx`

**Purpose:** Displays job information when job marker clicked

**Props:**
```typescript
interface JobDetailPanelProps {
  job: JobLocation
  onClose: () => void
  onAssignTech: (jobId: string) => void
  onNavigate: (lat: number, lng: number) => void
  availableTechs: TechLocation[]
}
```

**Features:**
- Job ID, description, customer name
- Service address
- Job status (unassigned, assigned, en_route, in_progress)
- Scheduled time
- Priority indicator
- Distance calculations to all available techs
- "Assign Tech" button (shows tech selection)
- "Navigate to Job" button
- Estimated time to arrival for each tech
- Customer contact info

**Distance Calculation:**
- Use existing `lib/utils/distance.ts` `calculateDistance()` function
- Show distance in miles (mi) or kilometers (km)
- Sort techs by nearest first
- Color-code based on distance:
  - Green: < 5 miles
  - Yellow: 5-10 miles
  - Orange: 10-20 miles
  - Red: > 20 miles

**Design:**
- Slide-in panel from right (stacks below TechDetailPanel if both open)
- Shows tech recommendations sorted by distance
- Displays travel time estimate (distance / average speed)

**API Endpoints Needed:**
- GET `/api/dispatch/jobs/active` - All active jobs with locations
- POST `/api/dispatch/jobs/[id]/assign` - Assign tech to job

---

### 3. TechListSidebar Component

**Location:** `components/dispatch/TechListSidebar.tsx`

**Purpose:** Sidebar showing all techs with filters and search

**Props:**
```typescript
interface TechListSidebarProps {
  techs: TechLocation[]
  onTechClick: (tech: TechLocation) => void
  onTechHover: (techId: string | null) => void
  selectedTechId: string | null
}
```

**Features:**
- Collapsible sidebar (left side, ~300px width)
- Search input (filters by tech name)
- Status filter chips (All, On Job, En Route, Idle, Offline)
- Tech list with:
  - Name, status badge
  - Current job (if applicable)
  - Last GPS timestamp
  - Distance to hovered job (if job hovered)
- Sort options:
  - By name (A-Z)
  - By status
  - By distance (to selected job)
- Collapse/expand button

**Interactions:**
- Click tech → select and pan map to tech
- Hover tech → highlight marker on map
- Hover job marker → show distance in tech list

**Design:**
- Dark theme sidebar
- Fixed height, scrollable list
- Smooth animations
- Mobile: slide-out drawer (hamburger menu)

**State Management:**
- Use React Context or Zustand for selected tech/job
- Sync with map marker selection

---

### 4. AssignTechDialog Component

**Location:** `components/dispatch/AssignTechDialog.tsx`

**Purpose:** Modal dialog for assigning a tech to a job

**Props:**
```typescript
interface AssignTechDialogProps {
  open: boolean
  onClose: () => void
  job: JobLocation
  techs: TechLocation[]
  onAssign: (jobId: string, techId: string) => Promise<void>
}
```

**Features:**
- Modal overlay
- Job details at top (address, description)
- Tech selection list with:
  - Tech name, status, current job
  - Distance from job
  - ETA calculation
  - "Assign" button per tech
- Filter to show only idle techs
- "Assign Nearest Available" button
- Confirmation message after assignment

**Validation:**
- Can't assign tech already on job (show warning)
- Can't assign offline tech (disabled)
- Confirm if assigning tech that's en_route

**Design:**
- shadcn/ui Dialog component
- Responsive (mobile-friendly)
- Loading state during assignment
- Success/error toast notifications

**API Integration:**
- POST `/api/dispatch/jobs/[id]/assign`
```typescript
{
  jobId: string
  techId: string
  notifyTech: boolean
}
```

---

### 5. Job Markers on Map

**Location:** `app/(dashboard)/dispatch/map/page.tsx` (modify existing)

**Features:**
- Fetch active jobs with locations
- Display job markers on map:
  - Red = Unassigned (high priority)
  - Orange = Assigned (not started)
  - Blue = En Route (tech traveling)
  - Green = In Progress (tech on site)
- Different marker icon from tech markers (pin vs circle)
- Click job marker → open JobDetailPanel
- Hover job marker → show tech distances in sidebar

**Job Data:**
```typescript
interface JobLocation {
  id: string
  description: string
  address: string
  customerName: string
  status: 'unassigned' | 'assigned' | 'en_route' | 'in_progress' | 'completed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledTime: string
  assignedTechId?: string
  location?: {
    lat: number
    lng: number
  }
}
```

**Implementation:**
- Add job fetching to existing `fetchTechs()` function
- Create separate state for jobs: `const [jobs, setJobs] = useState<JobLocation[]>([])`
- Add Supabase real-time subscription for job status changes
- Render job markers alongside tech markers
- Handle marker clustering if >20 jobs visible

---

## API Endpoints to Create

### 1. GET /api/dispatch/jobs/active

**Purpose:** Fetch all active jobs for the dispatch map

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "description": "Water heater repair",
      "address": "123 Main St, Indianapolis, IN",
      "customerName": "John Doe",
      "status": "unassigned",
      "priority": "high",
      "scheduledTime": "2025-11-27T14:00:00Z",
      "assignedTechId": null,
      "location": {
        "lat": 39.770000,
        "lng": -86.160000
      }
    }
  ]
}
```

**Query Logic:**
- Fetch jobs with status IN ('unassigned', 'assigned', 'en_route', 'in_progress')
- Join with contacts for address
- Geocode address if lat/lng not in database
- Filter by account_id for multi-tenant

### 2. GET /api/dispatch/techs/[id]/activity

**Purpose:** Fetch recent GPS logs for a tech

**Response:**
```json
{
  "activity": [
    {
      "id": "uuid",
      "latitude": 39.768403,
      "longitude": -86.158068,
      "accuracy": 10,
      "timestamp": "2025-11-27T10:30:00Z",
      "eventType": "auto",
      "jobId": "uuid"
    }
  ]
}
```

### 3. GET /api/dispatch/techs/[id]/stats

**Purpose:** Fetch daily performance stats for a tech

**Response:**
```json
{
  "stats": {
    "jobsCompletedToday": 5,
    "averageJobTimeMinutes": 45,
    "totalDistanceTraveledMiles": 32.5,
    "hoursWorkedToday": 7.5
  }
}
```

### 4. POST /api/dispatch/jobs/[id]/assign

**Purpose:** Assign a tech to a job

**Request:**
```json
{
  "techId": "uuid",
  "notifyTech": true
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "assignedTechId": "uuid",
    "status": "assigned"
  }
}
```

**Side Effects:**
- Update job.assigned_tech_id
- Update job.status to 'assigned'
- Send notification to tech (if notifyTech = true)
- Create audit log entry

---

## Database Schema Updates

### Jobs Table - Add Location Fields

```sql
ALTER TABLE jobs
ADD COLUMN latitude NUMERIC(10, 8),
ADD COLUMN longitude NUMERIC(11, 8),
ADD COLUMN geocoded_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_jobs_location ON jobs(latitude, longitude) WHERE latitude IS NOT NULL;
```

### Optional: Geocoding Cache Table

```sql
CREATE TABLE geocode_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL UNIQUE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy TEXT,
  geocoded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geocode_cache_address ON geocode_cache(address);
```

---

## Geocoding Strategy

### Option 1: Google Maps Geocoding API (Recommended)

**Pros:**
- Already have Google Maps API key
- Most accurate
- Handles addresses worldwide

**Cons:**
- Costs money after free tier (40,000 requests/month free)

**Implementation:**
```typescript
async function geocodeAddress(address: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  )
  const data = await response.json()
  return {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng
  }
}
```

### Option 2: Nominatim (OpenStreetMap) - Free Alternative

**Pros:**
- 100% free
- No API key required

**Cons:**
- Less accurate than Google
- Rate limited (1 request/second)

---

## Real-Time Updates

### Subscribe to Job Status Changes

Add to `app/(dashboard)/dispatch/map/page.tsx`:

```typescript
// Subscribe to job updates
const jobChannel = supabase
  .channel('dispatch_job_updates')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'jobs'
  }, (payload) => {
    // Update jobs state
    console.log('🔔 Job update received:', payload)
  })
  .subscribe()
```

---

## State Management

### Option 1: React Context (Recommended for this scale)

Create `contexts/DispatchContext.tsx`:
```typescript
interface DispatchContextType {
  techs: TechLocation[]
  jobs: JobLocation[]
  selectedTech: TechLocation | null
  selectedJob: JobLocation | null
  setSelectedTech: (tech: TechLocation | null) => void
  setSelectedJob: (job: JobLocation | null) => void
  hoveredJobId: string | null
  setHoveredJobId: (id: string | null) => void
}
```

### Option 2: Zustand (if more complex state needed)

---

## Testing Checklist

### Functionality Tests
- [ ] Tech markers clickable and show TechDetailPanel
- [ ] Job markers clickable and show JobDetailPanel
- [ ] Distance calculations accurate (test with known addresses)
- [ ] Sidebar filters work (status filter, search)
- [ ] Job assignment works and updates database
- [ ] Real-time updates for job status changes
- [ ] "Assign Nearest Tech" automation works
- [ ] Mobile responsive (all panels, sidebar)

### Edge Cases
- [ ] No available techs (all on job) - show warning
- [ ] Job without location (no lat/lng) - don't show marker
- [ ] Tech goes offline during assignment - handle gracefully
- [ ] Multiple dispatchers assign same job - conflict resolution
- [ ] Poor GPS accuracy - show warning indicator

### Performance Tests
- [ ] Map performance with 50+ markers
- [ ] Real-time updates don't cause lag
- [ ] Sidebar scrolling smooth with 20+ techs
- [ ] Distance calculations efficient (<100ms)

---

## User Experience Improvements

1. **Visual Feedback**
   - Loading spinners during API calls
   - Toast notifications for successful assignments
   - Error messages for failed operations
   - Optimistic UI updates (show change before API confirms)

2. **Keyboard Shortcuts**
   - `Esc` - Close all panels
   - `/` - Focus search
   - `R` - Refresh map
   - `F` - Toggle filters

3. **Accessibility**
   - ARIA labels for all buttons
   - Keyboard navigation support
   - Screen reader announcements
   - High contrast mode support

---

## Success Criteria

Phase 3 is complete when:

1. ✅ Tech detail panel shows comprehensive tech info
2. ✅ Job markers visible on map with status colors
3. ✅ Distance calculations show in both panels
4. ✅ Sidebar allows filtering and searching techs
5. ✅ Job assignment dialog works end-to-end
6. ✅ Real-time job updates work
7. ✅ Mobile responsive
8. ✅ All API endpoints functional
9. ✅ Database schema updated
10. ✅ Comprehensive testing completed

---

## Timeline Estimate

- TechDetailPanel: ~2-3 hours
- JobDetailPanel: ~2-3 hours
- TechListSidebar: ~3-4 hours
- AssignTechDialog: ~2 hours
- Job markers + API: ~3-4 hours
- Geocoding integration: ~2 hours
- Testing & polish: ~3 hours

**Total: ~17-21 hours** (can be parallelized across multiple agents)

---

## Dependencies

**Before Starting:**
- ✅ Phase 1 & 2 complete
- ✅ Google Maps API key configured
- ✅ Test GPS data exists

**Required:**
- shadcn/ui components (Dialog, Sheet, Badge, Input, etc.)
- Distance calculation utility (already exists in `lib/utils/distance.ts`)
- Geocoding API integration

---

## Notes for Agents

- Follow existing code patterns from Phase 1 & 2
- Use TypeScript strictly - no `any` types without justification
- Match dark theme from existing dashboard
- Test on mobile devices before marking complete
- Add inline comments for complex logic
- Use error boundaries for component failures
- Implement loading states for all async operations

---

*Document Owner: Dispatch Map Phase 3 Implementation Team*
*Last Updated: 2025-11-27*
