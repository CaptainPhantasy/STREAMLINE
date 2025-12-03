'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, Square, Coffee, CoffeeOff } from 'lucide-react'
import { toast } from 'sonner'

interface TimeClockProps {
  jobId?: string
  onStatusChange?: (status: string, hours: number) => void
}

export function TimeClock({ jobId, onStatusChange }: TimeClockProps) {
  const [status, setStatus] = useState<'clocked_out' | 'clocked_in' | 'on_break'>('clocked_out')
  const [todayHours, setTodayHours] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      setFetching(true)
      const response = await fetch('/api/tech/time-clock')

      if (!response.ok) {
        throw new Error('Failed to fetch time clock status')
      }

      const data = await response.json()
      setStatus(data.currentStatus || 'clocked_out')
      setTodayHours(data.todayHours || 0)
    } catch (error: any) {
      console.error('Error fetching time clock status:', error)
    } finally {
      setFetching(false)
    }
  }

  async function handleClockAction(type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end') {
    setLoading(true)

    try {
      const response = await fetch('/api/tech/time-clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          jobId: jobId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update time clock')
      }

      const data = await response.json()
      setStatus(data.status)
      setTodayHours(data.todayHours || 0)
      onStatusChange?.(data.status, data.todayHours || 0)

      const actionMessages = {
        clock_in: 'Clocked in',
        clock_out: 'Clocked out',
        break_start: 'Break started',
        break_end: 'Break ended',
      }
      toast.success(actionMessages[type])
    } catch (error: any) {
      console.error('Error updating time clock:', error)
      toast.error(error.message || 'Failed to update time clock')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'clocked_in':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Play className="w-3 h-3 mr-1" />
            Clocked In
          </Badge>
        )
      case 'on_break':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Coffee className="w-3 h-3 mr-1" />
            On Break
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Square className="w-3 h-3 mr-1" />
            Clocked Out
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Clock
        </CardTitle>
        <CardDescription>Track your work hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {/* Today's Hours */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Today's Hours:</span>
          <span className="text-lg font-bold">{todayHours.toFixed(2)}h</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {status === 'clocked_out' && (
            <Button
              onClick={() => handleClockAction('clock_in')}
              disabled={loading || fetching}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Clock In
            </Button>
          )}

          {status === 'clocked_in' && (
            <>
              <Button
                onClick={() => handleClockAction('break_start')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Coffee className="w-4 h-4 mr-2" />
                Start Break
              </Button>
              <Button
                onClick={() => handleClockAction('clock_out')}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                Clock Out
              </Button>
            </>
          )}

          {status === 'on_break' && (
            <>
              <Button
                onClick={() => handleClockAction('break_end')}
                disabled={loading}
                className="w-full"
              >
                <CoffeeOff className="w-4 h-4 mr-2" />
                End Break
              </Button>
              <Button
                onClick={() => handleClockAction('clock_out')}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                Clock Out
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

