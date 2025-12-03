# Component Architecture Guide
**For All Agent Swarms**

## File Organization Pattern

```
# REUSABLE (can copy to other projects)
/lib/
  /types/[feature].ts          # TypeScript interfaces
  /api/[feature].ts            # API client functions
  /hooks/use-[feature].ts      # State management hooks
  /utils/[feature].ts          # Utility functions

/components/[feature]/
  /ComponentName.tsx           # UI component
  /ComponentName.types.ts      # Component-specific types (optional)
  /index.ts                    # Barrel export

# PROJECT-SPECIFIC (CRM-AI Pro)
/app/
  /api/[feature]/route.ts      # API route handlers
  /(dashboard)/[route]/page.tsx  # Desktop pages
  /m/[role]/[route]/page.tsx   # Mobile pages
```

---

## Component Template

```typescript
// components/[feature]/ComponentName.tsx

'use client'

import { cn } from '@/lib/utils'
import type { ComponentNameProps } from './ComponentName.types'

/**
 * ComponentName - One-line description
 *
 * @description
 * More detailed description of what this component does and when to use it.
 *
 * @example
 * ```tsx
 * <ComponentName
 *   data={items}
 *   onAction={handleAction}
 *   config={{ theme: 'light' }}
 * />
 * ```
 *
 * @param props - ComponentNameProps
 * @returns React component
 */
export function ComponentName({
  // Required props
  data,
  onAction,

  // Optional props with defaults
  config = {},
  loading = false,
  error = null,

  // Style props
  className,
  ...rest
}: ComponentNameProps) {
  // 1. State
  const [localState, setLocalState] = useState<StateType>(initialState)

  // 2. Derived values
  const computedValue = useMemo(() => {
    return data.map(/* transform */)
  }, [data])

  // 3. Event handlers
  const handleClick = useCallback((item: Item) => {
    onAction?.(item)
  }, [onAction])

  // 4. Loading state
  if (loading) {
    return (
      <div className={cn('component-loading', className)}>
        <Loader />
      </div>
    )
  }

  // 5. Error state
  if (error) {
    return (
      <div className={cn('component-error', className)}>
        <ErrorDisplay error={error} />
      </div>
    )
  }

  // 6. Empty state
  if (!data || data.length === 0) {
    return (
      <div className={cn('component-empty', className)}>
        <EmptyState message="No items found" />
      </div>
    )
  }

  // 7. Main render
  return (
    <div
      className={cn('component-base', className)}
      {...rest}
    >
      {data.map(item => (
        <div key={item.id} onClick={() => handleClick(item)}>
          {item.name}
        </div>
      ))}
    </div>
  )
}

// Export types for external use
export type { ComponentNameProps }
```

---

## TypeScript Types Pattern

```typescript
// lib/types/feature.ts

/**
 * Base entity interface
 */
export interface FeatureItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  // ... other fields
}

/**
 * API request/response types
 */
export interface GetFeatureItemsParams {
  page?: number
  limit?: number
  filter?: string
  sort?: 'asc' | 'desc'
}

export interface GetFeatureItemsResponse {
  items: FeatureItem[]
  total: number
  page: number
  limit: number
}

/**
 * Component prop types
 */
export interface FeatureComponentProps {
  // Required
  items: FeatureItem[]
  onItemSelect: (item: FeatureItem) => void

  // Optional
  config?: FeatureConfig
  loading?: boolean
  error?: Error | null
  emptyMessage?: string

  // Style
  className?: string
  style?: React.CSSProperties
}

/**
 * Hook return types
 */
export interface UseFeatureReturn {
  items: FeatureItem[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  addItem: (item: Partial<FeatureItem>) => Promise<FeatureItem>
  updateItem: (id: string, updates: Partial<FeatureItem>) => Promise<FeatureItem>
  deleteItem: (id: string) => Promise<void>
}
```

---

## API Layer Pattern

