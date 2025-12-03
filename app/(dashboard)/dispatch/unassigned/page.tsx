'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, X, User, Calendar, MapPin, Phone } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface UnassignedJob {
  id: string
  description: string
  status: string
  request_status: string
  scheduled_start: string | null
  scheduled_end: string | null
  notes: string | null
  created_at: string
  contact?: {
    id: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    address: string | null
  }
  tech_assigned?: {
    id: string
    full_name: string | null
  }
}

export default function UnassignedJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<UnassignedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<UnassignedJob | null>(null)
  const [selectedTechId, setSelectedTechId] = useState<string>('')
  const [techs, setTechs] = useState<Array<{ id: string; full_name: string | null }>>([])
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('manage_dispatch')) {
      router.push('/inbox')
    }
  }, [hasPermission, permissionsLoading, router])

  useEffect(() => {
    if (hasPermission('manage_dispatch')) {
      fetchUnassignedJobs()
      fetchTechs()
    }
  }, [hasPermission])

  async function fetchUnassignedJobs() {
    try {
      setLoading(true)
      const response = await fetch('/api/jobs/unassigned')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      } else {
        toast.error('Failed to load unassigned jobs', 'An error occurred')
      }
    } catch (error) {
      console.error('Error fetching unassigned jobs:', error)
      toast.error('Failed to load unassigned jobs', 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTechs() {
    try {
      const response = await fetch('/api/users?role=tech')
      if (response.ok) {
        const data = await response.json()
        setTechs(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching techs:', error)
    }
  }

  async function handleApprove(job: UnassignedJob) {
    setSelectedJob(job)
    setApproveDialogOpen(true)
  }

  async function handleApproveConfirm() {
    if (!selectedJob) return

    try {
      const response = await fetch('/api/jobs/unassigned', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          action: 'approve',
          techId: selectedTechId || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Job request approved')
        setApproveDialogOpen(false)
        setSelectedJob(null)
        setSelectedTechId('')
        fetchUnassignedJobs()
      } else {
        const errorData = await response.json()
        toast.error('Failed to approve request', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error approving job:', error)
      toast.error('Failed to approve request', 'Network error')
    }
  }

  async function handleReject(jobId: string) {
    if (!confirm('Are you sure you want to reject this job request?')) {
      return
    }

    try {
      const response = await fetch('/api/jobs/unassigned', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'reject',
        }),
      })

      if (response.ok) {
        toast.success('Job request rejected')
        fetchUnassignedJobs()
      } else {
        const errorData = await response.json()
        toast.error('Failed to reject request', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error rejecting job:', error)
      toast.error('Failed to reject request', 'Network error')
    }
  }

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    )
  }

  if (!hasPermission('manage_dispatch')) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Access Denied</div>
      </div>
    )
  }

  const contactName = (job: UnassignedJob) => {
    if (!job.contact) return 'Unknown'
    return `${job.contact.first_name || ''} ${job.contact.last_name || ''}`.trim() || 'Unknown'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dispatch/map')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Map
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Unassigned Jobs</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Review and approve technician job requests
          </p>
        </div>
      </div>

      <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle>Pending Requests ({jobs.length})</CardTitle>
          <CardDescription>Job requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading requests...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <p className="text-lg font-medium mb-2">No pending requests</p>
              <p className="text-sm">All job requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-lg hover:bg-[var(--card-bg-hover)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending Approval
                        </Badge>
                        {job.tech_assigned && (
                          <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                            <User className="w-4 h-4" />
                            Requested by: {job.tech_assigned.full_name || 'Unknown'}
                          </div>
                        )}
                      </div>

                      <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
                        {job.description || 'No description'}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                          <User className="w-4 h-4" />
                          {contactName(job)}
                        </div>
                        {job.contact?.phone && (
                          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                            <Phone className="w-4 h-4" />
                            {job.contact.phone}
                          </div>
                        )}
                        {job.contact?.address && (
                          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                            <MapPin className="w-4 h-4" />
                            {job.contact.address}
                          </div>
                        )}
                        {job.scheduled_start && (
                          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(job.scheduled_start), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>

                      {job.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <strong>Note:</strong> {job.notes}
                        </div>
                      )}

                      <div className="text-xs text-[var(--color-text-subtle)] mt-2">
                        Requested: {format(new Date(job.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(job)}
                        className="bg-[#56D470] hover:bg-[#37C856] text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Job Request</DialogTitle>
            <DialogDescription>
              Approve this job request and optionally assign it to a technician
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tech">Assign to Technician (Optional)</Label>
              <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                <SelectTrigger>
                  <SelectValue placeholder="Leave unassigned for now" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Leave unassigned</SelectItem>
                  {techs.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--color-text-subtle)]">
                You can assign this job later from the dispatch map
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveConfirm}
              className="bg-[#56D470] hover:bg-[#37C856] text-white"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

