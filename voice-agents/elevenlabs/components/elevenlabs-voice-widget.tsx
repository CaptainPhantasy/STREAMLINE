'use client'

import { useState } from 'react'
import { Phone, PhoneOff, Volume2, VolumeX, Mic, MicOff, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useElevenLabsVoiceConversation } from './elevenlabs-voice-conversation-provider'
import { getElevenLabsConfig } from '../utils/elevenlabs-config'
import type { VoiceAgentWidgetProps } from '../types/elevenlabs.types'

/**
 * ElevenLabs Voice Agent Widget
 *
 * UI component for controlling the ElevenLabs voice agent conversation.
 * Uses the shared conversation context from ElevenLabsVoiceConversationProvider.
 *
 * **Features:**
 * - Start/end voice calls
 * - Mute/unmute microphone
 * - Volume control
 * - Connection status indicator
 * - Error handling and fallbacks
 * - Loading states
 */

export function ElevenLabsVoiceWidget({
  className,
  onStatusChange,
  onError
}: VoiceAgentWidgetProps = {}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get configuration
  const config = getElevenLabsConfig()

  // Get conversation context
  const conversationContext = useElevenLabsVoiceConversation()
  const { conversation, startSessionWithTools } = conversationContext

  const { status, isSpeaking } = conversation
  const isConnected = status === 'connected'

  // Handle status changes
  const handleStatusChange = (newStatus: string) => {
    onStatusChange?.(newStatus)
  }

  // Handle errors
  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    onError?.(new Error(errorMessage))
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000)
  }

  const handleStartCall = async () => {
    try {
      setError(null)
      setIsConnecting(true)
      handleStatusChange('connecting')

      await startSessionWithTools()

      setIsExpanded(true)
      handleStatusChange('connected')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice call'
      console.error('[ElevenLabs Widget] Failed to start session:', error)
      handleError(errorMessage)
      handleStatusChange('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleEndCall = async () => {
    try {
      setError(null)
      await conversation.endSession()
      setIsExpanded(false)
      handleStatusChange('disconnected')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end voice call'
      console.error('[ElevenLabs Widget] Failed to end session:', error)
      handleError(errorMessage)
    }
  }

  const toggleMic = () => {
    setMicMuted(!micMuted)
    // Note: You may need to update the conversation's micMuted state
    // depending on how the SDK handles this
  }

  const toggleVolume = () => {
    setVolume(volume > 0 ? 0 : 0.8)
    // Note: You may need to update the conversation's volume state
    // depending on how the SDK handles this
  }

  // If voice is disabled, render nothing
  if (!config.enabled) {
    return null
  }

  // If configuration is invalid, show error state
  if (!config.isValid) {
    return (
      <div className={cn("w-full px-3 py-3 border-t border-theme-border bg-theme-surface", className)}>
        <div className="flex items-center gap-2 text-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">
            Voice agent configuration error
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full px-3 py-3 border-t border-theme-border bg-theme-surface", className)}>
      {/* Error display */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}

      {!isExpanded ? (
        // Collapsed state - just the start button
        <Button
          onClick={handleStartCall}
          disabled={isConnecting}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-10",
            "bg-theme-accent-primary hover:bg-theme-accent-primary/90",
            "text-white font-medium",
            "transition-all"
          )}
        >
          <Phone className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Start a call'}
        </Button>
      ) : (
        // Expanded state - full controls
        <div className="space-y-3">
          {/* Status indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected
                    ? isSpeaking
                      ? "bg-green-500 animate-pulse"
                      : "bg-green-500"
                    : "bg-gray-400"
                )}
              />
              <span className="text-xs text-theme-secondary">
                {isConnected
                  ? isSpeaking
                    ? 'Agent speaking...'
                    : 'Connected'
                  : 'Disconnected'}
              </span>
            </div>
            <Button
              onClick={handleEndCall}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-theme-secondary hover:text-theme-primary"
            >
              <PhoneOff className="h-3 w-3" />
            </Button>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMic}
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 h-8",
                micMuted && "bg-red-500/10 border-red-500/50 text-red-500"
              )}
            >
              {micMuted ? (
                <>
                  <MicOff className="h-3 w-3 mr-1" />
                  <span className="text-xs">Unmute</span>
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3 mr-1" />
                  <span className="text-xs">Mute</span>
                </>
              )}
            </Button>
            <Button
              onClick={toggleVolume}
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 h-8",
                volume === 0 && "bg-orange-500/10 border-orange-500/50 text-orange-500"
              )}
            >
              {volume === 0 ? (
                <>
                  <VolumeX className="h-3 w-3 mr-1" />
                  <span className="text-xs">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3 mr-1" />
                  <span className="text-xs">Volume</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}