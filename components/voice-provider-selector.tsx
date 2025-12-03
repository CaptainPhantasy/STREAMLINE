'use client'

import { createContext, useContext, ReactNode } from 'react'
import { VoiceConversationProvider } from '@/components/voice-conversation-provider'
import { GoogleVoiceConversationProvider } from '@/voice-agents/google/components/google-voice-conversation-provider'

type VoiceProvider = 'elevenlabs' | 'google'

interface VoiceProviderSelectorProps {
  children: ReactNode
  provider?: VoiceProvider
}

// Create a selector that can switch between providers
export function VoiceProviderSelector({
  children,
  provider = 'elevenlabs' // Default to ElevenLabs
}: VoiceProviderSelectorProps) {
  // You can dynamically choose the provider based on:
  // 1. Explicit prop (as shown)
  // 2. Environment variable: process.env.NEXT_PUBLIC_DEFAULT_VOICE_PROVIDER
  // 3. User preference from database
  // 4. Feature flag from remote config

  const selectedProvider = provider ||
    (process.env.NEXT_PUBLIC_DEFAULT_VOICE_PROVIDER as VoiceProvider) ||
    'elevenlabs'

  console.log(`[VoiceProvider] Using provider: ${selectedProvider}`)

  // Render the selected provider
  switch (selectedProvider) {
    case 'google':
      return <GoogleVoiceConversationProvider>{children}</GoogleVoiceConversationProvider>
    case 'elevenlabs':
    default:
      return <VoiceConversationProvider>{children}</VoiceConversationProvider>
  }
}

// Create a context for provider switching at runtime
const VoiceSwitchContext = createContext<{
  switchProvider: (provider: VoiceProvider) => void
  currentProvider: VoiceProvider
}>({
  switchProvider: () => {},
  currentProvider: 'elevenlabs'
})

// Hook for components to access provider switching
export function useVoiceSwitch() {
  return useContext(VoiceSwitchContext)
}