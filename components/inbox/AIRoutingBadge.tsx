'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIRoutingBadgeProps {
  routedTo?: string | null
  confidence?: number | null
  routedUserName?: string | null
  className?: string
}

export function AIRoutingBadge({
  routedTo,
  confidence,
  routedUserName,
  className,
}: AIRoutingBadgeProps) {
  if (!routedTo) {
    return null
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (conf >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5',
        confidence ? getConfidenceColor(confidence) : 'bg-gray-100 text-gray-800',
        className
      )}
      title={`AI routed to ${routedUserName || 'user'} (${confidence || 0}% confidence)`}
    >
      <Sparkles className="w-3 h-3" />
      <span className="text-xs">
        {routedUserName ? `AI: ${routedUserName}` : 'AI Routed'}
      </span>
      {confidence !== null && confidence !== undefined && (
        <span className="text-xs opacity-75">({confidence}%)</span>
      )}
    </Badge>
  )
}

