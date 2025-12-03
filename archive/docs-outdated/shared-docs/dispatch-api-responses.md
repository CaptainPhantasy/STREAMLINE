# Dispatch Map API Endpoints - Sample Responses

**Created:** 2025-11-27
**Agent:** API Endpoints Specialist (Agent 1)
**Status:** Complete ✅

---

## Overview

All 7 API endpoints have been successfully created for the Dispatch Map Dashboard (Phase 3 & 4). This document provides sample API responses for testing and integration.

---

## 1. GET /api/dispatch/jobs/active

**Purpose:** Fetch all active jobs for the dispatch map

**URL:** `/api/dispatch/jobs/active`

**Method:** GET

**Authorization:** dispatcher, admin, or owner role required

**Sample Response:**

```json
{
  "jobs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "description": "Water heater repair",
      "status": "scheduled",
      "scheduledStart": "2025-11-27T14:00:00Z",
      "customer": {
        "name": "John Doe",
        "phone": "+1-317-555-0123",
        "address": "123 Main St, Indianapolis, IN 46204",
        "email": "john.doe@example.com"
      },
      "location": {
        "lat": 39.770000,
        "lng": -86.160000
      },
      "assignedTech": {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "name": "Mike Johnson"
      },
      "totalAmount": 35000
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "description": "Plumbing inspection",
      "status": "in_progress",
      "scheduledStart": "2025-11-27T10:00:00Z",
      "customer": {
        "name": "Jane Smith",
        "phone": "+1-317-555-0456",
        "address": "456 Oak Ave, Indianapolis, IN 46220",
        "email": "jane.smith@example.com"
      },
      "location": {
        "lat": 39.780000,
        "lng": -86.150000
      },
      "assignedTech": {
        "id": "660e8400-e29b-41d4-a716-446655440004",
        "name": "Sarah Williams"
      },
      "totalAmount": 15000
    }
  ],
  "meta": {
    "total": 2,
    "withLocations": 2,
    "withoutLocations": 0
  }
}
```

---

## 2. GET /api/dispatch/techs/[id]/activity

**Purpose:** Fetch recent GPS logs for a specific technician

**URL:** `/api/dispatch/techs/660e8400-e29b-41d4-a716-446655440002/activity?limit=5`

**Method:** GET

**Query Parameters:**
- `limit`: number (default: 20, max: 100)
- `jobId`: string (optional) - Filter by job

**Sample Response:**

```json
{
  "activity": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "latitude": 39.768403,
      "longitude": -86.158068,
      "accuracy": 10,
      "timestamp": "2025-11-27T10:30:00Z",
      "eventType": "arrival",
      "jobId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "latitude": 39.768405,
      "longitude": -86.158070,
      "accuracy": 12,
      "timestamp": "2025-11-27T10:15:00Z",
      "eventType": "auto",
      "jobId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "latitude": 39.765000,
      "longitude": -86.155000,
      "accuracy": 15,
      "timestamp": "2025-11-27T10:00:00Z",
      "eventType": "departure",
      "jobId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "meta": {
    "techId": "660e8400-e29b-41d4-a716-446655440002",
    "techName": "Mike Johnson",
    "count": 3,
    "limit": 5
  }
}
```

---

## 3. GET /api/dispatch/techs/[id]/stats

**Purpose:** Fetch daily performance stats for a technician

**URL:** `/api/dispatch/techs/660e8400-e29b-41d4-a716-446655440002/stats?date=2025-11-27`

**Method:** GET

**Query Parameters:**
- `date`: string (YYYY-MM-DD, optional) - Specific date
- `range`: 'today' | 'week' | 'month' (optional)

**Sample Response:**

```json
{
  "stats": {
    "jobsCompletedToday": 5,
    "jobsInProgress": 1,
    "jobsScheduled": 2,
    "averageJobTimeMinutes": 45,
    "totalDistanceTraveledMiles": 32.5,
    "hoursWorkedToday": 7.5,
    "efficiency": 83
  },
  "meta": {
    "techId": "660e8400-e29b-41d4-a716-446655440002",
    "techName": "Mike Johnson",
    "dateRange": {
      "start": "2025-11-27T00:00:00.000Z",
      "end": "2025-11-27T23:59:59.999Z"
    },
    "gpsLogsCount": 145
  }
}
```

---

