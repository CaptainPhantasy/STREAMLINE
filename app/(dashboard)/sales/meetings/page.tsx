'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Mic, User, Clock, MapPin, FileText, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Meeting {
  id: string
  title: string
  contactId: string
  contactName: string
  location: string
  scheduledAt: string
  meetingType: string
  transcript?: string
  analysis?: {
    summary?: string
    actionItems?: string[]
    sentiment?: string
    nextSteps?: string
  }
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const router = useRouter()

  useEffect(() => {
    fetchMeetings()
  }, [filter])

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`/api/meetings?filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }

  const getMeetingStatus = (scheduledAt: string, transcript?: string) => {
    const now = new Date()
    const meetingDate = new Date(scheduledAt)
    
    if (transcript) return 'completed'
    if (meetingDate > now) return 'upcoming'
    return 'missed'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-accent-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-theme-primary">Meetings</h1>
          <p className="text-sm text-theme-secondary mt-1">
            Manage your sales meetings with AI-powered transcription and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/sales/meetings/record')}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
          <Button asChild className="bg-[#4B79FF] hover:bg-[#3366FF] text-white">
            <Link href="/sales/meetings/new">
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-[#4B79FF] hover:bg-[#3366FF]' : ''}
        >
          All Meetings
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
          className={filter === 'upcoming' ? 'bg-[#4B79FF] hover:bg-[#3366FF]' : ''}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-[#4B79FF] hover:bg-[#3366FF]' : ''}
        >
          Completed
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No meetings found</h3>
          <p className="text-theme-secondary mb-4">
            Start by scheduling a new meeting with a contact
          </p>
          <Button asChild className="bg-[#4B79FF] hover:bg-[#3366FF] text-white">
            <Link href="/sales/meetings/new">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => {
            const { date, time } = formatDateTime(meeting.scheduledAt)
            const status = getMeetingStatus(meeting.scheduledAt, meeting.transcript)
            
            return (
              <Card
                key={meeting.id}
                className="hover:shadow-card-hover transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/sales/meetings/${meeting.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-theme-primary">
                          {meeting.title || `Meeting with ${meeting.contactName}`}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            status === 'completed'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : status === 'upcoming'
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {status === 'completed' ? '✓ Completed' : status === 'upcoming' ? '→ Upcoming' : '⊗ Missed'}
                        </span>
                        {meeting.transcript && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                            <Mic className="w-3 h-3 inline mr-1" />
                            AI Analyzed
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm text-theme-secondary mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{meeting.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                        </div>
                      </div>

                      {meeting.location && (
                        <div className="flex items-center gap-2 text-sm text-theme-secondary mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{meeting.location}</span>
                        </div>
                      )}

                      {meeting.analysis?.summary && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-sm">AI Summary</span>
                          </div>
                          <p className="text-sm text-theme-secondary line-clamp-2">
                            {meeting.analysis.summary}
                          </p>
                          {meeting.analysis.actionItems && meeting.analysis.actionItems.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                              <TrendingUp className="w-3 h-3" />
                              <span>{meeting.analysis.actionItems.length} action items identified</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-theme-accent-primary/20 text-theme-accent-primary border border-[#4B79FF]/30">
                        {meeting.meetingType}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
