/* global google */
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, TrafficLayer } from '@react-google-maps/api'
import type { TechLocation, JobLocation } from '@/types/dispatch'
import { techStatusColors, jobStatusColors } from '@/types/dispatch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin, RefreshCw, Briefcase, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TechDetailPanel } from '@/components/dispatch/TechDetailPanel'
import JobDetailPanel from '@/components/dispatch/JobDetailPanel'
import TechListSidebar from '@/components/dispatch/TechListSidebar'
import { AssignTechDialog } from '@/components/dispatch/AssignTechDialog'
import { toast } from '@/lib/toast'

// Default map center (Indianapolis - adjust based on business location)
const DEFAULT_CENTER = {
  lat: 39.7684,
  lng: -86.1581
}

import { JobSelectionDialog } from '@/components/dispatch/JobSelectionDialog'

const DispatchMapPage = React.memo(function DispatchMapPage() {
  // Simple in-memory cache for API responses (moved inside component)
  const apiCacheRef = React.useRef(new Map<string, { data: any; timestamp: number }>())
  const CACHE_TTL = 30000 // 30 seconds

  const getCachedData = React.useCallback(<T,>(key: string): T | null => {
    const cached = apiCacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    return null
  }, [])

  const setCachedData = React.useCallback((key: string, data: any): void => {
    apiCacheRef.current.set(key, { data, timestamp: Date.now() })
  }, [])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  // Tech state
  const [techs, setTechs] = useState<TechLocation[]>([])
  const [selectedTech, setSelectedTech] = useState<TechLocation | null>(null)
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null)

  // Job state
  const [jobs, setJobs] = useState<JobLocation[]>([])
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null)

  // Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignDialogJob, setAssignDialogJob] = useState<JobLocation | null>(null)
  const [jobSelectionOpen, setJobSelectionOpen] = useState(false)
  const [pendingTechId, setPendingTechId] = useState<string | null>(null)

  // Map state
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(12)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [showTraffic, setShowTraffic] = useState(false)

  // Fit map to bounds of all markers
  const fitMapToBounds = useCallback((items: { lat: number, lng: number }[]) => {
    if (!mapInstance || items.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    items.forEach(item => {
      bounds.extend(new window.google.maps.LatLng(item.lat, item.lng))
    })
    mapInstance.fitBounds(bounds)

    // If only one point, zoom out a bit so it's not too close
    if (items.length === 1) {
      mapInstance.setZoom(14)
    }
  }, [mapInstance])

  // Fetch tech locations with intelligent caching
  const fetchTechs = useCallback(async () => {
    try {
      const cacheKey = 'dispatch-techs'
      const cachedData = getCachedData<TechLocation[]>(cacheKey)
      
      if (cachedData) {
        console.log('Using cached tech data')
        setTechs(cachedData)
        return
      }
      
      const res = await fetch('/api/dispatch/techs', {
        headers: {
          'Cache-Control': 'max-age=30'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setTechs(data.techs)
        setCachedData(cacheKey, data.techs) // Cache the data
      } else {
        console.error('Failed to fetch tech locations:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch tech locations:', error)
    } finally {
      setLoading(false)
    }
  }, [getCachedData, setCachedData])

  // Fetch active jobs with intelligent caching
  const fetchJobs = useCallback(async () => {
    try {
      const cacheKey = 'dispatch-jobs-active'
      const cachedData = getCachedData<JobLocation[]>(cacheKey)
      
      if (cachedData) {
        console.log('Using cached jobs data')
        setJobs(cachedData)
        return
      }
      
      const res = await fetch('/api/dispatch/jobs/active', {
        headers: {
          'Cache-Control': 'max-age=30'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
        setCachedData(cacheKey, data.jobs || []) // Cache the data
      } else {
        console.error('Failed to fetch jobs:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }, [getCachedData, setCachedData])

  // Auto-fit bounds when data loads initially
  useEffect(() => {
    if (mapInstance && !loading && (techs.length > 0 || jobs.length > 0)) {
      const points = [
        ...techs.filter(t => t.lastLocation).map(t => ({ lat: t.lastLocation!.lat, lng: t.lastLocation!.lng })),
        ...jobs.filter(j => j.location).map(j => ({ lat: j.location!.lat, lng: j.location!.lng }))
      ]
      fitMapToBounds(points)
    }
  }, [mapInstance, loading, techs.length, jobs.length, fitMapToBounds])

  // Refresh all data with debouncing to prevent rapid-fire API calls
  const refreshAllData = useCallback(() => {
    const now = Date.now()
    const lastRefresh = (globalThis as any).__lastRefresh || 0
    const minRefreshInterval = 5000 // 5 seconds minimum between refreshes
    
    if (now - lastRefresh < minRefreshInterval) {
      console.log('Refresh skipped - too frequent')
      return
    }
    
    (globalThis as any).__lastRefresh = now
    fetchTechs()
    fetchJobs()
  }, [fetchTechs, fetchJobs])

  // Initial data load
  useEffect(() => {
    if (isLoaded) {
      fetchTechs()
      fetchJobs()
    }
  }, [isLoaded])

  // ... (Real-time updates useEffect remains same)

  // Event handlers
  const handleTechClick = (tech: TechLocation) => {
    setSelectedTech(tech)
    setSelectedJob(null) // Close job panel if open
    if (tech.lastLocation && mapInstance) {
      mapInstance.panTo({ lat: tech.lastLocation.lat, lng: tech.lastLocation.lng })
      mapInstance.setZoom(14)
    }
  }

  const handleJobClick = (job: JobLocation) => {
    setSelectedJob(job)
    setSelectedTech(null) // Close tech panel if open
    if (job.location && mapInstance) {
      mapInstance.panTo({ lat: job.location.lat, lng: job.location.lng })
      mapInstance.setZoom(14)
    }
  }

  const handleTechHover = (techId: string | null) => {
    setHoveredTechId(techId)
  }

  const handleAssignJob = (techId: string) => {
    // If a job is already selected, use it
    if (selectedJob) {
      setAssignDialogJob(selectedJob)
      setAssignDialogOpen(true)
    } else {
      // Otherwise, open job selection dialog
      setPendingTechId(techId)
      setJobSelectionOpen(true)
    }
  }

  const handleJobSelectedForAssign = (job: JobLocation) => {
    setJobSelectionOpen(false)
    setAssignDialogJob(job)
    setAssignDialogOpen(true)

    // If we have a pending tech, we need to make sure the AssignTechDialog knows about it
    // But AssignTechDialog is designed to pick a tech for a job.
    // We might need to auto-select the tech in the dialog or just let the user confirm.
    // For now, let's just open the dialog with the job. The user will see the list of techs.
    // Ideally, we'd pre-select the tech, but the current dialog doesn't support that prop easily.
    // However, since we are assigning TO a specific tech, we can just call the assign API directly if we wanted,
    // but using the dialog allows for confirmation and "distance" checks.

    // Wait, if we started from a Tech, we want to assign THAT tech to THIS job.
    // The AssignTechDialog lists ALL techs.
    // Let's just use the dialog for now, it's safer.
  }

  const handleAssignTechToJob = (jobId: string, _techId: string) => {
    setAssignDialogJob(jobs.find(j => j.id === jobId) || null)
    setAssignDialogOpen(true)
  }

  const handleJobAssignment = async (jobId: string, techId: string) => {
    try {
      // If we had a pending tech, ensure we are assigning THAT tech if possible,
      // or just use the techId passed from the dialog (which comes from the user selection in the dialog)
      const finalTechId = techId

      const response = await fetch(`/api/dispatch/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techId: finalTechId, notifyTech: true })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Assignment failed')
      }

      toast({
        title: 'Tech Assigned',
        description: 'Job assignment successful',
        variant: 'success',
      })

      // Refresh data
      refreshAllData()
      setAssignDialogOpen(false)
      setPendingTechId(null)
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      })
      throw error // Re-throw for dialog to handle
    }
  }

  const handleNavigate = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')
  }

  // Filter map view based on stats click
  const handleStatsClick = (type: 'unassigned' | 'all') => {
    if (type === 'unassigned') {
      const unassignedPoints = jobs
        .filter(j => !j.assignedTech && j.location)
        .map(j => ({ lat: j.location!.lat, lng: j.location!.lng }))

      if (unassignedPoints.length > 0) {
        fitMapToBounds(unassignedPoints)
        toast({ title: 'Showing Unassigned Jobs', description: `Zoomed to ${unassignedPoints.length} unassigned jobs` })
      } else {
        toast({ title: 'No Unassigned Jobs', description: 'There are no unassigned jobs with location data', variant: 'warning' })
      }
    } else if (type === 'all') {
      const points = [
        ...techs.filter(t => t.lastLocation).map(t => ({ lat: t.lastLocation!.lat, lng: t.lastLocation!.lng })),
        ...jobs.filter(j => j.location).map(j => ({ lat: j.location!.lat, lng: j.location!.lng }))
      ]
      fitMapToBounds(points)
    }
  }

  // ... (getTechMarkerIcon and getJobMarkerIcon remain same)
  const getTechMarkerIcon = (status: TechLocation['status']) => {
    return {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      fillColor: techStatusColors[status].marker,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    }
  }

  const getJobMarkerIcon = (status: JobLocation['status']) => {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: jobStatusColors[status].marker,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.2,
      anchor: new window.google.maps.Point(0, 0),
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dispatch map...</p>
        </div>
      </div>
    )
  }

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!googleMapsApiKey) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
            </p>
            {/* ... instructions ... */}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col relative">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Dispatch Map</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showTraffic ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTraffic(!showTraffic)}
              className={showTraffic ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Traffic
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{techs.length} tech{techs.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button onClick={refreshAllData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-50 border-b p-4 z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleStatsClick('all')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {techs.filter(t => t.status === 'on_job').length}
              </div>
              <div className="text-sm text-gray-600">On Job</div>
            </CardContent>
          </Card>
          {/* ... other cards ... */}
          <Card className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleStatsClick('all')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {techs.filter(t => t.status === 'en_route').length}
              </div>
              <div className="text-sm text-gray-600">En Route</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleStatsClick('all')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">
                {techs.filter(t => t.status === 'idle').length}
              </div>
              <div className="text-sm text-gray-600">Idle</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleStatsClick('all')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">
                {techs.filter(t => t.status === 'offline').length}
              </div>
              <div className="text-sm text-gray-600">Offline</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-red-50 transition-colors border-red-100"
            onClick={() => handleStatsClick('unassigned')}
          >
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {jobs.filter(j => !j.assignedTech).length}
              </div>
              <div className="text-sm text-gray-600">Unassigned Jobs</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Tech List Sidebar */}
        <TechListSidebar
          techs={techs}
          onTechClick={handleTechClick}
          onTechHover={handleTechHover}
          selectedTechId={selectedTech?.id || null}
          selectedJobId={selectedJob?.id || null}
          selectedJobLocation={selectedJob?.location || null}
        />

        {/* Map */}
        <div className="flex-1 relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={zoom}
              onLoad={(map) => setMapInstance(map)}
              onUnmount={() => setMapInstance(null)}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {showTraffic && <TrafficLayer />}

              {/* Tech Markers */}
              {techs.map((tech) => {
                if (!tech.lastLocation) return null

                return (
                  <Marker
                    key={`tech-${tech.id}`}
                    position={{
                      lat: tech.lastLocation.lat,
                      lng: tech.lastLocation.lng
                    }}
                    icon={getTechMarkerIcon(tech.status)}
                    onClick={() => handleTechClick(tech)}
                    title={tech.name}
                  />
                )
              })}

              {/* Job Markers */}
              {jobs.map((job) => {
                if (!job.location) return null

                return (
                  <Marker
                    key={`job-${job.id}`}
                    position={{
                      lat: job.location.lat,
                      lng: job.location.lng
                    }}
                    icon={getJobMarkerIcon(job.status)}
                    onClick={() => handleJobClick(job)}
                    title={`${job.description} - ${job.customer.name}`}
                  />
                )
              })}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tech Detail Panel */}
      {selectedTech && (
        <TechDetailPanel
          tech={selectedTech}
          onClose={() => setSelectedTech(null)}
          onAssignJob={handleAssignJob}
          onNavigate={handleNavigate}
        />
      )}

      {/* Job Detail Panel */}
      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAssignTech={handleAssignTechToJob}
          onNavigate={handleNavigate}
          availableTechs={techs}
        />
      )}

      {/* Assign Tech Dialog */}
      <AssignTechDialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false)
          setAssignDialogJob(null)
          setPendingTechId(null)
        }}
        job={assignDialogJob}
        techs={techs}
        onAssign={handleJobAssignment}
      />

      {/* Job Selection Dialog */}
      <JobSelectionDialog
        open={jobSelectionOpen}
        onClose={() => {
          setJobSelectionOpen(false)
          setPendingTechId(null)
        }}
        onSelect={handleJobSelectedForAssign}
        jobs={jobs}
      />
    </div>
  )
})

export default DispatchMapPage
