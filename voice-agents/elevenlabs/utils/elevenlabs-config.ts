/**
 * ElevenLabs Configuration Management
 *
 * Centralized configuration for ElevenLabs voice agent functionality.
 * Handles environment variable validation and feature flag management.
 */

export interface ElevenLabsConfig {
  enabled: boolean
  provider: 'elevenlabs' | 'google'
  agentId: string
  apiKey?: string
  isValid: boolean
  validationErrors: string[]
}

/**
 * Get ElevenLabs configuration from environment variables
 */
export function getElevenLabsConfig(): ElevenLabsConfig {
  const config: ElevenLabsConfig = {
    enabled: process.env.NEXT_PUBLIC_ENABLE_VOICE_AGENT === 'true',
    provider: (process.env.NEXT_PUBLIC_VOICE_PROVIDER as 'elevenlabs' | 'google') || 'elevenlabs',
    agentId: process.env.ELEVENLABS_AGENT_ID || 'agent_6501katrbe2re0c834kfes3hvk2d', // Keep hard-coded default
    apiKey: process.env.ELEVENLABS_API_KEY,
    isValid: true,
    validationErrors: []
  }

  // Validate configuration
  const validationErrors: string[] = []

  if (config.enabled && config.provider === 'elevenlabs') {
    if (!config.apiKey) {
      validationErrors.push('ELEVENLABS_API_KEY is required when ElevenLabs voice is enabled')
    }

    if (!config.agentId) {
      validationErrors.push('ELEVENLABS_AGENT_ID is required when ElevenLabs voice is enabled')
    }
  }

  config.validationErrors = validationErrors
  config.isValid = validationErrors.length === 0

  return config
}

/**
 * Check if ElevenLabs voice agent is properly configured and enabled
 */
export function isElevenLabsEnabled(): boolean {
  const config = getElevenLabsConfig()
  return config.enabled && config.provider === 'elevenlabs' && config.isValid
}

/**
 * Get the current user context for ElevenLabs session
 */
export interface UserContext {
  user_identifier: string
  user_name: string
  user_role: string
  account_id: string
}

export async function getUserContext(): Promise<UserContext | null> {
  try {
    // Dynamic import to avoid SSR issues
    const { createBrowserClient } = await import('@supabase/ssr')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get user role and account info
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('role, account_id')
      .eq('user_id', user.id)
      .single()

    return {
      user_identifier: user.id,
      user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
      user_role: accountUser?.role || 'unknown',
      account_id: accountUser?.account_id || 'unknown'
    }
  } catch (error) {
    console.error('[ElevenLabs Config] Failed to get user context:', error)
    return null
  }
}

/**
 * Default configuration for development
 */
export const defaultConfig: ElevenLabsConfig = {
  enabled: false,
  provider: 'elevenlabs',
  agentId: 'agent_6501katrbe2re0c834kfes3hvk2d',
  isValid: false,
  validationErrors: ['Voice agent is disabled by default']
}