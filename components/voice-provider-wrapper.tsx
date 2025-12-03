'use client'

import React, { useState, useEffect } from 'react'
import { getVoiceFeatureFlags } from '@/lib/voice-feature-flags'

interface VoiceProviderWrapperProps {
  children: React.ReactNode
}

/**
 * Voice Provider Wrapper
 *
 * Conditional provider that loads the appropriate voice provider
 * based on feature flags. Only loads the selected provider to
 * minimize bundle size when voice is disabled.
 */

/**
 * Error boundary for voice provider loading
 */
class VoiceProviderErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Voice Provider] Error loading voice provider:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <>{this.props.children}</>
    }

    return this.props.children
  }
}

/**
 * Voice Provider Wrapper Component
 *
 * Renders the appropriate voice provider based on configuration.
 * Returns children without voice provider if voice is disabled.
 */
export function VoiceProviderWrapper({ children }: VoiceProviderWrapperProps) {
  const flags = getVoiceFeatureFlags()
  const [VoiceProvider, setVoiceProvider] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null)

  useEffect(() => {
    // If voice is disabled, don't load anything
    if (!flags.enabled || !flags.isValid) {
      return
    }

    // Dynamically import the appropriate provider
    const loadVoiceProvider = async () => {
      try {
        if (flags.provider === 'elevenlabs') {
          const module = await import('voice-agents/elevenlabs/components/elevenlabs-voice-conversation-provider')
          setVoiceProvider(() => module.ElevenLabsVoiceConversationProvider)
        } else if (flags.provider === 'google') {
          const module = await import('voice-agents/google/components/google-voice-conversation-provider')
          setVoiceProvider(() => module.GoogleVoiceConversationProvider)
        }
      } catch (error) {
        console.warn(`[Voice Provider] Failed to load ${flags.provider} provider:`, error)
        setVoiceProvider(null)
      }
    }

    loadVoiceProvider()
  }, [flags.enabled, flags.isValid, flags.provider])

  // If voice is disabled, return children without provider
  if (!flags.enabled) {
    return <>{children}</>
  }

  // If configuration is invalid, return children without provider
  if (!flags.isValid) {
    console.error('[Voice Provider] Invalid voice configuration, voice features disabled')
    return <>{children}</>
  }

  // If no provider loaded, return children without provider
  if (!VoiceProvider) {
    console.warn('[Voice Provider] No voice provider loaded, continuing without voice')
    return <>{children}</>
  }

  // Render the loaded provider
  return (
    <VoiceProviderErrorBoundary fallback={<>{children}</>}>
      <VoiceProvider
        onError={(error) => {
          console.error(`[Voice Provider] ${flags.provider} provider error:`, error)
        }}
      >
        {children}
      </VoiceProvider>
    </VoiceProviderErrorBoundary>
  )
}