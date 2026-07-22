# Hook Optimization Patterns

**Last Updated**: 14:30:45 Jan 15, 2025

## Overview

This document outlines critical optimization patterns to prevent infinite loops and excessive API calls in React hooks and components.

## Problem: Infinite Loop Pattern

### The Issue

When hooks accept object parameters (like `initialParams`, `options`, `filters`), and these objects are created inline in components, React sees them as "new" objects on every render, causing `useEffect` dependencies to trigger repeatedly.

**Example of BAD pattern:**
```tsx
function MyComponent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  
  // ❌ BAD: Creates new object on every render
  const { data } = useMyHook({
    initialParams: {
      page,
      search: search || undefined
    }
  })
}

function useMyHook({ initialParams = {} }) {
  useEffect(() => {
    fetchData(initialParams) // ❌ Runs on EVERY render!
  }, [initialParams]) // ❌ initialParams is always "new"
}
```

### The Solution

1. **Memoize params in components** using `useMemo`
2. **Use params key comparison in hooks** to detect actual changes
3. **Debounce search inputs** to prevent API spam

## Pattern 1: Memoize Params in Components

**✅ GOOD pattern:**
```tsx
function MyComponent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      if (search !== debouncedSearch) {
        setPage(1) // Reset to page 1 on new search
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search, debouncedSearch])
  
  // ✅ GOOD: Memoize params object
  const params = useMemo(() => ({
    page,
    search: debouncedSearch || undefined
  }), [page, debouncedSearch])
  
  const { data } = useMyHook({
    initialParams: params
  })
}
```

## Pattern 2: Params Key Comparison in Hooks

**✅ GOOD pattern:**
```tsx
function useMyHook({ initialParams = {} }) {
  const [data, setData] = useState([])
  
  // ✅ GOOD: Create stable key from params
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      page: initialParams.page,
      search: initialParams.search,
      // ... all relevant params
    })
  }, [
    initialParams.page,
    initialParams.search,
    // ... all relevant params
  ])
  
  // ✅ GOOD: Track last fetched key
  const lastFetchedKeyRef = useRef<string>('')
  
  useEffect(() => {
    // ✅ GOOD: Only fetch if params actually changed
    if (paramsKey === lastFetchedKeyRef.current) {
      return // Skip if params haven't changed
    }
    
    lastFetchedKeyRef.current = paramsKey
    fetchData(initialParams)
  }, [paramsKey, initialParams]) // ✅ Use paramsKey, not initialParams directly
}
```

## Pattern 3: Search Debouncing

**Always debounce search inputs** to prevent API calls on every keystroke:

```tsx
function SearchComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  // ✅ Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Use debouncedSearchQuery in API calls, not searchQuery
  const params = useMemo(() => ({
    search: debouncedSearchQuery || undefined
  }), [debouncedSearchQuery])
}
```

## Pattern 4: Filter Memoization

**When using complex filter objects**, memoize them properly:

```tsx
// ❌ BAD: JSON.stringify in dependency array
useEffect(() => {
  fetchData()
}, [searchQuery, JSON.stringify(filters)]) // ❌ Inefficient

// ✅ GOOD: Memoize filter key
const filtersKey = useMemo(() => {
  return JSON.stringify({
    tags: filters.tags,
    status: filters.status,
    dateRange: filters.dateRange,
  })
}, [filters.tags, filters.status, filters.dateRange.start, filters.dateRange.end])

useEffect(() => {
  fetchData()
}, [searchQuery, filtersKey]) // ✅ Efficient
```

## Implementation Checklist

When creating or updating hooks that accept object parameters:

- [ ] **Component level:**
  - [ ] Memoize params object with `useMemo`
  - [ ] Debounce search inputs (500ms recommended)
  - [ ] Reset pagination when filters change

- [ ] **Hook level:**
  - [ ] Create `paramsKey` using `useMemo` + `JSON.stringify`
  - [ ] Use `useRef` to track `lastFetchedKey`
  - [ ] Compare `paramsKey` vs `lastFetchedKeyRef.current` before fetching
  - [ ] Only include actual param values in `paramsKey` dependencies

## Examples in Codebase

**✅ Correctly implemented:**
- `lib/hooks/use-parts.ts` - Uses paramsKey comparison
- `lib/hooks/use-estimates.ts` - Uses paramsKey comparison
- `components/parts/PartsListView.tsx` - Memoizes params, debounces search
- `components/estimates/EstimateListView.tsx` - Memoizes params, debounces search

**⚠️ Needs review:**
- Any hook that accepts `initialParams`, `options`, or `filters` objects
- Any component that creates params objects inline
- Any search input without debouncing

## Performance Impact

**Before optimization:**
- Parts page: ~200 API calls per 10 seconds
- Estimates page: Similar excessive calls
- High bandwidth usage
- Poor user experience

**After optimization:**
- Parts page: ~2-5 API calls per user action
- Estimates page: ~2-5 API calls per user action
- 95%+ reduction in API calls
- Smooth, responsive UI

## Related Files

- `lib/hooks/use-parts.ts` - Reference implementation
- `lib/hooks/use-estimates.ts` - Reference implementation
- `components/parts/PartsListView.tsx` - Component pattern example
- `components/estimates/EstimateListView.tsx` - Component pattern example

---

14:30:45 Jan 15, 2025

