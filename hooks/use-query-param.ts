"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"

/**
 * Hook for managing a single query parameter with type safety
 */
export function useQueryParam<T extends string = string>(
  key: string,
  defaultValue?: T
): [T | null, (value: T | null, replace?: boolean) => void] {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const value = useMemo(() => {
    const param = searchParams.get(key)
    return (param as T) || defaultValue || null
  }, [searchParams, key, defaultValue])

  const setValue = useCallback(
    (newValue: T | null, replace: boolean = false) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (newValue === null || newValue === "") {
        params.delete(key)
      } else {
        params.set(key, newValue)
      }
      
      const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
      
      if (replace) {
        router.replace(newURL)
      } else {
        router.push(newURL)
      }
    },
    [key, pathname, router, searchParams]
  )

  return [value, setValue]
}

/**
 * Hook for managing query parameters with backward compatibility
 * Useful for migrating from one param name to another
 */
export function useQueryParamWithFallback<T extends string = string>(
  primaryKey: string,
  fallbackKeys: string[],
  defaultValue?: T
): [T | null, (value: T | null, replace?: boolean) => void] {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const value = useMemo(() => {
    // Check primary key first
    const primaryValue = searchParams.get(primaryKey)
    if (primaryValue) return primaryValue as T
    
    // Check fallback keys
    for (const fallbackKey of fallbackKeys) {
      const fallbackValue = searchParams.get(fallbackKey)
      if (fallbackValue) return fallbackValue as T
    }
    
    return defaultValue || null
  }, [searchParams, primaryKey, fallbackKeys, defaultValue])

  const setValue = useCallback(
    (newValue: T | null, replace: boolean = false) => {
      const params = new URLSearchParams(searchParams.toString())
      
      // Remove all fallback keys when setting primary key
      fallbackKeys.forEach(fallbackKey => params.delete(fallbackKey))
      
      if (newValue === null || newValue === "") {
        params.delete(primaryKey)
      } else {
        params.set(primaryKey, newValue)
      }
      
      const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
      
      if (replace) {
        router.replace(newURL)
      } else {
        router.push(newURL)
      }
    },
    [primaryKey, fallbackKeys, pathname, router, searchParams]
  )

  return [value, setValue]
}

