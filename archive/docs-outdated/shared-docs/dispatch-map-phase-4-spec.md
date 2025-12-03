# Dispatch Map Dashboard - Phase 4 Implementation Spec

**Date:** 2025-11-27
**Status:** Ready for Implementation
**Dependencies:** Phase 1, 2, 3 Complete

---

## Overview

Phase 4 adds advanced features to the dispatch map dashboard, including enhanced statistics dashboard, map controls, automation for assigning nearest tech, navigation links, and historical playback.

## Goals

1. **Advanced Statistics** - KPI dashboard with charts and metrics
2. **Map Controls** - Zoom to fit, center, layer toggles, clustering
3. **Automation** - "Assign Nearest Available Tech" with AI optimization
4. **Navigation Integration** - Deep links to Google Maps for turn-by-turn
5. **Historical Playback** - Review tech movements over time

---

## Component Architecture

### 1. DispatchStats Component

**Location:** `components/dispatch/DispatchStats.tsx`

**Purpose:** Comprehensive statistics dashboard with KPIs and charts

**Props:**
```typescript
interface DispatchStatsProps {
  techs: TechLocation[]
  jobs: JobLocation[]
  timeRange: 'today' | 'week' | 'month'
  onTimeRangeChange: (range: 'today' | 'week' | 'month') => void
}
```

**Features:**

#### KPI Cards (Top Row)
1. **Team Efficiency**
   - Average jobs completed per tech per day
   - Trend indicator (↑ ↓)
   - Sparkline chart showing last 7 days

2. **Response Time**
   - Average time from job assignment to en_route
   - Target: <15 minutes
   - Color-coded: Green (<15), Yellow (15-30), Red (>30)

3. **Utilization Rate**
   - % of techs currently on job
   - Formula: (on_job + en_route) / total_techs * 100
   - Goal: 70-80%

4. **Coverage Area**
   - Radius covered by all active techs
   - Displays in miles
   - Heatmap overlay option

#### Charts (Bottom Row)

1. **Jobs by Status** (Donut Chart)
   - Unassigned, Assigned, En Route, In Progress, Completed
   - Click segment to filter map

2. **Tech Activity Timeline** (Line Chart)
   - X-axis: Time (hourly)
   - Y-axis: Number of active techs
   - Compare today vs yesterday

3. **Distance Traveled** (Bar Chart)
   - Top 10 techs by miles traveled
   - Shows fuel/mileage efficiency

4. **Job Completion Rate** (Progress Bars)
   - By tech, sorted by completion rate
   - Shows jobs completed vs assigned

**Design:**
- Collapsible section above map (toggle button)
- Grid layout: 4 columns (KPIs) + 2 rows (charts)
- Dark theme with accent colors
- Export button (download PDF/CSV)
- Print-friendly layout

**API Endpoints Needed:**
- GET `/api/dispatch/stats` - All statistics data
- GET `/api/dispatch/stats/export` - Export data

---

### 2. MapControls Component

**Location:** `components/dispatch/MapControls.tsx`

**Purpose:** Custom map controls for enhanced navigation

**Features:**

#### Control Buttons (Floating Panel)
1. **Zoom to Fit All**
   - Button icon: `⊞`
   - Adjusts zoom/center to show all techs and jobs
   - Uses Google Maps `fitBounds()` API

2. **Center on Business**
   - Button icon: `🏢`
   - Centers map on business location (from env vars)

3. **Follow Mode** (Toggle)
   - Button icon: `📍`
   - Auto-centers on selected tech as they move
   - Stays locked until user pans map

4. **Layer Toggles**
   - Tech markers (on/off)
   - Job markers (on/off)
   - Traffic layer (on/off)
   - Heatmap overlay (tech density)

5. **Refresh Button**
   - Button icon: `🔄`
   - Manual refresh all data
   - Shows last refresh timestamp

6. **Fullscreen Toggle**
   - Button icon: `⛶`
   - Expand map to fullscreen
   - ESC to exit

#### Marker Clustering
- Automatically cluster markers when >20 visible
- Show count on cluster icon
- Click to zoom into cluster
- Library: `@googlemaps/markerclusterer`

**Implementation:**
```typescript
import { MarkerClusterer } from '@googlemaps/markerclusterer'

const clusterer = new MarkerClusterer({
  map,
  markers,
  algorithm: new SuperClusterAlgorithm({ radius: 100 }),
})
```

**Design:**
- Floating panel top-right corner
- Vertical button stack
- Tooltips on hover
- Smooth animations