## 4. POST /api/dispatch/jobs/[id]/assign

**Purpose:** Assign a technician to a job

**URL:** `/api/dispatch/jobs/550e8400-e29b-41d4-a716-446655440001/assign`

**Method:** POST

**Request Body:**

```json
{
  "techId": "660e8400-e29b-41d4-a716-446655440002",
  "notifyTech": true,
  "notes": "Customer prefers afternoon appointment"
}
```

**Sample Success Response:**

```json
{
  "success": true,
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "assignedTechId": "660e8400-e29b-41d4-a716-446655440002",
    "status": "scheduled",
    "assignedAt": "2025-11-27T10:45:00.000Z"
  },
  "meta": {
    "techName": "Mike Johnson",
    "assignedBy": "880e8400-e29b-41d4-a716-446655440000",
    "notificationSent": true
  }
}
```

**Sample Error Response (Tech Busy):**

```json
{
  "error": "Tech is currently on another job",
  "details": "Mike Johnson is already working on: Drain cleaning emergency",
  "conflictingJobId": "550e8400-e29b-41d4-a716-446655440099"
}
```

---

## 5. GET /api/dispatch/stats

**Purpose:** Fetch comprehensive statistics for the dispatch dashboard

**URL:** `/api/dispatch/stats?timeRange=today`

**Method:** GET

**Query Parameters:**
- `timeRange`: 'today' | 'week' | 'month' (default: 'today')

**Sample Response:**

```json
{
  "kpis": {
    "avgJobsPerTech": 4.2,
    "avgJobsPerTechTrend": "up",
    "avgResponseTimeMinutes": 12,
    "utilizationRate": 75,
    "coverageRadiusMiles": 18.3
  },
  "charts": {
    "jobsByStatus": {
      "unassigned": 3,
      "scheduled": 5,
      "en_route": 2,
      "in_progress": 8,
      "completed": 42
    },
    "techActivityTimeline": [
      { "hour": "08:00", "active": 2 },
      { "hour": "09:00", "active": 5 },
      { "hour": "10:00", "active": 8 },
      { "hour": "11:00", "active": 8 },
      { "hour": "12:00", "active": 6 },
      { "hour": "13:00", "active": 7 },
      { "hour": "14:00", "active": 8 },
      { "hour": "15:00", "active": 7 },
      { "hour": "16:00", "active": 5 },
      { "hour": "17:00", "active": 3 }
    ],
    "distanceTraveled": [
      { "techName": "Mike Johnson", "miles": 45.2 },
      { "techName": "Sarah Williams", "miles": 38.7 },
      { "techName": "Tom Davis", "miles": 32.1 },
      { "techName": "Lisa Brown", "miles": 28.5 }
    ],
    "completionRates": [
      { "techName": "Mike Johnson", "rate": 95, "completed": 19, "assigned": 20 },
      { "techName": "Sarah Williams", "rate": 92, "completed": 23, "assigned": 25 },
      { "techName": "Tom Davis", "rate": 88, "completed": 15, "assigned": 17 },
      { "techName": "Lisa Brown", "rate": 85, "completed": 17, "assigned": 20 }
    ]
  },
  "meta": {
    "timeRange": "today",
    "dateRange": {
      "start": "2025-11-27T00:00:00.000Z",
      "end": "2025-11-27T23:59:59.999Z"
    },
    "techCount": 12,
    "totalJobs": 60
  }
}
```

---

## 6. GET /api/dispatch/historical-gps

**Purpose:** Fetch historical GPS logs for playback

**URL:** `/api/dispatch/historical-gps?startTime=2025-11-27T08:00:00Z&endTime=2025-11-27T12:00:00Z&downsample=true&interval=5`

**Method:** GET

**Query Parameters:**
- `startTime`: string (ISO timestamp, required)
- `endTime`: string (ISO timestamp, required)
- `userIds`: string (comma-separated, optional)
- `downsample`: boolean (default: true)
- `interval`: number (minutes, default: 5)

**Sample Response:**

