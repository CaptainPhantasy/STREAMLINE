'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { useQuery } from '@tanstack/react-query'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  contactId?: string
  jobId?: string
  status?: string
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void
  onCreateEvent?: () => void
  className?: string
}

export function CalendarView({ onEventClick, onCreateEvent, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Fetch events using React Query
  const { data: events = [], isLoading, isFetching } = useQuery({
    queryKey: ['calendar-events', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const startDate = startOfMonth(currentDate).toISOString()
      const endDate = endOfMonth(currentDate).toISOString()
      const res = await fetch(`/api/calendar/events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()
      return (data.events || []) as CalendarEvent[]
    },
    placeholderData: (previousData) => previousData, // Keep showing previous month while loading new one
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Memoize expensive date calculations
  const { days, eventsByDate } = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const calculatedDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const calculatedEventsByDate = events.reduce((acc, event) => {
      const date = format(new Date(event.startTime), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(event)
      return acc
    }, {} as Record<string, CalendarEvent[]>)

    return { days: calculatedDays, eventsByDate: calculatedEventsByDate }
  }, [currentDate, events])

  function getEventsForDate(date: Date): CalendarEvent[] {
    const dateKey = format(date, 'yyyy-MM-dd')
    return eventsByDate[dateKey] || []
  }

  return (
    <Card className={cn("bg-theme-card border-theme-border", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-theme-accent-primary" />
            {format(currentDate, 'MMMM yyyy')}
            {isFetching && <Loader2 className="w-4 h-4 animate-spin text-theme-subtle ml-2" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="border-theme-border"
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="border-theme-border"
              disabled={isLoading}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="border-theme-border"
              disabled={isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {onCreateEvent && (
              <Button
                size="sm"
                onClick={onCreateEvent}
                className="bg-theme-accent-primary hover:bg-theme-accent-primary text-black"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Event
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-semibold text-theme-subtle/70"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-1 border border-theme-border transition-opacity duration-200",
                  !isCurrentMonth && "opacity-30",
                  isToday && "bg-theme-accent-primary/10 border-theme-accent-primary",
                  // Fade out slightly if we are fetching new data but showing old data
                  isFetching && "opacity-50"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday
                      ? "text-theme-accent-primary font-bold"
                      : isCurrentMonth
                        ? "text-white"
                        : "text-theme-subtle/50"
                  )}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="w-full text-left px-1 py-0.5 text-xs rounded bg-theme-accent-primary/20 hover:bg-theme-accent-primary/30 text-white truncate border border-theme-accent-primary/30"
                      title={event.title}
                    >
                      {format(new Date(event.startTime), 'HH:mm')} {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-theme-subtle/70 px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

