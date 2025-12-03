'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search
} from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface CSRStats {
  openConversations: number
  jobsCreated: number
  contactsCreated: number
  pendingFollowUps: number
  todayInteractions: number
}

interface RecentActivity {
  id: string
  type: 'conversation' | 'job' | 'contact'
  title: string
  description: string
  timestamp: string
  status?: string
}

export default function CSRDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<CSRStats>({
    openConversations: 0,
    jobsCreated: 0,
    contactsCreated: 0,
    pendingFollowUps: 0,
    todayInteractions: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const { isCSR, isOwner, isAdmin, loading: permissionsLoading } = usePermissions()

  const canAccessCSR = isCSR || isOwner || isAdmin

  useEffect(() => {
    if (!permissionsLoading && !canAccessCSR) {
      router.push('/inbox')
    }
  }, [canAccessCSR, permissionsLoading, router])

  useEffect(() => {
    if (canAccessCSR) {
      fetchDashboardData()
    }
  }, [canAccessCSR])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      // Fetch CSR-specific stats
      const [conversationsRes, jobsRes, contactsRes] = await Promise.all([
        fetch('/api/conversations?status=open'),
        fetch('/api/jobs?limit=10'),
        fetch('/api/contacts?limit=10'),
      ])

      const conversations = conversationsRes.ok ? await conversationsRes.json() : { conversations: [] }
      const jobs = jobsRes.ok ? await jobsRes.json() : { jobs: [] }
      const contacts = contactsRes.ok ? await contactsRes.json() : { contacts: [] }

      setStats({
        openConversations: conversations.conversations?.length || 0,
        jobsCreated: jobs.jobs?.length || 0,
        contactsCreated: contacts.contacts?.length || 0,
        pendingFollowUps: 0, // TODO: Calculate from conversations
        todayInteractions: conversations.conversations?.filter((c: any) => {
          const today = new Date().toDateString()
          return new Date(c.last_message_at).toDateString() === today
        }).length || 0,
      })

      // Build recent activity
      const activities: RecentActivity[] = []
      
      conversations.conversations?.slice(0, 5).forEach((conv: any) => {
        activities.push({
          id: conv.id,
          type: 'conversation',
          title: conv.subject || 'No subject',
          description: `From ${conv.contact?.first_name || 'Unknown'}`,
          timestamp: conv.last_message_at,
          status: conv.status,
        })
      })

      jobs.jobs?.slice(0, 3).forEach((job: any) => {
        activities.push({
          id: job.id,
          type: 'job',
          title: job.description || 'No description',
          description: `Status: ${job.status}`,
          timestamp: job.created_at,
          status: job.status,
        })
      })

      setRecentActivity(activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10))
    } catch (error) {
      console.error('Error fetching CSR dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'conversation':
        return <Mail className="w-4 h-4" />
      case 'job':
        return <Briefcase className="w-4 h-4" />
      case 'contact':
        return <Users className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return { bg: '#EBF0FF', text: '#4B79FF', border: 'rgba(75, 121, 255, 0.2)' }
      case 'closed':
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      case 'scheduled':
        return { bg: '#FFF4E8', text: '#FFA24D', border: 'rgba(255, 162, 77, 0.2)' }
      case 'completed':
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      default:
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
    }
  }

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    )
  }

  if (!canAccessCSR) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Access Denied</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">CSR Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Customer service overview and quick actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Open Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.openConversations}
            </div>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2"
              onClick={() => router.push('/inbox')}
            >
              View All →
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Jobs Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.jobsCreated}
            </div>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2"
              onClick={() => router.push('/jobs')}
            >
              View All →
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.contactsCreated}
            </div>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2"
              onClick={() => router.push('/contacts')}
            >
              View All →
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today's Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.todayInteractions}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Follow Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {stats.pendingFollowUps}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common customer service tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/contacts')}
            >
              <Users className="w-6 h-6" />
              <span>Add Contact</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/jobs')}
            >
              <Briefcase className="w-6 h-6" />
              <span>Create Job</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/inbox')}
            >
              <Mail className="w-6 h-6" />
              <span>View Conversations</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest conversations, jobs, and contacts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading activity...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-subtle)]" />
              <p className="text-lg font-medium mb-2">No recent activity</p>
              <p className="text-sm">Activity will appear here as you work</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const statusColors = activity.status ? getStatusColor(activity.status) : null
                return (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-[var(--card-bg-hover)] transition-colors cursor-pointer"
                    onClick={() => {
                      if (activity.type === 'conversation') {
                        router.push(`/inbox?conversation=${activity.id}`)
                      } else if (activity.type === 'job') {
                        router.push(`/jobs?id=${activity.id}`)
                      } else if (activity.type === 'contact') {
                        router.push(`/contacts?id=${activity.id}`)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[var(--color-text-primary)]">
                          {activity.title}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {activity.description}
                        </div>
                        <div className="text-xs text-[var(--color-text-subtle)] mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {statusColors && (
                      <Badge
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          borderColor: statusColors.border,
                          borderWidth: '1px',
                        }}
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

