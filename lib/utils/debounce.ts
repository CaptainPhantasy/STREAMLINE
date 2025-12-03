// lib/utils/debounce.ts
import { useCallback, useRef } from 'react'

/**
 * Hook that returns a debounced version of a callback function
 * 
 * Useful for reducing API calls from real-time subscriptions
 * that fire rapidly in succession.
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns Debounced version of the callback
 * 
 * @example
 * ```tsx
 * const debouncedFetch = useDebouncedCallback(fetchConversations, 1000)
 * 
 * .on('postgres_changes', {
 *   event: '*',
 *   schema: 'public',
 *   table: 'conversations',
 *   filter: `account_id=eq.${accountId}`
 * }, (payload) => {
 *   debouncedFetch()  // Waits 1s, batches rapid changes
 * })
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Hook that returns a throttled version of a callback function
 * 
 * Unlike debounce (which delays execution), throttle ensures
 * the function runs at most once per time period.
 * 
 * @param callback - The function to throttle
 * @param limit - The minimum time between executions in milliseconds
 * @returns Throttled version of the callback
 * 
 * @example
 * ```tsx
 * const throttledUpdate = useThrottledCallback(updateUI, 500)
 * 
 * .on('postgres_changes', {...}, () => {
 *   throttledUpdate()  // Runs max once per 500ms
 * })
 * ```
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false)
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    },
    [callback, limit]
  )
}
