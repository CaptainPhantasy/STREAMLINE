'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

type SpeechErrorEvent = { error: string }

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface SpeechToTextProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export function SpeechToText({ onTranscript, onError, disabled, className }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const shouldListenRef = useRef(false)
  const SpeechRecognition = typeof window === 'undefined'
    ? undefined
    : window.SpeechRecognition || window.webkitSpeechRecognition

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechResultEvent) => {
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: SpeechErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        
        if (event.error === 'not-allowed') {
          setIsListening(false)
          shouldListenRef.current = false
          if (onError) onError('Microphone access denied')
        } else if (event.error === 'no-speech') {
          // Ignore no-speech errors, just let it restart if needed
          return
        } else {
          // For other errors, maybe stop?
          // setIsListening(false)
          if (onError) onError(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start()
          } catch (error) {
            console.error('Failed to restart recognition:', error)
            setIsListening(false)
            shouldListenRef.current = false
          }
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      shouldListenRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore stop errors
        }
      }
    }
  }, [SpeechRecognition, onTranscript, onError])

  const toggleListening = () => {
    if (!SpeechRecognition || disabled) return

    if (isListening) {
      shouldListenRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore stop errors
        }
      }
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        try {
          shouldListenRef.current = true
          recognitionRef.current.start()
          setIsListening(true)
        } catch (error) {
          console.error('Failed to start recognition:', error)
          shouldListenRef.current = false
          if (onError) {
            onError('Failed to start speech recognition')
          }
        }
      }
    }
  }

  if (!SpeechRecognition) {
    return null // Don't show button if not supported
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleListening}
      disabled={disabled}
      className={cn(
        "relative",
        isListening && "bg-red-50 border-red-300 text-red-600",
        className
      )}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isListening && (
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </Button>
  )
}

