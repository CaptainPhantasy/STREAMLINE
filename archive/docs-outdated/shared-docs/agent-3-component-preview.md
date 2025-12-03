# JobDetailPanel Component - Visual Preview

## Component Layout

```
┌─────────────────────────────────────────────────┐
│ 📍 Job Details              ID: 7a3f2bc1    [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Job Information     [URGENT] [SCHEDULED]│   │
│  ├─────────────────────────────────────────┤   │
│  │ 🔔 Description                          │   │
│  │    Water heater repair - emergency      │   │
│  │ ─────────────────────────────────────── │   │
│  │ 👤 Customer                             │   │
│  │    John Doe                             │   │
│  │ 📍 Address                              │   │
│  │    123 Main St, Indianapolis, IN        │   │
│  │ 📅 Scheduled                            │   │
│  │    Nov 27, 2025 2:00 PM                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📞 Customer Contact                     │   │
│  ├─────────────────────────────────────────┤   │
│  │ [ 📞 (317) 555-0123 ]                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🧭 Navigation                           │   │
│  ├─────────────────────────────────────────┤   │
│  │ [ 🧭 Navigate to Job ]                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 👤 Available Technicians (5)            │   │
│  │ Sorted by distance (nearest first)      │   │
│  ├─────────────────────────────────────────┤   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ Mike Johnson          2.3 mi 🟢     │ │   │
│  │ │ [TECH] [IDLE]         ~5 min ETA    │ │   │
│  │ │ Last seen: 10:35 AM                 │ │   │
│  │ │ [ ✓ Assign to Mike ]                │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ Sarah Williams        7.8 mi 🟡     │ │   │
│  │ │ [TECH] [IDLE]         ~16 min ETA   │ │   │
│  │ │ Last seen: 10:32 AM                 │ │   │
│  │ │ [ ✓ Assign to Sarah ]               │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ Tom Davis             12.5 mi 🟠    │ │   │
│  │ │ [TECH] [EN_ROUTE]     ~25 min ETA   │ │   │
│  │ │ On: Furnace inspection              │ │   │
│  │ │ Last seen: 10:28 AM                 │ │   │
│  │ │ [ ✓ Assign to Tom ]                 │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ Lisa Martinez         18.2 mi 🟠    │ │   │
│  │ │ [SALES] [IDLE]        ~36 min ETA   │ │   │
│  │ │ Last seen: 10:25 AM                 │ │   │
│  │ │ [ ✓ Assign to Lisa ]                │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ Bob Anderson          25.7 mi 🔴    │ │   │
│  │ │ [TECH] [ON_JOB]       ~51 min ETA   │ │   │
│  │ │ On: Air conditioning repair         │ │   │
│  │ │ Last seen: 10:20 AM                 │ │   │
│  │ │ [ ✓ Assign to Bob ]                 │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│ Distance Color Legend:                         │
│ 🟢 < 5 miles   🟡 5-10 miles                   │
│ 🟠 10-20 miles  🔴 > 20 miles                  │
└─────────────────────────────────────────────────┘
```

## Color Schemes

### Priority Badges

```
┌──────────┬──────────┬──────────┬──────────┐
│   LOW    │  NORMAL  │   HIGH   │  URGENT  │
│  [Gray]  │  [Blue]  │ [Orange] │   [Red]  │
└──────────┴──────────┴──────────┴──────────┘
```

### Status Badges

```
┌────────────┬───────────┬─────────────┐
│ SCHEDULED  │ EN_ROUTE  │ IN_PROGRESS │
│  [Yellow]  │  [Blue]   │   [Green]   │
└────────────┴───────────┴─────────────┘
```

### Distance Color Coding

```
Distance Range    Color     Use Case
─────────────────────────────────────────
< 5 miles         🟢 Green   Excellent match
5-10 miles        🟡 Yellow  Good match
10-20 miles       🟠 Orange  Moderate distance
> 20 miles        🔴 Red     Long travel time
```

## Responsive Layouts

### Desktop (≥ 768px)

