'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Save, X, Pause, Play, ArrowLeft, Loader2, FileText, CheckCircle, TrendingUp, AlertCircle, Sparkles, Brain, Target, MessageSquare, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface RealtimeInsight {
  type: string
  content: string
  timestamp: string
}

export default function QuickRecordPage() {
  const router = useRouter()

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  const [realtimeAIEnabled, setRealtimeAIEnabled] = useState(false)
  const [realtimeInsights, setRealtimeInsights] = useState<RealtimeInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null)

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
          setMicPermission('denied')
          alert('Microphone access denied. Please enable it in browser settings.')
        }
      }

      recognitionRef.current.onend = () => {
        if (isRecording && !isPaused) {
          recognitionRef.current?.start()
        }
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (analysisTimerRef.current) clearInterval(analysisTimerRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (realtimeAIEnabled && isRecording && !isPaused && transcript.length > lastAnalyzedLength + 200) {
      triggerRealtimeAnalysis()
    }
  }, [transcript, realtimeAIEnabled, isRecording, isPaused])

  const triggerRealtimeAnalysis = async () => {
    if (isAnalyzing || transcript.length < 100) return

    setIsAnalyzing(true)
    setLastAnalyzedLength(transcript.length)

    const analysisTypes = ['sentiment', 'key_points', 'objections', 'opportunities']
    const randomType = analysisTypes[Math.floor(Math.random() * analysisTypes.length)]

    try {
      const res = await fetch('/api/meetings/analyze-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.slice(-500),
          analysisType: randomType
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.insights) {
          setRealtimeInsights(prev => [
            {
              type: randomType,
              content: data.insights,
              timestamp: new Date().toISOString()
            },
            ...prev.slice(0, 4)
          ])
        }
      }
    } catch (error) {
      console.error('Real-time analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      recognitionRef.current.start()
      setIsRecording(true)
      setMicPermission('granted')
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check microphone permissions.')
    }
  }

  const pauseRecording = () => {
    recognitionRef.current?.stop()
    setIsPaused(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resumeRecording = () => {
    recognitionRef.current?.start()
    setIsPaused(false)
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
    setIsPaused(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const saveAndAnalyze = async () => {
    if (!transcript.trim()) {
      alert('No transcript to save')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Quick Recording - ${new Date().toLocaleString()}`,
          transcript,
          scheduledAt: new Date().toISOString(),
          meetingType: 'quick_record'
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.meeting?.analysis) {
          setAnalysis(data.meeting.analysis)
        }
        alert('Meeting saved successfully!')
        setTimeout(() => router.push('/sales/meetings'), 2000)
      } else {
        alert('Failed to save meeting')
      }
    } catch (error) {
      console.error('Failed to save meeting:', error)
      alert('Failed to save meeting')
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'sentiment': return <TrendingUp className="w-4 h-4" />
      case 'key_points': return <Target className="w-4 h-4" />
      case 'objections': return <AlertCircle className="w-4 h-4" />
      case 'opportunities': return <Lightbulb className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'sentiment': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'key_points': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'objections': return 'bg-red-100 text-red-800 border-red-300'
      case 'opportunities': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/sales/meetings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Meetings
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-theme-primary">Quick Recording</h1>
            <p className="text-xs text-theme-secondary">
              Record and transcribe with AI analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <Switch
              id="realtime-ai"
              checked={realtimeAIEnabled}
              onCheckedChange={setRealtimeAIEnabled}
            />
            <Label htmlFor="realtime-ai" className="text-sm font-semibold cursor-pointer flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Real-time AI Insights
              {realtimeAIEnabled && (
                <Badge className="bg-purple-600 text-white">ON</Badge>
              )}
            </Label>
          </div>
          <span className="text-2xl font-mono font-bold text-theme-primary">
            {formatDuration(duration)}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {micPermission === 'denied' && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900">Microphone Access Denied</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Please enable microphone access in your browser settings to use this feature.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-theme-border">
              <CardHeader>
                <CardTitle>Recording Controls</CardTitle>
                <CardDescription>
                  Click Start Recording to begin transcribing your meeting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4 py-8">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white h-16 px-8 text-lg"
                    >
                      <Mic className="w-6 h-6 mr-3" />
                      START RECORDING
                    </Button>
                  ) : (
                    <>
                      {isPaused ? (
                        <Button
                          onClick={resumeRecording}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white h-16 px-8"
                        >
                          <Play className="w-6 h-6 mr-2" />
                          RESUME
                        </Button>
                      ) : (
                        <Button
                          onClick={pauseRecording}
                          size="lg"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white h-16 px-8"
                        >
                          <Pause className="w-6 h-6 mr-2" />
                          PAUSE
                        </Button>
                      )}
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        variant="outline"
                        className="h-16 px-8 border-2"
                      >
                        <MicOff className="w-6 h-6 mr-2" />
                        STOP
                      </Button>
                    </>
                  )}
                </div>

                {isRecording && (
                  <div className="flex items-center justify-center gap-2 text-red-600 animate-pulse">
                    <div className="w-3 h-3 bg-red-600 rounded-full" />
                    <span className="font-semibold">Recording in progress...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {transcript && (
              <Card className="border-theme-border">
                <CardHeader>
                  <CardTitle>Live Transcript</CardTitle>
                  <CardDescription>
                    Real-time transcription of your meeting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-theme-primary whitespace-pre-wrap leading-relaxed">
                      {transcript}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={saveAndAnalyze}
                      disabled={saving || isRecording}
                      className="bg-[#4B79FF] hover:bg-[#3366FF] text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          SAVE & ANALYZE WITH AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-green-900">AI Analysis Complete</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.summary && (
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Summary
                      </h3>
                      <p className="text-green-800">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis.actionItems && analysis.actionItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Action Items
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-green-800">
                        {analysis.actionItems.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.sentiment && (
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Sentiment
                      </h3>
                      <p className="text-green-800">{analysis.sentiment}</p>
                    </div>
                  )}

                  {analysis.nextSteps && (
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Next Steps</h3>
                      <p className="text-green-800">{analysis.nextSteps}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="border-theme-border sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Insights
                  </CardTitle>
                  {isAnalyzing && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  )}
                </div>
                <CardDescription>
                  {realtimeAIEnabled ? 'Live analysis during recording' : 'Enable real-time insights above'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!realtimeAIEnabled && (
                  <div className="text-center py-8 text-theme-secondary">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium mb-2">
                      Real-time AI Insights Disabled
                    </p>
                    <p className="text-xs">
                      Toggle the switch in the header to enable live AI analysis during your meeting
                    </p>
                  </div>
                )}

                {realtimeAIEnabled && !isRecording && (
                  <div className="text-center py-8 text-purple-600">
                    <Brain className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                    <p className="text-sm font-medium mb-2">
                      AI Ready
                    </p>
                    <p className="text-xs text-theme-secondary">
                      Start recording to begin receiving live insights
                    </p>
                  </div>
                )}

                {realtimeAIEnabled && isRecording && realtimeInsights.length === 0 && (
                  <div className="text-center py-8 text-theme-secondary">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-purple-400 animate-pulse" />
                    <p className="text-sm font-medium mb-2 text-purple-600">
                      Listening...
                    </p>
                    <p className="text-xs">
                      Insights will appear as you speak (after ~30 seconds of conversation)
                    </p>
                  </div>
                )}

                {realtimeAIEnabled && realtimeInsights.length > 0 && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {realtimeInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {getInsightIcon(insight.type)}
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed mt-2">
                          {insight.content}
                        </p>
                        <p className="text-xs opacity-60 mt-2">
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
