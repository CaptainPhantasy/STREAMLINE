'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Job } from '@/types'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'
import { JobDetailModal } from '@/components/jobs/job-detail-modal'
import { BulkAssignDialog } from '@/components/jobs/bulk-assign-dialog'
import { JobsLayout } from '@/components/layout/jobs-layout'
import { useModalState } from '@/hooks/use-modal-state'
import { toast, error as toastError, success as toastSuccess, warning as toastWarning } from '@/lib/toast'
import { confirmDialog } from '@/lib/confirm'
import { ErrorBoundary } from '@/components/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@supabase/supabase-js'

function JobsPageContent() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Use modal state hook to sync with URL query parameter
  const { isOpen: detailModalOpen, modalId: urlJobId, open: openModal, close: closeModal } = useModalState('id', {
    onOpen: (id) => {
      setSelectedJobId(id)
    },
    onClose: () => {
      setSelectedJobId(null)
    }
  })
  
  // Sync selectedJobId with URL param
  useEffect(() => {
    if (urlJobId && urlJobId !== selectedJobId) {
      setSelectedJobId(urlJobId)
    } else if (!urlJobId && selectedJobId) {
      setSelectedJobId(null)
    }
  }, [urlJobId, selectedJobId])
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    revenue: 0
  })

  useEffect(() => {
    fetchJobs()

    // Set up real-time subscriptions for live updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const channel = supabase
      .channel('jobs_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'jobs'
      }, (payload) => {
        console.log('Job inserted:', payload.new)
        // Add new job to the list
        setJobs(prevJobs => [payload.new as Job, ...prevJobs])
        // Show success notification
        toastSuccess('New job created')
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs'
      }, (payload) => {
        console.log('Job updated:', payload.new)
        // Update existing job in the list
        setJobs(prevJobs => prevJobs.map(job =>
          job.id === payload.new.id ? { ...job, ...payload.new } as Job : job
        ))
        // Show update notification
        toastSuccess('Job updated')
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'jobs'
      }, (payload) => {
        console.log('Job deleted:', payload.old)
        // Remove job from the list
        setJobs(prevJobs => prevJobs.filter(job => job.id !== payload.old.id))
        // Show deletion notification
        toastSuccess('Job deleted')
      })
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Handle query parameter on mount and when it changes
  useEffect(() => {
    const jobIdParam = searchParams.get('id')
    if (jobIdParam && jobIdParam !== selectedJobId) {
      setSelectedJobId(jobIdParam)
      openModal(jobIdParam)
    }
  }, [searchParams])

  async function fetchJobs() {
    try {
      setLoading(true)
      // Add cache control for faster subsequent loads
      const response = await fetch('/api/jobs', {
        next: { revalidate: 30 }, // Cache for 30 seconds
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })
      
      if (!response.ok) {
        // API failed, but continue with empty state
        console.warn('API call failed, using empty state')
        setJobs([])
        setStats({ total: 0, completed: 0, inProgress: 0, revenue: 0 })
        return
      }
      
      if (response.ok) {
      const data = await response.json()
      setJobs(data.jobs || [])
      
      // Calculate stats efficiently with useMemo-like optimization
      const jobsArray = data.jobs || []
      const total = jobsArray.length
      let completed = 0
      let inProgress = 0
      let revenue = 0
      
      for (const job of jobsArray) {
        if (job.status === 'completed') completed++
        if (job.status === 'in_progress') inProgress++
        revenue += job.total_amount || 0
      }
      
      setStats({ total, completed, inProgress, revenue })
      }
    } catch (error) {
      // API failed, but continue with empty state
      console.error('Error fetching jobs:', error)
      setJobs([])
      setStats({ total: 0, completed: 0, inProgress: 0, revenue: 0 })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateJob() {
    setCreateJobOpen(true)
  }

  async function handleViewJob(jobId: string) {
    setSelectedJobId(jobId)
    openModal(jobId)
  }

  async function handleSeedDatabase() {
    const confirmed = await confirmDialog({
      title: 'Seed Test Data',
      description: 'This will populate the database with test data. Continue?',
      variant: 'default',
    })
    
    if (!confirmed) {
      return
    }

    setSeeding(true)
    try {
      const response = await fetch('/api/seed', { method: 'POST' })
      
      if (response.ok) {
        const data = await response.json()
        toastSuccess(
          'Database seeded successfully!',
          `Summary: ${data.summary.contacts} contacts, ${data.summary.conversations} conversations, ${data.summary.jobs} jobs, ${data.summary.messages} messages`
        )
        fetchJobs() // Refresh
      } else {
        const data = await response.json().catch(() => ({}))
        toastError(
          'Failed to seed database',
          data.error || data.details || 'If data already exists, this is normal. Try refreshing the page.'
        )
      }
    } catch (error: any) {
      console.error('Error seeding database:', error)
      toastError(
        'Failed to seed database',
        error.message || 'Network error. Make sure the server is running and try again.'
      )
    } finally {
      setSeeding(false)
    }
  }


  function handleToggleJobSelection(jobId: string) {
    const newSelected = new Set(selectedJobIds)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobIds(newSelected)
  }

  function handleSelectAllJobs() {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set())
    } else {
      setSelectedJobIds(new Set(jobs.map(j => j.id)))
    }
  }

  function handleClearSelection() {
    setSelectedJobIds(new Set())
  }

  async function handleBulkStatusUpdate(status: string) {
    if (selectedJobIds.size === 0) return

    setBulkStatusUpdating(true)
    try {
      const response = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          jobIds: Array.from(selectedJobIds),
          status,
        }),
      })

      if (response.ok) {
      const data = await response.json()
        if (data.success) {
        const successCount = data.results.filter((r: { success: boolean }) => r.success).length
        const failedCount = data.results.length - successCount
        if (failedCount === 0) {
            toastSuccess(`Updated ${successCount} job(s) to ${status}`)
        } else {
            toastWarning(
            `Updated ${successCount} job(s)`,
            `${failedCount} job(s) failed to update`
          )
        }
        setSelectedJobIds(new Set())
        fetchJobs()
      } else {
          toastError('Failed to update jobs', data.error || 'Unknown error occurred')
        }
      } else {
        const data = await response.json().catch(() => ({}))
        toastError('Failed to update jobs', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      toastError('Failed to update job status', 'Network error. Please try again.')
    } finally {
      setBulkStatusUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': 
        return { bg: 'bg-theme-card', text: 'text-theme-accent-primary', border: 'border-theme-accent-primary' }
      case 'in_progress': 
        return { bg: 'bg-theme-card', text: 'text-theme-accent-primary', border: 'border-theme-accent-primary' }
      case 'completed': 
        return { bg: 'bg-theme-card', text: 'text-theme-accent-secondary', border: 'border-theme-accent-secondary' }
      case 'en_route':
        return { bg: 'bg-theme-card', text: 'text-theme-accent-secondary', border: 'border-theme-accent-secondary' }
      default: 
        return { bg: 'bg-theme-card', text: 'text-theme-subtle', border: 'border-theme-border' }
    }
  }

  // Always render the page structure, even if data loading fails
  return (
    <ErrorBoundary context="jobs">
      <JobsLayout
        jobs={jobs}
        loading={loading}
        stats={stats}
        selectedJobIds={selectedJobIds}
        bulkStatusUpdating={bulkStatusUpdating}
        onSelectAllJobs={handleSelectAllJobs}
        onToggleJobSelection={handleToggleJobSelection}
        onClearSelection={handleClearSelection}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onViewJob={handleViewJob}
        onCreateJob={handleCreateJob}
        onBulkAssign={() => setBulkAssignOpen(true)}
      >
        {/* Modals and dialogs */}
      <CreateJobDialog 
        open={createJobOpen} 
        onOpenChange={setCreateJobOpen}
        onSuccess={fetchJobs}
      />

      <JobDetailModal
        open={detailModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal()
          } else {
            if (selectedJobId) {
              openModal(selectedJobId)
            }
          }
        }}
        jobId={selectedJobId}
      />

      <BulkAssignDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        jobs={selectedJobIds.size > 0 ? jobs.filter(j => selectedJobIds.has(j.id)) : jobs}
        onSuccess={() => {
          setSelectedJobIds(new Set())
          fetchJobs()
        }}
      />
      </JobsLayout>
    </ErrorBoundary>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Jobs</h1>
            <p className="text-sm text-theme-subtle mt-1">Manage work orders and schedules</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-2 border-theme-border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  )
}
