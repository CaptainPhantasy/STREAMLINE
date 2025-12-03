'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GripVertical, User, MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Job } from '@/types'

interface JobsKanbanViewProps {
  jobs: Job[]
  onJobClick?: (jobId: string) => void
  onStatusChange?: (jobId: string, newStatus: Job['status']) => Promise<void>
  loading?: boolean
}

const STATUS_COLUMNS: Array<{
  id: Job['status']
  label: string
  color: string
}> = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-100' },
  { id: 'en_route', label: 'En Route', color: 'bg-yellow-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-orange-100' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100' },
  { id: 'invoiced', label: 'Invoiced', color: 'bg-purple-100' },
  { id: 'paid', label: 'Paid', color: 'bg-emerald-100' },
]

export function JobsKanbanView({
  jobs,
  onJobClick,
  onStatusChange,
  loading = false,
}: JobsKanbanViewProps) {
  const [draggedJob, setDraggedJob] = useState<string | null>(null)
  const [jobsByStatus, setJobsByStatus] = useState<Record<string, Job[]>>({})

  useEffect(() => {
    // Group jobs by status
    const grouped: Record<string, Job[]> = {}
    STATUS_COLUMNS.forEach((col) => {
      grouped[col.id] = []
    })

    jobs.forEach((job) => {
      if (job.status && grouped[job.status]) {
        grouped[job.status].push(job)
      }
    })

    setJobsByStatus(grouped)
  }, [jobs])

  function handleDragStart(jobId: string) {
    setDraggedJob(jobId)
  }

  function handleDragOver(e: React.DragEvent, status: Job['status']) {
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent, targetStatus: Job['status']) {
    e.preventDefault()
    if (!draggedJob) return

    const job = jobs.find((j) => j.id === draggedJob)
    if (!job || job.status === targetStatus) {
      setDraggedJob(null)
      return
    }

    // Optimistic update
    const newJobsByStatus = { ...jobsByStatus }
    const oldStatus = job.status
    if (oldStatus && newJobsByStatus[oldStatus]) {
      newJobsByStatus[oldStatus] = newJobsByStatus[oldStatus].filter(
        (j) => j.id !== draggedJob
      )
    }
    if (newJobsByStatus[targetStatus]) {
      newJobsByStatus[targetStatus] = [
        ...newJobsByStatus[targetStatus],
        { ...job, status: targetStatus },
      ]
    }
    setJobsByStatus(newJobsByStatus)

    // Update in backend
    if (onStatusChange) {
      try {
        await onStatusChange(draggedJob, targetStatus)
      } catch (error) {
        // Revert on error
        setJobsByStatus(jobsByStatus)
        console.error('Error updating job status:', error)
      }
    }

    setDraggedJob(null)
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {STATUS_COLUMNS.map((column) => {
        const columnJobs = jobsByStatus[column.id] || []

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={cn('p-3 rounded-t-lg', column.color)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                <Badge variant="secondary">{columnJobs.length}</Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[400px]">
              {loading && columnJobs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : columnJobs.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">
                  No jobs
                </div>
              ) : (
                columnJobs.map((job) => (
                  <Card
                    key={job.id}
                    draggable
                    onDragStart={() => handleDragStart(job.id)}
                    className={cn(
                      'cursor-move hover:shadow-md transition-shadow',
                      draggedJob === job.id && 'opacity-50'
                    )}
                    onClick={() => onJobClick?.(job.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {job.contact?.first_name} {job.contact?.last_name}
                          </p>
                          {job.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {job.description}
                            </p>
                          )}
                        </div>
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>

                      <div className="space-y-1.5 mt-3">
                        {job.scheduled_start && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(job.scheduled_start)}</span>
                          </div>
                        )}
                        {job.total_amount && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                            <span>{formatCurrency(job.total_amount)}</span>
                          </div>
                        )}
                        {job.tech && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            <span className="truncate">{job.tech.full_name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