```typescript
// lib/api/feature.ts

import { FeatureItem, GetFeatureItemsParams, GetFeatureItemsResponse } from '@/lib/types/feature'

/**
 * API Configuration
 * Allows customization for different projects
 */
export interface FeatureAPIConfig {
  baseUrl?: string
  headers?: Record<string, string>
  onError?: (error: Error) => void
}

/**
 * Feature API Client
 * Reusable API functions that can work in any project
 */
export class FeatureAPI {
  private baseUrl: string
  private headers: Record<string, string>
  private onError?: (error: Error) => void

  constructor(config: FeatureAPIConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/feature'
    this.headers = config.headers || {}
    this.onError = config.onError
  }

  /**
   * Get all feature items
   */
  async getItems(params: GetFeatureItemsParams = {}): Promise<GetFeatureItemsResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.filter) searchParams.set('filter', params.filter)
      if (params.sort) searchParams.set('sort', params.sort)

      const response = await fetch(
        `${this.baseUrl}/items?${searchParams}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Get single item by ID
   */
  async getItem(id: string): Promise<FeatureItem> {
    try {
      const response = await fetch(
        `${this.baseUrl}/items/${id}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Create new item
   */
  async createItem(data: Partial<FeatureItem>): Promise<FeatureItem> {
    try {
      const response = await fetch(
        `${this.baseUrl}/items`,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Update existing item
   */
  async updateItem(id: string, updates: Partial<FeatureItem>): Promise<FeatureItem> {
    try {
      const response = await fetch(
        `${this.baseUrl}/items/${id}`,
        {
          method: 'PUT',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/items/${id}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }
}

/**
 * Default instance for this project
 * Other projects can create their own with different config
 */
export const featureAPI = new FeatureAPI({
  baseUrl: '/api/feature',
  onError: (error) => {
    console.error('Feature API Error:', error)
    // Project-specific error handling (e.g., toast notification)
  }
})

/**
 * Convenience functions that use the default instance
 * These make it easy to use in components without creating an API instance
 */
export const getFeatureItems = (params?: GetFeatureItemsParams) =>
  featureAPI.getItems(params)

export const getFeatureItem = (id: string) =>
  featureAPI.getItem(id)

export const createFeatureItem = (data: Partial<FeatureItem>) =>
  featureAPI.createItem(data)

export const updateFeatureItem = (id: string, updates: Partial<FeatureItem>) =>
  featureAPI.updateItem(id, updates)

export const deleteFeatureItem = (id: string) =>
  featureAPI.deleteItem(id)
```

---

## Custom Hook Pattern

```typescript
// lib/hooks/use-feature.ts

import { useState, useEffect, useCallback } from 'react'
import { getFeatureItems, createFeatureItem, updateFeatureItem, deleteFeatureItem } from '@/lib/api/feature'
import type { FeatureItem, GetFeatureItemsParams, UseFeatureReturn } from '@/lib/types/feature'

/**
 * Hook options
 */
export interface UseFeatureOptions {
  enabled?: boolean
  initialParams?: GetFeatureItemsParams
  onSuccess?: (data: FeatureItem[]) => void
  onError?: (error: Error) => void
}

/**
 * useFeature - Manage feature items with loading and error states
 *
 * @example
 * ```tsx
 * const { items, loading, error, refetch, addItem } = useFeature({
 *   initialParams: { filter: 'active' },
 *   onSuccess: (data) => console.log('Loaded:', data.length)
 * })
 * ```
 */
export function useFeature(options: UseFeatureOptions = {}): UseFeatureReturn {
  const {
    enabled = true,
    initialParams = {},
    onSuccess,
    onError
  } = options

  const [items, setItems] = useState<FeatureItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch items from API
   */
  const fetchItems = useCallback(async (params: GetFeatureItemsParams = {}) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await getFeatureItems({ ...initialParams, ...params })
      setItems(response.items)
      onSuccess?.(response.items)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [enabled, initialParams, onSuccess, onError])

  /**
   * Add new item
   */
  const addItem = useCallback(async (data: Partial<FeatureItem>): Promise<FeatureItem> => {
    setLoading(true)
    setError(null)

    try {
      const newItem = await createFeatureItem(data)
      setItems(prev => [newItem, ...prev])
      return newItem
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  /**
   * Update existing item
   */
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<FeatureItem>
  ): Promise<FeatureItem> => {
    setLoading(true)
    setError(null)

    try {
      const updatedItem = await updateFeatureItem(id, updates)
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
      return updatedItem
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  /**
   * Delete item
   */
  const removeItem = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await deleteFeatureItem(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  /**
   * Fetch items on mount
   */
  useEffect(() => {
    if (enabled) {
      fetchItems(initialParams)
    }
  }, [enabled, fetchItems, initialParams])

  return {
    items,
    loading,
    error,
    refetch: () => fetchItems(initialParams),
    addItem,
    updateItem,
    deleteItem: removeItem
  }
}
```

---

## API Route Handler Pattern

```typescript
// app/api/feature/items/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/feature/items
 * Get all feature items with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') || undefined
    const sort = searchParams.get('sort') || 'desc'

    // 3. Build query
    let query = supabase
      .from('feature_items')
      .select('*', { count: 'exact' })
      .eq('account_id', user.account_id) // Ensure RLS

    // Apply filters
    if (filter) {
      query = query.ilike('name', `%${filter}%`)
    }

    // Apply sorting
    query = query.order('created_at', { ascending: sort === 'asc' })

    // Apply pagination
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    // 4. Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      )
    }

    // 5. Return response
    return NextResponse.json({
      items: data || [],
      total: count || 0,
      page,
      limit
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/feature/items
 * Create new feature item
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { name, description, /* other fields */ } = body

    // 3. Validate input
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // 4. Insert into database
    const { data, error } = await supabase
      .from('feature_items')
      .insert({
        name,
        description,
        account_id: user.account_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      )
    }

    // 5. Return created item
    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Page Integration Pattern

```typescript
// app/(dashboard)/feature/page.tsx

import { FeatureList } from '@/components/feature/FeatureList'
import { PermissionGate } from '@/lib/auth/PermissionGate'
import { PageHeader } from '@/components/layout/PageHeader'

export default function FeaturePage() {
  return (
    <PermissionGate requires="view_feature">
      <div className="container mx-auto p-6">
        <PageHeader
          title="Feature Items"
          description="Manage your feature items"
        />

        <FeatureList />
      </div>
    </PermissionGate>
  )
}

// components/feature/FeatureList.tsx
'use client'

import { useFeature } from '@/lib/hooks/use-feature'
import { FeatureItem } from '@/components/feature/FeatureItem'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'

export function FeatureList() {
  const { items, loading, error, addItem } = useFeature({
    initialParams: { sort: 'desc', limit: 20 }
  })

  const handleAdd = async () => {
    await addItem({ name: 'New Item' })
  }

  if (loading) {
    return <Loader />
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <Button onClick={handleAdd}>Add Item</Button>

      <div className="grid gap-4 mt-4">
        {items.map(item => (
          <FeatureItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
```

---

## Extracting for Other Projects

To use components in another project:

1. **Copy the reusable files:**
   ```bash
   cp -r lib/types/feature.ts        other-project/lib/types/
   cp -r lib/api/feature.ts          other-project/lib/api/
   cp -r lib/hooks/use-feature.ts    other-project/lib/hooks/
   cp -r components/feature/         other-project/components/
   ```

2. **Update API configuration:**
   ```typescript
   // In other project
   import { FeatureAPI } from './lib/api/feature'

   export const featureAPI = new FeatureAPI({
     baseUrl: 'https://api.other-project.com/feature',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

3. **Implement backend API:**
   - Create routes that match the expected endpoints
   - Return data in the expected format

4. **Use in pages:**
   - Import components and hooks
   - Integrate with your project's layout/auth system

---

## Design System Integration

### Using Existing UI Components
```typescript
// Available from /components/ui/
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
// ... and more
```

### Styling Patterns
```typescript
// Use cn() for conditional classes
import { cn } from '@/lib/utils'

className={cn(
  'base-classes',
  variant === 'primary' && 'primary-classes',
  disabled && 'disabled-classes',
  className // Allow override
)}
```

### Mobile-Specific Styling
```css
/* Use these breakpoints */
@media (max-width: 768px) {
  /* Mobile styles */
  .touch-target {
    min-height: 60px; /* Large touch targets */
    padding: 16px; /* Generous padding */
  }
}
```

---

## Testing Checklist

Before marking component as complete:

- [ ] TypeScript types exported
- [ ] Component renders without errors
- [ ] Loading state displays correctly
- [ ] Error state displays correctly
- [ ] Empty state displays correctly
- [ ] API calls work and return expected data
- [ ] User interactions trigger correct handlers
- [ ] Permissions enforced (if applicable)
- [ ] Mobile responsive (if mobile component)
- [ ] Documented with JSDoc comments
- [ ] Integration report written

---

**Follow these patterns for ALL components to ensure consistency and reusability!**
