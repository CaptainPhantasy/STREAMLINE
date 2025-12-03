/**
 * Query parameter utilities for URL-based state management
 * Extends the filters.ts pattern for general query param handling
 */

import { useSearchParams as useNextSearchParams, usePathname, useRouter } from "next/navigation"

/**
 * Get a query parameter value
 */
export function getQueryParam(searchParams: URLSearchParams, key: string): string | null {
  return searchParams.get(key)
}

/**
 * Get all query parameters as an object
 */
export function getAllQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }
  return params
}

/**
 * Set a query parameter in the URL
 */
export function setQueryParam(
  key: string,
  value: string | null,
  pathname: string,
  router: ReturnType<typeof useRouter>,
  replace: boolean = false
): void {
  const searchParams = new URLSearchParams(window.location.search)
  
  if (value === null || value === "") {
    searchParams.delete(key)
  } else {
    searchParams.set(key, value)
  }
  
  const newURL = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
  
  if (replace) {
    router.replace(newURL)
  } else {
    router.push(newURL)
  }
}

/**
 * Remove a query parameter from the URL
 */
export function removeQueryParam(
  key: string,
  pathname: string,
  router: ReturnType<typeof useRouter>
): void {
  setQueryParam(key, null, pathname, router, true)
}

/**
 * Clear all query parameters
 */
export function clearQueryParams(
  pathname: string,
  router: ReturnType<typeof useRouter>
): void {
  router.replace(pathname)
}

/**
 * Check if a query parameter exists
 */
export function hasQueryParam(searchParams: URLSearchParams, key: string): boolean {
  return searchParams.has(key)
}

/**
 * Get query parameter with backward compatibility
 * Checks multiple keys in order and returns the first found value
 */
export function getQueryParamWithFallback(
  searchParams: URLSearchParams,
  primaryKey: string,
  fallbackKeys: string[]
): string | null {
  // Check primary key first
  const primaryValue = searchParams.get(primaryKey)
  if (primaryValue) return primaryValue
  
  // Check fallback keys
  for (const fallbackKey of fallbackKeys) {
    const fallbackValue = searchParams.get(fallbackKey)
    if (fallbackValue) return fallbackValue
  }
  
  return null
}

