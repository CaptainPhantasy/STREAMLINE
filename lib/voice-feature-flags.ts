/**
 * Voice Feature Flags System
 *
 * Centralized feature flag management for voice functionality across the CRM.
 * Supports both ElevenLabs and Google voice providers.
 */

export interface VoiceFeatureFlags {
  // Master switch for voice functionality
  enabled: boolean

  // Provider selection
  provider: 'elevenlabs' | 'google'

  // Specific feature flags
  enableNavigation: boolean
  enableUIActions: boolean
  enableTranscription: boolean
  enableRecording: boolean

  // Development flags
  debugMode: boolean
  enableLogging: boolean

  // Configuration validation
  isValid: boolean
  validationErrors: string[]
}

/**
 * Get current voice feature flags from environment variables
 */
export function getVoiceFeatureFlags(): VoiceFeatureFlags {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_VOICE_AGENT === 'true'
  const provider = (process.env.NEXT_PUBLIC_VOICE_PROVIDER as 'elevenlabs' | 'google') || 'elevenlabs'

  const flags: VoiceFeatureFlags = {
    enabled,
    provider,
    enableNavigation: process.env.NEXT_PUBLIC_ENABLE_VOICE_NAVIGATION !== 'false', // Default true
    enableUIActions: process.env.NEXT_PUBLIC_ENABLE_VOICE_UI_ACTIONS !== 'false', // Default true
    enableTranscription: process.env.NEXT_PUBLIC_ENABLE_VOICE_TRANSCRIPTION === 'true', // Default false
    enableRecording: process.env.NEXT_PUBLIC_ENABLE_VOICE_RECORDING === 'true', // Default false
    debugMode: process.env.NEXT_PUBLIC_VOICE_DEBUG_MODE === 'true',
    enableLogging: process.env.NEXT_PUBLIC_VOICE_ENABLE_LOGGING !== 'false', // Default true in development
    isValid: true,
    validationErrors: []
  }

  // Validate configuration
  const validationErrors: string[] = []

  if (enabled && !provider) {
    validationErrors.push('Voice provider must be specified when voice is enabled')
  }

  if (enabled && provider === 'elevenlabs') {
    if (!process.env.ELEVENLABS_API_KEY) {
      validationErrors.push('ELEVENLABS_API_KEY is required when ElevenLabs provider is selected')
    }
  }

  if (enabled && provider === 'google') {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      validationErrors.push('GOOGLE_GEMINI_API_KEY is required when Google provider is selected')
    }
  }

  flags.validationErrors = validationErrors
  flags.isValid = validationErrors.length === 0

  return flags
}

/**
 * Check if voice is enabled and valid
 */
export function isVoiceEnabled(): boolean {
  const flags = getVoiceFeatureFlags()
  return flags.enabled && flags.isValid
}

/**
 * Check if a specific voice feature is enabled
 */
export function isVoiceFeatureEnabled(feature: keyof Omit<VoiceFeatureFlags, 'enabled' | 'provider' | 'isValid' | 'validationErrors'>): boolean {
  const flags = getVoiceFeatureFlags()
  return flags.enabled && flags[feature]
}

/**
 * Get the current voice provider
 */
export function getVoiceProvider(): 'elevenlabs' | 'google' | null {
  const flags = getVoiceFeatureFlags()
  return flags.enabled ? flags.provider : null
}

/**
 * Validate voice configuration
 */
export function validateVoiceConfiguration(): { valid: boolean; errors: string[]; warnings: string[] } {
  const flags = getVoiceFeatureFlags()
  const errors: string[] = []
  const warnings: string[] = []

  if (flags.enabled) {
    // Check for required environment variables
    if (!flags.provider) {
      errors.push('NEXT_PUBLIC_VOICE_PROVIDER must be set to "elevenlabs" or "google"')
    }

    // Provider-specific validation
    if (flags.provider === 'elevenlabs') {
      if (!process.env.ELEVENLABS_API_KEY) {
        errors.push('ELEVENLABS_API_KEY is required for ElevenLabs provider')
      }
      if (!process.env.ELEVENLABS_AGENT_ID) {
        warnings.push('ELEVENLABS_AGENT_ID is not set, using default agent')
      }
    }

    if (flags.provider === 'google') {
      if (!process.env.GOOGLE_GEMINI_API_KEY) {
        errors.push('GOOGLE_GEMINI_API_KEY is required for Google provider')
      }
      if (!process.env.GOOGLE_GEMINI_MODEL) {
        warnings.push('GOOGLE_GEMINI_MODEL is not set, using default model')
      }
    }

    // Optional features warnings
    if (flags.enableTranscription && !process.env.ELEVENLABS_API_KEY && flags.provider === 'elevenlabs') {
      warnings.push('Voice transcription requires ElevenLabs API key')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Runtime feature flag checker for components
 */
export function useVoiceFeatureFlags(): VoiceFeatureFlags {
  // In a real implementation, this would use React state and context
  // to update flags in real-time when environment changes
  return getVoiceFeatureFlags()
}

/**
 * Feature flag metadata for UI/UX decisions
 */
export interface VoiceFeatureMetadata {
  name: string
  description: string
  category: 'core' | 'navigation' | 'ui' | 'recording' | 'development'
  requiredProvider?: 'elevenlabs' | 'google' | 'both'
  defaultValue: boolean
}

/**
 * Get metadata for all voice features
 */
export function getVoiceFeatureMetadata(): Record<string, VoiceFeatureMetadata> {
  return {
    enabled: {
      name: 'Voice Agent',
      description: 'Enable voice assistant functionality',
      category: 'core',
      requiredProvider: 'both',
      defaultValue: false
    },
    enableNavigation: {
      name: 'Voice Navigation',
      description: 'Allow voice commands to navigate between pages',
      category: 'navigation',
      requiredProvider: 'both',
      defaultValue: true
    },
    enableUIActions: {
      name: 'Voice UI Actions',
      description: 'Allow voice commands to trigger UI actions like opening modals',
      category: 'ui',
      requiredProvider: 'both',
      defaultValue: true
    },
    enableTranscription: {
      name: 'Voice Transcription',
      description: 'Transcribe voice conversations to text',
      category: 'recording',
      requiredProvider: 'elevenlabs',
      defaultValue: false
    },
    enableRecording: {
      name: 'Voice Recording',
      description: 'Record voice conversations for playback',
      category: 'recording',
      requiredProvider: 'both',
      defaultValue: false
    },
    debugMode: {
      name: 'Debug Mode',
      description: 'Enable additional debugging information for voice features',
      category: 'development',
      requiredProvider: 'both',
      defaultValue: false
    },
    enableLogging: {
      name: 'Voice Logging',
      description: 'Enable detailed logging for voice interactions',
      category: 'development',
      requiredProvider: 'both',
      defaultValue: true
    }
  }
}