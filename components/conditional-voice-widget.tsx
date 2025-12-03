'use client'

import { useState, useEffect } from 'react'
import { getVoiceFeatureFlags } from '@/lib/voice-feature-flags'

/**
 * Conditional Voice Widget
 *
 * Dynamically loads and renders the appropriate voice widget based on
 * the configured voice provider. Only loads when voice is enabled.
 * Gracefully handles missing modules with fallbacks.
 */

export function ConditionalVoiceWidget() {
  const flags = getVoiceFeatureFlags()
  const [VoiceWidget, setVoiceWidget] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    // If voice is disabled, don't load anything
    if (!flags.enabled || !flags.isValid) {
      return
    }

    // Dynamically import the appropriate widget
    const loadVoiceWidget = async () => {
      try {
        if (flags.provider === 'elevenlabs') {
          const module = await import('voice-agents/elevenlabs/components/elevenlabs-voice-widget')
          setVoiceWidget(() => module.ElevenLabsVoiceWidget)
        } else if (flags.provider === 'google') {
          const module = await import('voice-agents/google/components/google-voice-widget')
          setVoiceWidget(() => module.GoogleVoiceWidget)
        }
      } catch (error) {
        console.warn(`[Conditional Voice Widget] Failed to load ${flags.provider} widget:`, error)
        setVoiceWidget(null)
      }
    }

    loadVoiceWidget()
  }, [flags.enabled, flags.isValid, flags.provider])

  // If voice is disabled or configuration is invalid, render nothing
  if (!flags.enabled || !flags.isValid) {
    return null
  }

  // If no widget loaded, render nothing
  if (!VoiceWidget) {
    return null
  }

  // Render the loaded widget
  return <VoiceWidget />
}