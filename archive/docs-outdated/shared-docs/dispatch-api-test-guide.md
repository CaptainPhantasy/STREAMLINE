# Dispatch Map API Endpoints - Testing Guide

**Date:** 2025-11-27
**Status:** Ready for Testing

---

## Quick Start Testing with cURL

### 1. Get Active Jobs

```bash
curl -X GET 'http://localhost:3002/api/dispatch/jobs/active' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN'
```

**Expected Response:**
```json
{
  "jobs": [...],
  "meta": {
    "total": 0,
    "withLocations": 0,
    "withoutLocations": 0
  }
}
```

---

### 2. Get Tech Activity

```bash
curl -X GET 'http://localhost:3002/api/dispatch/techs/TECH_ID/activity?limit=10' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN'
```

**Expected Response:**
```json
{
  "activity": [...],
  "meta": {
    "techId": "...",
    "techName": "...",
    "count": 0,
    "limit": 10
  }
}
```

---

### 3. Get Tech Stats

```bash
curl -X GET 'http://localhost:3002/api/dispatch/techs/TECH_ID/stats' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN'
```

**Expected Response:**
```json
{
  "stats": {
    "jobsCompletedToday": 0,
    "jobsInProgress": 0,
    "jobsScheduled": 0,
    "averageJobTimeMinutes": 0,
    "totalDistanceTraveledMiles": 0,
    "hoursWorkedToday": 0,
    "efficiency": 0
  },
  "meta": {...}
}
```

---

### 4. Assign Tech to Job

```bash
curl -X POST 'http://localhost:3002/api/dispatch/jobs/JOB_ID/assign' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN' \
  -d '{
    "techId": "TECH_ID",
    "notifyTech": true,
    "notes": "Customer prefers afternoon"
  }'
```

**Expected Success:**
```json
{
  "success": true,
  "job": {
    "id": "...",
    "assignedTechId": "...",
    "status": "scheduled",
    "assignedAt": "..."
  },
  "meta": {...}
}
```

---

### 5. Get Dispatch Stats

```bash
curl -X GET 'http://localhost:3002/api/dispatch/stats?timeRange=today' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN'
```

**Expected Response:**
```json
{
  "kpis": {
    "avgJobsPerTech": 0,
    "avgJobsPerTechTrend": "stable",
    "avgResponseTimeMinutes": 0,
    "utilizationRate": 0,
    "coverageRadiusMiles": 0
  },
  "charts": {...},
  "meta": {...}
}
```

---

### 6. Get Historical GPS

```bash
curl -X GET 'http://localhost:3002/api/dispatch/historical-gps?startTime=2025-11-27T08:00:00Z&endTime=2025-11-27T12:00:00Z&downsample=true&interval=5' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN'
```

**Expected Response:**
```json
{
  "logs": [...],
  "meta": {
    "count": 0,
    "downsampled": true,
    "downsampleInterval": 5,
    "timeRange": {...}
  }
}
```

---

### 7. Auto-Assign Job

**Dry Run (Preview Only):**
```bash
curl -X POST 'http://localhost:3002/api/dispatch/auto-assign' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN' \
  -d '{
    "jobId": "JOB_ID",
    "dryRun": true
  }'
```

**Actual Assignment:**
```bash
curl -X POST 'http://localhost:3002/api/dispatch/auto-assign' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN' \
  -d '{
    "jobId": "JOB_ID",
    "factors": {
      "prioritizeDistance": true,
      "prioritizePerformance": false
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "assignment": {
    "techId": "...",
    "techName": "...",
    "distance": 3.2,
    "eta": 8,
    "score": 145,
    "reason": "Best match: closest available tech"
  },
  "alternatives": [...],
  "meta": {...}
}
```

---

## Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Dispatch Map API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Active Jobs",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/jobs/active",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "jobs", "active"]
        }
      }
    },
    {
      "name": "Get Tech Activity",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/techs/{{techId}}/activity?limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "techs", "{{techId}}", "activity"],
          "query": [{"key": "limit", "value": "10"}]
        }
      }
    },
    {
      "name": "Get Tech Stats",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/techs/{{techId}}/stats",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "techs", "{{techId}}", "stats"]
        }
      }
    },
    {
      "name": "Assign Tech to Job",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"techId\": \"{{techId}}\",\n  \"notifyTech\": true\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/jobs/{{jobId}}/assign",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "jobs", "{{jobId}}", "assign"]
        }
      }
    },
    {
      "name": "Get Dispatch Stats",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/stats?timeRange=today",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "stats"],
          "query": [{"key": "timeRange", "value": "today"}]
        }
      }
    },
    {
      "name": "Get Historical GPS",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/historical-gps?startTime=2025-11-27T08:00:00Z&endTime=2025-11-27T12:00:00Z",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "historical-gps"],
          "query": [
            {"key": "startTime", "value": "2025-11-27T08:00:00Z"},
            {"key": "endTime", "value": "2025-11-27T12:00:00Z"}
          ]
        }
      }
    },
    {
      "name": "Auto-Assign Job",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jobId\": \"{{jobId}}\",\n  \"dryRun\": true\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/dispatch/auto-assign",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dispatch", "auto-assign"]
        }
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:3002"},
    {"key": "techId", "value": "YOUR_TECH_ID"},
    {"key": "jobId", "value": "YOUR_JOB_ID"}
  ]
}
```

---

## Browser Console Testing

Open browser console on your app and run:

```javascript
// 1. Get active jobs
fetch('/api/dispatch/jobs/active')
  .then(r => r.json())
  .then(console.log)

