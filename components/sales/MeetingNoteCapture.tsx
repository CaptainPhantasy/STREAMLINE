'use client'

/**
 * MeetingNoteCapture - Voice-to-text meeting notes
 *
 * Captures meeting notes with real-time transcription and auto-save.
 *
 * @example
 * ```tsx
 * <MeetingNoteCapture
 *   meetingId="meeting-123"
 *   onSave={(note) => console.log('Saved:', note)}
 *   autoSave
 * />
 * ```
 */

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Save, Check, Loader2 } from 'lucide-react'
import type { MeetingNoteCaptureProps } from '@/lib/types/sales'

export function MeetingNoteCapture({ meetingId, onSave, autoSave = true, className }: MeetingNoteCaptureProps) {
  const [note, setNote] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check for Web Speech API support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
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

          if (finalTranscript) {
            setNote((prev) => prev + finalTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setError(`Voice recognition error: ${event.error}`)
          setIsRecording(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (autoSave && note && !isSaving) {
      // Debounce auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave()
      }, 2000)
    }
  }, [note, autoSave])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not supported in this browser')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      setError(null)
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const handleSave = async () => {
    if (!note.trim() || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/meetings/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          content: note,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      setLastSaved(new Date())
      onSave?.(note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={cn('bg-gray-800 rounded-xl p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Meeting Notes</h3>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Check className="w-3 h-3" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          {isSaving && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Text Area */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Type or speak your notes here..."
        className="w-full min-h-[200px] px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
      />

      {/* Voice Recording Status */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-sm font-semibold">Recording...</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={toggleRecording}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all',
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          )}
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Voice Note
            </>
          )}
        </button>

        {!autoSave && (
          <button
            onClick={handleSave}
            disabled={!note.trim() || isSaving}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
        )}
      </div>

      {/* Character Count */}
      <div className="text-right text-xs text-gray-500">
        {note.length} characters
      </div>
    </div>
  )
}

export default MeetingNoteCapture