```
┌───────────────────────────────────────────────────────┐
│                    Map Area                           │
│                                                       │
│                                              ┌────────┤
│                                              │  Job   │
│                                              │ Detail │
│                                              │ Panel  │
│                                              │ 450px  │
│                                              │        │
│                                              │ (Fixed │
│                                              │ Right) │
└──────────────────────────────────────────────┴────────┘
```

### Mobile (< 768px)

```
┌─────────────────────┐
│                     │
│     Map Area        │
│                     │
└─────────────────────┘
┌─────────────────────┐
│   Job Detail Panel  │
│   (Full Width)      │
│   (Overlay)         │
│                     │
│   [Scrollable]      │
│                     │
└─────────────────────┘
```

## Interactive Elements

### Assign Button States

```
Default:      [ ✓ Assign to Mike ]
Loading:      [ ⟳ Assigning... ]
Disabled:     [ ✓ Assign to Mike ] (grayed out for offline techs)
```

### Tech Card Hover

```
Normal:       ┌─────────────────┐
              │ Mike Johnson    │
              └─────────────────┘

Hovered:      ┌─────────────────┐  ← Shadow effect
              │ Mike Johnson    │  ← Slight elevation
              └─────────────────┘
```

## Data Flow

```
Parent Component (DispatchMapPage)
    │
    ├── Fetches jobs from API
    ├── Fetches techs from API
    │
    ├── User clicks job marker on map
    │
    └─→ Opens JobDetailPanel
         │
         ├── Calculates distances for each tech
         ├── Sorts techs by distance
         ├── Renders tech recommendations
         │
         ├── User clicks "Assign to [Tech]"
         │
         └─→ Calls onAssignTech(jobId, techId)
              │
              └─→ Parent sends POST /api/dispatch/jobs/[id]/assign
```

## Example Usage

```typescript
// In DispatchMapPage.tsx
import JobDetailPanel from '@/components/dispatch/JobDetailPanel'

function DispatchMapPage() {
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null)
  const [jobs, setJobs] = useState<JobLocation[]>([])
  const [techs, setTechs] = useState<TechLocation[]>([])

  const handleAssignTech = async (jobId: string, techId: string) => {
    const response = await fetch(`/api/dispatch/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId, notifyTech: true })
    })

    if (response.ok) {
      // Refresh jobs and close panel
      await fetchJobs()
      setSelectedJob(null)
      toast.success('Tech assigned successfully!')
    } else {
      toast.error('Failed to assign tech')
    }
  }

  const handleNavigate = (lat: number, lng: number) => {
    // Open Google Maps with directions
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    )
  }

  return (
    <div className="relative">
      {/* Google Map */}
      <GoogleMap>
        {jobs.map(job => (
          <Marker
            key={job.id}
            position={job.location}
            onClick={() => setSelectedJob(job)}
          />
        ))}
      </GoogleMap>

      {/* Job Detail Panel */}
      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAssignTech={handleAssignTech}
          onNavigate={handleNavigate}
          availableTechs={techs}
        />
      )}
    </div>
  )
}
```

## Component Props

```typescript
interface JobDetailPanelProps {
  // The job to display details for
  job: JobLocation

  // Callback when user closes the panel
  onClose: () => void

  // Callback when user assigns a tech to the job
  // Returns a promise for async handling
  onAssignTech: (jobId: string, techId: string) => Promise<void>

  // Callback when user clicks "Navigate to Job"
  // Provides GPS coordinates for external navigation
  onNavigate: (lat: number, lng: number) => void

  // List of all available techs (will be filtered and sorted)
  availableTechs: TechLocation[]
}
```

## Performance Notes

- Distance calculations run once on mount (useMemo)
- Only recalculates when job location or techs array changes
- Filters out techs without GPS data efficiently
- Sorting is O(n log n) but cached with useMemo
- No unnecessary re-renders

## Accessibility Features

- Semantic HTML (header, main, section)
- ARIA labels on buttons (via shadcn/ui)
- Keyboard navigation support
- High contrast colors
- Screen reader friendly
- Focus management

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile Safari: ✅ Full support
- Mobile Chrome: ✅ Full support

---

*This preview document shows the visual layout and functionality of the JobDetailPanel component.*
