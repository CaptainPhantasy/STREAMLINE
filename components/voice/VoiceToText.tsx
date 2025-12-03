'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceToTextProps {
  onTranscript?: (text: string) => void
  onError?: (error: Error) => void
  autoStart?: boolean
  language?: string
}

export function VoiceToText({
  onTranscript,
  onError,
  autoStart = false,
  language = 'en-US',
}: VoiceToTextProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        setTranscript(fullTranscript)
        onTranscript?.(fullTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        const error = new Error(`Speech recognition error: ${event.error}`)
        onError?.(error)
        toast.error('Voice recognition error')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    if (autoStart && isSupported) {
      startListening()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, autoStart, isSupported])

  function startListening() {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported')
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
      toast.success('Listening...')
    } catch (error: any) {
      console.error('Error starting recognition:', error)
      toast.error('Failed to start voice recognition')
      onError?.(error)
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      toast.success('Stopped listening')
    }
  }

  function clearTranscript() {
    setTranscript('')
    onTranscript?.('')
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice to Text</CardTitle>
          <CardDescription>
            Your browser does not support speech recognition
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice to Text</CardTitle>
        <CardDescription>
          Click the microphone to start voice input
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? 'destructive' : 'default'}
            size="lg"
            className="rounded-full w-20 h-20"
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          {isListening && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600">Listening...</span>
            </div>
          )}
        </div>

        {transcript && (
          <div className="space-y-2">
            <div className="p-4 border rounded-lg bg-gray-50 min-h-[100px]">
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
            <Button
              onClick={clearTranscript}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