---

### 3. Assign Nearest Tech Automation

**Location:** `lib/dispatch/auto-assign.ts`

**Purpose:** Intelligent algorithm to assign the best available tech to a job

**Algorithm:**

#### Step 1: Filter Eligible Techs
```typescript
function getEligibleTechs(job: JobLocation, techs: TechLocation[]): TechLocation[] {
  return techs.filter(tech => {
    // Must be idle (not on job, not en_route)
    if (tech.status !== 'idle') return false

    // Must have recent GPS update (<30 min)
    if (!tech.lastLocation) return false
    const gpsAge = Date.now() - new Date(tech.lastLocation.updatedAt).getTime()
    if (gpsAge > 30 * 60 * 1000) return false

    // Must have required skills (if job specifies)
    // TODO: Add skill matching when skill system implemented

    return true
  })
}
```

#### Step 2: Score Each Tech
```typescript
interface TechScore {
  techId: string
  score: number
  distance: number
  eta: number
}

function scoreTechs(job: JobLocation, techs: TechLocation[]): TechScore[] {
  return techs.map(tech => {
    const distance = calculateDistance(
      tech.lastLocation!.lat,
      tech.lastLocation!.lng,
      job.location!.lat,
      job.location!.lng
    )

    // ETA calculation (distance / avg speed)
    const avgSpeedMph = 30 // Assume 30 mph average in city
    const etaMinutes = (distance / avgSpeedMph) * 60

    // Scoring factors (weighted)
    const distanceScore = Math.max(0, 100 - distance * 2) // Closer = higher
    const performanceScore = tech.todayJobsCompleted * 5 // More productive = higher
    const urgencyBonus = job.priority === 'urgent' ? 50 : 0

    const totalScore = distanceScore + performanceScore + urgencyBonus

    return {
      techId: tech.id,
      score: totalScore,
      distance,
      eta: etaMinutes
    }
  }).sort((a, b) => b.score - a.score)
}
```

#### Step 3: Assign & Notify
```typescript
async function autoAssignNearestTech(jobId: string) {
  const job = await fetchJob(jobId)
  const techs = await fetchTechs()

  const eligible = getEligibleTechs(job, techs)
  if (eligible.length === 0) {
    throw new Error('No available techs')
  }

  const scored = scoreTechs(job, eligible)
  const bestTech = scored[0]

  // Assign job
  await assignTechToJob(jobId, bestTech.techId)

  // Send notification
  await notifyTech(bestTech.techId, {
    type: 'job_assigned',
    jobId,
    eta: bestTech.eta,
    distance: bestTech.distance
  })

  return {
    assignedTechId: bestTech.techId,
    eta: bestTech.eta,
    distance: bestTech.distance
  }
}
```

**UI Integration:**
- Button in JobDetailPanel: "Assign Nearest Available Tech"
- Shows calculation result before confirming
- Confirmation dialog shows:
  - Selected tech name
  - Distance to job
  - ETA
  - Reason for selection
  - "Confirm Assignment" button

---

### 4. Navigation Links

**Purpose:** Deep links to Google Maps for turn-by-turn navigation

**Implementation:**

#### Google Maps Navigation URL Format
```typescript
function getNavigationUrl(lat: number, lng: number): string {
  // Format: https://www.google.com/maps/dir/?api=1&destination=LAT,LNG
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
```

#### Integration Points

1. **TechDetailPanel**
   - "Navigate to Tech" button
   - Opens tech's last known location in Google Maps
   - On mobile: Opens native Google Maps app

2. **JobDetailPanel**
   - "Navigate to Job" button
   - Opens job address in Google Maps
   - On mobile: Opens native app

3. **AssignTechDialog**
   - "Preview Route" button per tech
   - Opens route from tech → job in Google Maps
   - Shows estimated drive time

**Multi-Stop Routes:**
For techs with multiple jobs, create multi-waypoint route:
```typescript
function getMultiStopRoute(waypoints: Array<{lat: number, lng: number}>): string {
  const waypointsParam = waypoints.map(w => `${w.lat},${w.lng}`).join('/')
  return `https://www.google.com/maps/dir/${waypointsParam}`
}
```

---

### 5. Historical Playback

**Location:** `components/dispatch/HistoricalPlayback.tsx`

**Purpose:** Review tech movements over a past time period

**Features:**

#### Playback Controls
- Date/time picker (select start time)
- Play/Pause button
- Speed controls (1x, 2x, 5x, 10x)
- Scrubber timeline (drag to jump to time)
- "Live" button to exit playback mode

#### Visualization
- Tech markers show historical positions
- Breadcrumb trail showing path traveled
- Timestamp overlay showing current playback time
- Job markers show status at that time

#### Data Loading
```typescript
interface HistoricalGPSLog {
  userId: string
  latitude: number
  longitude: number
  timestamp: string
  jobId?: string
}

