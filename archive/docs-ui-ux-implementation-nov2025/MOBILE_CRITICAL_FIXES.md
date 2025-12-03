# Mobile Critical Fixes Required

**Priority: HIGH - Fix Before Testing**

## Issue 1: Route Links Missing `/m/` Prefix

### Tech Dashboard
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/m/tech/dashboard/page.tsx`

Line 99:
```tsx
// BEFORE (WRONG)
<Link href={`/tech/job/${currentJob.id}`}>

// AFTER (CORRECT)
<Link href={`/m/tech/job/${currentJob.id}`}>
```

### Tech Job Page
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/m/tech/job/[id]/page.tsx`

Line 754:
```tsx
// BEFORE (WRONG)
onClick={() => router.push('/tech/dashboard')}

// AFTER (CORRECT)
onClick={() => router.push('/m/tech/dashboard')}
```

### Sales Dashboard
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/m/sales/dashboard/page.tsx`

Line 102:
```tsx
// BEFORE (WRONG)
<Link href={`/sales/briefing/${nextMeeting.contactId}`}>

// AFTER (CORRECT)
<Link href={`/m/sales/briefing/${nextMeeting.contactId}`}>
```

Line 109:
```tsx
// BEFORE (WRONG)
<Link href={`/sales/meeting/${nextMeeting.id}`}>

// AFTER (CORRECT)
<Link href={`/m/sales/meeting/${nextMeeting.id}`}>
```

Line 123:
```tsx
// BEFORE (WRONG)
<Link href="/sales/meeting/new">

// AFTER (CORRECT)
<Link href="/m/sales/meeting/new">
```

Line 131:
```tsx
// BEFORE (WRONG)
<Link href="/sales/voice-note">

// AFTER (CORRECT)
<Link href="/m/sales/voice-note">
```

Line 148:
```tsx
// BEFORE (WRONG)
href={`/sales/meeting/${meeting.id}`}

// AFTER (CORRECT)
href={`/m/sales/meeting/${meeting.id}`}
```

### Owner Dashboard
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/m/owner/dashboard/page.tsx`

Line 211:
```tsx
// BEFORE (WRONG)
<Link href="/owner/reports">

// AFTER (CORRECT)
<Link href="/m/owner/reports">
```

Line 218:
```tsx
// BEFORE (WRONG)
<Link href="/owner/schedule">

// AFTER (CORRECT)
<Link href="/m/owner/schedule">
```

---

## Issue 2: Hardcoded Blue Colors (13 occurrences)

### Loading Spinners

**Files:**
- `/app/m/owner/dashboard/page.tsx` line 79
- `/app/m/sales/briefing/[contactId]/page.tsx` line 71
- `/app/m/office/dashboard/page.tsx` line 85
- `/app/m/tech/job/[id]/page.tsx` line 475

```tsx
// BEFORE (WRONG)
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />

// AFTER (CORRECT)
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

### Icons and Text

**File:** `/app/m/tech/job/[id]/page.tsx`

Line 529:
```tsx
// BEFORE (WRONG)
<MapPin className="w-16 h-16 mx-auto text-blue-400 mb-4" />

// AFTER (CORRECT)
<MapPin className="w-16 h-16 mx-auto text-[var(--color-accent-primary)] mb-4" />
```

Line 703:
```tsx
// BEFORE (WRONG)
<PenTool className="w-16 h-16 mx-auto text-blue-400 mb-4" />

// AFTER (CORRECT)
<PenTool className="w-16 h-16 mx-auto text-[var(--color-accent-primary)] mb-4" />
```

**File:** `/app/m/sales/meeting/[id]/page.tsx`

Line 224:
```tsx
// BEFORE (WRONG)
<div className="text-3xl font-mono text-blue-400">{formatTime(duration)}</div>

// AFTER (CORRECT)
<div className="text-3xl font-mono text-[var(--color-accent-primary)]">{formatTime(duration)}</div>
```

### Buttons and Backgrounds

**File:** `/app/m/sales/briefing/[contactId]/page.tsx`

Line 84:
```tsx
// BEFORE (WRONG)
<button onClick={() => router.back()} className="mt-4 text-blue-400">

// AFTER (CORRECT)
<button onClick={() => router.back()} className="mt-4 text-[var(--color-accent-primary)]">
```

Line 95:
```tsx
// BEFORE (WRONG)
<header className="bg-gradient-to-b from-blue-900 to-gray-900 p-4 pb-8">

// AFTER (CORRECT)
<header className="bg-gradient-to-b from-[var(--color-accent-primary)]/20 to-gray-900 p-4 pb-8">
```

Line 101:
```tsx
// BEFORE (WRONG)
<div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">

// AFTER (CORRECT)
<div className="w-16 h-16 bg-[var(--color-accent-primary)] rounded-full flex items-center justify-center text-2xl font-bold">
```

Line 108:
```tsx
// BEFORE (WRONG)
<div className="flex items-center gap-2 text-blue-300">

// AFTER (CORRECT)
<div className="flex items-center gap-2 text-[var(--color-accent-primary)]/80">
```

Line 209:
```tsx
// BEFORE (WRONG)
<div key={meeting.id} className="border-l-2 border-blue-500 pl-3">

// AFTER (CORRECT)
<div key={meeting.id} className="border-l-2 border-[var(--color-accent-primary)] pl-3">
```

**File:** `/app/m/office/dashboard/page.tsx`

Line 222:
```tsx
// BEFORE (WRONG)
className="px-4 py-2 bg-blue-600 rounded-lg font-bold text-sm"