```json
{
  "logs": [
    {
      "userId": "660e8400-e29b-41d4-a716-446655440002",
      "userName": "Mike Johnson",
      "latitude": 39.768403,
      "longitude": -86.158068,
      "accuracy": 10,
      "timestamp": "2025-11-27T08:00:00Z",
      "eventType": "auto",
      "jobId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "userId": "660e8400-e29b-41d4-a716-446655440002",
      "userName": "Mike Johnson",
      "latitude": 39.770000,
      "longitude": -86.160000,
      "accuracy": 12,
      "timestamp": "2025-11-27T08:05:00Z",
      "eventType": "auto",
      "jobId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "userId": "660e8400-e29b-41d4-a716-446655440004",
      "userName": "Sarah Williams",
      "latitude": 39.780000,
      "longitude": -86.150000,
      "accuracy": 8,
      "timestamp": "2025-11-27T08:00:00Z",
      "eventType": "arrival"
    }
  ],
  "meta": {
    "count": 48,
    "downsampled": true,
    "downsampleInterval": 5,
    "timeRange": {
      "start": "2025-11-27T08:00:00.000Z",
      "end": "2025-11-27T12:00:00.000Z",
      "durationHours": 4
    },
    "techsCount": 2,
    "techNames": ["Mike Johnson", "Sarah Williams"]
  }
}
```

---

## 7. POST /api/dispatch/auto-assign

**Purpose:** Automatically assign the best available tech to a job

**URL:** `/api/dispatch/auto-assign`

**Method:** POST

**Request Body (Production):**

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "factors": {
    "prioritizeDistance": true,
    "prioritizePerformance": false,
    "requireSkills": []
  },
  "dryRun": false
}
```

**Request Body (Dry Run - Preview Only):**

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "dryRun": true
}
```

**Sample Success Response:**

```json
{
  "success": true,
  "assignment": {
    "techId": "660e8400-e29b-41d4-a716-446655440002",
    "techName": "Mike Johnson",
    "distance": 3.2,
    "eta": 8,
    "score": 145,
    "reason": "Best match: closest available tech, real-time location"
  },
  "alternatives": [
    {
      "techId": "660e8400-e29b-41d4-a716-446655440004",
      "techName": "Sarah Williams",
      "distance": 5.7,
      "eta": 14,
      "score": 132
    },
    {
      "techId": "660e8400-e29b-41d4-a716-446655440006",
      "techName": "Tom Davis",
      "distance": 8.1,
      "eta": 18,
      "score": 118
    }
  ],
  "meta": {
    "assignedAt": "2025-11-27T10:45:00.000Z",
    "assignedBy": "880e8400-e29b-41d4-a716-446655440000",
    "eligibleTechsCount": 8,
    "totalTechsCount": 12
  }
}
```

**Sample Dry Run Response:**

```json
{
  "success": true,
  "dryRun": true,
  "assignment": {
    "techId": "660e8400-e29b-41d4-a716-446655440002",
    "techName": "Mike Johnson",
    "distance": 3.2,
    "eta": 8,
    "score": 145,
    "reason": "Best match: closest available tech, real-time location"
  },
  "alternatives": [
    {
      "techId": "660e8400-e29b-41d4-a716-446655440004",
      "techName": "Sarah Williams",
      "distance": 5.7,
      "eta": 14,
      "score": 132
    }
  ],
  "allScores": [
    {
      "techId": "660e8400-e29b-41d4-a716-446655440002",
      "techName": "Mike Johnson",
      "distanceMiles": 3.2,
      "eta": 8,
      "score": 145,
      "isEligible": true,
      "reason": "Available",
      "gpsAge": 2,
      "activeJobs": 0,
      "jobsCompletedToday": 5
    },
    {
      "techId": "660e8400-e29b-41d4-a716-446655440005",
      "techName": "Bob Martinez",
      "distanceMiles": null,
      "eta": null,
      "score": 0,
      "isEligible": false,
      "reason": "Currently on 1 job(s)",
      "gpsAge": 3,
      "activeJobs": 1,
      "jobsCompletedToday": 3
    }
  ]
}
```

**Sample Error Response (No Eligible Techs):**

