# Task 3: Offline Sync Activation

**Agent:** C (Offline Systems Engineer)
**Priority:** IMPORTANT
**Duration:** 2-3 hours
**Dependencies:** None
**Confidence:** 100%

---

## 🎯 **Objective**

Activate automatic offline sync when network connection is restored. The sync infrastructure exists but isn't triggered automatically.

---

## 📋 **Current State**

**What EXISTS:**
- ✅ Offline database (lib/offline/db.ts) - Dexie.js IndexedDB
- ✅ Sync queue system (lib/offline/db.ts:105-140)
- ✅ Offline save functions for gates, photos, GPS logs
- ⚠️ Sync service exists (lib/offline/sync-service.ts) - NOT INTEGRATED

**What's MISSING:**
- ❌ Automatic sync trigger on network reconnection
- ❌ Background sync worker
- ❌ Sync status UI indicators
- ❌ Conflict resolution logic

**Existing Code:**
```typescript
// lib/offline/db.ts:105-118
export async function addToSyncQueue(
  table: string,
  operation: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  const db = getOfflineDB()
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    table,
    operation,
    data,
    attempts: 0,
  })
}
```

---

## ✅ **Solution Approach**

Implement a sync orchestrator that:
1. Monitors network connection status
2. Triggers sync when online
3. Processes sync queue items
4. Handles sync failures with exponential backoff

---

## 🔧 **Implementation Steps**

### **Step 1: Read Existing Sync Service**

Check if sync service can be used as-is:
```bash
cat lib/offline/sync-service.ts
```

**Expected:** Sync logic for uploading pending items to Supabase

### **Step 2: Create Sync Orchestrator Hook**

**File:** `/lib/hooks/use-offline-sync.ts` (NEW FILE)

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPendingSyncItems, markSynced, incrementSyncAttempt } from '@/lib/offline/db'
import { createClient } from '@/lib/supabase/client'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingItems() // Auto-sync when back online
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get pending items count
  const updatePendingCount = useCallback(async () => {
    const items = await getPendingSyncItems()
    setPendingCount(items.length)
  }, [])

  // Sync pending items
  const syncPendingItems = useCallback(async () => {
    if (isSyncing || !isOnline) return

    setIsSyncing(true)
    try {
      const items = await getPendingSyncItems()

      for (const item of items) {
        try {
          // Sync based on table
          if (item.table === 'job_gates') {
            await syncGateCompletion(item.data, supabase)
          } else if (item.table === 'job_photos') {
            await syncPhoto(item.data, supabase)
          } else if (item.table === 'gps_logs') {
            await syncGpsLog(item.data, supabase)
          }

          // Mark as synced
          await markSynced(item.id)
        } catch (error) {
          console.error(`Sync failed for ${item.table}:`, error)
          await incrementSyncAttempt(item.id, (error as Error).message)
        }
      }

      await updatePendingCount()
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, supabase])

  // Check for pending items on mount
  useEffect(() => {
    updatePendingCount()
  }, [updatePendingCount])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow: syncPendingItems,
  }
}

// Sync helper functions
async function syncGateCompletion(data: any, supabase: any) {
  const { error } = await supabase.from('job_gates').insert({
    job_id: data.jobId,
    stage_name: data.stageName,
    status: data.status || 'completed',
    metadata: data.metadata,
    completed_at: data.completedAt || new Date().toISOString(),
    completed_by: data.completedBy,
    requires_exception: data.requiresException,
    satisfaction_rating: data.satisfactionRating,
    review_requested: data.reviewRequested,
    discount_applied: data.discountApplied,
  })

  if (error) throw error
}

async function syncPhoto(data: any, supabase: any) {
  // Photos with blobs need special handling
  if (data.blobData) {
    // Upload blob to storage first
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(data.storagePath, data.blobData)

    if (uploadError) throw uploadError
  }

  // Then create record
  const { error } = await supabase.from('job_photos').insert({
    job_id: data.jobId,
    storage_path: data.storagePath,
    taken_by: data.takenBy,
    metadata: data.metadata,
  })

  if (error) throw error
}

async function syncGpsLog(data: any, supabase: any) {
  const { error } = await supabase.from('gps_logs').insert({
    account_id: data.accountId,
    user_id: data.userId,
    job_id: data.jobId,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    event_type: data.eventType,
    metadata: data.metadata,
  })

  if (error) throw error
}
```

---

### **Step 3: Add Sync Provider to App Layout**

**File:** `/app/m/tech/layout.tsx` (NEW FILE)

```typescript
'use client'

import { useOfflineSync } from '@/lib/hooks/use-offline-sync'