async function fetchHistoricalGPS(
  startTime: Date,
  endTime: Date
): Promise<HistoricalGPSLog[]> {
  // Fetch all GPS logs in time range
  const { data } = await supabase
    .from('gps_logs')
    .select('*')
    .gte('created_at', startTime.toISOString())
    .lte('created_at', endTime.toISOString())
    .order('created_at', { ascending: true })

  return data
}
```

#### Performance Optimization
- Downsample GPS points for long time ranges (e.g., every 5 minutes instead of every log)
- Load data in chunks (1-hour segments)
- Render only visible markers (viewport culling)

**Use Cases:**
- Review why a job took longer than expected
- Verify tech visited job site
- Training: Show efficient routing examples
- Audit: Check time on site vs reported time

---

## API Endpoints to Create

### 1. GET /api/dispatch/stats

**Purpose:** Fetch all statistics data for the dashboard

**Query Params:**
- `timeRange`: 'today' | 'week' | 'month'
- `accountId`: (auto-filled from session)

**Response:**
```json
{
  "kpis": {
    "avgJobsPerTech": 4.2,
    "avgJobsPerTechTrend": "up",
    "avgResponseTimeMinutes": 12.5,
    "utilizationRate": 75.0,
    "coverageRadiusMiles": 18.3
  },
  "charts": {
    "jobsByStatus": {
      "unassigned": 3,
      "assigned": 5,
      "en_route": 2,
      "in_progress": 8,
      "completed": 42
    },
    "techActivityTimeline": [
      { "hour": "08:00", "active": 2 },
      { "hour": "09:00", "active": 5 },
      { "hour": "10:00", "active": 8 }
    ],
    "distanceTraveled": [
      { "techName": "John Smith", "miles": 45.2 },
      { "techName": "Jane Doe", "miles": 38.7 }
    ],
    "completionRates": [
      { "techName": "John Smith", "rate": 95.0, "completed": 19, "assigned": 20 }
    ]
  }
}
```

### 2. GET /api/dispatch/historical-gps

**Purpose:** Fetch GPS logs for historical playback

**Query Params:**
- `startTime`: ISO timestamp
- `endTime`: ISO timestamp
- `userIds`: comma-separated tech IDs (optional)
- `downsample`: boolean (default: true)

**Response:**
```json
{
  "logs": [
    {
      "userId": "uuid",
      "userName": "John Smith",
      "latitude": 39.768403,
      "longitude": -86.158068,
      "timestamp": "2025-11-27T08:30:00Z",
      "jobId": "uuid"
    }
  ]
}
```

### 3. POST /api/dispatch/auto-assign

**Purpose:** Automatically assign the best available tech to a job

**Request:**
```json
{
  "jobId": "uuid",
  "factors": {
    "prioritizeDistance": true,
    "prioritizePerformance": false,
    "requireSkills": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    "techId": "uuid",
    "techName": "John Smith",
    "distance": 3.2,
    "eta": 8.5,
    "score": 145,
    "reason": "Closest available tech with high performance rating"
  }
}
```

---

## Database Queries

### Statistics Query (Optimized)

```sql
-- KPIs for today
WITH tech_stats AS (
  SELECT
    u.id,
    u.full_name,
    COUNT(j.id) FILTER (WHERE j.status = 'completed' AND j.completed_at >= CURRENT_DATE) as jobs_completed_today,
    AVG(EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) / 60) as avg_job_minutes,
    SUM(
      6371 * acos(
        cos(radians(g1.latitude)) * cos(radians(g2.latitude)) *
        cos(radians(g2.longitude) - radians(g1.longitude)) +
        sin(radians(g1.latitude)) * sin(radians(g2.latitude))
      )
    ) as total_distance_km
  FROM users u
  LEFT JOIN jobs j ON j.assigned_tech_id = u.id
  LEFT JOIN gps_logs g1 ON g1.user_id = u.id
  LEFT JOIN gps_logs g2 ON g2.user_id = u.id AND g2.created_at > g1.created_at
  WHERE u.role IN ('tech', 'sales')
    AND u.account_id = $1
    AND g1.created_at >= CURRENT_DATE
  GROUP BY u.id, u.full_name
)
SELECT * FROM tech_stats;
```

### Historical GPS Query (Downsampled)

```sql
-- Get GPS logs every 5 minutes (downsampled)
SELECT DISTINCT ON (user_id, time_bucket)
  user_id,
  latitude,
  longitude,
  created_at as timestamp,
  job_id,
  DATE_TRUNC('minute', created_at) -
    (EXTRACT(MINUTE FROM created_at)::int % 5) * INTERVAL '1 minute' as time_bucket
