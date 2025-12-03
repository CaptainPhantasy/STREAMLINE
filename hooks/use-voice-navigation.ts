'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Default account ID - matches the Supabase MCP server default
const DEFAULT_ACCOUNT_ID = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'

/**
 * Hook that listens for voice navigation commands from the ElevenLabs agent
 * via Supabase Realtime and executes them by navigating to the requested page.
 */
export function useVoiceNavigation(accountId: string = DEFAULT_ACCOUNT_ID) {
  const router = useRouter()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  // Get user data on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user)
          console.log('[VoiceNavigation] User loaded:', user.user_metadata?.account_id)
        }
      } catch (error) {
        console.error('[VoiceNavigation] Error getting user:', error)
      }
    }
    getUser()
  }, [])

  // Use the actual user's account ID if available
  const actualAccountId = user?.user_metadata?.account_id || accountId

  useEffect(() => {
    if (!actualAccountId) {
      console.log('[VoiceNavigation] Waiting for account ID...')
      return
    }

    console.log('[VoiceNavigation] Listening for account:', actualAccountId)

    // Subscribe to new navigation commands
    const channel = supabase
      .channel(`voice-nav-${actualAccountId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_navigation_commands',
          filter: `account_id=eq.${actualAccountId}`,
        },
        async (payload) => {
          console.log('[VoiceNavigation] Received command:', payload.new)

          const command = payload.new as {
            id: string
            page: string
            params: Record<string, any>
            executed: boolean
          }

          // Skip if already executed
          if (command.executed) return

          try {
            // Navigate to the page
            console.log('[VoiceNavigation] Navigating to:', command.page)
            router.push(command.page)

            // Mark command as executed
            await supabase
              .from('voice_navigation_commands')
              .update({
                executed: true,
                executed_at: new Date().toISOString()
              })
              .eq('id', command.id)

            console.log('[VoiceNavigation] Navigation completed')
          } catch (error) {
            console.error('[VoiceNavigation] Navigation failed:', error)
          }
        }
      )
      .subscribe((status) => {
        console.log('[VoiceNavigation] Subscription status:', status)
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [actualAccountId, router])

  return {}
}

/**
 * Provider component that enables voice navigation globally
 */
export function VoiceNavigationProvider({ 
  accountId = DEFAULT_ACCOUNT_ID 
}: { 
  accountId?: string 
}) {
  useVoiceNavigation(accountId)
  return null
}