export default function TechLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync()

  return (
    <>
      {/* Offline indicator banner */}
      {!isOnline && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm font-medium">
          ⚠️ Offline Mode - {pendingCount} items pending sync
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
          🔄 Syncing {pendingCount} items...
        </div>
      )}

      {children}
    </>
  )
}
```

---

### **Step 4: Integrate Offline Save in Tech Workflow**

**File:** `/app/m/tech/job/[id]/page.tsx`

**Add import (after line 10):**
```typescript
import { saveGateCompletionOffline, type OfflineGateCompletion } from '@/lib/offline/db'
```

**Update handleArrival (lines 89-111):**
```typescript
const handleArrival = async () => {
  setIsProcessing(true)
  try {
    await gpsTracker.logArrival(jobId, { stage: 'arrival' })

    const gateData = {
      jobId,
      stageName: 'arrival',
      metadata: { gpsLogged: true },
    }

    // Try online first
    try {
      await fetch('/api/tech/gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateData),
      })
    } catch (error) {
      // If offline, save to IndexedDB
      if (!navigator.onLine) {
        const offlineGate: OfflineGateCompletion = {
          id: crypto.randomUUID(),
          localId: crypto.randomUUID(),
          jobId: jobId,
          stageName: 'arrival',
          status: 'completed',
          metadata: { gpsLogged: true },
          syncStatus: 'pending',
          lastModified: Date.now(),
        }
        await saveGateCompletionOffline(offlineGate)
      } else {
        throw error
      }
    }

    setGateState(prev => ({ ...prev, arrivalLogged: true }))
    setCurrentStage('before_photos')
  } catch (error) {
    alert('Failed to log arrival. Please check GPS permissions.')
  } finally {
    setIsProcessing(false)
  }
}
```

**Repeat for other gate completions** (satisfaction, signature, etc.)

---

## 🧪 **Testing**

### **Test Plan:**

1. **Test Online Sync:**
   - [ ] Complete a gate while online
   - [ ] Verify it saves to server immediately
   - [ ] Check no items in sync queue

2. **Test Offline Mode:**
   - [ ] Open DevTools → Network → Throttle to "Offline"
   - [ ] Complete arrival gate
   - [ ] Verify "Offline Mode" banner appears
   - [ ] Check gate saved to IndexedDB: `chrome://indexeddb/`
   - [ ] Verify sync queue has 1 item

3. **Test Auto-Sync on Reconnect:**
   - [ ] While still offline, complete another gate
   - [ ] Verify 2 items in sync queue
   - [ ] Switch throttle to "Online"
   - [ ] Verify "Syncing..." banner appears automatically
   - [ ] Wait for sync to complete
   - [ ] Verify both gates appear in Supabase
   - [ ] Verify sync queue is empty

4. **Test Sync Failures:**
   - [ ] Add invalid data to sync queue manually
   - [ ] Trigger sync
   - [ ] Verify failed item stays in queue
   - [ ] Verify `attempts` counter increments
   - [ ] Verify max 5 attempts before giving up

---

## ✅ **Acceptance Criteria**

- [ ] Auto-sync triggers when network reconnects
- [ ] Offline banner shows when offline
- [ ] Syncing indicator shows during sync
- [ ] Pending count displays correctly
- [ ] Failed syncs retry with backoff
- [ ] No data loss in offline mode
- [ ] Sync queue processes all items
- [ ] No errors in console

---

## 🚨 **Edge Cases to Handle**

1. **Duplicate Syncs:** Use `isSyncing` flag to prevent concurrent syncs
2. **Partial Failures:** Continue syncing other items if one fails
3. **Network Flapping:** Debounce sync trigger (wait 2 seconds after online event)
4. **Battery Saving:** Limit sync attempts per item (max 5)

---

## 📊 **Success Metrics**

- ✅ 100% of offline items eventually sync
- ✅ Sync triggers within 2 seconds of reconnection
- ✅ No duplicate data in database
- ✅ User sees clear status indicators

---

## ⏱️ **Time Breakdown**

- Create sync hook: 1 hour
- Add layout wrapper: 15 min
- Integrate offline saves: 45 min
- Testing all scenarios: 45 min
- Bug fixes: 15-30 min
- **Total: 2-3 hours**

---

## 🔗 **Related Files**

- `/lib/offline/db.ts` - Offline database (DO NOT MODIFY)
- `/lib/offline/sync-service.ts` - May have useful functions
- `/app/m/tech/job/[id]/page.tsx` - Integrate offline saves
- `/lib/gps/tracker.ts` - Already has offline GPS save

---

**Status:** Ready for execution ✅