```json
{
  "error": "No eligible technicians available",
  "details": "All techs are either busy or offline",
  "ineligibleTechs": [
    { "techName": "Mike Johnson", "reason": "Currently on 1 job(s)" },
    { "techName": "Sarah Williams", "reason": "Currently on 1 job(s)" },
    { "techName": "Tom Davis", "reason": "GPS data too old (>30 min)" },
    { "techName": "Lisa Brown", "reason": "No GPS data available" }
  ]
}
```

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden: dispatcher, admin, or owner role required"
}
```

### 404 Not Found

```json
{
  "error": "Tech not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch tech activity",
  "details": "Database connection error"
}
```

---

## Testing Checklist

### 1. GET /api/dispatch/jobs/active
- [ ] Returns jobs with status: scheduled, en_route, in_progress
- [ ] Filters by account_id (multi-tenant)
- [ ] Returns empty array when no jobs
- [ ] Includes job location if available
- [ ] Includes assigned tech details
- [ ] Returns 401 for unauthenticated users
- [ ] Returns 403 for non-dispatcher roles

### 2. GET /api/dispatch/techs/[id]/activity
- [ ] Returns recent GPS logs for tech
- [ ] Respects limit parameter (max 100)
- [ ] Filters by jobId if provided
- [ ] Validates tech belongs to same account
- [ ] Returns 404 for invalid tech ID
- [ ] Orders by most recent first

### 3. GET /api/dispatch/techs/[id]/stats
- [ ] Calculates jobs completed, in progress, scheduled
- [ ] Calculates average job time accurately
- [ ] Calculates distance traveled using GPS logs
- [ ] Calculates hours worked from GPS logs
- [ ] Supports date range filtering
- [ ] Returns efficiency percentage

### 4. POST /api/dispatch/jobs/[id]/assign
- [ ] Assigns tech to job successfully
- [ ] Updates job status to 'scheduled'
- [ ] Creates audit log entry
- [ ] Prevents assigning busy tech (409 conflict)
- [ ] Prevents assigning to already assigned job
- [ ] Validates tech and job are in same account
- [ ] Returns 400 for invalid tech role

### 5. GET /api/dispatch/stats
- [ ] Returns all KPIs correctly
- [ ] Calculates trend (up/down/stable)
- [ ] Returns jobs by status chart data
- [ ] Returns tech activity timeline (hourly)
- [ ] Returns distance traveled per tech
- [ ] Returns completion rates per tech
- [ ] Supports timeRange parameter

### 6. GET /api/dispatch/historical-gps
- [ ] Fetches GPS logs for time range
- [ ] Downsamples for time ranges > 1 hour
- [ ] Filters by userIds if provided
- [ ] Validates time range (max 7 days)
- [ ] Returns empty array when no logs
- [ ] Includes meta information

### 7. POST /api/dispatch/auto-assign
- [ ] Assigns best available tech based on score
- [ ] Prioritizes distance when factor enabled
- [ ] Filters out busy techs
- [ ] Filters out offline techs (GPS > 30 min)
- [ ] Returns alternatives (top 3)
- [ ] Supports dryRun mode
- [ ] Creates audit log entry
- [ ] Returns error when no eligible techs

---

## Performance Benchmarks

Target response times (95th percentile):

| Endpoint | Target | Notes |
|----------|--------|-------|
| GET /api/dispatch/jobs/active | < 500ms | Depends on job count |
| GET /api/dispatch/techs/[id]/activity | < 300ms | Limited to 100 logs |
| GET /api/dispatch/techs/[id]/stats | < 800ms | Includes distance calculations |
| POST /api/dispatch/jobs/[id]/assign | < 500ms | Includes validation queries |
| GET /api/dispatch/stats | < 2000ms | Complex aggregations |
| GET /api/dispatch/historical-gps | < 1500ms | With downsampling |
| POST /api/dispatch/auto-assign | < 1000ms | Scores all techs |

---

## Security Features

All endpoints implement:

1. **Authentication**: Required for all endpoints
2. **Authorization**: Role-based access control (dispatcher/admin/owner only)
3. **Multi-tenancy**: All queries filter by account_id
4. **Input Validation**: Request body and query parameter validation
5. **Error Handling**: Consistent error response format
6. **Audit Logging**: Critical actions logged to crmai_audit table

---

## Next Steps for Integration

1. **Frontend Components**: Use these endpoints in React components
2. **Real-time Updates**: Add Supabase subscriptions for live data
3. **Caching**: Add Redis/in-memory caching for stats endpoint
4. **Rate Limiting**: Add rate limiting for production
5. **Monitoring**: Add APM for endpoint performance tracking
6. **Documentation**: Generate OpenAPI/Swagger docs

---

*Document created by Agent 1: API Endpoints Specialist*
*All 7 endpoints completed and ready for integration*
*Date: 2025-11-27*
