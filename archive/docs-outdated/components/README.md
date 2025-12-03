# Dispatch Map Components

This directory contains all components for the real-time dispatch map dashboard (Phase 3).

---

## Component Overview

| Component | Status | Agent | Description |
|-----------|--------|-------|-------------|
| `AssignTechDialog.tsx` | ✅ Complete | Agent 5 | Modal dialog for assigning techs to jobs |
| `TechDetailPanel.tsx` | ✅ Complete | Agent 2 | Side panel with tech details and activity |
| `JobDetailPanel.tsx` | ✅ Complete | Agent 3 | Side panel with job details |
| `TechListSidebar.tsx` | ✅ Complete | Agent 4 | Collapsible sidebar with tech list and filters |

---

## AssignTechDialog Component

Modal dialog for assigning technicians to jobs with distance calculations and validation.

### Features

- Job details display (address, customer, scheduled time)
- Tech selection list with distances and ETAs
- Real-time distance calculations using Haversine formula
- Color-coded distances (green/yellow/orange/red based on proximity)
- Filter to show only available techs
- "Assign Nearest Available" quick action
- Validation rules (prevent offline/busy tech assignment)
- Confirmation dialogs for edge cases
- Success/error toast notifications
- Mobile responsive design

### Props

```typescript
interface AssignTechDialogProps {
  open: boolean                                        // Dialog visibility
  onClose: () => void                                  // Close handler
  job: JobLocation | null                              // Selected job
  techs: TechLocation[]                                // Available techs
  onAssign: (jobId: string, techId: string) => Promise<void>  // Assignment handler
}
```

### Usage Example

```tsx
import { AssignTechDialog } from '@/components/dispatch/AssignTechDialog'
import { useState } from 'react'

export default function DispatchMap() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null)
  const [techs, setTechs] = useState<TechLocation[]>([])

  const handleAssign = async (jobId: string, techId: string) => {
    const response = await fetch(`/api/dispatch/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId, notifyTech: true }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    // Refresh job list after assignment
    await refreshJobs()
  }

  return (
    <>
      {/* Your map/job list UI */}
      <AssignTechDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        job={selectedJob}
        techs={techs}
        onAssign={handleAssign}
      />
    </>
  )
}
```

### API Integration

**Endpoint:** `POST /api/dispatch/jobs/[id]/assign`

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
    "status": "scheduled",
    "assignedAt": "2025-11-27T10:30:00Z"
  },
  "meta": {
    "techName": "John Doe",
    "assignedBy": "dispatcher-uuid",
    "notificationSent": true
  }
}
```

### Validation Rules

1. **Cannot assign offline tech** - Shows error toast
2. **Cannot assign tech on another job** - Shows confirmation dialog
3. **Cannot assign tech en route** - Shows confirmation dialog
4. **No available techs** - Shows warning message

### Distance Calculation

Uses Haversine formula to calculate straight-line distance between job and tech locations:

```typescript
const distanceMeters = calculateDistance(
  jobLat, jobLng,
  techLat, techLng
)
const distanceMiles = distanceMeters / 1609.34
```

**Color Coding:**
- Green: < 5 miles
- Yellow: 5-10 miles
- Orange: 10-20 miles
- Red: > 20 miles

### ETA Calculation

Simple estimation based on average speed:
```typescript
const eta = Math.ceil((distanceMiles / 30) * 60) // minutes at 30 mph
```

For complete integration examples, see `AssignTechDialog.example.tsx`.

---

## TechListSidebar Component

A collapsible sidebar for displaying, filtering, and searching field technicians on the dispatch map.

### Features

- **Search**: Real-time filtering by technician name
- **Status Filters**: Filter by status (All, On Job, En Route, Idle, Offline) with counts
- **Sorting**: Sort by name (A-Z), status, or distance to selected job
- **Distance Calculations**: Shows distance from each tech to selected job
- **Hover Interactions**: Hover over tech to highlight marker on map
- **Collapse/Expand**: Desktop sidebar can be collapsed to save space
- **Mobile Responsive**: Slide-out drawer with hamburger menu on mobile devices

