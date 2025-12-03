'use client'

import { useEffect, useState } from 'react'
import { X, Navigation, UserPlus, Phone, MessageSquare, MapPin, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { techStatusColors, type TechLocation } from '@/types/dispatch'
import { cn } from '@/lib/utils'

// Props interface
interface TechDetailPanelProps {
  tech: TechLocation
  onClose: () => void
  onAssignJob: (techId: string) => void
  onNavigate: (lat: number, lng: number) => void
}

// Activity log interface
interface ActivityLog {
  id: string
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
  eventType: string
  jobId?: string
}

// Stats interface
interface TechStats {
  jobsCompletedToday: number
  averageJobTimeMinutes: number
  totalDistanceTraveledMiles: number
  hoursWorkedToday: number
}

// Activity timeline item component
function ActivityTimelineItem({ log }: { log: ActivityLog }) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'arrival':
        return '🎯'
      case 'departure':
        return '🚗'
      case 'checkpoint':
        return '📍'
      default:
        return '📌'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCoords = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="text-xl" title={log.eventType}>
        {getEventIcon(log.eventType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatTime(log.timestamp)}
          </span>
          <span className="text-xs text-gray-500">
            ±{log.accuracy}m
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {formatCoords(log.latitude, log.longitude)}
        </div>
      </div>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// Error state component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Try Again
      </Button>
    </div>
  )
}

