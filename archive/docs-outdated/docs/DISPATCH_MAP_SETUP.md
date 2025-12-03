# Dispatch Map Dashboard Setup Guide

## Overview

The Dispatch Map Dashboard provides real-time GPS tracking of field technicians and sales personnel. This guide covers the setup and configuration required to enable the feature.

## ✅ What's Been Implemented (Phase 1)

**Completed Features:**
- ✅ Google Maps integration with `@react-google-maps/api`
- ✅ API endpoint for fetching tech locations (`/api/dispatch/techs`)
- ✅ Main dispatch map dashboard page (`/app/(dashboard)/dispatch/map`)
- ✅ Tech marker display with status-based colors
- ✅ Info windows showing tech details
- ✅ Stats bar with counts by status (On Job, En Route, Idle, Offline)
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh button
- ✅ Dispatcher route updated to point to map dashboard

**Status Colors:**
- 🟢 Green = On Job (actively working)
- 🔵 Blue = En Route (traveling to job)
- 🟡 Yellow = Idle (available, recent GPS update)
- ⚪ Gray = Offline (no GPS update >30 minutes)

## 📋 Prerequisites

1. **Google Maps API Key** (required)
2. **Dispatcher Role User** (for testing)
3. **GPS Tracking Enabled** (backend already implemented)

## 🔧 Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Maps JavaScript API**:
   - Navigation: APIs & Services → Library
   - Search for "Maps JavaScript API"
   - Click "Enable"
4. Create an API Key:
   - Navigation: APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### Step 2: Configure API Key Restrictions (Recommended)

**For Security:**
1. Click on your API key in the Credentials page
2. Under "Application restrictions":
   - Select "HTTP referrers (websites)"
   - Add your domains:
     - `localhost:3002/*` (development)
     - `your-production-domain.com/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Maps JavaScript API"
4. Click "Save"

### Step 3: Add API Key to Environment Variables

Add to `.env.local`:

```bash
# Google Maps API Key (required for dispatch map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional: Default map center (business location)
# Default is Indianapolis if not specified
NEXT_PUBLIC_MAP_CENTER_LAT=39.7684
NEXT_PUBLIC_MAP_CENTER_LNG=-86.1581
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
```

**Example for 317 Plumber (Indianapolis):**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...your_key_here
NEXT_PUBLIC_MAP_CENTER_LAT=39.768403
NEXT_PUBLIC_MAP_CENTER_LNG=-86.158068
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
```

### Step 4: Restart Development Server

```bash
# Clear Next.js cache
rm -rf .next

# Restart server
PORT=3002 npm run dev
```

### Step 5: Access Dispatch Map

1. Log in as a user with `dispatcher`, `admin`, or `owner` role
2. Navigate to: `http://localhost:3002/dispatch/map`
3. Or, if logged in as dispatcher, you'll be automatically redirected to the map

## 🧪 Testing

### Test with Real Data

1. **Create Dispatcher User** (if not exists):
   ```sql
   UPDATE users
   SET role = 'dispatcher'
   WHERE email = 'dispatcher@317plumber.com';
   ```

2. **Generate Test GPS Logs**:
   - Use a tech user on mobile PWA
   - Navigate to a job and capture location
   - Or insert test data manually:
     ```sql
     INSERT INTO gps_logs (user_id, latitude, longitude, accuracy, event_type)
     VALUES (
       'tech-user-uuid',
       39.768403,  -- Indianapolis
       -86.158068,
       10,
       'auto'
     );
     ```

3. **Verify Map Display**:
   - Tech markers appear at correct locations
   - Colors match tech status
   - Clicking marker shows info window
   - Stats update correctly

### Test Auto-Refresh

1. Open dispatch map
2. Insert a new GPS log for a tech (in another tab)
3. Wait ~30 seconds
4. Verify marker position updates automatically

## 📊 API Endpoints

### GET /api/dispatch/techs

**Purpose:** Fetch all techs/sales with last known GPS location

**Authentication:** Requires `dispatcher`, `admin`, or `owner` role

