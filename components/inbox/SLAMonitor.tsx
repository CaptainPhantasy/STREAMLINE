'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SLAMonitorProps {
  slaStatus: 'on_track' | 'at_risk' | 'breached' | null
  slaTargetMinutes?: number | null
  lastMessageAt?: string | null
  className?: string
}

export function SLAMonitor({
  slaStatus,
  slaTargetMinutes,
  lastMessageAt,
  className,
}: SLAMonitorProps) {
  if (!slaStatus || !slaTargetMinutes) {
    return null
  }

  const getStatusConfig = () => {
    switch (slaStatus) {
      case 'on_track':
        return {
          icon: CheckCircle,
          label: 'On Track',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'at_risk':
        return {
          icon: AlertTriangle,
          label: 'At Risk',
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'breached':
        return {
          icon: XCircle,
          label: 'Breached',
          variant: 'default' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  const Icon = config.icon

  // Calculate time remaining/overdue
  let timeText = ''
  if (lastMessageAt) {
    const now = new Date()
    const lastMessage = new Date(lastMessageAt)
    const diffMinutes = Math.floor((now.getTime() - lastMessage.getTime()) / (1000 * 60))
    const remaining = slaTargetMinutes - diffMinutes

    if (remaining > 0) {
      timeText = `${remaining}m remaining`
    } else {
      timeText = `${Math.abs(remaining)}m overdue`
    }
  }

  return (
    <Badge
      variant={config.variant}
      className={cn('flex items-center gap-1.5', config.className, className)}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {timeText && <span className="text-xs">({timeText})</span>}
    </Badge>
  )
}

interface SLAMonitorStatsProps {
  stats: {
    total: number
    on_track: number
    at_risk: number
    breached: number
    on_track_percentage: number
    at_risk_percentage: number
    breached_percentage: number
  }
}

export function SLAMonitorStats({ stats }: SLAMonitorStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Status Overview</CardTitle>
        <CardDescription>Response time monitoring across all conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.on_track}</span>
            </div>
            <p className="text-sm text-gray-600">On Track</p>
            <p className="text-xs text-gray-500">{stats.on_track_percentage}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{stats.at_risk}</span>
            </div>
            <p className="text-sm text-gray-600">At Risk</p>
            <p className="text-xs text-gray-500">{stats.at_risk_percentage}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.breached}</span>
            </div>
            <p className="text-sm text-gray-600">Breached</p>
            <p className="text-xs text-gray-500">{stats.breached_percentage}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

