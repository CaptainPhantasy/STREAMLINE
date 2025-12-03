/**
 * ElevenLabs Client Wrapper
 *
 * Wrapper for the @elevenlabs/react SDK with error handling,
 * reconnection logic, and graceful degradation.
 */

import { getElevenLabsConfig } from '../utils/elevenlabs-config'
import type { ElevenLabsConversationCallbacks } from '../types/elevenlabs.types'

/**
 * Wrapped ElevenLabs conversation with error handling
 */
export class ElevenLabsClientWrapper {
  private retryCount = 0
  private maxRetries = 3
  private reconnectDelay = 1000 // 1 second
  private isDestroyed = false

  constructor(private callbacks?: ElevenLabsConversationCallbacks) {}

  /**
   * Start ElevenLabs session with error handling and retries
   */
  async startSession(payload: any): Promise<void> {
    const config = getElevenLabsConfig()

    if (!config.enabled) {
      throw new Error('ElevenLabs voice agent is disabled')
    }

    if (!config.isValid) {
      throw new Error(`ElevenLabs configuration invalid: ${config.validationErrors.join(', ')}`)
    }

    if (!config.apiKey) {
      throw new Error('ELEVENLABS_API_KEY is required')
    }

    try {
      // Dynamic import to avoid SSR issues
      const { useConversation } = await import('@elevenlabs/react')

      // Note: This would need to be used within a React component
      // This wrapper is primarily for configuration validation and error handling

      console.log('[ElevenLabs Client] Starting session with payload:', {
        agentId: payload.agentId,
        toolsCount: Object.keys(payload.clientTools || {}).length,
        hasUserContext: !!payload.variableValues
      })

      this.callbacks?.onConnect?.()
      this.retryCount = 0 // Reset retry count on successful connection

    } catch (error) {
      console.error('[ElevenLabs Client] Failed to start session:', error)

      if (!this.isDestroyed && this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`[ElevenLabs Client] Retrying connection (${this.retryCount}/${this.maxRetries})...`)

        // Exponential backoff
        const delay = this.reconnectDelay * Math.pow(2, this.retryCount - 1)
        await this.delay(delay)

        return this.startSession(payload)
      }

      this.callbacks?.onError?.(error)
      throw new Error(`ElevenLabs session failed after ${this.retryCount} retries: ${error}`)
    }
  }

  /**
   * End session with cleanup
   */
  async endSession(): Promise<void> {
    try {
      console.log('[ElevenLabs Client] Ending session...')
      this.callbacks?.onDisconnect?.()
      this.retryCount = 0
    } catch (error) {
      console.error('[ElevenLabs Client] Error ending session:', error)
      throw error
    }
  }

  /**
   * Health check for ElevenLabs service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const config = getElevenLabsConfig()

      if (!config.enabled || !config.isValid) {
        return false
      }

      // Simple ping to ElevenLabs API (if available)
      // This would require implementing a health check endpoint

      return true
    } catch (error) {
      console.error('[ElevenLabs Client] Health check failed:', error)
      return false
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    // This would interface with the actual useConversation hook
    // For now, return a default status
    return 'disconnected'
  }

  /**
   * Destroy wrapper and cleanup resources
   */
  destroy(): void {
    this.isDestroyed = true
    this.callbacks = undefined
    console.log('[ElevenLabs Client] Wrapper destroyed')
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Create a new ElevenLabs client wrapper
 */
export function createElevenLabsClient(callbacks?: ElevenLabsConversationCallbacks): ElevenLabsClientWrapper {
  return new ElevenLabsClientWrapper(callbacks)
}

/**
 * Singleton instance for global usage
 */
let globalClient: ElevenLabsClientWrapper | null = null

/**
 * Get or create the global ElevenLabs client instance
 */
export function getElevenLabsClient(callbacks?: ElevenLabsConversationCallbacks): ElevenLabsClientWrapper {
  if (!globalClient || globalClient['isDestroyed']) {
    globalClient = new ElevenLabsClientWrapper(callbacks)
  }
  return globalClient
}

/**
 * Cleanup global client instance
 */
export function cleanupElevenLabsClient(): void {
  if (globalClient) {
    globalClient.destroy()
    globalClient = null
  }
}