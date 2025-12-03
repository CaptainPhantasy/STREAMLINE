'use client'

import { useMemo, useState } from 'react'
import { X, MapPin, Phone, User, Calendar, Clock, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { JobLocation, TechLocation } from '@/types/dispatch'
import { calculateDistance } from '@/lib/gps/tracker'

interface JobDetailPanelProps {
  job: JobLocation
  onClose: () => void
  onAssignTech: (jobId: string, techId: string) => void
  onNavigate: (lat: number, lng: number) => void
  availableTechs: TechLocation[]
}

interface TechWithDistance extends TechLocation {
  distanceInMiles: number
  etaMinutes: number
}

// Priority colors
const priorityColors = {
  low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300' },
  normal: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300' },
  urgent: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', border: 'border-red-300' },
}

// Status colors
const statusColors = {
  scheduled: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
  en_route: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  in_progress: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
}

// Distance color coding
const getDistanceColor = (distanceInMiles: number) => {
  if (distanceInMiles < 5) return 'text-green-600 dark:text-green-400'
  if (distanceInMiles < 10) return 'text-yellow-600 dark:text-yellow-400'
  if (distanceInMiles < 20) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

const getDistanceBgColor = (distanceInMiles: number) => {
  if (distanceInMiles < 5) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
  if (distanceInMiles < 10) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
  if (distanceInMiles < 20) return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
  return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
}

export default function JobDetailPanel({
  job,
  onClose,
  onAssignTech,
  onNavigate,
  availableTechs,
}: JobDetailPanelProps) {
  const [assigningTechId, setAssigningTechId] = useState<string | null>(null)

  // Calculate distances and ETAs for all techs
  const techsWithDistance = useMemo<TechWithDistance[]>(() => {
    if (!job.location) return []

    const avgSpeedMph = 30 // City driving average

    return availableTechs
      .filter(tech => tech.lastLocation) // Only techs with GPS data
      .map(tech => {
        const distanceInMeters = calculateDistance(
          tech.lastLocation!.lat,
          tech.lastLocation!.lng,
          job.location.lat,
          job.location.lng
        )
        const distanceInMiles = distanceInMeters / 1609.34 // Convert meters to miles
        const etaMinutes = Math.round((distanceInMiles / avgSpeedMph) * 60)

        return {
          ...tech,
          distanceInMiles,
          etaMinutes,
        }
      })
      .sort((a, b) => a.distanceInMiles - b.distanceInMiles) // Sort by nearest first
  }, [job.location, availableTechs])

  const handleAssignClick = async (techId: string) => {
    setAssigningTechId(techId)
    try {
      await onAssignTech(job.id, techId)
    } finally {
      setAssigningTechId(null)
    }
  }

  const priority = (job as any).priority || 'normal'
  const priorityColor = priorityColors[priority as keyof typeof priorityColors] || priorityColors.normal

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-gray-900 text-white shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-bold">Job Details</h2>
            <p className="text-sm text-gray-400">ID: {job.id.slice(0, 8)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Job Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Job Information</span>
                <div className="flex gap-2">
                  <Badge className={`${priorityColor.bg} ${priorityColor.text}`}>
                    {priority.toUpperCase()}
                  </Badge>
                  <Badge className={`${statusColors[job.status].bg} ${statusColors[job.status].text}`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="font-medium text-white">{job.description}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium text-white">{job.customer.name}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="font-medium text-white">{job.customer.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Scheduled</p>
                    <p className="font-medium text-white">
                      {new Date(job.scheduledStart).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {job.assignedTech && (
                <>
                  <Separator className="bg-gray-700" />
                  <div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-1 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-500">Assigned Technician</p>
                        <p className="font-medium text-white">{job.assignedTech.name}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Contact */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Customer Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-gray-600 hover:bg-gray-700 text-white"
                onClick={() => window.open(`tel:${job.customer.phone}`, '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                {job.customer.phone}
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onNavigate(job.location.lat, job.location.lng)}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate to Job
              </Button>
            </CardContent>
          </Card>

          {/* Available Technicians */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Available Technicians ({techsWithDistance.length})
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Sorted by distance (nearest first)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {techsWithDistance.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No technicians with GPS data available</p>
                </div>
              ) : (
                techsWithDistance.map((tech) => (
                  <Card
                    key={tech.id}
                    className={`border transition-all hover:shadow-lg ${getDistanceBgColor(tech.distanceInMiles)}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {tech.name}
                          </h3>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {tech.role.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getDistanceColor(tech.distanceInMiles)}`}>
                            {tech.distanceInMiles.toFixed(1)} mi
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>~{tech.etaMinutes} min ETA</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${
                            tech.status === 'idle'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : tech.status === 'on_job'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}
                        >
                          {tech.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {tech.currentJob && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            On: {tech.currentJob.description}
                          </span>
                        )}
                      </div>

                      {tech.lastLocation && (
                        <p className="text-xs text-gray-500">
                          Last seen: {new Date(tech.lastLocation.updatedAt).toLocaleTimeString()}
                        </p>
                      )}

                      <Button
                        className={`w-full ${
                          tech.status === 'idle'
                            ? 'bg-green-600 hover:bg-green-700'
                            : tech.status === 'on_job'
                            ? 'bg-gray-500 hover:bg-gray-600'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                        onClick={() => handleAssignClick(tech.id)}
                        disabled={assigningTechId === tech.id || tech.status === 'offline'}
                      >
                        {assigningTechId === tech.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Assign to {tech.name.split(' ')[0]}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Distance Legend */}
      <div className="border-t border-gray-700 bg-gray-800 p-4">
        <p className="text-xs text-gray-400 mb-2 font-semibold">Distance Color Legend:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">&lt; 5 miles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-300">5-10 miles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-300">10-20 miles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">&gt; 20 miles</span>
          </div>
        </div>
      </div>
    </div>
  )
}
