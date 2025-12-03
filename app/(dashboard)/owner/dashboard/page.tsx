'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Users, Star, TrendingUp, AlertTriangle, BarChart3, Calendar, Settings, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Stats {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  jobsToday: number
  jobsCompleted: number
  avgRating: number
  reviewsCollected: number
  techsActive: number
  techsTotal: number
  alerts: Array<{
    id: string
    type: string
    message: string
    severity: 'info' | 'warning' | 'critical'
  }>
}

interface TechStatus {
  id: string
  name: string
  status: 'idle' | 'en_route' | 'on_job' | 'offline'
  currentJob?: string
}

function StatCard({ title, value, change, changeType, borderColor }: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  borderColor: string
}) {
  return (
    <Card className={`border-l ${borderColor} border-theme-border`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-theme-secondary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-theme-primary">{value}</div>
        {change && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            changeType === 'positive' && "text-theme-accent-secondary",
            changeType === 'negative' && "text-red-500",
            changeType === 'neutral' && "text-theme-secondary"
          )}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<Stats>({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    jobsToday: 0,
    jobsCompleted: 0,
    avgRating: 0,
    reviewsCollected: 0,
    techsActive: 0,
    techsTotal: 0,
    alerts: [],
  })
  const [techs, setTechs] = useState<TechStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/owner/stats')
        if (res.ok && isMounted) {
          const data = await res.json()
          setStats(data.stats || stats)
          setTechs(data.techs || [])
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const filteredTechs = techs.filter(tech =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_job': return 'bg-ops-accentSoft text-ops-accent border border-ops-accent'
      case 'en_route': return 'bg-blue-100 text-blue-700 border border-blue-300'
      case 'idle': return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      default: return 'bg-gray-100 text-gray-500 border border-gray-300'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Owner Dashboard</h1>
          <p className="text-xs text-theme-secondary">
            Business overview and team management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
          >
            <Link href="/reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </Link>
          </Button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="px-4 py-4">
        <Card className="border-theme-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-accent-primary" />
                <Input
                  placeholder="Search team members..."
                  className="pl-10 border-theme-border bg-theme-input text-theme-primary placeholder:text-theme-secondary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="border-theme-border text-theme-primary hover:bg-theme-surface"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Today's Revenue"
            value={`$${stats.todayRevenue.toLocaleString()}`}
            change="+12% from yesterday"
            changeType="positive"
            borderColor="border-l-theme-accent-secondary"
          />
          <StatCard
            title="Week Revenue"
            value={`$${stats.weekRevenue.toLocaleString()}`}
            change="+8% from last week"
            changeType="positive"
            borderColor="border-l-theme-accent-primary"
          />
          <StatCard
            title="Avg Rating"
            value={stats.avgRating.toFixed(1)}
            change={`${stats.reviewsCollected} reviews`}
            changeType="neutral"
            borderColor="border-l-orange-500"
          />
          <StatCard
            title="Team Active"
            value={`${stats.techsActive}/${stats.techsTotal}`}
            change="All systems operational"
            changeType="positive"
            borderColor="border-l-theme-accent-secondary"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        {/* Team Status */}
        <section className="flex-1 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-card overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="h-full flex flex-col">
            <CardHeader className="border-b border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <CardTitle className="text-ops-text">Team Status</CardTitle>
              <CardDescription className="text-ops-textMuted">Current team activity</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-ops-surfaceSoft border-ops-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-12 w-12 rounded-full bg-ops-bg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 bg-ops-bg" />
                            <Skeleton className="h-3 w-24 bg-ops-bg" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTechs.length === 0 ? (
                <Card className="m-4 border-0 bg-transparent">
                  <CardContent className="py-12 text-center">
                    <p className="text-ops-textMuted font-medium">No team members found</p>
                    <p className="text-sm text-ops-textMuted mt-1">
                      {searchQuery ? 'Try a different search term' : 'Add team members to get started'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTechs.map((tech) => (
                      <Card
                        key={tech.id}
                        className={cn(
                          "hover:shadow-card transition-all border-2 bg-theme-surface",
                          "border-theme-border hover:border-theme-accent-primary"
                        )}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="text-ops-accent bg-ops-accentSoft">
                                {tech.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="text-base text-ops-text">{tech.name}</CardTitle>
                              <Badge
                                variant="secondary"
                                className={cn("mt-1", getStatusBadge(tech.status))}
                              >
                                {tech.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {tech.currentJob && (
                            <div className="flex items-center gap-2 text-sm text-ops-textMuted">
                              <BarChart3 className="w-4 h-4 text-ops-accent" />
                              <span className="truncate">{tech.currentJob}</span>
                            </div>
                          )}
                          <div className="pt-2 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-ops-border text-ops-text hover:bg-ops-surface"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 bg-ops-accent hover:bg-ops-accent/90 text-black"
                            >
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </section>

        {/* Sidebar */}
        <section className="w-80 ml-4 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-lg shadow-card transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="p-4">
            <h3 className="font-semibold text-ops-text mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/reports" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <BarChart3 className="w-4 h-4 mr-2 text-ops-accent" />
                  Reports
                </Button>
              </Link>
              <Link href="/calendar" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <Calendar className="w-4 h-4 mr-2 text-ops-accent" />
                  Schedule
                </Button>
              </Link>
              <Link href="/jobs" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <DollarSign className="w-4 h-4 mr-2 text-ops-accent" />
                  Revenue
                </Button>
              </Link>
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full justify-start border-ops-border text-ops-text hover:bg-ops-surface">
                  <Settings className="w-4 h-4 mr-2 text-ops-accent" />
                  Settings
                </Button>
              </Link>
            </div>

            {/* Alerts Section */}
            {stats.alerts.length > 0 && (
              <div className="mt-6 pt-4 border-t border-ops-border">
                <h3 className="font-semibold text-ops-text mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-ops-warning" />
                  Alerts ({stats.alerts.length})
                </h3>
                <div className="space-y-2">
                  {stats.alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="text-sm text-ops-textMuted flex items-start gap-2">
                      <span className="text-ops-warning mt-0.5">•</span>
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Section */}
            <div className="mt-6 pt-4 border-t border-ops-border">
              <h3 className="font-semibold text-ops-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Today's Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ops-textMuted">Jobs Completed</span>
                  <span className="text-ops-text font-medium">{stats.jobsCompleted}/{stats.jobsToday}</span>
                </div>
                <div className="h-2 bg-ops-surfaceSoft rounded-full overflow-hidden border border-ops-border">
                  <div
                    className="h-full bg-ops-accent transition-all duration-500"
                    style={{ width: `${stats.jobsToday > 0 ? (stats.jobsCompleted / stats.jobsToday) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
