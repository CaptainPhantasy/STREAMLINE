'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Play, Square } from 'lucide-react'

interface TimeEntry {
  id: string
  job_id: string
  clock_in_at: string
  clock_out_at: string | null
  duration_minutes: number | null
  notes: string | null
}

interface TimeTrackerProps {
  jobId: string
  userId: string
}

export function TimeTracker({ jobId, userId }: TimeTrackerProps) {
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null)
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00')

  useEffect(() => {
    fetchTimeEntries()
  }, [jobId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (currentEntry && !currentEntry.clock_out_at) {
      interval = setInterval(() => {
        const start = new Date(currentEntry.clock_in_at).getTime()
        const now = Date.now()
        const diff = now - start
        
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentEntry])

  async function fetchTimeEntries() {
    try {
      const response = await fetch(`/api/time-entries?jobId=${jobId}`)
      if (response.ok) {
        const data = await response.json()
        const entries = data.entries || []
        setAllEntries(entries)
        
        // Find active entry (clocked in but not clocked out)
        const active = entries.find((e: TimeEntry) => e.clock_in_at && !e.clock_out_at)
        setCurrentEntry(active || null)
        
        if (active) {
          // Calculate elapsed time for active entry
          const start = new Date(active.clock_in_at).getTime()
          const now = Date.now()
          const diff = now - start
          const hours = Math.floor(diff / 3600000)
          const minutes = Math.floor((diff % 3600000) / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          setElapsedTime(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          )
        }
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    }
  }

  async function handleClockIn() {
    setLoading(true)
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'clock_in',
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        await fetchTimeEntries()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error clocking in:', error)
      alert('Failed to clock in')
    } finally {
      setLoading(false)
    }
  }

  async function handleClockOut() {
    if (!currentEntry) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          entryId: currentEntry.id,
          action: 'clock_out',
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        await fetchTimeEntries()
        setElapsedTime('00:00:00')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error clocking out:', error)
      alert('Failed to clock out')
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(minutes: number | null): string {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const totalMinutes = allEntries.reduce((sum, entry) => {
    return sum + (entry.duration_minutes || 0)
  }, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentEntry && !currentEntry.clock_out_at ? (
          <div className="space-y-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-neutral-600 mb-1">Currently Clocked In</p>
              <p className="text-3xl font-bold text-blue-600">{elapsedTime}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Started: {new Date(currentEntry.clock_in_at).toLocaleString()}
              </p>
            </div>
            <Button
              onClick={handleClockOut}
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              Clock Out
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleClockIn}
            disabled={loading}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Clock In
          </Button>
        )}

        {allEntries.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total Time:</span>
              <span className="font-bold">{formatDuration(totalMinutes)}</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center text-xs p-2 bg-neutral-50 rounded"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(entry.clock_in_at).toLocaleTimeString()}
                      {entry.clock_out_at && ` - ${new Date(entry.clock_out_at).toLocaleTimeString()}`}
                    </p>
                    {entry.notes && (
                      <p className="text-neutral-500">{entry.notes}</p>
                    )}
                  </div>
                  <span className="font-medium">
                    {formatDuration(entry.duration_minutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

