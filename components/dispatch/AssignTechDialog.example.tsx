/**
 * Example Usage of AssignTechDialog Component
 *
 * This file demonstrates how to integrate the AssignTechDialog
 * into a dispatch map or job management interface.
 */

'use client'

import { useState } from 'react'
import { AssignTechDialog } from './AssignTechDialog'
import type { JobLocation, TechLocation } from '@/types/dispatch'
import { Button } from '@/components/ui/button'

export function DispatchMapExample() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null)

  // Example job data
  const exampleJob: JobLocation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Water heater repair - No hot water',
    status: 'scheduled',
    scheduledStart: '2025-11-27T14:00:00Z',
    customer: {
      name: 'John Doe',
      phone: '(317) 555-0123',
      address: '123 Main St, Indianapolis, IN 46204',
    },
    location: {
      lat: 39.768403,
      lng: -86.158068,
    },
  }

  // Example tech data
  const exampleTechs: TechLocation[] = [
    {
      id: 'tech-1',
      name: 'Mike Johnson',
      role: 'tech',
      status: 'idle',
      lastLocation: {
        lat: 39.770000,
        lng: -86.160000,
        accuracy: 10,
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'tech-2',
      name: 'Sarah Williams',
      role: 'tech',
      status: 'on_job',
      currentJob: {
        id: 'job-456',
        description: 'HVAC maintenance',
        address: '456 Oak Ave, Indianapolis, IN',
      },
      lastLocation: {
        lat: 39.780000,
        lng: -86.170000,
        accuracy: 15,
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'tech-3',
      name: 'David Brown',
      role: 'tech',
      status: 'en_route',
      currentJob: {
        id: 'job-789',
        description: 'Plumbing repair',
        address: '789 Elm St, Indianapolis, IN',
      },
      lastLocation: {
        lat: 39.790000,
        lng: -86.180000,
        accuracy: 20,
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'tech-4',
      name: 'Emily Davis',
      role: 'sales',
      status: 'idle',
      lastLocation: {
        lat: 39.750000,
        lng: -86.150000,
        accuracy: 8,
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'tech-5',
      name: 'James Wilson',
      role: 'tech',
      status: 'offline',
      lastLocation: {
        lat: 39.740000,
        lng: -86.140000,
        accuracy: 50,
        updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
    },
  ]

  /**
   * Handle job assignment
   * This would typically make an API call to assign the tech
   */
  const handleAssign = async (jobId: string, techId: string): Promise<void> => {
    // Make API call to assign tech
    const response = await fetch(`/api/dispatch/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        techId,
        notifyTech: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign tech')
    }

    // After successful assignment, you would typically:
    // 1. Refresh the job list
    // 2. Update the tech's status
    // 3. Update the map markers
    console.log(`Successfully assigned tech ${techId} to job ${jobId}`)
  }

  /**
   * Open assignment dialog for a job
   */
  const openAssignDialog = (job: JobLocation) => {
    setSelectedJob(job)
    setAssignDialogOpen(true)
  }

  /**
   * Close assignment dialog
   */
  const closeAssignDialog = () => {
    setAssignDialogOpen(false)
    setSelectedJob(null)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Dispatch Map Example</h1>

      {/* Example trigger button */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Active Jobs</h2>
        <div className="border-2 border-theme-border rounded-lg p-4 bg-theme-secondary/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{exampleJob.description}</h3>
              <p className="text-sm text-theme-subtle">{exampleJob.customer.address}</p>
              <p className="text-sm text-theme-subtle">{exampleJob.customer.name}</p>
            </div>
            <Button onClick={() => openAssignDialog(exampleJob)}>
              Assign Tech
            </Button>
          </div>
        </div>
      </div>

      {/* Assignment Dialog */}
      <AssignTechDialog
        open={assignDialogOpen}
        onClose={closeAssignDialog}
        job={selectedJob}
        techs={exampleTechs}
        onAssign={handleAssign}
      />
    </div>
  )
}

/**
 * Integration Example: Using with Real-time Data
 *
 * In a real dispatch map, you would fetch techs and jobs from your API:
 */
export function RealTimeDispatchExample() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null)
  const [techs, setTechs] = useState<TechLocation[]>([])
  const [jobs, setJobs] = useState<JobLocation[]>([])

  // Fetch techs and jobs on component mount
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const [techsRes, jobsRes] = await Promise.all([
  //       fetch('/api/dispatch/techs'),
  //       fetch('/api/dispatch/jobs/active')
  //     ])
  //
  //     const techsData = await techsRes.json()
  //     const jobsData = await jobsRes.json()
  //
  //     setTechs(techsData.techs)
  //     setJobs(jobsData.jobs)
  //   }
  //
  //   fetchData()
  //
  //   // Set up real-time subscriptions with Supabase
  //   const channel = supabase
  //     .channel('dispatch_updates')
  //     .on('postgres_changes', {
  //       event: '*',
  //       schema: 'public',
  //       table: 'jobs'
  //     }, () => {
  //       fetchData() // Refresh on changes
  //     })
  //     .subscribe()
  //
  //   return () => {
  //     channel.unsubscribe()
  //   }
  // }, [])

  const handleAssign = async (jobId: string, techId: string): Promise<void> => {
    const response = await fetch(`/api/dispatch/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId, notifyTech: true }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign tech')
    }

    // Optimistically update the UI
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: 'scheduled' as const,
              assignedTech: {
                id: techId,
                name: techs.find((t) => t.id === techId)?.name || '',
              },
            }
          : job
      )
    )
  }

  return (
    <div>
      {/* Your dispatch map UI */}
      <AssignTechDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        job={selectedJob}
        techs={techs}
        onAssign={handleAssign}
      />
    </div>
  )
}
