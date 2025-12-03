'use client'

import { useState, useEffect } from 'react'
import { Map, Briefcase, Clock, UserCheck, Phone, MessageSquare, Calendar, TrendingUp, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TechDashboardStats {
  jobsToday: number
  jobsCompleted: number
  jobsRemaining: number
  avgDuration: string
  onTimeRate: number
  customerSatisfaction: number
}

interface Job {
  id: string
  description: string
  status: string
  scheduledStart: string
  contact: {
    firstName: string
    lastName: string
    address: string
    phone: string
  }
}

export default function TechDashboard() {
  const [stats, setStats] = useState<TechDashboardStats | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsRes = await fetch('/api/tech/dashboard/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
      
      // Fetch today's jobs
      const jobsRes = await fetch('/api/tech/jobs')
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Tech Dashboard</h1>
        <p className="text-[var(--color-text-secondary)]">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/tech/jobs">
          <Card className="p-6 hover:shadow-card-hover transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-accent-primary)]/20">
                <Briefcase className="w-6 h-6 text-[var(--color-accent-primary)]" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.jobsToday || 0}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Jobs Today</div>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.jobsCompleted || 0}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Completed</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.onTimeRate || 0}%</div>
              <div className="text-sm text-[var(--color-text-secondary)]">On-time Rate</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.customerSatisfaction || 0}/5</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Satisfaction</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Today's Jobs</h2>
            <Link href="/jobs" className="text-[var(--color-accent-primary)] hover:underline">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <Link key={job.id} href={`/tech/jobs/${job.id}`}>
                <Card className="p-4 hover:shadow-card-hover transition-all duration-200 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold">{job.contact.firstName} {job.contact.lastName}</div>
                      <div className="text-[var(--color-text-secondary)] text-sm mt-1">{job.description}</div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 text-[var(--color-text-subtle)]">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(job.scheduledStart)}</span>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          job.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          job.status === 'in_progress' ? 'bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/30' :
                          job.status === 'en_route' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-[var(--color-bg-surface)]/50 text-[var(--color-text-subtle)] border-[var(--color-border)]'
                        }`}>
                          {job.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {jobs.length === 0 && (
              <Card className="text-center py-8">
                <div className="text-[var(--color-text-subtle)]">
                  No jobs scheduled for today
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/dispatch/map')}
              className="p-6 bg-[var(--color-bg-secondary)] rounded-xl hover:shadow-card-hover transition-all duration-200 text-left"
            >
              <div className="flex flex-col items-center">
                <Map className="w-8 h-8 text-[var(--color-accent-primary)] mb-2" />
                <span className="font-medium">View Map</span>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/jobs')}
              className="p-6 bg-[var(--color-bg-secondary)] rounded-xl hover:shadow-card-hover transition-all duration-200 text-left"
            >
              <div className="flex flex-col items-center">
                <Briefcase className="w-8 h-8 text-[var(--color-accent-primary)] mb-2" />
                <span className="font-medium">All Jobs</span>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/inbox')}
              className="p-6 bg-[var(--color-bg-secondary)] rounded-xl hover:shadow-card-hover transition-all duration-200 text-left"
            >
              <div className="flex flex-col items-center">
                <MessageSquare className="w-8 h-8 text-[var(--color-accent-primary)] mb-2" />
                <span className="font-medium">Messages</span>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/tech/jobs/request')}
              className="p-6 bg-[var(--color-bg-secondary)] rounded-xl hover:shadow-card-hover transition-all duration-200 text-left"
            >
              <div className="flex flex-col items-center">
                <Briefcase className="w-8 h-8 text-[var(--color-accent-primary)] mb-2" />
                <span className="font-medium">Request Job</span>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/estimates?create=true')}
              className="p-6 bg-[var(--color-bg-secondary)] rounded-xl hover:shadow-card-hover transition-all duration-200 text-left"
            >
              <div className="flex flex-col items-center">
                <FileText className="w-8 h-8 text-[var(--color-accent-primary)] mb-2" />
                <span className="font-medium">Create Estimate</span>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/calendar')}
              className="p-6 bg-[var(--color-bg-secondary)] rounded-xl hover:shadow-card-hover transition-all duration-200 text-left"
            >
              <div className="flex flex-col items-center">
                <Calendar className="w-8 h-8 text-[var(--color-accent-primary)] mb-2" />
                <span className="font-medium">Calendar</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}