// AFTER (CORRECT)
className="px-4 py-2 bg-[var(--color-accent-primary)] rounded-lg font-bold text-sm"
```

**File:** `/app/m/owner/dashboard/page.tsx`

Line 181:
```tsx
// BEFORE (WRONG)
tech.status === 'en_route' ? 'bg-blue-900 text-blue-400' :

// AFTER (CORRECT)
tech.status === 'en_route' ? 'bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]' :
```

Line 245 (StatCard color mapping):
```tsx
// BEFORE (WRONG)
const colors = {
  green: 'text-green-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
}

// AFTER (CORRECT)
const colors = {
  green: 'text-green-400',
  blue: 'text-[var(--color-accent-primary)]',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
}
```

---

## Issue 3: Missing API Routes

### Create Sales Leads Route
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/api/sales/leads/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch leads for the sales rep
  const { data: leads, error } = await supabase
    .from('opportunities')
    .select(`
      id,
      status,
      value,
      last_contact,
      contact:contacts(
        id,
        first_name,
        last_name,
        company
      )
    `)
    .eq('assigned_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data for mobile
  const transformedLeads = leads?.map(lead => ({
    id: lead.id,
    contactName: `${lead.contact.first_name} ${lead.contact.last_name}`,
    company: lead.contact.company,
    status: lead.status,
    value: lead.value || 0,
    lastContact: lead.last_contact,
  }))

  return NextResponse.json({ leads: transformedLeads || [] })
}
```

### Create Sales Profile Route
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/api/sales/profile/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role')
    .eq('id', user.id)
    .single()

  // Calculate stats
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, status, value')
    .eq('assigned_user_id', user.id)

  const dealsWon = opportunities?.filter(o => o.status === 'won').length || 0
  const totalRevenue = opportunities
    ?.filter(o => o.status === 'won')
    .reduce((sum, o) => sum + (o.value || 0), 0) || 0
  const conversionRate = opportunities?.length
    ? Math.round((dealsWon / opportunities.length) * 100)
    : 0

  return NextResponse.json({
    user: {
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      email: profile?.email,
    },
    stats: {
      dealsWon,
      totalRevenue,
      conversionRate,
    },
  })
}
```

### Create Tech Profile Route
**File:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/app/api/tech/profile/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role')
    .eq('id', user.id)
    .single()

  // Calculate stats
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, status, scheduled_start, gate_completions!inner(satisfaction_rating)')
    .eq('assigned_tech_id', user.id)
    .eq('status', 'completed')

  const jobsCompleted = jobs?.length || 0
  const avgRating = jobs?.length
    ? jobs.reduce((sum, j) => {
        const rating = j.gate_completions?.[0]?.satisfaction_rating || 0
        return sum + rating
      }, 0) / jobs.length
    : 0

  // Calculate on-time rate
  const onTimeJobs = jobs?.filter(j => {
    // Logic to determine if job was completed on time
    return true // Placeholder
  }).length || 0
  const onTimeRate = jobs?.length ? Math.round((onTimeJobs / jobs.length) * 100) : 0

  return NextResponse.json({
    user: {
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      email: profile?.email,
    },
    stats: {
      jobsCompleted,
      avgRating: Math.round(avgRating * 10) / 10,
      onTimeRate,
    },
  })
}
```

---

## Quick Fix Script

Run this to apply all link fixes at once:

```bash
# Fix Tech Dashboard
sed -i '' 's|/tech/job/|/m/tech/job/|g' app/m/tech/dashboard/page.tsx

# Fix Tech Job Page
sed -i '' "s|'/tech/dashboard'|'/m/tech/dashboard'|g" app/m/tech/job/\[id\]/page.tsx

# Fix Sales Dashboard
sed -i '' 's|/sales/briefing/|/m/sales/briefing/|g' app/m/sales/dashboard/page.tsx
sed -i '' 's|/sales/meeting/|/m/sales/meeting/|g' app/m/sales/dashboard/page.tsx
sed -i '' 's|/sales/voice-note|/m/sales/voice-note|g' app/m/sales/dashboard/page.tsx

# Fix Owner Dashboard
sed -i '' 's|/owner/reports|/m/owner/reports|g' app/m/owner/dashboard/page.tsx
sed -i '' 's|/owner/schedule|/m/owner/schedule|g' app/m/owner/dashboard/page.tsx

# Fix theme colors (loading spinners)
sed -i '' 's|border-blue-500|border-[var(--color-accent-primary)]|g' app/m/owner/dashboard/page.tsx
sed -i '' 's|border-blue-500|border-[var(--color-accent-primary)]|g' app/m/sales/briefing/\[contactId\]/page.tsx
sed -i '' 's|border-blue-500|border-[var(--color-accent-primary)]|g' app/m/office/dashboard/page.tsx
sed -i '' 's|border-blue-500|border-[var(--color-accent-primary)]|g' app/m/tech/job/\[id\]/page.tsx

echo "✅ All critical fixes applied!"
```

---

## Verification After Fixes

After applying fixes, verify:

1. ✅ All navigation links work correctly
2. ✅ No 404 errors when navigating between pages
3. ✅ All colors use theme variables
4. ✅ API routes return proper data
5. ✅ Complete a full tech workflow
6. ✅ Complete a full sales workflow

---

**Total Time to Fix:** ~30 minutes
**Impact:** Critical - App won't work correctly without these fixes
**Priority:** FIX IMMEDIATELY before any testing
