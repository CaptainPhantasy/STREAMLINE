# Component Structure Knowledge Base

**Last Updated**: 12:21:04 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete understanding of UI component structure, dependencies, and PermissionGate usage for bug finder configuration

---

## 1. Component Architecture Overview

### 1.1 Component Organization

**Base Path**: `components/`

Components are organized into **35+ modules** by feature/domain:

- **Admin Components** (12 files) - Admin management UI
- **Analytics Components** - Analytics visualization
- **Calendar Components** (2 files) - Calendar integration UI
- **Contacts Components** (5 files) - Customer management UI
- **Conversations Components** (3 files) - Messaging interface
- **Dashboard Components** (5 files) - Dashboard widgets
- **Dispatch Components** (11 files) - Dispatch management UI
- **Documents Components** (6 files) - File management UI
- **Email Templates Components** - Email template UI
- **Estimates Components** (6 files) - Estimate management UI
- **Export Components** - Data export tools
- **Filters Components** (2 files) - Advanced filtering
- **Inbox Components** (5 files) - Message inbox UI
- **Integrations Components** (2 files) - Integration UI
- **Inventory Components** (2 files) - Inventory management UI
- **Jobs Components** (10 files) - Work order components
- **Layout Components** (6 files) - Layout and navigation
- **Marketing Components** (3 files) - Marketing campaign UI
- **Messaging Components** (3 files) - Direct messaging UI
- **Mobile Components** (4 files) - Mobile-optimized components
- **Notifications Components** (5 files) - Alert system UI
- **Onboarding Components** (6 files) - User onboarding flow
- **Parts Components** (3 files) - Parts management UI
- **Photos Components** - Photo management UI
- **Profile Components** (2 files) - User profile components
- **Reports Components** (10 files) - Report generation UI
- **Sales Components** (14 files) - Sales pipeline components
- **Scheduling Components** (3 files) - Scheduling components
- **Search Components** (2 files) - Search interface
- **Settings Components** (5 files) - Settings UI
- **Tech Components** (16 files) - Technician interface
- **Templates Components** - Template management UI
- **UI Components** (34 files) - shadcn/ui component library
- **Voice Components** - Voice UI
- **Voice Agent Components** - Voice AI interface

### 1.2 Standalone Voice Components

Located in `components/` root:

- `conditional-voice-navigation-bridge.tsx` - Conditional voice navigation bridge
- `conditional-voice-widget.tsx` - Conditional voice widget
- `dual-voice-widget.tsx` - Dual voice widget
- `voice-agent-overlay.tsx` - Voice agent overlay
- `voice-conversation-provider.tsx` - Voice conversation provider
- `voice-error-boundary.tsx` - Voice error boundary
- `voice-navigation-bridge-simple.tsx` - Simple voice navigation bridge
- `voice-navigation-bridge.tsx` - Voice navigation bridge
- `voice-provider-selector.tsx` - Voice provider selector
- `voice-provider-wrapper.tsx` - Voice provider wrapper

---

## 2. PermissionGate Usage Patterns

### 2.1 Navigation Component (sidebar-nav.tsx)

**Location**: `components/layout/sidebar-nav.tsx`

**PermissionGate Usage**:
- Wraps navigation items based on permissions
- Uses `requires` prop for single permission checks
- Uses `requiresAny` for multiple permission options
- Nested PermissionGates for section-level and item-level checks

**Example Patterns**:
```tsx
// Single permission check
<PermissionGate requires="view_all_jobs">
  <Link href="/jobs">Jobs</Link>
</PermissionGate>

// Multiple permissions (OR logic)
<PermissionGate requiresAny={['view_all_jobs', 'view_assigned_jobs']}>
  <div className="tech-section">
    {/* Tech navigation items */}
  </div>
</PermissionGate>

// Section-level permission
<PermissionGate requires="manage_marketing">
  <div className="marketing-section">
    {/* Marketing items - no individual checks needed */}
  </div>
</PermissionGate>
```

