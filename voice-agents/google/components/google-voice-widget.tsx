'use client'

import { useState } from 'react'
import { Phone, PhoneOff, Volume2, VolumeX, Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useGoogleVoiceConversation } from './google-voice-conversation-provider'

/**
 * Google Voice Widget
 *
 * UI component for controlling the Google Gemini voice agent.
 * Matches the ElevenLabs widget interface for easy swapping.
 */

export function GoogleVoiceWidget() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [volume, setVolume] = useState(0.8)

  const {
    isConnected,
    isSpeaking,
    isListening,
    status,
    startSessionWithTools,
    endSession,
    setMuted,
    getIsMuted
  } = useGoogleVoiceConversation()

  const [micMuted, setMicMuted] = useState(getIsMuted())

  const handleStartCall = async () => {
    console.log('[GoogleVoiceWidget] Starting voice session...')
    try {
      await startSessionWithTools()
      setIsExpanded(true)
    } catch (error) {
      console.error('[GoogleVoiceWidget] Failed to start session:', error)
    }
  }

  const handleEndCall = async () => {
    console.log('[GoogleVoiceWidget] Ending voice session...')
    try {
      await endSession()
      setIsExpanded(false)
    } catch (error) {
      console.error('[GoogleVoiceWidget] Failed to end session:', error)
    }
  }

  const toggleMic = () => {
    const newMuted = !micMuted
    setMicMuted(newMuted)
    setMuted(newMuted)
  }

  const toggleVolume = () => {
    setVolume(volume > 0 ? 0 : 0.8)
    // Note: Volume control handled at browser level
  }

  // Status indicator configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return { color: 'bg-yellow-500 animate-pulse', text: 'Connecting...' }
      case 'connected':
      case 'ready':
        return { color: 'bg-green-500', text: 'Connected' }
      case 'speaking':
        return { color: 'bg-green-500 animate-pulse', text: 'Speaking...' }
      case 'listening':
        return { color: 'bg-blue-500 animate-pulse', text: 'Listening...' }
      case 'error':
        return { color: 'bg-red-500', text: 'Error' }
      default:
        return { color: 'bg-gray-400', text: 'Disconnected' }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="w-full px-3 py-3 border-t border-theme-border bg-theme-surface">
      {!isExpanded ? (
        // Collapsed state - just the start button
        <Button
          onClick={handleStartCall}
          disabled={status === 'connecting'}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-10",
            "bg-theme-accent-primary hover:bg-theme-accent-primary/90",
            "text-white font-medium",
            "transition-all"
          )}
        >
          {status === 'connecting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="h-4 w-4" />
              Start Voice Call
            </>
          )}
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
                  statusConfig.color
                )}
              />
              <span className="text-xs text-theme-secondary">
                {statusConfig.text}
              </span>
              {isListening && (
                <span className="text-xs text-blue-500">(Listening)</span>
              )}
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

          {/* Voice model indicator */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-theme-secondary">
              Powered by Google Gemini • Voice: Kore
            </span>
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

          {/* Tips */}
          <div className="text-xs text-theme-secondary text-center">
            Try: "Go to dashboard" or "Create a job"
          </div>
        </div>
      )}
    </div>
  )
}