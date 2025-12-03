'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Mic, MicOff, Save, Upload, Image as ImageIcon, Trash2, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface VoiceNote {
  id: string
  audioUrl: string
  transcript?: string
  duration: number
  createdAt: string
}

interface Photo {
  id: string
  url: string
  caption?: string
  createdAt: string
}

interface Job {
  id: string
  title: string
  customerName: string
  address: string
  status: string
  description: string
  notes?: string
}

export default function TechJobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [notes, setNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [saving, setSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchJob()
    fetchVoiceNotes()
    fetchPhotos()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (res.ok) {
        const data = await res.json()
        setJob(data.job)
        setNotes(data.job.notes || '')
      }
    } catch (error) {
      console.error('Failed to fetch job:', error)
    }
  }

  const fetchVoiceNotes = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/voice-notes`)
      if (res.ok) {
        const data = await res.json()
        setVoiceNotes(data.voiceNotes || [])
      }
    } catch (error) {
      console.error('Failed to fetch voice notes:', error)
    }
  }

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/photos`)
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadVoiceNote(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const uploadVoiceNote = async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice-note.webm')
    formData.append('jobId', jobId)
    formData.append('duration', recordingDuration.toString())

    try {
      const res = await fetch('/api/jobs/voice-notes', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchVoiceNotes()
      }
    } catch (error) {
      console.error('Failed to upload voice note:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('photos', file)
    })
    formData.append('jobId', jobId)

    try {
      const res = await fetch('/api/jobs/photos', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to upload photos:', error)
    }
  }

  const saveNotes = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (res.ok) {
        alert('Notes saved successfully')
      }
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-accent-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/tech/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-theme-primary">{job.title}</h1>
            <p className="text-xs text-theme-secondary">{job.customerName} - {job.address}</p>
          </div>
        </div>
        <Badge className="bg-theme-accent-primary text-black font-semibold">
          {job.status}
        </Badge>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-theme-border">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Service information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-theme-secondary">{job.description}</p>
            </CardContent>
          </Card>

          <Card className="border-theme-border">
            <CardHeader>
              <CardTitle>Tech Notes</CardTitle>
              <CardDescription>Add your observations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter your notes here..."
                className="min-h-[100px] border-theme-border bg-theme-input text-theme-primary"
              />
              <Button
                onClick={saveNotes}
                disabled={saving}
                className="w-full bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-theme-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Notes
            </CardTitle>
            <CardDescription>Record audio notes for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-lg font-mono font-bold text-theme-primary">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {voiceNotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-theme-primary">Recorded Notes</h4>
                {voiceNotes.map((note) => (
                  <Card key={note.id} className="bg-theme-surface border-theme-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-theme-accent-primary/20 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-theme-accent-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-theme-primary">
                              Voice Note - {formatDuration(note.duration)}
                            </p>
                            <p className="text-xs text-theme-secondary">
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <audio controls src={note.audioUrl} className="h-10" />
                      </div>
                      {note.transcript && (
                        <p className="mt-3 text-sm text-theme-secondary border-t border-theme-border pt-3">
                          {note.transcript}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-theme-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Job Photos
            </CardTitle>
            <CardDescription>Upload photos of the work site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button asChild className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos
                </label>
              </Button>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Job photo'}
                      className="w-full h-48 object-cover rounded-lg border-2 border-theme-border"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(photo.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
