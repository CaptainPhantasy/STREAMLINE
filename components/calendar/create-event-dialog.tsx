'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated: () => void
  contactId?: string
  jobId?: string
  defaultTitle?: string
  defaultStartTime?: string
  defaultEndTime?: string
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onEventCreated,
  contactId,
  jobId,
  defaultTitle = '',
  defaultStartTime = '',
  defaultEndTime = '',
}: CreateEventDialogProps) {
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [endTime, setEndTime] = useState(defaultEndTime)
  const [location, setLocation] = useState('')

  async function handleCreateEvent() {
    if (!title || !startTime || !endTime) {
      toast.error('Title, start time, and end time are required')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          location,
          contactId,
          jobId,
        }),
      })

      if (response.ok) {
        toast.success('Event added to calendar')
        // Reset form
        setTitle('')
        setDescription('')
        setStartTime('')
        setEndTime('')
        setLocation('')
        onEventCreated()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create calendar event')
      }
    } catch (error) {
      console.error('Error creating calendar event:', error)
      toast.error('Failed to create calendar event')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to your calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting with John"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="123 Main St, City, State"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateEvent}
            disabled={creating || !title || !startTime || !endTime}
          >
            {creating ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
