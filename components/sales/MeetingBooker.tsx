'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface MeetingBookerProps {
  contactId: string
  contactName?: string
  onMeetingBooked?: () => void
}

export function MeetingBooker({
  contactId,
  contactName,
  onMeetingBooked,
}: MeetingBookerProps) {
  const [booking, setBooking] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    notes: '',
    scheduled_time: '',
    duration_minutes: '30',
    location: '',
  })

  async function handleBook() {
    if (!formData.scheduled_time) {
      toast.error('Please select a date and time')
      return
    }

    setBooking(true)

    try {
      const response = await fetch('/api/sales/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes) || 30,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to book meeting')
      }

      toast.success('Meeting booked successfully')
      onMeetingBooked?.()
      setFormData({
        subject: '',
        notes: '',
        scheduled_time: '',
        duration_minutes: '30',
        location: '',
      })
    } catch (error: any) {
      console.error('Error booking meeting:', error)
      toast.error(error.message || 'Failed to book meeting')
    } finally {
      setBooking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Book Meeting
        </CardTitle>
        <CardDescription>
          Schedule a meeting with {contactName || 'contact'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Meeting subject..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Meeting location..."
          />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Meeting notes..."
            rows={3}
          />
        </div>

        <Button onClick={handleBook} disabled={booking || !formData.scheduled_time} className="w-full">
          {booking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Book Meeting
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

