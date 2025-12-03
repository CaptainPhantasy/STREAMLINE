'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, PhoneOff, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceAgentWidget } from '@/components/voice-agent/voice-agent-widget'
import { GoogleVoiceWidget } from '@/voice-agents/google/components/google-voice-widget'
import { cn } from '@/lib/utils'

/**
 * Dual Voice Widget
 *
 * Allows users to choose between ElevenLabs and Google voice agents
 * Each provider maintains its own session state independently
 */

export function DualVoiceWidget() {
  const [selectedProvider, setSelectedProvider] = useState<'elevenlabs' | 'google'>('elevenlabs')
  const [showSettings, setShowSettings] = useState(false)
  const [activeSession, setActiveSession] = useState<'elevenlabs' | 'google' | null>(null)

  // Track which session is active
  const updateActiveSession = (provider: 'elevenlabs' | 'google', isActive: boolean) => {
    if (isActive) {
      setActiveSession(provider)
    } else if (activeSession === provider) {
      setActiveSession(null)
    }
  }

  return (
    <div className="w-full px-3 py-3 border-t border-theme-border bg-theme-surface">
      {/* Provider Selection Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-theme-border">
            <button
              onClick={() => setSelectedProvider('elevenlabs')}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-all",
                selectedProvider === 'elevenlabs'
                  ? "bg-theme-accent-primary text-white"
                  : "bg-theme-surface text-theme-secondary hover:bg-theme-hover"
              )}
            >
              ElevenLabs
            </button>
            <button
              onClick={() => setSelectedProvider('google')}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-all",
                selectedProvider === 'google'
                  ? "bg-theme-accent-primary text-white"
                  : "bg-theme-surface text-theme-secondary hover:bg-theme-hover"
              )}
            >
              Google Gemini
            </button>
          </div>

          {/* Active indicator */}
          {activeSession && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-theme-secondary">
                {activeSession === 'elevenlabs' ? 'ElevenLabs' : 'Google'} Active
              </span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="h-6 w-6 p-0"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Provider Comparison Info */}
      {showSettings && (
        <div className="mb-3 p-2 rounded-lg bg-theme-surface border border-theme-border text-xs">
          <div className="font-medium mb-2">Voice Provider Comparison:</div>
          <div className="space-y-1 text-theme-secondary">
            <div className="flex justify-between">
              <span>ElevenLabs:</span>
              <span>Human-like, emotional range</span>
            </div>
            <div className="flex justify-between">
              <span>Google Gemini:</span>
              <span>Fast responses, integrated tools</span>
            </div>
          </div>
        </div>
      )}

      {/* Render the selected widget */}
      {selectedProvider === 'elevenlabs' ? (
        <div className="relative">
          <VoiceAgentWidget />
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            1
          </div>
        </div>
      ) : (
        <div className="relative">
          <GoogleVoiceWidget />
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
            2
          </div>
        </div>
      )}

      {/* Quick switch buttons when both providers are available */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => setSelectedProvider('elevenlabs')}
            disabled={selectedProvider === 'elevenlabs'}
          >
            Switch to ElevenLabs
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => setSelectedProvider('google')}
            disabled={selectedProvider === 'google'}
          >
            Switch to Google
          </Button>
        </div>
      )}

      {/* Voice tips based on provider */}
      <div className="mt-2 text-xs text-theme-secondary text-center">
        {selectedProvider === 'elevenlabs' ? (
          <span>ElevenLabs: Natural conversation with emotional depth</span>
        ) : (
          <span>Google: Quick responses with smart tool execution</span>
        )}
      </div>
    </div>
  )
}