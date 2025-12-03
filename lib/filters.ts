/**
 * Filter persistence utilities for URL-based filter management
 */

export interface FilterState {
  [key: string]: string | string[] | undefined
}

/**
 * Parse filters from URL search params
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = {}
  
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '')
      // Handle array values (e.g., filter_status=completed&filter_status=scheduled)
      if (filters[filterKey]) {
        const existing = filters[filterKey]
        if (Array.isArray(existing)) {
          existing.push(value)
        } else {
          filters[filterKey] = [existing as string, value]
        }
      } else {
        filters[filterKey] = value
      }
    }
  }
  
  return filters
}

/**
 * Convert filter state to URL search params
 */
export function filtersToURLParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v) params.append(`filter_${key}`, v)
        })
      } else {
        params.append(`filter_${key}`, String(value))
      }
    }
  })
  
  return params
}

/**
 * Update URL with filters without page reload
 */
export function updateURLWithFilters(filters: FilterState, pathname: string): void {
  const params = filtersToURLParams(filters)
  const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
  window.history.pushState({}, '', newURL)
}

/**
 * Clear all filters from URL
 */
export function clearFiltersFromURL(pathname: string): void {
  window.history.pushState({}, '', pathname)
}

/**
 * Get filter summary text for display
 */
export function getFilterSummary(filters: FilterState): string {
  const activeFilters = Object.entries(filters).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== null && value !== ''
  })
  
  if (activeFilters.length === 0) return 'No filters'
  
  return `${activeFilters.length} filter${activeFilters.length > 1 ? 's' : ''} active`
}

