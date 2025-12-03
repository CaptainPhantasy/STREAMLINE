'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Job, User } from '@/types'

interface BulkAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: Job[]
  onSuccess: () => void
}

export function BulkAssignDialog({ open, onOpenChange, jobs, onSuccess }: BulkAssignDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [selectedTechId, setSelectedTechId] = useState<string>('')
  const [technicians, setTechnicians] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    if (open) {
      fetchTechnicians()
      // Pre-select all jobs
      setSelectedJobIds(new Set(jobs.map(j => j.id)))
    }
  }, [open, jobs])

  async function fetchTechnicians() {
    try {
      const response = await fetch('/api/users?role=tech')
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching technicians:', error)
    }
  }

  function handleToggleJob(jobId: string) {
    const newSelected = new Set(selectedJobIds)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobIds(newSelected)
  }

  function handleSelectAll() {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set())
    } else {
      setSelectedJobIds(new Set(jobs.map(j => j.id)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedJobIds.size === 0) {
      setError('Please select at least one job')
      return
    }

    if (!selectedTechId) {
      setError('Please select a technician')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Use bulk API
      const response = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          jobIds: Array.from(selectedJobIds),
          techId: selectedTechId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const successCount = data.results.filter((r: { success: boolean }) => r.success).length
        const failedCount = data.results.filter((r: { success: boolean }) => !r.success).length
        setResults({ success: successCount, failed: failedCount })
      } else {
        setError(data.error || 'Failed to assign jobs')
        setResults({ success: 0, failed: selectedJobIds.size })
      }
    } catch (error) {
      console.error('Error assigning jobs:', error)
      setError('Failed to assign jobs')
      setResults({ success: 0, failed: selectedJobIds.size })
    } finally {
      setLoading(false)
    }

    if (results && results.failed === 0) {
      // All succeeded
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setSelectedJobIds(new Set())
        setSelectedTechId('')
        setResults(null)
      }, 1500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Assign Jobs</DialogTitle>
          <DialogDescription>
            Select jobs and assign them to a technician
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            {results && (
              <div className={`p-3 text-sm rounded ${results.failed === 0
                  ? 'text-green-600 bg-green-50 border border-green-200'
                  : 'text-yellow-600 bg-yellow-50 border border-yellow-200'
                }`}>
                {results.failed === 0
                  ? `✅ Successfully assigned ${results.success} job(s)`
                  : `⚠️ Assigned ${results.success} job(s), ${results.failed} failed`
                }
              </div>
            )}

            {/* Technician Selection */}
            <div className="space-y-2">
              <Label htmlFor="technician">Assign to Technician *</Label>
              <Select
                value={selectedTechId}
                onValueChange={setSelectedTechId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.length === 0 ? (
                    <SelectItem value="no-techs" disabled>No technicians available</SelectItem>
                  ) : (
                    technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.full_name || 'Unnamed Tech'} {tech.role ? `(${tech.role})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Job Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Jobs ({selectedJobIds.size} selected)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedJobIds.size === jobs.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {jobs.length === 0 ? (
                  <p className="text-sm text-neutral-500">No jobs available</p>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`job-${job.id}`}
                        checked={selectedJobIds.has(job.id)}
                        onCheckedChange={() => handleToggleJob(job.id)}
                      />
                      <Label
                        htmlFor={`job-${job.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {job.contact?.first_name} {job.contact?.last_name} - {job.description || 'No description'}
                          </span>
                          <span className="text-xs text-neutral-500 ml-2">
                            {job.status}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setError(null)
                setResults(null)
                setSelectedJobIds(new Set())
                setSelectedTechId('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedJobIds.size === 0 || !selectedTechId}
              className="bg-[#4B79FF] hover:bg-[#3366FF]"
            >
              {loading ? 'Assigning...' : `Assign ${selectedJobIds.size} Job(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