### 2.2 PermissionGate Usage Locations

**Found in**:
- `components/layout/sidebar-nav.tsx` - Navigation menu (extensive usage)

**Pattern**: Most components don't use PermissionGate directly - they rely on:
1. Page-level route protection
2. API-level permission checks
3. Conditional rendering based on user role from context

---

## 3. Component Data Fetching Patterns

### 3.1 React Query Pattern (Preferred)

**Library**: `@tanstack/react-query`

**Pattern**:
```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

// Query pattern
const { data, isLoading, error } = useQuery({
  queryKey: ['resource-name', id],
  queryFn: async () => {
    const res = await fetch(`/api/resource/${id}`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
})

// Mutation pattern
const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch('/api/resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create')
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource-name'] })
  },
})
```

**Used by**:
- `components/calendar/calendar-view.tsx` - Calendar events
- `components/dashboard/conversation-list.tsx` - Conversations
- Many other components

### 3.2 Fetch Pattern (Legacy/Direct)

**Pattern**:
```tsx
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)

async function fetchData() {
  setLoading(true)
  try {
    const response = await fetch('/api/resource')
    if (!response.ok) throw new Error('Failed to fetch')
    const result = await response.json()
    setData(result.data || [])
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchData()
}, [dependencies])
```

**Used by**:
- `components/reports/DataExplorer.tsx`
- `components/reports/ReportBuilder.tsx`
- `components/sales/AIBriefingCard.tsx`
- Many other components

### 3.3 API Call Patterns

#### Standard Fetch Pattern
```tsx
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify(data),
})

if (!response.ok) {
  throw new Error(`Failed: ${response.statusText}`)
}

const result = await response.json()
```

#### Error Handling Patterns
```tsx
// Pattern 1: Try-catch with state
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized
      setConversations([])
      return
    }
    throw new Error('Failed to fetch')
  }
  const data = await response.json()
  setData(data)
} catch (error) {
  console.error('Error:', error)
  setError(error.message)
}

// Pattern 2: Error boundaries
// Components use ErrorBoundary for component-level errors
```

---

## 4. Component Dependencies

### 4.1 Common Dependencies

#### UI Library (shadcn/ui)
- Located in `components/ui/` (34 components)
- Includes: Button, Card, Dialog, Input, Select, Table, etc.
- Used throughout the application

#### Icons (lucide-react)
- Used extensively for icons
- Imported per-component as needed

#### Utilities
- `@/lib/utils` - `cn()` function for className merging
- `@/lib/auth/PermissionGate` - Permission checking component
- `@/lib/hooks/usePermissions` - Permission checking hook

### 4.2 Component Hierarchy

#### Layout Components
- `components/layout/sidebar-nav.tsx` - Main navigation
- Uses PermissionGate for conditional navigation items
- Includes ConditionalVoiceWidget at bottom

#### Dashboard Components
- `components/dashboard/conversation-list.tsx` - Conversation list
- `components/dashboard/message-thread.tsx` - Message thread
- Fetch data from `/api/conversations` and `/api/conversations/[id]/messages`

#### Feature Components
- Each feature module has components specific to that domain
- Components fetch data from corresponding API endpoints
- Use React Query or direct fetch patterns

---

## 5. Component Data Flow

### 5.1 Component → API → Database Flow

#### Example: Conversation List Component

1. **Component**: `components/dashboard/conversation-list.tsx`
2. **API Call**: `fetch('/api/conversations')`
3. **API Route**: `app/api/conversations/route.ts`
4. **Authentication**: `getAuthenticatedSession(request)`
5. **Database Query**: `supabase.from('conversations').select()`
6. **RLS Enforcement**: Database filters by `account_id`
7. **Response**: JSON array of conversations
8. **Component Update**: `setConversations(data.conversations)`

#### Example: Job Detail Modal

