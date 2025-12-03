'use client'

import { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useConversation } from '@elevenlabs/react'
import { getElevenLabsConfig, UserContext, getUserContext } from '../utils/elevenlabs-config'
import type {
  VoiceConversationContextValue,
  NavigationResult,
  CurrentPageResult,
  ScrollResult,
  UIActionResult,
  OpenNewTabResult,
  ElevenLabsConversationCallbacks
} from '../types/elevenlabs.types'

/**
 * ElevenLabs Voice Conversation Provider
 *
 * Provides a SINGLE shared conversation instance for the entire application.
 * This prevents multiple components from creating duplicate WebRTC sessions.
 *
 * **Architecture:**
 * - ONE conversation instance per user session
 * - Client-side tools registered here (navigation, UI actions, etc.)
 * - UI components consume this context for controls
 * - Error boundaries and graceful degradation
 * - Configuration validation
 */

const ElevenLabsVoiceConversationContext = createContext<VoiceConversationContextValue | null>(null)

interface ElevenLabsVoiceConversationProviderProps {
  children: ReactNode
  onError?: (error: Error) => void
}

export function ElevenLabsVoiceConversationProvider({
  children,
  onError
}: ElevenLabsVoiceConversationProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const sessionStarted = useRef(false)
  const [config, setConfig] = useState(() => getElevenLabsConfig())

  // User context state
  const [userContext, setUserContext] = useState<UserContext | null>(null)

  // Validate configuration on mount
  useEffect(() => {
    const currentConfig = getElevenLabsConfig()
    setConfig(currentConfig)

    if (!currentConfig.isValid) {
      const error = new Error(`ElevenLabs configuration invalid: ${currentConfig.validationErrors.join(', ')}`)
      console.error('[ElevenLabs] Configuration error:', error.message)
      onError?.(error)
      return
    }

    if (!currentConfig.enabled) {
      console.log('[ElevenLabs] Voice agent disabled via feature flag')
      return
    }

    // Get user context
    getUserContext()
      .then(context => {
        if (context) {
          console.log('[ElevenLabs] User context loaded:', context)
          setUserContext(context)
        } else {
          console.warn('[ElevenLabs] Failed to load user context')
        }
      })
      .catch(error => {
        console.error('[ElevenLabs] Failed to load user context:', error)
        onError?.(error)
      })
  }, [onError])

  // ElevenLabs conversation hooks
  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs] Connected to voice agent')
    },
    onDisconnect: () => {
      console.log('[ElevenLabs] Disconnected from voice agent')
      sessionStarted.current = false
    },
    onError: (error) => {
      console.error('[ElevenLabs] Conversation error:', error)
      onError?.(new Error(`ElevenLabs conversation error: ${error}`))
    },
    onStatusChange: (status) => {
      console.log('[ElevenLabs] Status change:', status)
    },
  })

  /**
   * Start ElevenLabs session with client-side tools
   * This should only be called ONCE when the user initiates a voice call
   */
  const startSessionWithTools = async (): Promise<void> => {
    console.log('[ElevenLabs] Starting session with tools...')

    if (sessionStarted.current) {
      console.log('[ElevenLabs] Session already started')
      return
    }

    if (!config.enabled || !config.isValid) {
      throw new Error('ElevenLabs voice agent is not properly configured')
    }

    try {
      sessionStarted.current = true

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
          handler: async (params: { route: string }): Promise<NavigationResult> => {
            console.log("[ElevenLabs] Navigation request:", params.route)

            let { route } = params
            let target = route.toLowerCase().trim()

            // Unified route mapping for both mobile and desktop
            if (target.includes('tech') && (target.includes('dashboard') || target.includes('home'))) {
              target = pathname.startsWith('/m/tech') ? '/m/tech/dashboard' : '/tech/dashboard'
            } else if (target.includes('tech') && target.includes('map')) {
              target = pathname.startsWith('/m/') ? '/m/tech/map' : '/dispatch/map'
            } else if (target.includes('tech') && target.includes('job')) {
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
              const contactIdMatch = target.match(/briefing[\/\s]+([a-f0-9\-]+)/)
              if (contactIdMatch) {
                target = pathname.startsWith('/m/') ? `/m/sales/briefing/${contactIdMatch[1]}` : `/sales/briefing/${contactIdMatch[1]}`
              } else {
                target = pathname.startsWith('/m/') ? '/m/sales/dashboard' : '/sales/dashboard'
              }
            } else if (target.includes('sales') && target.includes('meeting')) {
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
              if (pathname.startsWith('/m/tech')) {
                target = '/m/tech/dashboard'
              } else if (pathname.startsWith('/m/sales')) {
                target = '/m/sales/dashboard'
              } else if (pathname.startsWith('/m/owner')) {
                target = '/m/owner/dashboard'
              } else {
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

            console.log(`[ElevenLabs] Navigation: "${route}" → ${target}`)

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
          handler: async (): Promise<CurrentPageResult> => {
            console.log(`[ElevenLabs] Current page: ${pathname}`)

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
          handler: async (params: { sectionId: string }): Promise<ScrollResult> => {
            const { sectionId } = params

            console.log(`[ElevenLabs] Scrolling to: ${sectionId}`)

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
          handler: async (params: { action: string; payload?: Record<string, unknown> }): Promise<UIActionResult> => {
            const { action, payload } = params

            console.log(`[ElevenLabs] Triggering UI action: ${action}`, payload)

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
          handler: async (params: { url: string }): Promise<OpenNewTabResult> => {
            const { url } = params

            console.log(`[ElevenLabs] Opening new tab: ${url}`)

            window.open(url, '_blank', 'noopener,noreferrer')

            return {
              success: true,
              message: `Opened ${url} in new tab`,
            }
          },
        },
      }

      // Start session with client tools
      console.log("[ElevenLabs] Starting session with client tools:", Object.keys(clientTools))

      // Prepare session payload
      const sessionPayload = {
        agentId: config.agentId,
        clientTools: clientTools
      }

      // Add user context if available
      if (userContext) {
        sessionPayload.variableValues = userContext
        console.log('[ElevenLabs] Starting session with user context:', userContext)
      } else {
        console.warn('[ElevenLabs] Starting session without user context - this may limit functionality')
      }

      await conversation.startSession(sessionPayload)

      console.log("[ElevenLabs] Session started successfully")
      console.log('[ElevenLabs] Client tools registered:', Object.keys(clientTools))
    } catch (error) {
      console.error('[ElevenLabs] Failed to start session:', error)
      sessionStarted.current = false
      const wrappedError = new Error(`Failed to start ElevenLabs session: ${error}`)
      onError?.(wrappedError)
      throw wrappedError
    }
  }

  // If voice is disabled, just render children without provider functionality
  if (!config.enabled) {
    return <>{children}</>
  }

  // If configuration is invalid, render children with error handling
  if (!config.isValid) {
    console.error('[ElevenLabs] Invalid configuration, voice features disabled')
    return <>{children}</>
  }

  return (
    <ElevenLabsVoiceConversationContext.Provider value={{ conversation, startSessionWithTools }}>
      {children}
    </ElevenLabsVoiceConversationContext.Provider>
  )
}

/**
 * Hook to access the shared ElevenLabs voice conversation
 */
export function useElevenLabsVoiceConversation(): VoiceConversationContextValue {
  const context = useContext(ElevenLabsVoiceConversationContext)

  if (!context) {
    throw new Error('useElevenLabsVoiceConversation must be used within ElevenLabsVoiceConversationProvider')
  }

  return context
}