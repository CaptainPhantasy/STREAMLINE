'use client'

import { useEffect } from 'react'
import { getVoiceFeatureFlags } from '@/lib/voice-feature-flags'

/**
 * Voice Navigation Bridge
 *
 * Bridges voice commands to UI actions by listening for custom events.
 * This component handles the client-side execution of voice-triggered actions.
 *
 * **Conditional Rendering:**
 * - Only renders functionality when voice is enabled
 * - Respects feature flags for navigation and UI actions
 * - Gracefully degrades when voice is disabled
 *
 * **Architecture:**
 * - This is a "headless" component (renders null when disabled)
 * - Acts as a mounting point in the root layout
 * - Client tools are registered in the respective voice providers
 * - Session starts when user clicks voice button in widget
 */

export function VoiceNavigationBridge() {
  const flags = getVoiceFeatureFlags()

  useEffect(() => {
    // If voice is disabled, don't set up listeners
    if (!flags.enabled || !flags.enableUIActions) {
      return
    }

    // Handle voice-triggered UI actions
    const handleVoiceUIAction = (event: CustomEvent) => {
      const { action, payload } = event.detail

      console.log('[Voice Navigation Bridge] Handling UI action:', action, payload)

      switch (action) {
        case 'open_create_job_modal':
          // Dispatch event to open create job modal
          window.dispatchEvent(new CustomEvent('open-create-job-modal', { detail: payload }))
          break

        case 'open_create_contact_modal':
          window.dispatchEvent(new CustomEvent('open-create-contact-modal', { detail: payload }))
          break

        case 'show_notifications':
          window.dispatchEvent(new CustomEvent('show-notifications', { detail: payload }))
          break

        case 'open_settings':
          // Navigate to settings
          if (payload?.section) {
            window.location.href = `/settings#${payload.section}`
          } else {
            window.location.href = '/settings'
          }
          break

        case 'toggle_theme':
          // Toggle dark/light theme
          document.documentElement.classList.toggle('dark')
          break

        case 'refresh_page':
          // Refresh current page
          window.location.reload()
          break

        case 'go_back':
          // Navigate back in history
          window.history.back()
          break

        case 'scroll_to_top':
          // Scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' })
          break

        case 'open_help':
          // Open help modal or navigate to help page
          window.dispatchEvent(new CustomEvent('open-help-modal', { detail: payload }))
          break

        default:
          console.warn('[Voice Navigation Bridge] Unknown UI action:', action)
      }
    }

    // Add event listener
    window.addEventListener('voice-ui-action', handleVoiceUIAction as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('voice-ui-action', handleVoiceUIAction as EventListener)
    }
  }, [flags.enabled, flags.enableUIActions])

  // Log mount status
  useEffect(() => {
    if (flags.enabled) {
      console.log('[VoiceNavigationBridge] Mounted - Voice features enabled')
      console.log('[VoiceNavigationBridge] Provider:', flags.provider)
      console.log('[VoiceNavigationBridge] Features:', {
        navigation: flags.enableNavigation,
        uiActions: flags.enableUIActions,
        transcription: flags.enableTranscription,
        recording: flags.enableRecording
      })
    } else {
      console.log('[VoiceNavigationBridge] Voice features disabled - skipping setup')
    }
  }, [flags])

  // If voice is disabled, render null (headless component)
  if (!flags.enabled) {
    return null
  }

  // Headless component - renders nothing but sets up listeners
  return null
}
