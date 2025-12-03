'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react'
import type { Resource, SchedulingConflict } from '@/types/scheduling'

interface ResourceSchedulerProps {
  jobId: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
  onResourceAssigned?: (resourceId: string) => void
}

export function ResourceScheduler({
  jobId,
  scheduledStart,
  scheduledEnd,
  onResourceAssigned,
}: ResourceSchedulerProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([])

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    if (selectedResource && scheduledStart && scheduledEnd) {
      checkConflicts()
    } else {
      setConflicts([])
    }
  }, [selectedResource, scheduledStart, scheduledEnd])

  async function fetchResources() {
    try {
      setLoading(true)
      const response = await fetch('/api/schedule/resources?active_only=true')

      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }

      const data = await response.json()
      setResources(data.resources || [])
    } catch (error: any) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkConflicts() {
    if (!selectedResource || !scheduledStart || !scheduledEnd) return

    try {
      const response = await fetch('/api/schedule/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: selectedResource,
          job_id: jobId,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setConflicts(data.conflicts || [])
      }
    } catch (error) {
      console.error('Error checking conflicts:', error)
    }
  }

  async function handleAssign() {
    if (!selectedResource) return

    setAssigning(true)

    try {
      const response = await fetch(`/api/schedule/resources/${selectedResource}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 409) {
          // Conflict detected
          setConflicts(data.conflicts || [])
          return
        }
        throw new Error(data.error || 'Failed to assign resource')
      }

      const { assignment } = await response.json()
      onResourceAssigned?.(selectedResource)
      setSelectedResource('')
      setConflicts([])
    } catch (error: any) {
      console.error('Error assigning resource:', error)
    } finally {
      setAssigning(false)
    }
  }

  const techResources = resources.filter(r => r.resource_type === 'tech')
  const vehicleResources = resources.filter(r => r.resource_type === 'vehicle')
  const equipmentResources = resources.filter(r => r.resource_type === 'equipment')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Resources</CardTitle>
        <CardDescription>Assign techs, vehicles, or equipment to this job</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tech Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Technician</label>
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger>
              <SelectValue placeholder="Select a technician" />
            </SelectTrigger>
            <SelectContent>
              {techResources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.user?.full_name || resource.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900 mb-1">Scheduling Conflicts Detected</p>
                <ul className="space-y-1">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx} className="text-sm text-yellow-800">
                      • {conflict.conflict_details}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Assign Button */}
        <Button
          onClick={handleAssign}
          disabled={!selectedResource || assigning || conflicts.length > 0}
          className="w-full"
        >
          {assigning ? 'Assigning...' : 'Assign Resource'}
        </Button>

        {/* Resource Availability */}
        {selectedResource && scheduledStart && scheduledEnd && conflicts.length === 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">Resource is available for this time slot</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

