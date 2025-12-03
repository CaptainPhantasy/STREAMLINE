'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Briefcase, CheckCircle, Clock, TrendingUp, DollarSign, Plus, CheckSquare, User, MapPin, Calendar } from 'lucide-react'
import { Job } from '@/types'

interface JobsLayoutProps {
  jobs: Job[]
  loading: boolean
  stats: {
    total: number
    completed: number
    inProgress: number
    revenue: number
  }
  selectedJobIds: Set<string>
  bulkStatusUpdating: boolean
  onSelectAllJobs: () => void
  onToggleJobSelection: (jobId: string) => void
  onClearSelection: () => void
  onBulkStatusUpdate: (status: string) => void
  onViewJob: (jobId: string) => void
  onCreateJob: () => void
  onBulkAssign: () => void
  children?: ReactNode
}

function StatCard({ title, value, change, changeType, icon: Icon }: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-theme-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-theme-secondary">{title}</CardTitle>
        <Icon className="h-4 w-4 text-theme-accent-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-theme-primary">{value}</div>
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

export function JobsLayout({
  jobs,
  loading,
  stats,
  selectedJobIds,
  bulkStatusUpdating,
  onSelectAllJobs,
  onToggleJobSelection,
  onClearSelection,
  onBulkStatusUpdate,
  onViewJob,
  onCreateJob,
  onBulkAssign,
  children
}: JobsLayoutProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { bg: 'bg-ops-surface', text: 'text-ops-accent', border: 'border-ops-accent' }
      case 'in_progress':
        return { bg: 'bg-ops-surface', text: 'text-ops-accent', border: 'border-ops-accent' }
      case 'completed':
        return { bg: 'bg-ops-surface', text: 'text-ops-success', border: 'border-ops-success' }
      case 'en_route':
        return { bg: 'bg-ops-surface', text: 'text-ops-success', border: 'border-ops-success' }
      default:
        return { bg: 'bg-ops-surface', text: 'text-ops-textMuted', border: 'border-ops-border' }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Jobs</h1>
          <p className="text-xs text-theme-secondary">
            Manage work orders and schedules
          </p>
        </div>
        <div className="flex gap-2">
          {jobs.length > 0 && selectedJobIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-theme-secondary">{selectedJobIds.size} selected</span>
              <Select onValueChange={onBulkStatusUpdate} disabled={bulkStatusUpdating}>
                <SelectTrigger className="w-40 border-theme-border bg-theme-input text-theme-primary">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onBulkAssign}
                variant="outline"
                className="border-theme-border text-theme-primary hover:bg-theme-surface"
              >
                Assign Tech
              </Button>
              <Button
                onClick={onClearSelection}
                variant="ghost"
                size="sm"
                className="text-theme-secondary hover:bg-theme-surface hover:text-theme-primary"
              >
                Clear
              </Button>
            </div>
          )}
          {jobs.length > 0 && selectedJobIds.size === 0 && (
            <Button
              onClick={onBulkAssign}
              variant="outline"
              className="border-theme-border text-theme-primary hover:bg-theme-surface"
            >
              Bulk Assign
            </Button>
          )}
          <Button
            onClick={onCreateJob}
            className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Jobs"
            value={stats.total}
            change="+12%"
            changeType="positive"
            icon={Briefcase}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            change="75%"
            changeType="positive"
            icon={CheckCircle}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            change="Active"
            changeType="neutral"
            icon={Clock}
          />
          <StatCard
            title="Revenue"
            value={`$${(stats.revenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            change="+8%"
            changeType="positive"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        {/* Jobs List */}
        <section className="flex-1 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-card overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="h-full flex flex-col">
            <CardHeader className="border-b border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <CardTitle className="text-theme-primary">Recent Jobs</CardTitle>
              <CardDescription className="text-theme-secondary">View and manage your work orders</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-2 border-theme-border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-lg bg-theme-input" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48 bg-theme-input" />
                        <Skeleton className="h-3 w-32 bg-theme-input" />
                      </div>
                      <Skeleton className="h-8 w-20 bg-theme-input" />
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-theme-secondary">
                  No jobs found. Create your first job!
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {jobs.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b border-theme-border">
                      <Checkbox
                        checked={selectedJobIds.size === jobs.length && jobs.length > 0}
                        onCheckedChange={onSelectAllJobs}
                        className="border-theme-border"
                      />
                      <span className="text-sm text-theme-secondary">
                        {selectedJobIds.size > 0 ? `${selectedJobIds.size} selected` : 'Select all'}
                      </span>
                    </div>
                  )}
                  {jobs.map((job) => {
                    const colors = getStatusColor(job.status || 'lead')
                    return (
                      <div
                        key={job.id}
                        className={cn(
                          "flex items-center justify-between p-4 border-2 rounded-lg transition-all cursor-pointer",
                          selectedJobIds.has(job.id)
                            ? "border-theme-accent-primary bg-theme-accent-secondary/20 shadow-card"
                            : "border-theme-border hover:border-theme-accent-primary hover:bg-theme-surface"
                        )}
                        onClick={(e) => {
                          if (
                            e.target instanceof HTMLElement &&
                            !e.target.closest('button') &&
                            !e.target.closest('[role="checkbox"]')
                          ) {
                            onToggleJobSelection(job.id)
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Checkbox
                            checked={selectedJobIds.has(job.id)}
                            onCheckedChange={() => onToggleJobSelection(job.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="border-theme-border"
                          />
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-theme-surface border border-theme-border">
                            <User className="w-6 h-6 text-theme-accent-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-theme-primary">
                                {job.contact?.first_name} {job.contact?.last_name}
                              </h3>
                              <Badge
                                variant={
                                  job.status === 'completed' ? 'secondary' :
                                  job.status === 'in_progress' ? 'default' :
                                  job.status === 'en_route' ? 'default' : 'outline'
                                }
                                className={cn(
                                  "border",
                                  job.status === 'en_route' && "border-theme-accent-secondary text-theme-accent-secondary"
                                )}
                              >
                                {job.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-theme-secondary">
                              {job.contact?.address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-theme-accent-primary" />
                                  {job.contact.address}
                                </span>
                              )}
                              {job.scheduled_start && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-theme-accent-primary" />
                                  {new Date(job.scheduled_start).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {job.description && (
                              <p className="text-sm text-theme-secondary mt-1 truncate max-w-md">{job.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {job.total_amount && (
                            <div className="text-right">
                              <div className="font-semibold text-theme-primary flex items-center gap-1 justify-end">
                                <DollarSign className="w-4 h-4 text-theme-accent-secondary" />
                                {(job.total_amount / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-theme-secondary">Total</div>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-theme-border text-theme-primary hover:bg-theme-surface"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewJob(job.id)
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </div>
        </section>

        {/* Inspector Panel */}
        <section className="w-80 ml-4 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-lg shadow-card transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="p-4">
            <h3 className="font-semibold text-theme-primary mb-4">Job Details</h3>
            <div className="text-theme-secondary text-sm">
              Select a job to view details
            </div>
          </div>
        </section>
      </div>

      {/* Additional content (modals, etc.) */}
      {children}
    </div>
  )
}
