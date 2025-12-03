'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Clock, User, Phone, Wrench, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Script from 'next/script'

interface TechLocation {
  id: string
  techName: string
  latitude: number
  longitude: number
  currentJob?: {
    id: string
    title: string
    address: string
    status: string
  }
  lastUpdate: string
  status: 'available' | 'on_job' | 'traveling' | 'offline'
}

interface JobLocation {
  id: string
  title: string
  address: string
  latitude: number
  longitude: number
  status: string
  assignedTech?: string
}

export default function TechMapPage() {
  const [techs, setTechs] = useState<TechLocation[]>([])
  const [jobs, setJobs] = useState<JobLocation[]>([])
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const techMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const jobMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const userMarkerRef = useRef<google.maps.Marker | null>(null)

  useEffect(() => {
    fetchTechLocations()
    fetchJobLocations()
    getUserLocation()

    const interval = setInterval(() => {
      fetchTechLocations()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (googleMapsLoaded) {
      initializeMap()
    }
  }, [googleMapsLoaded, techs, jobs, userLocation])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(newLocation)

          if (googleMapRef.current && window.google) {
            googleMapRef.current.panTo(newLocation)
            googleMapRef.current.setZoom(15)

            if (userMarkerRef.current) {
              userMarkerRef.current.setMap(null)
            }

            const marker = new google.maps.Marker({
              position: newLocation,
              map: googleMapRef.current,
              title: 'My Location',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#8b5cf6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
              },
              zIndex: 1000
            })

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="color: #1f2937; padding: 8px;">
                  <h3 style="font-weight: 600; margin-bottom: 4px;">📍 My Location</h3>
                  <p style="font-size: 12px; color: #6b7280;">
                    Dispatch View
                  </p>
                </div>
              `
            })

            marker.addListener('click', () => {
              infoWindow.open(googleMapRef.current!, marker)
            })

            userMarkerRef.current = marker
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setUserLocation({
            lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '39.768403'),
            lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-86.158068')
          })
        }
      )
    } else {
      setUserLocation({
        lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '39.768403'),
        lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-86.158068')
      })
    }
  }

  const fetchTechLocations = async () => {
    try {
      console.log('Fetching tech locations...')
      const res = await fetch('/api/techs/locations')
      console.log('Tech locations response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Tech locations data:', data)
        setTechs(data.techs || [])
      } else {
        const errorData = await res.json()
        console.error('Failed to fetch tech locations:', errorData)
        setTechs([])
      }
    } catch (error) {
      console.error('Failed to fetch tech locations:', error)
      setTechs([])
    }
  }

  const fetchJobLocations = async () => {
    try {
      console.log('Fetching job locations...')
      const res = await fetch('/api/jobs/locations')
      console.log('Job locations response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Job locations data:', data)
        setJobs(data.jobs || [])
      } else {
        const errorData = await res.json()
        console.error('Failed to fetch job locations:', errorData)
        setJobs([])
      }
    } catch (error) {
      console.error('Failed to fetch job locations:', error)
      setJobs([])
    }
  }

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.error('Map ref not available')
      setMapLoading(false)
      return
    }

    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded')
      setMapLoading(false)
      return
    }

    try {
      const center = userLocation || {
        lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '39.768403'),
        lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-86.158068')
      }

      if (!googleMapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM || '12'),
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a1a' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1a1a1a' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca3af' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f172a' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#374151' }]
            }
          ]
        })
        googleMapRef.current = map
      }

      techMarkersRef.current.forEach(marker => marker.setMap(null))
      techMarkersRef.current.clear()

      techs.forEach((tech) => {
        const marker = new google.maps.Marker({
          position: { lat: tech.latitude, lng: tech.longitude },
          map: googleMapRef.current!,
          title: tech.techName,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: tech.status === 'available' ? '#22c55e' :
                       tech.status === 'on_job' ? '#3b82f6' :
                       tech.status === 'traveling' ? '#eab308' : '#6b7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color: #1f2937; padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${tech.techName}</h3>
              <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                Status: ${tech.status.replace('_', ' ').toUpperCase()}
              </p>
              ${tech.currentJob ? `
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">
                  <strong>Current Job:</strong> ${tech.currentJob.title}
                </p>
                <p style="font-size: 11px; color: #9ca3af;">
                  ${tech.currentJob.address}
                </p>
              ` : ''}
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current!, marker)
          setSelectedTech(tech.id)
        })

        techMarkersRef.current.set(tech.id, marker)
      })

      jobMarkersRef.current.forEach(marker => marker.setMap(null))
      jobMarkersRef.current.clear()

      jobs.filter(j => !j.assignedTech).forEach((job) => {
        const marker = new google.maps.Marker({
          position: { lat: job.latitude, lng: job.longitude },
          map: googleMapRef.current!,
          title: job.title,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: '#f97316',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color: #1f2937; padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${job.title}</h3>
              <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                <strong>Status:</strong> UNASSIGNED
              </p>
              <p style="font-size: 11px; color: #9ca3af;">
                ${job.address}
              </p>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current!, marker)
        })

        jobMarkersRef.current.set(job.id, marker)
      })

      console.log('Map initialized successfully')
      setMapLoading(false)
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-700 border-green-300',
      on_job: 'bg-blue-100 text-blue-700 border-blue-300',
      traveling: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      offline: 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colors[status as keyof typeof colors] || colors.offline
  }

  const centerOnTech = (tech: TechLocation) => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: tech.latitude, lng: tech.longitude })
      googleMapRef.current.setZoom(15)
      setSelectedTech(tech.id)
      
      const marker = techMarkersRef.current.get(tech.id)
      if (marker) {
        google.maps.event.trigger(marker, 'click')
      }
    }
  }

  const centerOnJob = (job: JobLocation) => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: job.latitude, lng: job.longitude })
      googleMapRef.current.setZoom(15)
      
      const marker = jobMarkersRef.current.get(job.id)
      if (marker) {
        google.maps.event.trigger(marker, 'click')
      }
    }
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        onLoad={() => {
          console.log('Google Maps loaded')
          setGoogleMapsLoaded(true)
        }}
        onError={(e) => {
          console.error('Failed to load Google Maps:', e)
          setMapLoading(false)
        }}
      />
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
          <div>
            <h1 className="text-lg font-semibold text-theme-primary">Tech Tracking Map</h1>
            <p className="text-xs text-theme-secondary">
              Real-time location tracking for field technicians
            </p>
          </div>
          <Button
            onClick={getUserLocation}
            variant="outline"
            className="border-theme-border"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Update My Location
          </Button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative bg-gray-900">
            <div 
              ref={mapRef} 
              className="absolute inset-0 w-full h-full"
            />
            
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-theme-accent-primary mx-auto mb-4" />
                  <p className="text-sm text-theme-secondary">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          <aside className="w-96 border-l border-theme-border bg-theme-surface overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-theme-primary mb-3">Active Technicians ({techs.length})</h3>
                <div className="space-y-2">
                  {techs.map((tech) => (
                    <Card
                      key={tech.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedTech === tech.id
                          ? 'border-theme-accent-primary bg-theme-accent-secondary/20'
                          : 'border-theme-border hover:border-theme-accent-primary'
                      }`}
                      onClick={() => centerOnTech(tech)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-theme-accent-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-theme-accent-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-theme-primary">{tech.techName}</p>
                              <p className="text-xs text-theme-secondary flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(tech.lastUpdate).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(tech.status)} border font-semibold text-xs`}>
                            {tech.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {tech.currentJob && (
                          <div className="mt-3 p-2 bg-gray-50 rounded border border-theme-border">
                            <div className="flex items-center gap-2 mb-1">
                              <Wrench className="w-3 h-3 text-theme-accent-primary" />
                              <p className="text-xs font-semibold text-theme-primary">{tech.currentJob.title}</p>
                            </div>
                            <p className="text-xs text-theme-secondary flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {tech.currentJob.address}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-theme-secondary">
                          <p>Lat: {tech.latitude.toFixed(6)}</p>
                          <p>Lng: {tech.longitude.toFixed(6)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {techs.length === 0 && (
                    <Card className="border-theme-border">
                      <CardContent className="p-8 text-center">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-theme-secondary">No active technicians</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-theme-primary mb-3">Unassigned Jobs ({jobs.filter(j => !j.assignedTech).length})</h3>
                <div className="space-y-2">
                  {jobs.filter(j => !j.assignedTech).map((job) => (
                    <Card 
                      key={job.id} 
                      className="border-theme-border cursor-pointer hover:border-theme-accent-primary transition-all"
                      onClick={() => centerOnJob(job)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm text-theme-primary">{job.title}</p>
                            <p className="text-xs text-theme-secondary flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {job.address}
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700 border border-orange-300 font-semibold text-xs">
                            UNASSIGNED
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-theme-secondary">
                          <p>Lat: {job.latitude.toFixed(6)}</p>
                          <p>Lng: {job.longitude.toFixed(6)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {jobs.filter(j => !j.assignedTech).length === 0 && (
                    <Card className="border-theme-border">
                      <CardContent className="p-8 text-center">
                        <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-theme-secondary">All jobs assigned</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
