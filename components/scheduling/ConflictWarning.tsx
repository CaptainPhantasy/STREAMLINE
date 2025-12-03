'use client'

import { AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SchedulingConflict } from '@/types/scheduling'

interface ConflictWarningProps {
  conflicts: SchedulingConflict[]
  className?: string
}

export function ConflictWarning({ conflicts, className }: ConflictWarningProps) {
  if (conflicts.length === 0) {
    return null
  }

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'double_booking':
        return XCircle
      case 'outside_working_hours':
        return Clock
      default:
        return AlertTriangle
    }
  }

  const getConflictColor = (type: string) => {
    switch (type) {
      case 'double_booking':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'outside_working_hours':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      default:
        return 'bg-orange-50 border-orange-200 text-orange-900'
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {conflicts.map((conflict, idx) => {
        const Icon = getConflictIcon(conflict.conflict_type)
        const colorClass = getConflictColor(conflict.conflict_type)

        return (
          <div
            key={idx}
            className={cn('p-3 border rounded-lg flex items-start gap-2', colorClass)}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {conflict.conflict_type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm">{conflict.conflict_details}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

