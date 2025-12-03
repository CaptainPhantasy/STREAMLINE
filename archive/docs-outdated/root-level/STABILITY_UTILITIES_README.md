# Stability & Performance Utilities

This directory contains utilities to improve application stability and performance.

## 🛡️ Error Handling

### ErrorBoundary
Catches React errors and prevents full page crashes.

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function MyPage() {
  return (
    <ErrorBoundary>
      <MyPageContent />
    </ErrorBoundary>
  )
}
```

## 🔄 Loading States

### LoadingSpinner
Consistent loading indicators across the app.

```tsx
import { LoadingSpinner, PageLoader, InlineLoader } from '@/components/LoadingSpinner'

// Full page loader
if (loading) return <PageLoader message="Loading data..." />

// Inline loader
{loading && <InlineLoader />}

// Custom loader
<LoadingSpinner message="Processing..." size="lg" />
```

## 🚀 Performance

### useDebounce Hook
Prevents excessive API calls from rapid user input.

```tsx
import { useDebounce } from '@/hooks/use-debounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch)
  }
}, [debouncedSearch])
```

### Request Caching
Automatically cache and deduplicate API requests.

```tsx
import { cachedFetch } from '@/lib/api/cache'

// Cached for 5 seconds by default
const data = await cachedFetch('/api/users')

// Custom TTL
const data = await cachedFetch('/api/jobs', {}, 10000) // 10 seconds
```

## 🛡️ Null Safety

### Safe Access Utilities
Prevent crashes from null/undefined values.

```tsx
import { safeGet, safeArray, safeString, safeAccess } from '@/lib/utils/safe-access'

// Safe property access
const name = safeString(user?.name, 'Unknown')

// Safe array operations
safeArray(jobs).map(job => ...)

// Safe nested access
const theme = safeAccess(user, 'profile.settings.theme', 'light')

// Safe JSON parsing
const config = safeJsonParse(jsonString, {})
```

## 📊 Performance Monitoring

### Performance Utilities
Identify slow operations in development.

```tsx
import { measurePerformance, createTimer } from '@/lib/utils/performance'

// Measure sync function
measurePerformance('Process data', () => {
  processLargeDataset()
})

// Measure async function
await measurePerformanceAsync('Fetch data', async () => {
  return await fetchData()
})

// Manual timing
const timer = createTimer('Complex operation')
// ... do work ...
timer.stop() // Logs if > 100ms
```

## 📝 Usage Guidelines

### When to Use ErrorBoundary
- ✅ Wrap entire pages
- ✅ Wrap complex components that might fail
- ✅ Wrap third-party components
- ❌ Don't wrap every single component (too granular)

### When to Use Debounce
- ✅ Search inputs
- ✅ Form validation
- ✅ Window resize handlers
- ✅ Scroll handlers

### When to Use Caching
- ✅ User profiles
- ✅ Settings/config data
- ✅ Reference data (tags, categories)
- ❌ Real-time data
- ❌ User-specific sensitive data

### When to Use Safe Access
- ✅ API response handling
- ✅ User input processing
- ✅ Third-party data
- ✅ Optional chaining replacements

## 🎯 Impact

These utilities provide:
- **Stability**: Prevents crashes from errors and null values
- **Performance**: Reduces unnecessary API calls and renders
- **UX**: Consistent loading states and error messages
- **DX**: Easy-to-use, battle-tested patterns

## 📦 What's Included

- `components/ErrorBoundary.tsx` - Error boundary component
- `components/LoadingSpinner.tsx` - Loading state components
- `hooks/use-debounce.ts` - Debounce hook
- `lib/utils/safe-access.ts` - Null safety utilities
- `lib/api/cache.ts` - Request caching
- `lib/utils/performance.ts` - Performance monitoring

All utilities are TypeScript-safe and production-ready!
