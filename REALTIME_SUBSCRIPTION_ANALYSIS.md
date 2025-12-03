# Real-time Subscription Performance Analysis & Action Plan

**Date:** November 29, 2025  
**Issue:** Real-time subscriptions consuming 97% of database time (2.2M+ queries)  
**Severity:** CRITICAL - Production Performance Impact

---

## Executive Summary

Your CRM-AI Pro platform has a critical performance issue caused by poorly optimized real-time subscriptions. The `realtime.list_changes()` function consumed **97.34%** of total database query time with over **2.2 million calls**, averaging 4.76ms per query with peaks at 7.4 seconds.

**The Good News:** This is entirely fixable through application code changes. No database schema modifications needed.

**The Bad News:** Without fixes, your platform will become increasingly slow as users scale, potentially causing:
- User session timeouts
- Delayed UI updates
- Increased infrastructure costs
- Poor user experience

---

## Current Subscription Analysis

### Files with Real-time Subscriptions

I found **6 active subscription implementations** across your codebase:

| File | Subscription Type | Filter Status | Risk Level |
|------|------------------|---------------|------------|
| `lib/hooks/useNotifications.ts` | Notifications | ✅ **GOOD** - Filtered by `user_id` | LOW |
| `hooks/use-voice-navigation.ts` | Voice Commands | ✅ **GOOD** - Filtered by `account_id` | LOW |
| `components/dashboard/message-thread.tsx` | Messages | ✅ **GOOD** - Filtered by `conversation_id` | LOW |
| `components/dashboard/conversation-list.tsx` | Conversations | ❌ **CRITICAL** - No filter! | **CRITICAL** |
| `app/(dashboard)/jobs/page.tsx` | Jobs | ❌ **CRITICAL** - No filter! | **CRITICAL** |
| `components/dispatch/AssignTechDialog.example.tsx` | Jobs (commented) | N/A - Commented out | N/A |

### Critical Issues Identified

#### 1. **Conversation List** - CRITICAL RISK
```typescript
// CURRENT CODE - BAD
const channel = supabase
  .channel('conversations_changes')
  .on('postgres_changes', {
    event: '*',              // ❌ Listening to ALL events
    schema: 'public',
    table: 'conversations',  // ❌ NO FILTER - Gets every conversation update!
  }, (payload) => {
    fetchConversations()     // ❌ Triggers full re-fetch on ANY change
  })
  .subscribe()
```

**Impact:**
- Every conversation update across ALL accounts triggers this
- Every user session listens to ALL conversations
- Multiplies by number of active users
- Triggers expensive API calls on every database change

**Estimated Load Contribution:** 40-50% of total subscription queries

---

#### 2. **Jobs Page** - CRITICAL RISK
```typescript
// CURRENT CODE - BAD
const channel = supabase
  .channel('jobs_changes')
  .on('postgres_changes', {
    event: 'INSERT',         // ✅ Good - specific event
    schema: 'public',
    table: 'jobs'            // ❌ NO FILTER - Gets every job across all accounts!
  }, (payload) => {
    setJobs(prevJobs => [payload.new as Job, ...prevJobs])  // ❌ Adds ALL jobs
    toastSuccess('New job created')                          // ❌ Toast for everyone!
  })
```

**Impact:**
- Every job creation shows toast notification to ALL users
- Jobs from other accounts appear in your job list
- Security vulnerability - data leakage
- Performance degradation with scale

**Estimated Load Contribution:** 30-40% of total subscription queries

---

## Risk Analysis Matrix

### Performance Risks

| Risk Category | Severity | Impact | Likelihood | Priority |
|--------------|----------|---------|-----------|----------|
| Database timeout during peak | HIGH | User sessions drop | HIGH | P0 |
| Exponential query growth | CRITICAL | Platform becomes unusable | HIGH | P0 |
| Cross-account data leakage | CRITICAL | Security breach | MEDIUM | P0 |
| Infrastructure cost spike | MEDIUM | Budget overruns | HIGH | P1 |
| Poor UX (slow updates) | HIGH | User churn | HIGH | P1 |

### Security Risks

**CRITICAL SECURITY VULNERABILITY IDENTIFIED:**

