'use client'

import { useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { parseFiltersFromURL, updateURLWithFilters, type FilterState } from '@/lib/filters'

interface UseFilterPersistenceOptions {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

/**
 * Hook to sync filters with URL params
 */
export function useFilterPersistence({ filters, onFiltersChange }: UseFilterPersistenceOptions) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams)
    if (Object.keys(urlFilters).length > 0) {
      onFiltersChange(urlFilters)
    }
  }, []) // Only on mount

  // Update URL when filters change
  useEffect(() => {
    updateURLWithFilters(filters, pathname)
  }, [filters, pathname])
}

