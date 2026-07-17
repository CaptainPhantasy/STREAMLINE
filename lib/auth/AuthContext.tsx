'use client'

/**
 * Shared Auth Context
 * 
 * CRITICAL OPTIMIZATION: This context caches auth state to prevent excessive
 * `/auth/v1/user` calls. All hooks should use this context instead of calling
 * `getUser()` directly.
 * 
 * Security: Still uses `getUser()` for verification, but caches results
 * with a TTL to reduce database load while maintaining security.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Cache TTL: 30 seconds (balance between security and performance)
const CACHE_TTL_MS = 30 * 1000

// Global cache to share across all instances
let globalCache: {
  user: User | null
  timestamp: number
  promise: Promise<User | null> | null
} = {
  user: null,
  timestamp: 0,
  promise: null,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(globalCache.user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()
  const mountedRef = useRef(true)

  const fetchUser = useCallback(async (force = false): Promise<User | null> => {
    const now = Date.now()
    const cacheAge = now - globalCache.timestamp

    // Return cached user if still valid and not forcing refresh
    if (!force && globalCache.user && cacheAge < CACHE_TTL_MS) {
      return globalCache.user
    }

    // If there's already a fetch in progress, wait for it
    if (globalCache.promise) {
      return globalCache.promise
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          throw error
        }

        // Update global cache
        globalCache = {
          user: user || null,
          timestamp: Date.now(),
          promise: null,
        }

        // Update state if component is still mounted
        if (mountedRef.current) {
          setUser(user || null)
          setError(null)
          setLoading(false)
        }

        return user || null
      } catch (err) {
        const error = err as Error
        
        // Update global cache with null (no user)
        globalCache = {
          user: null,
          timestamp: Date.now(),
          promise: null,
        }

        // Update state if component is still mounted
        if (mountedRef.current) {
          setUser(null)
          setError(error)
          setLoading(false)
        }

        throw error
      }
    })()

    // Store promise so other calls can wait for it
    globalCache.promise = fetchPromise

    return fetchPromise
  }, [supabase])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await fetchUser(true) // Force refresh
    } catch {
      // Error already handled in fetchUser
    }
  }, [fetchUser])

  // Initial load
  useEffect(() => {
    mountedRef.current = true
    
    // Load user on mount
    fetchUser().catch(() => {
      // Error already handled in fetchUser
    })

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mountedRef.current) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Force refresh on sign in or token refresh
        await fetchUser(true)
      } else if (event === 'SIGNED_OUT') {
        // Clear cache immediately on sign out
        globalCache = {
          user: null,
          timestamp: Date.now(),
          promise: null,
        }
        if (mountedRef.current) {
          setUser(null)
          setError(null)
          setLoading(false)
        }
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUser])

  // Periodic refresh to keep cache fresh (every 25 seconds, before TTL expires)
  useEffect(() => {
    const interval = setInterval(() => {
      if (mountedRef.current && globalCache.user) {
        // Silently refresh in background
        fetchUser().catch(() => {
          // Error already handled
        })
      }
    }, 25 * 1000) // 25 seconds

    return () => clearInterval(interval)
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access shared auth context
 * 
 * This replaces direct calls to `supabase.auth.getUser()` in components.
 * It uses cached auth state to prevent excessive API calls.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuth()
 *   
 *   if (loading) return <Loader />
 *   if (!user) return <LoginPrompt />
 *   
 *   return <div>Welcome, {user.email}</div>
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