// 2. Get tech activity
fetch('/api/dispatch/techs/TECH_ID/activity?limit=5')
  .then(r => r.json())
  .then(console.log)

// 3. Get tech stats
fetch('/api/dispatch/techs/TECH_ID/stats')
  .then(r => r.json())
  .then(console.log)

// 4. Assign job
fetch('/api/dispatch/jobs/JOB_ID/assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ techId: 'TECH_ID', notifyTech: true })
})
  .then(r => r.json())
  .then(console.log)

// 5. Get stats
fetch('/api/dispatch/stats?timeRange=today')
  .then(r => r.json())
  .then(console.log)

// 6. Auto-assign (dry run)
fetch('/api/dispatch/auto-assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobId: 'JOB_ID', dryRun: true })
})
  .then(r => r.json())
  .then(console.log)
```

---

## Error Testing

Test these error scenarios:

### 1. Unauthorized (401)
```bash
curl -X GET 'http://localhost:3002/api/dispatch/jobs/active'
# No session cookie - should return 401
```

### 2. Forbidden (403)
```bash
# Login as a 'tech' role user and try to access
curl -X GET 'http://localhost:3002/api/dispatch/jobs/active' \
  -H 'Cookie: sb-access-token=TECH_USER_TOKEN'
# Should return 403 - only dispatcher/admin/owner allowed
```

### 3. Not Found (404)
```bash
curl -X GET 'http://localhost:3002/api/dispatch/techs/invalid-id/activity' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN'
# Should return 404 - tech not found
```

### 4. Bad Request (400)
```bash
curl -X POST 'http://localhost:3002/api/dispatch/jobs/JOB_ID/assign' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN' \
  -d '{}'
# Missing techId - should return 400
```

### 5. Conflict (409)
```bash
# Try to assign a tech that's already on another job
curl -X POST 'http://localhost:3002/api/dispatch/jobs/JOB_ID/assign' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=YOUR_SESSION_TOKEN' \
  -d '{"techId": "BUSY_TECH_ID"}'
# Should return 409 with conflict details
```

---

## Load Testing with Artillery

Create `artillery-config.yml`:

```yaml
config:
  target: 'http://localhost:3002'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
  variables:
    techId: "YOUR_TECH_ID"
    jobId: "YOUR_JOB_ID"

scenarios:
  - name: "Dispatch API Load Test"
    flow:
      - get:
          url: "/api/dispatch/jobs/active"
          headers:
            Cookie: "sb-access-token=YOUR_TOKEN"
      - get:
          url: "/api/dispatch/stats?timeRange=today"
          headers:
            Cookie: "sb-access-token=YOUR_TOKEN"
      - get:
          url: "/api/dispatch/techs/{{ techId }}/activity"
          headers:
            Cookie: "sb-access-token=YOUR_TOKEN"
```

Run with:
```bash
npm install -g artillery
artillery run artillery-config.yml
```

---

## Monitoring & Debugging

### 1. Check Server Logs
```bash
# Watch Next.js server logs
tail -f .next/trace

# Or if running in terminal
npm run dev | grep "dispatch"
```

### 2. Database Query Monitoring

Enable Supabase query logging in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

### 3. Response Time Tracking

Add this to any endpoint for timing:
```typescript
const startTime = Date.now()
// ... your code ...
console.log(`[Dispatch API] Endpoint took ${Date.now() - startTime}ms`)
```

---

## Automated Testing Script

Save as `test-dispatch-api.sh`:

```bash
#!/bin/bash

# Dispatch Map API Test Script
# Usage: ./test-dispatch-api.sh YOUR_SESSION_TOKEN

TOKEN=$1
BASE_URL="http://localhost:3002"

if [ -z "$TOKEN" ]; then
  echo "Usage: ./test-dispatch-api.sh YOUR_SESSION_TOKEN"
  exit 1
fi

echo "Testing Dispatch Map API Endpoints..."
echo "======================================"

# Test 1: Get Active Jobs
echo -e "\n1. Testing GET /api/dispatch/jobs/active"
curl -s -X GET "$BASE_URL/api/dispatch/jobs/active" \
  -H "Cookie: sb-access-token=$TOKEN" | jq '.'

# Test 2: Get Dispatch Stats
echo -e "\n2. Testing GET /api/dispatch/stats"
curl -s -X GET "$BASE_URL/api/dispatch/stats?timeRange=today" \
  -H "Cookie: sb-access-token=$TOKEN" | jq '.kpis'

# Test 3: Test unauthorized access
echo -e "\n3. Testing unauthorized access (should return 401)"
curl -s -X GET "$BASE_URL/api/dispatch/jobs/active" | jq '.'

echo -e "\n======================================"
echo "Test complete!"
```

Make executable and run:
```bash
chmod +x test-dispatch-api.sh
./test-dispatch-api.sh YOUR_SESSION_TOKEN
```

---

## Next Steps After Testing

1. **If tests pass:**
   - ✅ Mark endpoints as production-ready
   - ✅ Begin frontend integration
   - ✅ Add to API documentation site

2. **If tests fail:**
   - Review error logs
   - Check database permissions
   - Verify Supabase connection
   - Contact Agent 1 for fixes

---

*Happy Testing!*
*Agent 1: API Endpoints Specialist*
