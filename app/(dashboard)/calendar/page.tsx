'use client'

import { CalendarView } from '@/components/calendar/calendar-view'
import { CreateEventDialog } from '@/components/calendar/create-event-dialog'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function CalendarPage() {
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const queryClient = useQueryClient()

  function handleEventClick(event: any) {
    // Navigate to event details or open modal
    console.log('Event clicked:', event)
  }

  function handleEventCreated() {
    setCreateEventOpen(false)
    // Invalidate all calendar queries to trigger a background refresh
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
      </div>

      <CalendarView
        onEventClick={handleEventClick}
        onCreateEvent={() => setCreateEventOpen(true)}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={handleEventCreated}
      />
    </div>
  )
}

