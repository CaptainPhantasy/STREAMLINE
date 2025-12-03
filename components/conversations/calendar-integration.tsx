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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CalendarIntegrationProps {
  conversationId?: string
  contactId?: string
  jobId?: string
  defaultTitle?: string
  defaultStartTime?: string
  defaultEndTime?: string
  className?: string
}

export function CalendarIntegration({
  conversationId,
  contactId,
  jobId,
  defaultTitle,
  defaultStartTime,
  defaultEndTime,
  className,
}: CalendarIntegrationProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState(defaultTitle || '')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState(defaultStartTime || '')
  const [endTime, setEndTime] = useState(defaultEndTime || '')
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
          conversationId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Event added to calendar')
        setOpen(false)
        // Reset form
        setTitle('')
        setDescription('')
        setStartTime('')
        setEndTime('')
        setLocation('')
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={`border-theme-accent-primary hover:bg-theme-secondary ${className}`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Add to Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-theme-card border-theme-accent-primary">
        <DialogHeader>
          <DialogTitle className="text-white">Add to Calendar</DialogTitle>
          <DialogDescription className="text-theme-subtle/70">
            Create a calendar event for this meeting or appointment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title" className="text-theme-subtle">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting with John"
              className="bg-theme-secondary border-theme-border text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-theme-subtle">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting details..."
              className="bg-theme-secondary border-theme-border text-white mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="text-theme-subtle">
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-theme-secondary border-theme-border text-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endTime" className="text-theme-subtle">
                End Time *
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-theme-secondary border-theme-border text-white mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="text-theme-subtle">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="123 Main St, City, State"
              className="bg-theme-secondary border-theme-border text-white mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-theme-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEvent}
            disabled={creating || !title || !startTime || !endTime}
            className="bg-theme-accent-primary hover:bg-theme-accent-primary text-black"
          >
            {creating ? 'Creating...' : 'Add to Calendar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