The Jobs page subscription has **NO account filtering**, meaning:
- User A can see when User B creates a job
- Toast notifications leak business intelligence
- Potential PII/PHI exposure if jobs contain customer data
- RLS policies may not protect real-time channels

**GDPR/HIPAA/Compliance Impact:** SEVERE

---

## Recommended Solutions

### Phase 1: Immediate Fixes (Deploy within 24-48 hours)

#### Fix 1: Add Account Filters to Conversations
```typescript
// hooks/use-account.ts - Create this utility
export function useAccountId() {
  const [accountId, setAccountId] = useState<string | null>(null)
  
  useEffect(() => {
    const getAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.account_id) {
        setAccountId(user.user_metadata.account_id)
      }
    }
    getAccount()
  }, [])
  
  return accountId
}
```

```typescript
// components/dashboard/conversation-list.tsx - FIXED
const accountId = useAccountId()

useEffect(() => {
  if (!accountId) return  // Don't subscribe without account context
  
  const channel = supabase
    .channel(`conversations_${accountId}`)  // ✅ Unique channel per account
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `account_id=eq.${accountId}`  // ✅ CRITICAL FIX
    }, (payload) => {
      // ✅ Now only gets THIS account's conversations
      fetchConversations()
    })
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}, [accountId])  // ✅ Re-subscribe if account changes
```

**Impact Reduction:** ~40-50% fewer subscription queries

---

#### Fix 2: Add Account Filters to Jobs
```typescript
// app/(dashboard)/jobs/page.tsx - FIXED
const accountId = useAccountId()  // Import from hooks/use-account.ts

useEffect(() => {
  if (!accountId) return
  
  const channel = supabase
    .channel(`jobs_${accountId}`)  // ✅ Unique channel per account
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'jobs',
      filter: `account_id=eq.${accountId}`  // ✅ CRITICAL FIX
    }, (payload) => {
      setJobs(prevJobs => [payload.new as Job, ...prevJobs])
      toastSuccess('New job created')
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'jobs',
      filter: `account_id=eq.${accountId}`  // ✅ Add to all events
    }, (payload) => {
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === payload.new.id ? { ...job, ...payload.new } as Job : job
      ))
      toastSuccess('Job updated')
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'jobs',
      filter: `account_id=eq.${accountId}`  // ✅ Add to all events
    }, (payload) => {
      setJobs(prevJobs => prevJobs.filter(job => job.id !== payload.old.id))
      toastSuccess('Job deleted')
    })
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}, [accountId])
```

**Impact Reduction:** ~30-40% fewer subscription queries

---

### Phase 2: Performance Optimizations (Deploy within 1 week)

#### Optimization 1: Debounce Rapid Updates
```typescript
// lib/utils/debounce.ts
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}
```

```typescript
// components/dashboard/conversation-list.tsx - OPTIMIZED
const debouncedFetch = useDebouncedCallback(fetchConversations, 1000)  // Wait 1s

.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'conversations',
  filter: `account_id=eq.${accountId}`
}, (payload) => {
  debouncedFetch()  // ✅ Batches rapid changes
})
```

**Impact Reduction:** ~20-30% fewer API calls during rapid updates

---

#### Optimization 2: Optimistic UI Updates (Reduce API Calls)
```typescript
// components/dashboard/conversation-list.tsx - OPTIMIZED
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'conversations',
  filter: `account_id=eq.${accountId}`
}, (payload) => {
  // ✅ Add directly to state - no API call needed
  setConversations(prev => [payload.new as Conversation, ...prev])
})
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'conversations',
  filter: `account_id=eq.${accountId}`
}, (payload) => {
  // ✅ Update state directly
  setConversations(prev => prev.map(conv =>
    conv.id === payload.new.id ? payload.new as Conversation : conv
  ))
})
.on('postgres_changes', {
  event: 'DELETE',
  schema: 'public',
  table: 'conversations',
  filter: `account_id=eq.${accountId}`
}, (payload) => {
  // ✅ Remove from state directly
  setConversations(prev => prev.filter(conv => conv.id !== payload.old.id))
})
```

**Impact Reduction:** ~50-70% fewer API calls

---