FROM gps_logs
WHERE created_at BETWEEN $1 AND $2
  AND account_id = $3
ORDER BY user_id, time_bucket, created_at DESC;
```

---

## Performance Optimizations

### 1. Database Indexing
```sql
-- Index for stats queries
CREATE INDEX idx_jobs_completed_at ON jobs(completed_at) WHERE status = 'completed';
CREATE INDEX idx_jobs_assigned_tech ON jobs(assigned_tech_id, status);

-- Index for historical GPS queries
CREATE INDEX idx_gps_logs_timestamp_user ON gps_logs(created_at, user_id);
```

### 2. Caching Strategy
- Cache statistics for 5 minutes (Redis or in-memory)
- Cache geocoding results permanently (database table)
- Cache tech scores for 30 seconds (during auto-assign calculations)

### 3. Query Batching
- Batch multiple API calls into single request
- Use GraphQL or custom batch endpoint

---

## Testing Checklist

### Functionality Tests
- [ ] Stats dashboard shows correct KPIs
- [ ] Charts render and update in real-time
- [ ] Map controls (zoom to fit, center) work
- [ ] Marker clustering activates with >20 markers
- [ ] Auto-assign selects correct tech
- [ ] Navigation links open Google Maps correctly
- [ ] Historical playback loads and plays smoothly
- [ ] Export stats to PDF/CSV works

### Performance Tests
- [ ] Stats dashboard loads in <2 seconds
- [ ] Historical playback smooth at 10x speed
- [ ] Map with 100 markers renders without lag
- [ ] Auto-assign calculation <500ms

### Edge Cases
- [ ] No eligible techs for auto-assign - show error
- [ ] Historical playback with missing GPS data - interpolate
- [ ] Stats with no data - show "No data available"
- [ ] Navigation link on desktop vs mobile - correct behavior

---

## Success Criteria

Phase 4 is complete when:

1. ✅ DispatchStats component displays all KPIs and charts
2. ✅ Map controls (zoom, center, layers) functional
3. ✅ Marker clustering works with >20 markers
4. ✅ Auto-assign algorithm selects best tech
5. ✅ Navigation links work on mobile and desktop
6. ✅ Historical playback feature complete
7. ✅ Export stats functionality works
8. ✅ All API endpoints performant (<2s response time)
9. ✅ Database queries optimized with indexes
10. ✅ Comprehensive testing completed

---

## Timeline Estimate

- DispatchStats component: ~4-5 hours
- MapControls + clustering: ~3-4 hours
- Auto-assign algorithm: ~2-3 hours
- Navigation links: ~1-2 hours
- Historical playback: ~5-6 hours
- Stats API endpoints: ~3-4 hours
- Database optimizations: ~2 hours
- Testing & polish: ~4 hours

**Total: ~24-30 hours** (can be parallelized across multiple agents)

---

## Dependencies

**Before Starting:**
- ✅ Phase 1, 2, 3 complete
- ✅ All Phase 3 components functional
- ✅ Job markers on map
- ✅ Distance calculations working

**Required:**
- `@googlemaps/markerclusterer` package
- Chart library (recharts or chart.js)
- PDF export library (jsPDF)

---

## Future Enhancements (Beyond Phase 4)

1. **Predictive Analytics**
   - ML model to predict job completion times
   - Recommend optimal tech assignments

2. **Route Optimization**
   - Multi-job routing (traveling salesman problem)
   - Suggest most efficient route for day

3. **Customer Communication**
   - Auto-send "Tech is 10 minutes away" SMS
   - Real-time ETA updates to customer

4. **Dispatcher Chat**
   - Real-time messaging between dispatcher and techs
   - Voice/video call integration

5. **Weather Integration**
   - Show weather conditions on map
   - Adjust ETA based on weather delays

---

*Document Owner: Dispatch Map Phase 4 Implementation Team*
*Last Updated: 2025-11-27*