1. **Component**: `components/jobs/job-detail-modal.tsx`
2. **API Call**: `fetch('/api/jobs/[id]')`
3. **API Route**: `app/api/jobs/[id]/route.ts`
4. **Permission Check**: Role check in API route
5. **Database Query**: `supabase.from('jobs').select().eq('id', id)`
6. **RLS Enforcement**: Filters by `account_id`
7. **Response**: Job object with related data
8. **Component Update**: Displays job details

### 5.2 Real-time Subscriptions

**Pattern**:
```tsx
useEffect(() => {
  const channel = supabase
    .channel('conversations')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `account_id=eq.${accountId}`,
    }, (payload) => {
      // Update local state
      setConversations(prev => {
        // Handle insert/update/delete
        return updatedConversations
      })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [accountId])
```

**Used by**:
- `components/dashboard/conversation-list.tsx` - Real-time conversation updates

---

## 6. Component Permission Checks

### 6.1 UI-Level Permission Checks

#### PermissionGate Component
- Wraps UI elements conditionally
- Checks user role against required permissions
- Admin role bypasses all checks
- Supports impersonation via `useEffectiveUser()` hook

#### Usage Locations
- Navigation menu items
- Feature sections in sidebar
- Conditional feature rendering

### 6.2 API-Level Permission Checks

Components don't directly check permissions - they rely on:
1. **API route authentication** - `getAuthenticatedSession(request)`
2. **API route role checks** - Manual role validation
3. **Database RLS** - Final security layer

### 6.3 Permission Check Flow

```
User Action
  ↓
Component Event Handler
  ↓
API Call (fetch/useMutation)
  ↓
API Route Handler
  ↓
Authentication Check (getAuthenticatedSession)
  ↓
Permission Check (role validation)
  ↓
Database Query
  ↓
RLS Policy Enforcement
  ↓
Response
  ↓
Component Update
```

---

## 7. Component Error Handling

### 7.1 Error Boundaries

**Components**:
- `components/error-boundary.tsx` - General error boundary
- `components/error-fallback.tsx` - Error fallback UI
- `components/ErrorBoundary.tsx` - Error boundary wrapper
- `components/voice-error-boundary.tsx` - Voice-specific error boundary

### 7.2 Error Handling Patterns

#### Pattern 1: Try-Catch with State
```tsx
const [error, setError] = useState<string | null>(null)

try {
  await fetchData()
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed')
}
```

#### Pattern 2: React Query Error Handling
```tsx
const { data, error, isLoading } = useQuery({
  queryKey: ['resource'],
  queryFn: fetchData,
})

if (error) {
  return <ErrorState message={error.message} />
}
```

#### Pattern 3: Retry Logic
```tsx
// Some components implement retry logic
const [errorCount, setErrorCount] = useState(0)

if (errorCount >= 3) {
  // Stop retrying after 3 errors
  return <ErrorState />
}
```

---

## 8. Component State Management

### 8.1 Local State (useState)

Most components use local state for:
- Loading states
- Form data
- UI state (modals, expanded sections, etc.)
- Error states

### 8.2 React Query Cache

React Query manages:
- Server state caching
- Background refetching
- Optimistic updates
- Cache invalidation

### 8.3 Context Providers

**Location**: `components/providers.tsx`

Provides:
- React Query client
- Theme context
- Other global contexts

---

## 9. Component Testing Considerations

### 9.1 Component Dependencies

Components depend on:
- API endpoints (must be mocked in tests)
- Permission context (must be provided in tests)
- Supabase client (must be mocked in tests)
- React Query (must be wrapped in QueryClientProvider)

### 9.2 PermissionGate Testing

To test PermissionGate:
- Mock `useEffectiveUser()` hook
- Provide user with specific role
- Verify conditional rendering

### 9.3 API Call Testing

To test API calls:
- Mock `fetch` function
- Verify correct endpoints called
- Verify correct request payloads
- Verify error handling

---

**End of Component Structure Documentation**

12:21:04 Dec 03, 2025

