'use client'

import { MapPin, Clock, Phone, Navigation, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TechJobCardProps } from '@/lib/types/tech-mobile'

/**
 * TechJobCard - Large job card optimized for mobile field use
 *
 * Features:
 * - 60px+ touch targets for glove use
 * - High contrast colors for outdoor visibility
 * - Swipe actions (start, complete, call, navigate)
 * - Status badges with clear visual indicators
 * - Large, readable text (16px base)
 *
 * @example
 * ```tsx
 * <TechJobCard
 *   job={jobData}
 *   onJobClick={(job) => router.push(`/m/tech/jobs/${job.id}`)}
 *   onCallCustomer={(phone) => window.location.href = `tel:${phone}`}
 *   showActions
 * />
 * ```
 */
export function TechJobCard({
  job,
  onJobClick,
  onCallCustomer,
  onNavigate,
  showActions = true,
  className,
}: TechJobCardProps) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-900/50 border-blue-500 text-blue-400',
      en_route: 'bg-purple-900/50 border-purple-500 text-purple-400',
      in_progress: 'bg-yellow-900/50 border-yellow-500 text-yellow-400',
      completed: 'bg-green-900/50 border-green-500 text-green-400',
      cancelled: 'bg-gray-900/50 border-gray-500 text-gray-400',
    }
    return colors[status as keyof typeof colors] || colors.scheduled
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: '📅 SCHEDULED',
      en_route: '🚗 EN ROUTE',
      in_progress: '🔧 IN PROGRESS',
      completed: '✅ COMPLETED',
      cancelled: '❌ CANCELLED',
    }
    return labels[status as keyof typeof labels] || status.toUpperCase()
  }

  const getPriorityColor = (priority?: string) => {
    if (!priority) return ''
    const colors = {
      low: 'bg-gray-600',
      medium: 'bg-blue-600',
      high: 'bg-orange-600',
      urgent: 'bg-red-600 animate-pulse',
    }
    return colors[priority as keyof typeof colors] || ''
  }

  const handleCardClick = () => {
    if (onJobClick) {
      onJobClick(job)
    }
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCallCustomer) {
      onCallCustomer(job.contact.phone)
    }
  }

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onNavigate) {
      onNavigate(job.contact.address)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'rounded-2xl border-2 p-6',
        'active:scale-[0.98] transition-all duration-150',
        'min-h-[180px]', // Ensure large touch target
        getStatusColor(job.status),
        onJobClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Status Badge */}
          <div className="text-sm font-bold mb-2 tracking-wider">
            {getStatusLabel(job.status)}
          </div>

          {/* Customer Name - Large and Bold */}
          <h3 className="text-2xl font-bold mb-1 leading-tight">
            {job.contact.firstName} {job.contact.lastName}
          </h3>

          {/* Job Description */}
          <p className="text-base text-gray-300 mb-3 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Priority Badge */}
        {job.priority && (
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase ml-3',
              getPriorityColor(job.priority)
            )}
          >
            {job.priority}
          </div>
        )}
      </div>

      {/* Location & Time Info */}
      <div className="space-y-2 mb-4">
        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400" />
          <span className="text-base text-gray-300 leading-relaxed">
            {job.contact.address}
          </span>
        </div>

        {/* Scheduled Time */}
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 flex-shrink-0 text-gray-400" />
          <span className="text-base text-gray-300">
            {formatTime(job.scheduledStart)}
            {job.estimatedDuration && (
              <span className="text-gray-500 ml-2">
                • {job.estimatedDuration} min
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
          {/* Call Button - 60px height */}
          <button
            onClick={handleCall}
            className={cn(
              'flex-1 min-h-[60px] px-4 py-3',
              'bg-green-600 hover:bg-green-700',
              'rounded-xl font-bold text-base',
              'flex items-center justify-center gap-2',
              'active:scale-95 transition-all'
            )}
          >
            <Phone className="w-5 h-5" />
            CALL
          </button>

          {/* Navigate Button - 60px height */}
          {job.location && (
            <button
              onClick={handleNavigate}
              className={cn(
                'flex-1 min-h-[60px] px-4 py-3',
                'bg-blue-600 hover:bg-blue-700',
                'rounded-xl font-bold text-base',
                'flex items-center justify-center gap-2',
                'active:scale-95 transition-all'
              )}
            >
              <Navigation className="w-5 h-5" />
              NAVIGATE
            </button>
          )}

          {/* View Details Arrow */}
          <button
            onClick={handleCardClick}
            className={cn(
              'min-h-[60px] min-w-[60px] px-4',
              'bg-gray-700 hover:bg-gray-600',
              'rounded-xl',
              'flex items-center justify-center',
              'active:scale-95 transition-all'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * TechJobCardSkeleton - Loading state for TechJobCard
 */
export function TechJobCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-gray-700 bg-gray-800 p-6 min-h-[180px] animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-gray-700 rounded w-24" />
        <div className="h-8 bg-gray-700 rounded w-48" />
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="flex gap-3 mt-6">
          <div className="flex-1 h-[60px] bg-gray-700 rounded-xl" />
          <div className="flex-1 h-[60px] bg-gray-700 rounded-xl" />
          <div className="w-[60px] h-[60px] bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export type { TechJobCardProps }
