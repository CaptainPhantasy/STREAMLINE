'use client'

/**
 * LeadCard - Mobile lead card with swipe actions
 *
 * Large touch-friendly card for mobile sales workflow.
 *
 * @example
 * ```tsx
 * <LeadCard
 *   lead={leadData}
 *   onSwipeCall={(lead) => console.log('Call', lead)}
 *   onClick={(lead) => console.log('View', lead)}
 * />
 * ```
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Phone, Mail, Calendar, DollarSign, TrendingUp, Building2, User } from 'lucide-react'
import type { LeadCardProps } from '@/lib/types/sales'

export function LeadCard({ lead, onSwipeCall, onSwipeEmail, onSwipeMeet, onClick, className }: LeadCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: 'bg-gray-600',
      contacted: 'bg-blue-600',
      qualified: 'bg-purple-600',
      proposal: 'bg-yellow-600',
      negotiation: 'bg-orange-600',
      closed_won: 'bg-green-600',
      closed_lost: 'bg-red-600',
    }
    return colors[stage] || 'bg-gray-600'
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - touchStart
    setSwipeOffset(Math.max(-200, Math.min(200, diff)))
  }

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 80) {
      // Trigger swipe action
      if (swipeOffset > 0) {
        onSwipeCall?.(lead)
      } else if (swipeOffset < -120) {
        onSwipeMeet?.(lead)
      } else {
        onSwipeEmail?.(lead)
      }
    }

    // Reset
    setSwipeOffset(0)
    setTouchStart(null)
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-green-400">
          <Phone className="w-6 h-6" />
          <span className="font-semibold">Call</span>
        </div>
        <div className="flex items-center gap-2 text-blue-400">
          <Mail className="w-6 h-6" />
          <span className="font-semibold">Email</span>
        </div>
        <div className="flex items-center gap-2 text-purple-400">
          <Calendar className="w-6 h-6" />
          <span className="font-semibold">Meet</span>
        </div>
      </div>

      {/* Main Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onClick?.(lead)}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={cn(
          'bg-gray-800 rounded-xl p-5 shadow-lg transition-transform cursor-pointer hover:bg-gray-750',
          swipeOffset !== 0 && 'transition-none'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate mb-1">{lead.name}</h3>
            {lead.company && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Building2 className="w-4 h-4" />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
          </div>
          <div className={cn('px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0 ml-2', getStageColor(lead.stage))}>
            {lead.stage.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Value & Probability */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2 text-green-400">
            <DollarSign className="w-5 h-5" />
            <span className="text-xl font-bold">{formatCurrency(lead.value)}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">{Math.round(lead.probability)}%</span>
          </div>
        </div>

        {/* Next Action */}
        <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Calendar className="w-3 h-3" />
            <span>Next Action</span>
          </div>
          <p className="text-white text-sm font-semibold">{lead.next_action}</p>
          {lead.next_action_date && (
            <p className="text-gray-400 text-xs mt-1">
              Due: {new Date(lead.next_action_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {lead.source && (
            <span>Source: {lead.source}</span>
          )}
          {lead.assigned_to && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{lead.assigned_to}</span>
            </div>
          )}
        </div>

        {/* Swipe Hint */}
        {swipeOffset === 0 && (
          <div className="text-center text-gray-600 text-xs mt-2">
            Swipe left or right for quick actions
          </div>
        )}
      </div>
    </div>
  )
}

export default LeadCard