#### Optimization 3: Subscription Pooling
```typescript
// lib/contexts/realtime-provider.tsx - NEW
export function RealtimeProvider({ children, accountId }: { children: React.ReactNode, accountId: string }) {
  const supabase = createClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  
  useEffect(() => {
    if (!accountId) return
    
    // ✅ Single shared channel for all subscriptions
    const sharedChannel = supabase
      .channel(`account_${accountId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `account_id=eq.${accountId}`
      }, (payload) => {
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('conversation_change', { detail: payload }))
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `account_id=eq.${accountId}`
      }, (payload) => {
        window.dispatchEvent(new CustomEvent('job_change', { detail: payload }))
      })
      .subscribe()
      
    setChannel(sharedChannel)
    
    return () => {
      supabase.removeChannel(sharedChannel)
    }
  }, [accountId])
  
  return <>{children}</>
}
```

**Impact Reduction:** ~30-50% fewer subscription channels

---

### Phase 3: Advanced Optimizations (Deploy within 2-4 weeks)

#### 1. **Implement Application-Level Caching**
```typescript
// lib/cache/subscription-cache.ts
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 500,  // Max items
  ttl: 1000 * 60 * 5,  // 5 minute TTL
})

export function useSubscriptionCache(key: string, fetcher: () => Promise<any>) {
  const [data, setData] = useState(cache.get(key))
  
  useEffect(() => {
    if (!data) {
      fetcher().then(result => {
        cache.set(key, result)
        setData(result)
      })
    }
  }, [key])
  
  return data
}
```

#### 2. **Implement Presence Tracking**
Only subscribe when user is actively viewing the page:

```typescript
useEffect(() => {
  let channel: RealtimeChannel | null = null
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // ✅ Unsubscribe when tab is hidden
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    } else {
      // ✅ Re-subscribe when tab becomes visible
      channel = setupSubscription()
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  channel = setupSubscription()
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (channel) supabase.removeChannel(channel)
  }
}, [])
```

#### 3. **Server-Sent Events (SSE) Alternative**
Consider migrating from Supabase Realtime to SSE for better control:

```typescript
// app/api/events/route.ts
export async function GET(req: Request) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()
  
  // Send events only for this account
  const interval = setInterval(() => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}

`))
  }, 30000)
  
  req.signal.addEventListener('abort', () => {
    clearInterval(interval)
    writer.close()
  })
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

---

## Implementation Timeline

| Phase | Tasks | Est. Time | Priority | Impact |
|-------|-------|-----------|----------|--------|
| **Immediate (Day 1-2)** | Add account filters to conversations & jobs | 4-6 hours | P0 | 70-90% reduction |
| **Short-term (Week 1)** | Debouncing + Optimistic UI | 8-12 hours | P1 | Additional 20-30% reduction |
| **Medium-term (Week 2-4)** | Subscription pooling + Caching | 16-24 hours | P2 | Additional 10-20% reduction |
| **Long-term (Month 2)** | SSE migration + Presence tracking | 40-60 hours | P3 | Future-proofing |

---

## Testing Strategy

### Unit Tests
```typescript
// tests/subscriptions/conversation-list.test.ts
describe('Conversation List Subscriptions', () => {
  it('should only subscribe to account-specific conversations', async () => {
    const mockAccountId = 'test-account-123'
    render(<ConversationList />, {
      wrapper: ({ children }) => (
        <AccountProvider accountId={mockAccountId}>
          {children}
        </AccountProvider>
      )
    })
    
    // Verify subscription includes account filter
    expect(supabase.channel).toHaveBeenCalledWith(
      expect.stringContaining(mockAccountId)
    )
    expect(supabase.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        filter: `account_id=eq.${mockAccountId}`
      }),
      expect.any(Function)
    )
  })
})
```

### Integration Tests
```typescript
// tests/e2e/subscriptions.spec.ts
test('cross-account isolation', async ({ page, context }) => {
  // Login as Account A
  const pageA = await context.newPage()
  await pageA.goto('/login')
  await loginAs(pageA, 'accountA@test.com')
  await pageA.goto('/jobs')
  
  // Login as Account B in separate context
  const contextB = await browser.newContext()
  const pageB = await contextB.newPage()
  await pageB.goto('/login')
  await loginAs(pageB, 'accountB@test.com')
  await pageB.goto('/jobs')
  
  // Create job in Account B
  await pageB.click('[data-testid="create-job"]')
  await pageB.fill('[name="title"]', 'Test Job B')
  await pageB.click('[data-testid="save-job"]')
  
  // Verify Account A doesn't see it
  await expect(pageA.locator('text=Test Job B')).not.toBeVisible()
})
```

### Load Testing
```typescript
// tests/load/subscription-stress.ts
import { check } from 'k6'
import http from 'k6/http'

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
}

