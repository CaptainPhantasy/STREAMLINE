// hooks/use-account.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to get the current user's account ID
 * 
 * This is critical for real-time subscription filtering to prevent
 * cross-account data leakage and reduce database load.
 * 
 * @returns accountId - The current user's account ID or null if not available
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const accountId = useAccountId()
 *   
 *   useEffect(() => {
 *     if (!accountId) return
 *     
 *     const channel = supabase
 *       .channel(`jobs_${accountId}`)
 *       .on('postgres_changes', {
 *         event: '*',
 *         schema: 'public',
 *         table: 'jobs',
 *         filter: `account_id=eq.${accountId}` // CRITICAL!
 *       }, handleUpdate)
 *       .subscribe()
 *       
 *     return () => supabase.removeChannel(channel)
 *   }, [accountId])
 * }
 * ```
 */
export function useAccountId(): string | null {
  const [accountId, setAccountId] = useState<string | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    let mounted = true
    
    const getAccount = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('[useAccountId] Error getting user:', error)
          return
        }
        
        if (!user) {
          console.warn('[useAccountId] No user found')
          return
        }
        
        const userAccountId = user.user_metadata?.account_id
        
        if (!userAccountId) {
          console.warn('[useAccountId] User has no account_id in metadata:', user.id)
          return
        }
        
        if (mounted) {
          setAccountId(userAccountId)
          console.log('[useAccountId] Account loaded:', userAccountId)
        }
      } catch (error) {
        console.error('[useAccountId] Unexpected error:', error)
      }
    }
    
    getAccount()
    
    // Listen for auth state changes
    // SECURITY: Use getUser() instead of session?.user to verify authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Verify user authentication with server
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          console.error('[useAccountId] Failed to verify user:', error)
          if (mounted) {
            setAccountId(null)
          }
          return
        }
        
        const userAccountId = user.user_metadata?.account_id
        if (mounted && userAccountId) {
          setAccountId(userAccountId)
          console.log('[useAccountId] Account updated:', userAccountId)
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setAccountId(null)
          console.log('[useAccountId] User signed out, cleared account')
        }
      }
    })
    
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])
  
  return accountId
}

/**
 * Hook to get the current user info including account ID
 * 
 * More comprehensive than useAccountId - provides full user context
 * 
 * @returns { user, accountId, loading }
 */
export function useCurrentUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const accountId = user?.user_metadata?.account_id || null
  const supabase = createClient()
  
  useEffect(() => {
    let mounted = true
    
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('[useCurrentUser] Error:', error)
        }
        
        if (mounted) {
          setUser(user)
          setLoading(false)
        }
      } catch (error) {
        console.error('[useCurrentUser] Unexpected error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    getUser()
    
    // Listen for auth changes
    // SECURITY: Use getUser() instead of session?.user to verify authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (mounted) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Verify user authentication with server
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error) {
            console.error('[useCurrentUser] Failed to verify user:', error)
            setUser(null)
            setLoading(false)
            return
          }
          setUser(user)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    })
    
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])
  
  return { user, accountId, loading }
}
