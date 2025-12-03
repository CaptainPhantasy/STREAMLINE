'use client'

import { useState } from 'react'
import { Clock, LogIn, LogOut, Coffee, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeClockCardProps } from '@/lib/types/tech-mobile'

/**
 * TimeClockCard - Clock in/out widget for tech mobile
 *
 * Features:
 * - Big clock in/out button (80px height)
 * - Current status display
 * - Daily hours total
 * - Location tracking on clock events
 * - Break timer
 *
 * @example
 * ```tsx
 * <TimeClockCard
 *   currentStatus="clocked_out"
 *   todayHours={6.5}
 *   onClockIn={handleClockIn}
 *   onClockOut={handleClockOut}
 *   trackLocation
 * />
 * ```
 */
export function TimeClockCard({
  currentStatus,
  lastEntry,
  todayHours = 0,
  onClockIn,
  onClockOut,
  onBreakStart,
  onBreakEnd,
  trackLocation = true,
  className,
}: TimeClockCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsProcessing(true)
    try {
      await action()
    } catch (error) {
      console.error('Time clock action failed:', error)
      alert('Failed to update time clock')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'clocked_in':
        return 'bg-green-900/50 border-green-500'
      case 'on_break':
        return 'bg-amber-900/50 border-amber-500'
      default:
        return 'bg-gray-900/50 border-gray-600'
    }
  }

  const getStatusLabel = () => {
    switch (currentStatus) {
      case 'clocked_in':
        return '✅ CLOCKED IN'
      case 'on_break':
        return '☕ ON BREAK'
      default:
        return '🚫 CLOCKED OUT'
    }
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getTimeWorkedToday = () => {
    if (!lastEntry || currentStatus === 'clocked_out') {
      return todayHours
    }

    // Calculate time since last clock in
    const now = new Date()
    const lastTime = new Date(lastEntry.timestamp)
    const hoursSince = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60)

    return todayHours + hoursSince
  }

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-6',
        getStatusColor(),
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-white" />
          <div>
            <div className="text-sm font-bold text-white tracking-wider">
              {getStatusLabel()}
            </div>
            {lastEntry && (
              <div className="text-xs text-gray-400">
                Since {new Date(lastEntry.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Today's Hours */}
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {formatHours(getTimeWorkedToday())}
          </div>
          <div className="text-xs text-gray-400">Today</div>
        </div>
      </div>

      {/* Location Indicator */}
      {trackLocation && (
        <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span>Location tracking enabled</span>
        </div>
      )}

      {/* Primary Action Button - 80px height */}
      {currentStatus === 'clocked_out' ? (
        <button
          onClick={() => handleAction(onClockIn || (() => {}))}
          disabled={isProcessing}
          className={cn(
            'w-full h-20 rounded-2xl',
            'flex items-center justify-center gap-4',
            'font-bold text-xl uppercase',
            'transition-all duration-150 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-green-600 hover:bg-green-700 text-white'
          )}
        >
          <LogIn className="w-8 h-8" />
          CLOCK IN
        </button>
      ) : (
        <div className="space-y-3">
          {/* Clock Out Button */}
          <button
            onClick={() => handleAction(onClockOut || (() => {}))}
            disabled={isProcessing}
            className={cn(
              'w-full h-20 rounded-2xl',
              'flex items-center justify-center gap-4',
              'font-bold text-xl uppercase',
              'transition-all duration-150 active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            <LogOut className="w-8 h-8" />
            CLOCK OUT
          </button>

          {/* Break Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {currentStatus === 'clocked_in' ? (
              <button
                onClick={() => handleAction(onBreakStart || (() => {}))}
                disabled={isProcessing}
                className={cn(
                  'h-14 rounded-xl',
                  'flex items-center justify-center gap-2',
                  'font-bold text-base',
                  'transition-all duration-150 active:scale-[0.98]',
                  'disabled:opacity-50',
                  'bg-amber-600 hover:bg-amber-700 text-white'
                )}
              >
                <Coffee className="w-5 h-5" />
                START BREAK
              </button>
            ) : (
              <button
                onClick={() => handleAction(onBreakEnd || (() => {}))}
                disabled={isProcessing}
                className={cn(
                  'h-14 rounded-xl col-span-2',
                  'flex items-center justify-center gap-2',
                  'font-bold text-base',
                  'transition-all duration-150 active:scale-[0.98]',
                  'disabled:opacity-50',
                  'bg-green-600 hover:bg-green-700 text-white'
                )}
              >
                <Coffee className="w-5 h-5" />
                END BREAK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * CompactTimeClock - Smaller version for dashboard
 */
export function CompactTimeClock({
  currentStatus,
  todayHours,
  onClockToggle,
  className,
}: {
  currentStatus: TimeClockCardProps['currentStatus']
  todayHours: number
  onClockToggle?: () => void
  className?: string
}) {
  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  return (
    <button
      onClick={onClockToggle}
      className={cn(
        'w-full h-16 px-4 rounded-xl',
        'flex items-center justify-between',
        'transition-all active:scale-95',
        currentStatus === 'clocked_in'
          ? 'bg-green-900/50 border-2 border-green-500'
          : 'bg-gray-800 border-2 border-gray-700',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5" />
        <span className="font-bold">
          {currentStatus === 'clocked_in' ? 'Clocked In' : 'Clocked Out'}
        </span>
      </div>
      <div className="text-right">
        <div className="font-bold">{formatHours(todayHours)}</div>
        <div className="text-xs text-gray-400">Today</div>
      </div>
    </button>
  )
}

export type { TimeClockCardProps }
