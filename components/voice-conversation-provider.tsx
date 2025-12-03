'use client'

import { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useConversation } from '@elevenlabs/react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * VoiceConversationProvider
 *
 * Provides a SINGLE shared conversation instance for the entire application.
 * This prevents multiple components from creating duplicate WebRTC sessions.
 *
 * **Architecture:**
 * - ONE conversation instance per user session
 * - Client-side tools registered here (navigation, UI actions, etc.)
 * - UI components (like VoiceAgentWidget) consume this context for controls
 */

const AGENT_ID = 'agent_6501katrbe2re0c834kfes3hvk2d'

interface VoiceConversationContextValue {
  conversation: ReturnType<typeof useConversation>
  startSessionWithTools: () => Promise<void>
}

const VoiceConversationContext = createContext<VoiceConversationContextValue | null>(null)

export function VoiceConversationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const sessionStarted = useRef(false)

  // CRITICAL FIX: Extract user context for ElevenLabs
  const [userContext, setUserContext] = useState<any>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get user context on mount
  useEffect(() => {
    const getUserContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Get user role and account info
          const { data: accountUser } = await supabase
            .from('account_users')
            .select('role, account_id')
            .eq('user_id', user.id)
            .single()

          const context = {
            user_identifier: user.id,
            user_name: user.user_metadata?.full_name || user.email,
            user_role: accountUser?.role || 'unknown',
            account_id: accountUser?.account_id || 'unknown'
          }

          console.log('[VoiceConversation] User context loaded:', context)
          setUserContext(context)
        }
      } catch (error) {
        console.error('[VoiceConversation] Failed to load user context:', error)
      }
    }

    getUserContext()
  }, [])

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceConversation] Connected to voice agent')
    },
    onDisconnect: () => {
      console.log('[VoiceConversation] Disconnected from voice agent')
      sessionStarted.current = false
    },
    onError: (error) => {
      console.error('[VoiceConversation] Error:', error)
    },
    onStatusChange: (status) => {
      console.log('[VoiceConversation] Status:', status)
    },
  })

  /**
   * Start ElevenLabs session with client-side tools
   * This should only be called ONCE when the user initiates a voice call
   */
  const startSessionWithTools = async () => {
    console.error('🚨 startSessionWithTools() CALLED')

    if (sessionStarted.current) {
      console.error('⚠️ Session already started - aborting')
      console.log('[VoiceConversation] Session already started')
      return
    }

    try {
      sessionStarted.current = true
      console.error('🚨 REGISTERING CLIENT TOOLS NOW...')

      // Define client-side tools that execute in the browser
      const clientTools = {
        navigation: {
          description: 'Navigate to a different page in the CRM application',
          parameters: {
            type: 'object' as const,
            properties: {
              route: {
                type: 'string' as const,
                description: 'The route to navigate to (e.g., /jobs, /settings, /contacts)',
              },
            },
            required: ['route'],
          },
          handler: async (params: { route: string }) => {
            // 🚨 LOUD DEBUGGING - This MUST appear if client tools are registered
            console.error("🚨 VOICE BRIDGE RECEIVED SIGNAL:", params.route)
            console.error("🚨 CLIENT TOOL HANDLER EXECUTING IN BROWSER")

            let { route } = params
            let target = route.toLowerCase().trim()

            // ==========================================
            // UNIFIED ROUTE MAPPING: All routes serve desktop UI
            // ==========================================

            // Tech Routes - Keep /m/ routes but they now serve desktop UI
            if (target.includes('tech') && (target.includes('dashboard') || target.includes('home'))) {
              target = pathname.startsWith('/m/tech') ? '/m/tech/dashboard' : '/tech/dashboard'
            } else if (target.includes('tech') && target.includes('map')) {
              target = pathname.startsWith('/m/') ? '/m/tech/map' : '/dispatch/map'
            } else if (target.includes('tech') && target.includes('job')) {
              // If job ID is provided, extract it
              const jobIdMatch = target.match(/job[\/\s]+(\d+)/)
              if (jobIdMatch) {
                target = pathname.startsWith('/m/') ? `/m/tech/job/${jobIdMatch[1]}` : `/tech/jobs/${jobIdMatch[1]}`
              } else {
                target = pathname.startsWith('/m/') ? '/m/tech/dashboard' : '/tech/jobs'
              }
            } else if (target.includes('tech') && target.includes('profile')) {
              target = pathname.startsWith('/m/') ? '/m/tech/profile' : '/tech/profile'
            }

            // Sales Routes
            else if (target.includes('sales') && (target.includes('dashboard') || target.includes('home'))) {
              target = pathname.startsWith('/m/sales') ? '/m/sales/dashboard' : '/sales/dashboard'
            } else if (target.includes('sales') && target.includes('lead')) {
              const leadIdMatch = target.match(/lead[\/\s]+([a-f0-9\-]+)/)
              if (leadIdMatch) {
                target = pathname.startsWith('/m/') ? `/m/sales/lead/${leadIdMatch[1]}` : `/sales/leads/${leadIdMatch[1]}`
              } else {
                target = pathname.startsWith('/m/') ? '/m/sales/leads' : '/sales/leads'
              }
            } else if (target.includes('sales') && target.includes('briefing')) {
              // If contact ID is provided, extract it
              const contactIdMatch = target.match(/briefing[\/\s]+([a-f0-9\-]+)/)
              if (contactIdMatch) {
                target = pathname.startsWith('/m/') ? `/m/sales/briefing/${contactIdMatch[1]}` : `/sales/briefing/${contactIdMatch[1]}`
              } else {
                target = pathname.startsWith('/m/') ? '/m/sales/dashboard' : '/sales/dashboard'
              }
            } else if (target.includes('sales') && target.includes('meeting')) {
              // If meeting ID is provided, extract it
              const meetingIdMatch = target.match(/meeting[\/\s]+([a-f0-9\-]+)/)
              if (meetingIdMatch) {
                target = pathname.startsWith('/m/') ? `/m/sales/meeting/${meetingIdMatch[1]}` : `/meetings/${meetingIdMatch[1]}`
              } else {
                target = pathname.startsWith('/m/') ? '/m/sales/dashboard' : '/sales/dashboard'
              }
            } else if (target.includes('sales') && target.includes('profile')) {
              target = pathname.startsWith('/m/') ? '/m/sales/profile' : '/sales/profile'
            }

            // Owner Routes
            else if (target.includes('owner') && (target.includes('dashboard') || target.includes('home'))) {
              target = pathname.startsWith('/m/owner') ? '/m/owner/dashboard' : '/owner/dashboard'
            }

            // Generic Dashboard - Stay in current context
            else if (target === 'dashboard' || target === '/dashboard') {
              // If user is currently on /m/ routes, stay there (they now serve desktop UI)
              if (pathname.startsWith('/m/tech')) {
                target = '/m/tech/dashboard'
              } else if (pathname.startsWith('/m/sales')) {
                target = '/m/sales/dashboard'
              } else if (pathname.startsWith('/m/owner')) {
                target = '/m/owner/dashboard'
              } else {
                // User is on desktop routes, stay there
                target = '/inbox' // Desktop owner default is inbox
              }
            }

            // If no alias matched, use the original route
            else {
              target = route
            }

            // Safety: Ensure leading slash
            if (!target.startsWith('/')) {
              target = `/${target}`
            }

            console.log(`[VoiceNavigation] Route requested: "${route}" → Navigating to: ${target}`)

            // Perform client-side navigation using Next.js router
            router.push(target)

            // Return success message to Agent
            return {
              success: true,
              message: `Navigated to ${target}`,
              previousRoute: pathname,
              newRoute: target,
              originalRequest: route,
            }
          },
        },

        get_current_page: {
          description: 'Get the current page/route the user is on',
          parameters: {
            type: 'object' as const,
            properties: {},
          },
          handler: async () => {
            console.log(`[VoiceNavigation] Current page: ${pathname}`)

            return {
              currentRoute: pathname,
              message: `User is currently on ${pathname}`,
            }
          },
        },

        scroll_to_section: {
          description: 'Scroll to a specific section on the current page',
          parameters: {
            type: 'object' as const,
            properties: {
              sectionId: {
                type: 'string' as const,
                description: 'The HTML ID of the section to scroll to',
              },
            },
            required: ['sectionId'],
          },
          handler: async (params: { sectionId: string }) => {
            const { sectionId } = params

            console.log(`[VoiceNavigation] Scrolling to: ${sectionId}`)

            const element = document.getElementById(sectionId)

            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              return {
                success: true,
                message: `Scrolled to section: ${sectionId}`,
              }
            } else {
              return {
                success: false,
                message: `Section not found: ${sectionId}`,
              }
            }
          },
        },

        trigger_ui_action: {
          description: 'Trigger a UI action like opening a modal, showing a tooltip, etc.',
          parameters: {
            type: 'object' as const,
            properties: {
              action: {
                type: 'string' as const,
                description: 'The UI action to trigger (e.g., "open_create_job_modal", "show_notifications")',
              },
              payload: {
                type: 'object' as const,
                description: 'Optional payload data for the action',
              },
            },
            required: ['action'],
          },
          handler: async (params: { action: string; payload?: Record<string, unknown> }) => {
            const { action, payload } = params

            console.log(`[VoiceNavigation] Triggering UI action: ${action}`, payload)

            // Dispatch custom event that UI components can listen to
            const event = new CustomEvent('voice-ui-action', {
              detail: { action, payload },
            })
            window.dispatchEvent(event)

            return {
              success: true,
              message: `Triggered UI action: ${action}`,
              action,
              payload,
            }
          },
        },

        open_new_tab: {
          description: 'Open a URL in a new browser tab',
          parameters: {
            type: 'object' as const,
            properties: {
              url: {
                type: 'string' as const,
                description: 'The URL to open',
              },
            },
            required: ['url'],
          },
          handler: async (params: { url: string }) => {
            const { url } = params

            console.log(`[VoiceNavigation] Opening new tab: ${url}`)

            window.open(url, '_blank', 'noopener,noreferrer')

            return {
              success: true,
              message: `Opened ${url} in new tab`,
            }
          },
        },
      }

      // Start session with client tools
      console.log("🚀 STARTING SESSION... Registering Client Tools:", Object.keys(clientTools))
      console.error('🚨 Navigation tool handler type:', typeof clientTools.navigation.handler)

      // CRITICAL FIX: Pass user context to ElevenLabs
      const sessionPayload: any = {
        agentId: AGENT_ID,
        clientTools: clientTools
      }

      // Add user context if available
      if (userContext) {
        sessionPayload.variableValues = userContext
        console.log('[VoiceConversation] Starting session with user context:', userContext)
      } else {
        console.warn('[VoiceConversation] Starting session without user context - this may limit functionality')
      }

      await conversation.startSession(sessionPayload)

      console.log("✅ Session Started Successfully")
      console.log('[VoiceConversation] Client tools registered:', Object.keys(clientTools))
    } catch (error) {
      console.error('[VoiceConversation] Failed to start session:', error)
      sessionStarted.current = false
      throw error
    }
  }

  return (
    <VoiceConversationContext.Provider value={{ conversation, startSessionWithTools }}>
      {children}
    </VoiceConversationContext.Provider>
  )
}

/**
 * Hook to access the shared voice conversation
 */
export function useVoiceConversation() {
  const context = useContext(VoiceConversationContext)

  if (!context) {
    throw new Error('useVoiceConversation must be used within VoiceConversationProvider')
  }

  return context
}
