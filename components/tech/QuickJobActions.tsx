'use client'

import { Play, CheckCircle, Phone, Camera, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuickJobActionsProps } from '@/lib/types/tech-mobile'

/**
 * QuickJobActions - Big button action bar for tech mobile
 *
 * Features:
 * - 80px height buttons (extra large for glove use)
 * - High contrast colors for outdoor visibility
 * - Context-aware button states based on job status
 * - Single-tap actions for speed
 * - Visual feedback on press
 *
 * @example
 * ```tsx
 * <QuickJobActions
 *   jobId={job.id}
 *   jobStatus={job.status}
 *   customerPhone={job.contact.phone}
 *   onStartJob={handleStart}
 *   onCompleteJob={handleComplete}
 *   onCallCustomer={handleCall}
 *   onAddPhotos={handlePhotos}
 *   onAddNotes={handleNotes}
 * />
 * ```
 */
export function QuickJobActions({
  jobId,
  jobStatus,
  customerPhone,
  onStartJob,
  onCompleteJob,
  onCallCustomer,
  onAddPhotos,
  onAddNotes,
  disabled = false,
  className,
}: QuickJobActionsProps) {
  const isScheduled = jobStatus === 'scheduled'
  const isEnRoute = jobStatus === 'en_route'
  const isInProgress = jobStatus === 'in_progress'
  const isCompleted = jobStatus === 'completed'

  return (
    <div className={cn('space-y-3', className)}>
      {/* Primary Action - Start or Complete Job */}
      {!isCompleted && (
        <button
          onClick={isInProgress ? onCompleteJob : onStartJob}
          disabled={disabled}
          className={cn(
            'w-full h-20 px-6 rounded-2xl',
            'flex items-center justify-center gap-4',
            'font-bold text-xl uppercase tracking-wide',
            'transition-all duration-150 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'border-2',
            isInProgress
              ? 'bg-green-600 border-green-500 text-white hover:bg-green-700'
              : 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/80'
          )}
        >
          {isInProgress ? (
            <>
              <CheckCircle className="w-8 h-8" />
              COMPLETE JOB
            </>
          ) : (
            <>
              <Play className="w-8 h-8" />
              START JOB
            </>
          )}
        </button>
      )}

      {/* Secondary Actions Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Call Customer */}
        <button
          onClick={onCallCustomer}
          disabled={disabled}
          className={cn(
            'h-20 px-4 rounded-xl',
            'flex flex-col items-center justify-center gap-1',
            'font-bold text-base',
            'transition-all duration-150 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-green-600 hover:bg-green-700 text-white'
          )}
        >
          <Phone className="w-6 h-6" />
          <span>CALL</span>
        </button>

        {/* Add Photos */}
        <button
          onClick={onAddPhotos}
          disabled={disabled || !isInProgress}
          className={cn(
            'h-20 px-4 rounded-xl',
            'flex flex-col items-center justify-center gap-1',
            'font-bold text-base',
            'transition-all duration-150 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isInProgress
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-gray-700 text-gray-400'
          )}
        >
          <Camera className="w-6 h-6" />
          <span>PHOTOS</span>
        </button>
      </div>

      {/* Add Notes */}
      <button
        onClick={onAddNotes}
        disabled={disabled}
        className={cn(
          'w-full h-16 px-6 rounded-xl',
          'flex items-center justify-center gap-3',
          'font-bold text-base',
          'transition-all duration-150 active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-gray-700 hover:bg-gray-600 text-white'
        )}
      >
        <MessageSquare className="w-5 h-5" />
        ADD NOTES
      </button>
    </div>
  )
}

/**
 * CompactJobActions - Smaller action bar for list views
 */
export function CompactJobActions({
  jobStatus,
  onStart,
  onCall,
  className,
}: {
  jobStatus: string
  onStart?: () => void
  onCall?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-2', className)}>
      {jobStatus !== 'completed' && (
        <button
          onClick={onStart}
          className="flex-1 h-12 px-4 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/80 rounded-lg font-bold text-sm active:scale-95 transition-all"
        >
          {jobStatus === 'in_progress' ? 'CONTINUE' : 'START'}
        </button>
      )}
      <button
        onClick={onCall}
        className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center active:scale-95 transition-all"
      >
        <Phone className="w-5 h-5" />
      </button>
    </div>
  )
}

export type { QuickJobActionsProps }
