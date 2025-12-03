'use client'

import { VoiceNavigationBridge } from './voice-navigation-bridge'
import { getVoiceFeatureFlags } from '@/lib/voice-feature-flags'

/**
 * Conditional Voice Navigation Bridge
 *
 * Renders VoiceNavigationBridge only when voice features are enabled.
 * This prevents unnecessary component mounting when voice is disabled.
 */

export function ConditionalVoiceNavigationBridge() {
  const flags = getVoiceFeatureFlags()

  // Only render bridge if voice is enabled
  if (!flags.enabled) {
    return null
  }

  return <VoiceNavigationBridge />
}