// Main component
export function TechDetailPanel({ tech, onClose, onAssignJob, onNavigate }: TechDetailPanelProps) {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<TechStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tech activity and stats
  const fetchTechData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch activity logs
      const activityRes = await fetch(`/api/dispatch/techs/${tech.id}/activity?limit=5`)
      if (!activityRes.ok) {
        throw new Error('Failed to fetch activity logs')
      }
      const activityData = await activityRes.json()
      setActivity(activityData.activity || [])

      // Fetch stats
      const statsRes = await fetch(`/api/dispatch/techs/${tech.id}/stats`)
      if (!statsRes.ok) {
        throw new Error('Failed to fetch tech stats')
      }
      const statsData = await statsRes.json()
      setStats(statsData.stats || null)
    } catch (err) {
      console.error('Error fetching tech data:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechData()
  }, [tech.id])

  // Handle navigation to tech location
  const handleNavigate = () => {
    if (tech.lastLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${tech.lastLocation.lat},${tech.lastLocation.lng}`
      window.open(url, '_blank')
      onNavigate(tech.lastLocation.lat, tech.lastLocation.lng)
    }
  }

  // Handle phone call
  const handleCall = () => {
    // In production, would need tech phone number from API
    window.location.href = 'tel:+1234567890'
  }

  // Handle SMS
  const handleSMS = () => {
    // In production, would need tech phone number from API
    window.location.href = 'sms:+1234567890'
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format time since last update
  const getTimeSinceUpdate = () => {
    if (!tech.lastLocation?.updatedAt) return 'Never'

    const now = new Date()
    const updated = new Date(tech.lastLocation.updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }

  // Get GPS accuracy indicator
  const getAccuracyIndicator = () => {
    if (!tech.lastLocation?.accuracy) return null

    const accuracy = tech.lastLocation.accuracy
    let color = 'text-green-500'
    let label = 'Excellent'

    if (accuracy > 50) {
      color = 'text-red-500'
      label = 'Poor'
    } else if (accuracy > 20) {
      color = 'text-yellow-500'
      label = 'Fair'
    } else if (accuracy > 10) {
      color = 'text-[var(--color-accent-primary)]'
      label = 'Good'
    }

    return (
      <div className="flex items-center gap-2 text-xs">
        <div className={cn('w-2 h-2 rounded-full', color.replace('text-', 'bg-'))} />
        <span className={color}>{label} GPS</span>
        <span className="text-gray-500">(±{accuracy}m)</span>
      </div>
    )
  }

  return (
    <>
      {/* Desktop: Slide-in panel from right */}
      <div className="hidden md:block fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-slide-in-right overflow-y-auto border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Tech Details
          </h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchTechData} />
          ) : (
            <div className="space-y-6">
              {/* Tech Profile */}
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={undefined} alt={tech.name} />
                  <AvatarFallback className="bg-[var(--badge-bg)] text-[var(--badge-text)] text-lg font-semibold">
                    {getInitials(tech.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                    {tech.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {tech.role === 'tech' ? 'Technician' : 'Sales'}
                    </Badge>
                    <Badge
                      className={cn(
                        'text-xs',
                        techStatusColors[tech.status].bg,
                        techStatusColors[tech.status].text
                      )}
                    >
                      {tech.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Current Job */}
              {tech.currentJob && (
                <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[var(--color-accent-primary)] mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          Current Job
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          {tech.currentJob.description}
                        </p>
                        <p className="text-xs text-[var(--color-accent-primary)] mt-1">
                          {tech.currentJob.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Info */}
              {tech.lastLocation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Last Known Location
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {getTimeSinceUpdate()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                        {tech.lastLocation.lat.toFixed(4)}, {tech.lastLocation.lng.toFixed(4)}
                      </span>
                    </div>
                    {getAccuracyIndicator()}
                  </div>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleNavigate}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/80"
                  disabled={!tech.lastLocation}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate to Tech
                </Button>
                <Button
                  onClick={() => onAssignJob(tech.id)}
                  variant="outline"
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Job
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleCall}
                    variant="outline"
                    size="sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={handleSMS}
                    variant="outline"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              {stats && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Today's Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Jobs Done</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.jobsCompletedToday}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-[var(--color-accent-primary)]" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Avg Time</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.averageJobTimeMinutes}
                          <span className="text-sm text-gray-500 ml-1">min</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Navigation className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Distance</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.totalDistanceTraveledMiles.toFixed(1)}
                          <span className="text-sm text-gray-500 ml-1">mi</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.hoursWorkedToday.toFixed(1)}
                          <span className="text-sm text-gray-500 ml-1">h</span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <Separator />

              {/* Recent Activity */}
              {activity.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Recent Activity
                  </h4>
                  <div className="space-y-1 divide-y divide-gray-200 dark:divide-gray-800">
                    {activity.map((log) => (
                      <ActivityTimelineItem key={log.id} log={log} />
                    ))}
                  </div>
                  {activity.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-50 animate-slide-in-bottom max-h-[85vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Tech Details
          </h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Same as desktop but with mobile padding */}
        <div className="p-4">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchTechData} />
          ) : (
            <div className="space-y-6">
              {/* Tech Profile */}
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={undefined} alt={tech.name} />
                  <AvatarFallback className="bg-[var(--badge-bg)] text-[var(--badge-text)] text-lg font-semibold">
                    {getInitials(tech.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                    {tech.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {tech.role === 'tech' ? 'Technician' : 'Sales'}
                    </Badge>
                    <Badge
                      className={cn(
                        'text-xs',
                        techStatusColors[tech.status].bg,
                        techStatusColors[tech.status].text
                      )}
                    >
                      {tech.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Current Job */}
              {tech.currentJob && (
                <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[var(--color-accent-primary)] mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          Current Job
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          {tech.currentJob.description}
                        </p>
                        <p className="text-xs text-[var(--color-accent-primary)] mt-1">
                          {tech.currentJob.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Info */}
              {tech.lastLocation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Last Known Location
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {getTimeSinceUpdate()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                        {tech.lastLocation.lat.toFixed(4)}, {tech.lastLocation.lng.toFixed(4)}
                      </span>
                    </div>
                    {getAccuracyIndicator()}
                  </div>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleNavigate}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/80"
                  disabled={!tech.lastLocation}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate to Tech
                </Button>
                <Button
                  onClick={() => onAssignJob(tech.id)}
                  variant="outline"
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Job
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleCall}
                    variant="outline"
                    size="sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={handleSMS}
                    variant="outline"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              {stats && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Today's Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Jobs Done</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.jobsCompletedToday}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-[var(--color-accent-primary)]" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Avg Time</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.averageJobTimeMinutes}
                          <span className="text-sm text-gray-500 ml-1">min</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Navigation className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Distance</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.totalDistanceTraveledMiles.toFixed(1)}
                          <span className="text-sm text-gray-500 ml-1">mi</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.hoursWorkedToday.toFixed(1)}
                          <span className="text-sm text-gray-500 ml-1">h</span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <Separator />

              {/* Recent Activity */}
              {activity.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Recent Activity
                  </h4>
                  <div className="space-y-1 divide-y divide-gray-200 dark:divide-gray-800">
                    {activity.map((log) => (
                      <ActivityTimelineItem key={log.id} log={log} />
                    ))}
                  </div>
                  {activity.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />
    </>
  )
}
