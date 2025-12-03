'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, User, Clock, Plus, Search, Filter, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Meeting {
  id: string
  title: string
  contactId: string
  contactName: string
  location: string
  scheduledAt: string
  meetingType: string
}

function StatCard({ title, value, change, changeType, borderColor }: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  borderColor: string
}) {
  return (
    <Card className={`border-l ${borderColor} border-ops-border bg-ops-surface`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-ops-textMuted">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-ops-text">{value}</div>
        {change && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            changeType === 'positive' && "text-ops-accent",
            changeType === 'negative' && "text-red-500",
            changeType === 'neutral' && "text-ops-textMuted"
          )}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function SalesDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalMeetings: 0,
    completedToday: 0,
    conversionRate: 0
  })

  useEffect(() => {
    let isMounted = true

    const fetchTodaysMeetings = async () => {
      try {
        const res = await fetch('/api/meetings?today=true')
        if (res.ok && isMounted) {
          const data = await res.json()
          const meetingsData = data.meetings || []
          setMeetings(meetingsData)

          const now = new Date()
          const upcoming = meetingsData.find((m: Meeting) =>
            new Date(m.scheduledAt) > now
          )
          setNextMeeting(upcoming || meetingsData[0] || null)

          setStats({
            totalMeetings: meetingsData.length,
            completedToday: meetingsData.filter((m: Meeting) => new Date(m.scheduledAt) < now).length,
            conversionRate: 68
          })
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch meetings:', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTodaysMeetings()

    return () => {
      isMounted = false
    }
  }, [])

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-ops-border px-4 py-3 bg-ops-surface">
        <div>
          <h1 className="text-lg font-semibold text-ops-text">Sales Dashboard</h1>
          <p className="text-xs text-ops-textMuted">
            Your meetings and leads for today
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-ops-accent hover:bg-ops-accent/90 text-black"
          >
            <Link href="/contacts/new">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Link>
          </Button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="px-4 py-4">
        <Card className="border-ops-border bg-ops-surface">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ops-accent" />
                <Input
                  placeholder="Search meetings..."
                  className="pl-10 border-ops-border bg-ops-input text-ops-text placeholder:text-ops-textMuted"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                asChild
                className="bg-ops-accent hover:bg-ops-accent/90 text-black"
              >
                <Link href="/sales/meetings">
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Meetings
                </Link>
              </Button>
              <Button
                asChild
                className="bg-ops-accent hover:bg-ops-accent/90 text-black"
              >
                <Link href="/sales/meetings/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Meeting
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Today's Meetings"
            value={stats.totalMeetings}
            change="+3 from yesterday"
            changeType="positive"
            borderColor="border-l-ops-accent"
          />
          <StatCard
            title="Completed"
            value={stats.completedToday}
            change={`${stats.totalMeetings > 0 ? Math.round((stats.completedToday / stats.totalMeetings) * 100) : 0}% done`}
            changeType="positive"
            borderColor="border-l-ops-accent"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            change="+5% this month"
            changeType="positive"
            borderColor="border-l-ops-warning"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        {/* Meetings List */}
        <section className="flex-1 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-card overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="h-full flex flex-col">
            <CardHeader className="border-b border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <CardTitle className="text-ops-text">Today's Schedule</CardTitle>
              <CardDescription className="text-ops-textMuted">All meetings for today</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-ops-surfaceSoft border-ops-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-12 w-12 rounded-full bg-ops-bg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 bg-ops-bg" />
                            <Skeleton className="h-3 w-24 bg-ops-bg" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-full mb-2 bg-ops-bg" />
                        <Skeleton className="h-8 w-full bg-ops-bg" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMeetings.length === 0 ? (
                <Card className="m-4 border-0 bg-transparent">
                  <CardContent className="py-12 text-center">
                    <p className="text-ops-textMuted font-medium">No meetings found</p>
                    <p className="text-sm text-ops-textMuted mt-1">
                      {searchQuery ? 'Try a different search term' : 'No meetings scheduled for today'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-4 space-y-4">
                  {filteredMeetings.map((meeting) => (
                    <Card
                      key={meeting.id}
                      className={cn(
                        "hover:shadow-card transition-all border-2 bg-theme-surface",
                        "border-theme-border hover:border-theme-accent-primary"
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-ops-accentSoft flex items-center justify-center">
                              <User className="w-6 h-6 text-ops-accent" />
                            </div>
                            <div>
                              <CardTitle className="text-base text-ops-text">{meeting.title}</CardTitle>
                              <p className="text-sm text-ops-textMuted">{meeting.contactName}</p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-ops-accentSoft text-ops-accent border border-ops-accent font-medium">
                            {meeting.meetingType}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-ops-textMuted">
                          <Calendar className="w-4 h-4 text-ops-accent" />
                          <span>{formatTime(meeting.scheduledAt)}</span>
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm text-ops-textMuted">
                            <MapPin className="w-4 h-4 text-ops-warning" />
                            <span className="truncate">{meeting.location}</span>
                          </div>
                        )}
                        <div className="pt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-ops-border text-ops-text hover:bg-ops-surface"
                            asChild
                          >
                            <Link href={`/meetings/${meeting.id}`}>View</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-ops-accent hover:bg-ops-accent/90 text-black"
                            asChild
                          >
                            <Link href={`/contacts/${meeting.contactId}`}>Contact</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </section>

        {/* Sidebar */}
        <section className="w-80 ml-4 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-lg shadow-card transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="p-4">
            <h3 className="font-semibold text-ops-text mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/contacts" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <User className="w-4 h-4 mr-2 text-ops-accent" />
                  Contacts
                </Button>
              </Link>
              <Link href="/calendar" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <Calendar className="w-4 h-4 mr-2 text-ops-accent" />
                  Calendar
                </Button>
              </Link>
              <Link href="/analytics" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <TrendingUp className="w-4 h-4 mr-2 text-ops-accent" />
                  Analytics
                </Button>
              </Link>
            </div>

            {nextMeeting && (
              <div className="mt-6 pt-4 border-t border-ops-border">
                <h3 className="font-semibold text-ops-text mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Next Meeting
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-ops-text">{nextMeeting.title}</p>
                  <div className="flex items-center gap-2 text-ops-textMuted">
                    <User className="w-4 h-4" />
                    <span>{nextMeeting.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ops-textMuted">
                    <Calendar className="w-4 h-4" />
                    <span>{formatTime(nextMeeting.scheduledAt)}</span>
                  </div>
                  {nextMeeting.location && (
                    <div className="flex items-center gap-2 text-ops-textMuted">
                      <MapPin className="w-4 h-4" />
                      <span>{nextMeeting.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