**Response:**
```json
{
  "techs": [
    {
      "id": "uuid",
      "name": "John Smith",
      "role": "tech",
      "status": "on_job",
      "currentJob": {
        "id": "job-uuid",
        "description": "Fix water heater",
        "address": "123 Main St"
      },
      "lastLocation": {
        "lat": 39.768403,
        "lng": -86.158068,
        "accuracy": 10,
        "updatedAt": "2025-11-27T10:30:00Z"
      }
    }
  ]
}
```

## 🎯 Usage

### For Dispatchers

1. **Monitor Tech Locations**: See real-time positions on map
2. **Check Tech Status**: Color-coded markers show availability
3. **View Tech Details**: Click marker for current job info
4. **Track Metrics**: Stats bar shows team activity at a glance

### For Admins/Owners

Same as dispatchers, plus:
- Access via `/dispatch/map` directly
- Can assign jobs (Phase 3 feature - coming soon)
- View historical data (Phase 4 feature - coming soon)

## 🚀 What's Next (Upcoming Phases)

### Phase 2: Real-Time Updates (Next)
- Supabase real-time subscriptions for live marker updates
- No page refresh needed
- Instant position updates when tech moves

### Phase 3: Interactive Features
- Click tech marker to assign jobs
- Distance calculations (tech → job)
- Tech list sidebar with filters
- Job markers on map

### Phase 4: Advanced Features
- Stats dashboard with KPIs
- "Assign nearest tech" automation
- Navigation links to Google Maps
- Search techs by name

## 💰 Cost Estimate

**Google Maps Free Tier:**
- 28,000 map loads per month FREE
- After that: $7/1,000 loads

**Typical Usage:**
- 5 dispatchers × 20 views/day × 30 days = 3,000 loads/month
- **Well within free tier** for most businesses

**Recommendation:** Set a billing alert at $5/month to monitor usage.

## 🔒 Security

**Access Control:**
- Only `dispatcher`, `admin`, and `owner` roles can access
- API endpoint checks role permissions
- Multi-tenant isolation (only see techs in your account)

**API Key Security:**
- Use HTTP referrer restrictions
- Limit to Maps JavaScript API only
- Rotate keys periodically

**Data Privacy:**
- GPS logs stored for 24 hours only
- Tech locations not exposed to unauthorized users
- Audit trail for all dispatch actions

## 🐛 Troubleshooting

### Map Not Loading

**Error:** "Google Maps API key is not configured"
- **Fix:** Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`
- Restart dev server after adding

**Error:** Map shows gray tiles or "This page can't load Google Maps correctly"
- **Fix:** Check API key is valid and Maps JavaScript API is enabled
- Verify no billing issues in Google Cloud Console

### No Tech Markers Showing

**Possible Causes:**
1. No techs have GPS logs in last 30 minutes
2. GPS logs missing `latitude`/`longitude` data
3. User doesn't have dispatcher permissions

**Debug:**
```bash
# Check GPS logs exist
SELECT user_id, latitude, longitude, created_at
FROM gps_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

# Check user role
SELECT id, full_name, role FROM users WHERE role IN ('tech', 'sales');
```

### "Unauthorized" or "Forbidden" Errors

**Fix:** Ensure logged-in user has dispatcher, admin, or owner role:
```sql
UPDATE users SET role = 'dispatcher' WHERE email = 'your-email@example.com';
```

## 📚 Related Documentation

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [GPS Tracking Implementation](/lib/gps/tracker.ts)
- [Supabase Real-Time Guide](https://supabase.com/docs/guides/realtime)
- [Multi-Tenant Security](/docs/MULTI_TENANT_SECURITY_ASSESSMENT.md)

## ✅ Checklist

Before launching to production:

- [ ] Google Maps API key configured
- [ ] API key restrictions enabled
- [ ] Billing alert set up
- [ ] Dispatcher users created
- [ ] Tested with real GPS data
- [ ] Tested on mobile devices
- [ ] Documented for team
- [ ] Support ticket template created

---

**Status:** Phase 1 Complete ✅
**Next:** Phase 2 - Real-Time Updates
**Estimated Completion:** 2 weeks for full implementation