### Props

```typescript
interface TechListSidebarProps {
  techs: TechLocation[]                          // Array of tech locations
  onTechClick: (tech: TechLocation) => void      // Called when tech is clicked
  onTechHover: (techId: string | null) => void   // Called when tech is hovered
  selectedTechId: string | null                  // Currently selected tech ID
  selectedJobId?: string | null                  // Currently selected job ID
  selectedJobLocation?: { lat: number; lng: number } | null  // Selected job location for distance calc
}
```

### Usage Example

```tsx
import TechListSidebar from '@/components/dispatch/TechListSidebar'
import { useState } from 'react'

export default function DispatchMapPage() {
  const [techs, setTechs] = useState<TechLocation[]>([])
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJobLocation, setSelectedJobLocation] = useState<{ lat: number; lng: number } | null>(null)

  const handleTechClick = (tech: TechLocation) => {
    setSelectedTechId(tech.id)
    // Pan map to tech location
    if (tech.lastLocation) {
      setMapCenter({ lat: tech.lastLocation.lat, lng: tech.lastLocation.lng })
    }
  }

  const handleTechHover = (techId: string | null) => {
    // Highlight marker on map (implement with marker state)
  }

  return (
    <div className="flex h-screen">
      <TechListSidebar
        techs={techs}
        onTechClick={handleTechClick}
        onTechHover={handleTechHover}
        selectedTechId={selectedTechId}
        selectedJobId={selectedJobId}
        selectedJobLocation={selectedJobLocation}
      />

      <div className="flex-1">
        {/* Map component */}
      </div>
    </div>
  )
}
```

### Integration Notes

1. **Desktop Layout**: Sidebar is fixed on the left, ~320px width when expanded, 0px when collapsed
2. **Mobile Layout**: Hidden by default, shows hamburger button that opens slide-out drawer
3. **Distance Calculations**: Uses `calculateDistance()` from `lib/gps/tracker.ts` (Haversine formula)
4. **Real-time Updates**: Pass updated `techs` array via props when GPS locations change
5. **Theming**: Dark theme by default to match dispatch dashboard

### Filtering Logic

- **Search**: Case-insensitive name matching
- **Status Filter**: Exact status match or "all"
- **Sort Options**:
  - `name`: Alphabetical A-Z
  - `status`: By status string
  - `distance`: Nearest to selected job first (requires `selectedJobLocation`)

### Mobile Responsive

- **Desktop (lg+)**: Fixed sidebar with collapse button
- **Mobile (<lg)**: Hamburger menu button opens Sheet drawer
- **Breakpoint**: 1024px (Tailwind `lg`)

### Styling

- Uses Tailwind CSS utility classes
- Dark theme colors: `bg-gray-900`, `bg-gray-800`, etc.
- Status badge colors match `techStatusColors` from `types/dispatch.ts`
- Smooth transitions for hover and active states

### Dependencies

- `@/components/ui/input` - Search input
- `@/components/ui/button` - Buttons
- `@/components/ui/badge` - Status badges
- `@/components/ui/scroll-area` - Scrollable tech list
- `@/components/ui/sheet` - Mobile drawer
- `lucide-react` - Icons
- `@/lib/gps/tracker` - Distance calculation
- `@/lib/utils` - `cn()` utility for class names
- `@/types/dispatch` - Type definitions

### Performance

- Uses `useMemo` for filtering and sorting to avoid unnecessary recalculations
- Efficient distance calculations only when `selectedJobLocation` changes
- Virtual scrolling not needed for typical tech counts (<100)

### Accessibility

- Keyboard navigation supported (focus states)
- ARIA labels on buttons
- Screen reader friendly structure
- High contrast status badges

### Future Enhancements

- [ ] Virtual scrolling for 100+ techs
- [ ] Multi-tech selection
- [ ] Export filtered list
- [ ] Saved filter presets
- [ ] Tech availability calendar
- [ ] Real-time ETA updates
