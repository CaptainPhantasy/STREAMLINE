'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Save, X, User, Pause, Play, ArrowLeft, Loader2, FileText, CheckCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MeetingRecordingPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string
  const isNewMeeting = meetingId === 'new'

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [contact, setContact] = useState<{ id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' '
          } else {
            interimTranscript += result[0].transcript
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable it in browser settings.')
        }
      }

      recognitionRef.current.onend = () => {
        if (isRecording && !isPaused) {
          recognitionRef.current?.start()
        }
      }
    }

    if (!isNewMeeting) {
      fetchMeeting()
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`)
      if (res.ok) {
        const data = await res.json()
        setContact(data.meeting?.contact)
        if (data.meeting?.transcript) {
          setTranscript(data.meeting.transcript)
        }
        if (data.meeting?.analysis) {
          setAnalysis(data.meeting.analysis)
        }
      }
    } catch (error) {
      console.error('Failed to fetch meeting:', error)
    }
  }

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser')
      return
    }

    setIsRecording(true)
    setIsPaused(false)
    recognitionRef.current.start()
    
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)
  }

  const pauseRecording = () => {
    setIsPaused(true)
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resumeRecording = () => {
    setIsPaused(false)
    recognitionRef.current?.start()
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const saveMeeting = async () => {
    if (!transcript.trim()) {
      alert('No transcript to save')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact?.id,
          transcript,
          meetingType: 'in_person',
          durationMinutes: Math.ceil(duration / 60),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        alert('Meeting saved and analyzed successfully!')
        router.push('/sales/meetings')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save meeting. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/sales/meetings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Meetings
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-theme-primary">
              {isRecording ? (isPaused ? 'Recording Paused' : 'Recording Meeting') : 'Meeting Recording'}
            </h1>
            {contact && (
              <p className="text-sm text-theme-secondary mt-1">
                Meeting with {contact.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-theme-accent-primary">
              {formatTime(duration)}
            </div>
            <div className="text-xs text-theme-secondary">Duration</div>
          </div>
          <div className={`w-4 h-4 rounded-full ${
            isRecording
              ? isPaused
                ? 'bg-yellow-500'
                : 'bg-red-500 animate-pulse'
              : 'bg-gray-400'
          }`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Live Transcript
            </CardTitle>
            <CardDescription>
              Real-time transcription of your meeting conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto border-2 border-gray-200">
              {transcript ? (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                  {transcript}
                </p>
              ) : (
                <p className="text-gray-400 text-center py-12">
                  {isRecording
                    ? 'Listening... Start speaking to see the transcript appear here'
                    : 'Click START RECORDING to begin capturing the meeting'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recording Controls</CardTitle>
            <CardDescription>Manage your meeting recording</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
              >
                <Mic className="w-6 h-6 mr-2" />
                START RECORDING
              </Button>
            ) : (
              <div className="space-y-3">
                {isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    RESUME
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    className="w-full h-16 text-lg bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Pause className="w-6 h-6 mr-2" />
                    PAUSE
                  </Button>
                )}
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="w-full h-16 text-lg"
                >
                  <MicOff className="w-6 h-6 mr-2" />
                  STOP RECORDING
                </Button>
              </div>
            )}

            {transcript && !isRecording && (
              <Button
                onClick={saveMeeting}
                disabled={saving}
                className="w-full h-16 text-lg bg-[#4B79FF] hover:bg-[#3366FF] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6 mr-2" />
                    SAVE & ANALYZE WITH AI
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <CheckCircle className="w-5 h-5" />
                AI Analysis Results
              </CardTitle>
              <CardDescription>
                Intelligent insights from your meeting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.summary && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-purple-900">Summary</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
                </div>
              )}

              {analysis.actionItems && analysis.actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-purple-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Action Items ({analysis.actionItems.length})
                  </h4>
                  <ul className="space-y-2">
                    {analysis.actionItems.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="font-semibold text-purple-600">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.sentiment && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-purple-900">Sentiment</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    analysis.sentiment === 'positive'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : analysis.sentiment === 'negative'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}>
                    {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
                  </span>
                </div>
              )}

              {analysis.nextSteps && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-purple-900">Next Steps</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.nextSteps}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
