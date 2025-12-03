'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Calendar,
  Clock,
  Gauge,
  X,
} from 'lucide-react'
import type { TechLocation, JobLocation } from '@/types/dispatch'

/**
 * Historical GPS log from API
 */
interface HistoricalGPSLog {
  userId: string
  userName: string
  latitude: number
  longitude: number
  timestamp: string
  jobId?: string
}

/**
 * Playback state for tech tracking
 */
interface TechPlaybackState {
  userId: string
  userName: string
  currentPosition: { lat: number; lng: number }
  trail: Array<{ lat: number; lng: number }>
  currentJobId?: string
}

interface HistoricalPlaybackProps {
  onExit: () => void
  initialTechs?: TechLocation[]
  initialJobs?: JobLocation[]
}

/**
 * HistoricalPlayback Component
 *
 * Allows users to review tech movements over a past time period.
 *
 * Features:
 * - Date/time picker for selecting start time
 * - Playback controls: Play/Pause, Speed (1x, 2x, 5x, 10x)
 * - Scrubber timeline for jumping to specific time
 * - "Live" button to exit playback mode
 * - Breadcrumb trail showing path traveled
 * - Timestamp overlay showing current playback time
 * - Automatic downsampling for long time ranges
 */
export function HistoricalPlayback({
  onExit,
  initialTechs = [],
  initialJobs = [],
}: HistoricalPlaybackProps) {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5 | 10>(1)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState<Date>(() => {
    const start = new Date()
    start.setHours(start.getHours() - 4) // Default: 4 hours ago
    return start
  })
  const [endTime, setEndTime] = useState<Date>(new Date())

  // Data state
  const [gpsLogs, setGpsLogs] = useState<HistoricalGPSLog[]>([])
  const [techStates, setTechStates] = useState<Map<string, TechPlaybackState>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  // Refs
  const playbackInterval = useRef<NodeJS.Timeout | null>(null)
  const scrubberRef = useRef<HTMLDivElement>(null)

  /**
   * Fetch historical GPS logs from API
   */
  const fetchHistoricalData = useCallback(async () => {
    setIsLoading(true)

    try {
      const startISO = startTime.toISOString()
      const endISO = endTime.toISOString()

      const response = await fetch(
        `/api/dispatch/historical-gps?startTime=${startISO}&endTime=${endISO}&downsample=true&interval=5`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch historical GPS data')
      }

      const data = await response.json()
      setGpsLogs(data.logs || [])

      // Initialize tech states
      const initialStates = new Map<string, TechPlaybackState>()
      const uniqueTechs = new Set<string>(data.logs.map((log: HistoricalGPSLog) => log.userId))

      uniqueTechs.forEach((userId) => {
        const techLogs = data.logs.filter((log: HistoricalGPSLog) => log.userId === userId)
        if (techLogs.length > 0) {
          const firstLog = techLogs[0]
          initialStates.set(userId, {
            userId,
            userName: firstLog.userName,
            currentPosition: { lat: firstLog.latitude, lng: firstLog.longitude },
            trail: [],
            currentJobId: firstLog.jobId,
          })
        }
      })

      setTechStates(initialStates)
      setCurrentTime(startTime)

      toast({
        title: 'Historical Data Loaded',
        description: `Loaded ${data.logs.length} GPS logs from ${uniqueTechs.size} techs`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
      toast({
        title: 'Failed to Load Data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [startTime, endTime])

  /**
   * Update playback position based on current time
   */
  const updatePlaybackPosition = useCallback(() => {
    const newStates = new Map<string, TechPlaybackState>()

    // Get all logs up to current time
    const logsUpToNow = gpsLogs.filter(
      (log) => new Date(log.timestamp) <= currentTime
    )

    // Group by user
    const logsByUser = logsUpToNow.reduce((acc, log) => {
      if (!acc[log.userId]) acc[log.userId] = []
      acc[log.userId].push(log)
      return acc
    }, {} as Record<string, HistoricalGPSLog[]>)

    // Update each tech's position
    Object.entries(logsByUser).forEach(([userId, logs]) => {
      if (logs.length === 0) return

      const latestLog = logs[logs.length - 1]
      const trail = logs.map((log) => ({ lat: log.latitude, lng: log.longitude }))

      newStates.set(userId, {
        userId,
        userName: latestLog.userName,
        currentPosition: { lat: latestLog.latitude, lng: latestLog.longitude },
        trail,
        currentJobId: latestLog.jobId,
      })
    })

    setTechStates(newStates)
  }, [gpsLogs, currentTime])

  /**
   * Start/stop playback
   */
  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  /**
   * Skip forward 5 minutes
   */
  const skipForward = useCallback(() => {
    setCurrentTime((prev) => {
      const next = new Date(prev)
      next.setMinutes(next.getMinutes() + 5)
      if (next > endTime) return endTime
      return next
    })
  }, [endTime])

  /**
   * Skip backward 5 minutes
   */
  const skipBackward = useCallback(() => {
    setCurrentTime((prev) => {
      const next = new Date(prev)
      next.setMinutes(next.getMinutes() - 5)
      if (next < startTime) return startTime
      return next
    })
  }, [startTime])

  /**
   * Reset playback to start
   */
  const resetPlayback = useCallback(() => {
    setCurrentTime(startTime)
    setIsPlaying(false)
  }, [startTime])

  /**
   * Handle scrubber drag
   */
  const handleScrubberClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrubberRef.current) return

      const rect = scrubberRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width

      const totalDuration = endTime.getTime() - startTime.getTime()
      const newTime = new Date(startTime.getTime() + totalDuration * percentage)

      setCurrentTime(newTime)
    },
    [startTime, endTime]
  )

  /**
   * Handle date/time input changes
   */
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value)
    if (newStart >= endTime) {
      toast({
        title: 'Invalid Time Range',
        description: 'Start time must be before end time',
        variant: 'error',
      })
      return
    }
    setStartTime(newStart)
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value)
    if (newEnd <= startTime) {
      toast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time',
        variant: 'error',
      })
      return
    }
    setEndTime(newEnd)
  }

  /**
   * Playback loop effect
   */
  useEffect(() => {
    if (!isPlaying) {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current)
        playbackInterval.current = null
      }
      return
    }

    // Update every 100ms, increment by speed factor
    const increment = 1000 * playbackSpeed // 1 second per 100ms at 10x speed

    playbackInterval.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = new Date(prev.getTime() + increment)
        if (next >= endTime) {
          setIsPlaying(false)
          return endTime
        }
        return next
      })
    }, 100)

    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current)
      }
    }
  }, [isPlaying, playbackSpeed, endTime])

  /**
   * Update tech positions when time changes
   */
  useEffect(() => {
    updatePlaybackPosition()
  }, [currentTime, updatePlaybackPosition])

  /**
   * Calculate scrubber position
   */
  const scrubberPosition = React.useMemo(() => {
    const totalDuration = endTime.getTime() - startTime.getTime()
    const elapsed = currentTime.getTime() - startTime.getTime()
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }, [currentTime, startTime, endTime])

  /**
   * Format time for display
   */
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  /**
   * Convert Date to datetime-local input format
   */
  const toDatetimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-4xl border-2 border-theme-accent-primary bg-theme-primary shadow-2xl">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-theme-accent-primary" />
            <h3 className="text-lg font-semibold text-white">Historical Playback</h3>
            <Badge variant="outline" className="bg-blue-900 text-blue-400 border-blue-400">
              {techStates.size} Techs
            </Badge>
          </div>
          <Button
            onClick={onExit}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-900/20 hover:text-red-400"
          >
            <X className="h-4 w-4 mr-1" />
            Exit Playback
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-white text-sm mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Start Time
            </Label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(startTime)}
              onChange={handleStartTimeChange}
              className="w-full px-3 py-2 bg-theme-secondary border border-theme-border rounded-md text-white text-sm"
              disabled={isPlaying}
            />
          </div>
          <div>
            <Label className="text-white text-sm mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              End Time
            </Label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(endTime)}
              onChange={handleEndTimeChange}
              className="w-full px-3 py-2 bg-theme-secondary border border-theme-border rounded-md text-white text-sm"
              disabled={isPlaying}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={fetchHistoricalData}
              disabled={isLoading || isPlaying}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Load Data'}
            </Button>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="flex items-center justify-center gap-2 py-2 bg-theme-secondary/30 rounded-lg border border-theme-border">
          <Clock className="h-4 w-4 text-theme-accent-primary" />
          <span className="text-white font-medium">{formatTime(currentTime)}</span>
          {isPlaying && (
            <Badge variant="outline" className="bg-green-900 text-green-400 border-green-400 animate-pulse">
              PLAYING
            </Badge>
          )}
        </div>

        {/* Scrubber Timeline */}
        <div className="space-y-2">
          <div
            ref={scrubberRef}
            onClick={handleScrubberClick}
            className="relative h-10 bg-theme-secondary border-2 border-theme-border rounded-lg cursor-pointer hover:border-theme-accent-primary transition-colors"
          >
            {/* Progress bar */}
            <div
              className="absolute top-0 left-0 h-full bg-theme-accent-primary/30 rounded-l-md transition-all"
              style={{ width: `${scrubberPosition}%` }}
            />

            {/* Scrubber handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-theme-accent-primary border-2 border-white rounded-md shadow-lg transition-all"
              style={{ left: `calc(${scrubberPosition}% - 8px)` }}
            />

            {/* Time markers */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-between px-2 text-xs text-theme-subtle pointer-events-none">
              <span>{formatTime(startTime)}</span>
              <span>{formatTime(endTime)}</span>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Skip backward */}
          <Button
            onClick={skipBackward}
            disabled={gpsLogs.length === 0 || currentTime <= startTime}
            variant="outline"
            size="sm"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            onClick={togglePlayback}
            disabled={gpsLogs.length === 0}
            size="sm"
            className="px-6"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Play
              </>
            )}
          </Button>

          {/* Skip forward */}
          <Button
            onClick={skipForward}
            disabled={gpsLogs.length === 0 || currentTime >= endTime}
            variant="outline"
            size="sm"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Reset */}
          <Button
            onClick={resetPlayback}
            disabled={gpsLogs.length === 0}
            variant="outline"
            size="sm"
          >
            <Square className="h-4 w-4" />
          </Button>

          {/* Speed controls */}
          <div className="flex items-center gap-1 ml-4 border-l border-theme-border pl-4">
            <Gauge className="h-4 w-4 text-theme-subtle" />
            {([1, 2, 5, 10] as const).map((speed) => (
              <Button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                disabled={!isPlaying}
                variant={playbackSpeed === speed ? 'default' : 'outline'}
                size="sm"
                className="min-w-[3rem]"
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {gpsLogs.length > 0 && (
          <div className="flex items-center justify-center gap-4 text-sm text-theme-subtle">
            <span>{gpsLogs.length} GPS logs</span>
            <span>•</span>
            <span>{techStates.size} techs tracked</span>
            <span>•</span>
            <span>
              {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} min duration
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