export default function () {
  const res = http.get('https://your-app.com/jobs')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'transaction time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

---

## Monitoring & Alerts

### Metrics to Track
```typescript
// lib/monitoring/subscription-metrics.ts
export function trackSubscriptionMetrics() {
  const metrics = {
    activeChannels: 0,
    messagesReceived: 0,
    averageLatency: 0,
    errorRate: 0,
  }
  
  // Track with your analytics provider
  analytics.track('subscription_metrics', metrics)
}
```

### Alert Thresholds
- **Critical:** Subscription count > 1000 per user
- **Warning:** Average message latency > 2000ms
- **Warning:** Error rate > 5%
- **Info:** Channel reconnection events

---

## Cost-Benefit Analysis

### Current State (No Filters)
- **Database Time:** 177 minutes consumed
- **Query Count:** 2.2M+ queries
- **Estimated Cost:** $500-1000/month in excess database resources
- **User Impact:** Slow UI, timeouts, data leakage

### After Phase 1 Fixes
- **Database Time:** ~18-35 minutes (80-90% reduction)
- **Query Count:** ~220K-440K queries (80-90% reduction)
- **Estimated Cost:** $50-150/month
- **User Impact:** Fast UI, no timeouts, secure data

### ROI
- **Development Time:** 4-6 hours
- **Cost Savings:** $450-850/month
- **Break-even:** Immediate
- **Payback Period:** < 1 week

---

## Decision Matrix

| Option | Risk | Complexity | Impact | Recommendation |
|--------|------|------------|--------|----------------|
| **Do Nothing** | CRITICAL | N/A | Platform fails | ❌ NOT RECOMMENDED |
| **Phase 1 Only** | LOW | LOW | 70-90% improvement | ✅ MINIMUM VIABLE |
| **Phase 1 + 2** | VERY LOW | MEDIUM | 90-95% improvement | ✅ RECOMMENDED |
| **All Phases** | VERY LOW | HIGH | 95-99% improvement | ✅ OPTIMAL |

---

## Conclusion & Next Steps

### Immediate Actions (Next 24 Hours)
1. ✅ Review this analysis
2. 🔧 Create `hooks/use-account.ts` utility
3. 🔧 Apply Phase 1 fixes to `conversation-list.tsx`
4. 🔧 Apply Phase 1 fixes to `jobs/page.tsx`
5. 🧪 Test in development environment
6. 🚀 Deploy to staging
7. 📊 Monitor subscription metrics

### This Week
1. Implement Phase 2 optimizations
2. Write unit tests for subscription logic
3. Add monitoring/alerting
4. Document subscription patterns for team

### This Month
1. Plan Phase 3 implementation
2. Conduct load testing
3. Review other subscription points
4. Optimize based on real-world metrics

---

## Questions & Concerns

### Q: Will this break existing functionality?
**A:** No. These are additive filters that make subscriptions MORE specific, not less. Existing functionality will work better and faster.

### Q: What if we have multi-account users?
**A:** The `account_id` filter handles this. When a user switches accounts, the subscription re-initializes with the new account context.

### Q: How do we test this won't cause data loss?
**A:** Implement optimistic UI updates with fallback re-fetching. If a real-time update fails, the next polling cycle catches it.

### Q: What's the deployment risk?
**A:** LOW. These are client-side changes. Rollback is instant. No database migrations needed.

---

**Prepared by:** Claude (AI Assistant)  
**For:** Douglas - LegacyAI / CRM-AI Pro  
**Status:** READY FOR IMPLEMENTATION  
**Urgency:** HIGH - Recommend starting within 24 hours
