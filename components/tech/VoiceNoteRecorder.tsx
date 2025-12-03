'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Save, X, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceNoteRecorderProps, VoiceNote } from '@/lib/types/tech-mobile'

/**
 * VoiceNoteRecorder - Voice-to-text notes for tech mobile
 *
 * Features:
 * - Web Speech API real-time transcription
 * - Save as text note
 * - Fallback to audio recording
 * - Large start/stop button
 * - Visual recording indicator
 *
 * @example
 * ```tsx
 * <VoiceNoteRecorder
 *   jobId={job.id}
 *   onNoteRecorded={(note) => saveNote(note)}
 *   autoSave
 *   maxDuration={300} // 5 minutes
 * />
 * ```
 */
export function VoiceNoteRecorder({
  jobId,
  onNoteRecorded,
  onTranscriptReady,
  maxDuration = 300, // 5 minutes default
  autoSave = false,
  className,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice recognition not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  const startRecording = () => {
    if (error) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setTranscript('')
      setDuration(0)
      setError(null)

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' '
        } else {
          interimTranscript += transcriptPiece
        }
      }

      setTranscript((prev) => prev + finalTranscript)

      // Show interim results in real-time
      if (interimTranscript) {
        // Could show this in a separate "listening..." display
        console.log('Interim:', interimTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(`Error: ${event.error}`)
      stopRecording()
    }

    recognition.onend = () => {
      // Auto-restart if still recording and under max duration
      if (isRecording && duration < maxDuration) {
        recognition.start()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    setIsRecording(false)

    // Callback with transcript
    if (onTranscriptReady && transcript) {
      onTranscriptReady(transcript)
    }

    // Auto-save if enabled
    if (autoSave && transcript) {
      handleSave()
    }
  }

  const handleSave = async () => {
    if (!transcript.trim()) {
      alert('No transcript to save')
      return
    }

    setIsSaving(true)
    try {
      const note: VoiceNote = {
        id: crypto.randomUUID(),
        jobId,
        transcript: transcript.trim(),
        duration,
        createdAt: new Date().toISOString(),
      }

      if (onNoteRecorded) {
        await onNoteRecorded(note)
      }

      // Clear after save
      setTranscript('')
      setDuration(0)
    } catch (error) {
      console.error('Failed to save note:', error)
      alert('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTranscript('')
    setDuration(0)
    setError(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Voice Note</h3>
          {duration > 0 && (
            <p className="text-gray-400 text-sm">
              {formatDuration(duration)} / {formatDuration(maxDuration)}
            </p>
          )}
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-500 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="font-bold text-sm">RECORDING</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-gray-800 rounded-xl p-4 min-h-[120px] max-h-[240px] overflow-y-auto">
          <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-3">
        {!isRecording ? (
          /* Start Recording Button - 80px height */
          <button
            onClick={startRecording}
            disabled={!!error}
            className={cn(
              'w-full h-20 rounded-2xl',
              'flex items-center justify-center gap-4',
              'font-bold text-xl uppercase',
              'transition-all duration-150 active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            <Mic className="w-8 h-8" />
            START RECORDING
          </button>
        ) : (
          /* Stop Recording Button */
          <button
            onClick={stopRecording}
            className={cn(
              'w-full h-20 rounded-2xl',
              'flex items-center justify-center gap-4',
              'font-bold text-xl uppercase',
              'transition-all duration-150 active:scale-[0.98]',
              'bg-gray-700 hover:bg-gray-600 text-white'
            )}
          >
            <Square className="w-8 h-8" />
            STOP RECORDING
          </button>
        )}

        {/* Save and Cancel Buttons */}
        {transcript && !isRecording && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'h-14 rounded-xl',
                'flex items-center justify-center gap-2',
                'font-bold text-base',
                'transition-all duration-150 active:scale-[0.98]',
                'disabled:opacity-50',
                'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'SAVING...' : 'SAVE NOTE'}
            </button>

            <button
              onClick={handleCancel}
              disabled={isSaving}
              className={cn(
                'h-14 rounded-xl',
                'flex items-center justify-center gap-2',
                'font-bold text-base',
                'transition-all duration-150 active:scale-[0.98]',
                'disabled:opacity-50',
                'bg-gray-700 hover:bg-gray-600 text-white'
              )}
            >
              <X className="w-5 h-5" />
              CANCEL
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      {!isRecording && !transcript && !error && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 text-blue-300 text-sm">
          <div className="flex items-start gap-2">
            <Volume2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Speak clearly and at a normal pace</li>
                <li>Reduce background noise</li>
                <li>Hold phone close to your mouth</li>
                <li>Pause briefly between sentences</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export type { VoiceNoteRecorderProps }
