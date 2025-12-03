'use client'

import { useState, useCallback } from 'react'
import type { Job } from '@/types'

export function useJobsKanban(initialJobs: Job[] = []) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)

  const updateJobStatus = useCallback(
    async (jobId: string, newStatus: Job['status']) => {
      // Optimistic update
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      )

      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })

        if (!response.ok) {
          throw new Error('Failed to update job status')
        }

        const { job: updatedJob } = await response.json()
        setJobs((prev) =>
          prev.map((job) => (job.id === jobId ? updatedJob : job))
        )
      } catch (error) {
        // Revert on error
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, status: jobs.find((j) => j.id === jobId)?.status || 'lead' }
              : job
          )
        )
        throw error
      }
    },
    [jobs]
  )

  return {
    jobs,
    setJobs,
    updateJobStatus,
  }
}

