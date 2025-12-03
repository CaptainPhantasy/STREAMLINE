'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, RefreshCw } from 'lucide-react'
import type { Location } from '@/types/tech'

interface LocationTrackerProps {
  jobId: string
  onLocationCaptured: (location: Location) => Promise<void>
}

export function LocationTracker({ jobId, onLocationCaptured }: LocationTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Try to get location on mount if permission already granted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          })
        },
        () => {
          // Silent fail on mount - user hasn't requested yet
        }
      )
    }
  }, [])

  async function captureLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setCapturing(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        }

        setCurrentLocation(location)
        setCapturing(false)

        // Auto-save if callback provided
        if (onLocationCaptured) {
          setSaving(true)
          try {
            await onLocationCaptured(location)
          } catch (err) {
            console.error('Error saving location:', err)
            setError('Failed to save location')
          } finally {
            setSaving(false)
          }
        }
      },
      (err) => {
        setCapturing(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access in your browser settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.')
            break
          case err.TIMEOUT:
            setError('Location request timed out.')
            break
          default:
            setError('An unknown error occurred while getting location.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  function openInMaps() {
    if (!currentLocation) return
    const url = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
    window.open(url, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLocation ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Location Captured</span>
                {currentLocation.accuracy && (
                  <span className="text-xs text-green-600">
                    ±{Math.round(currentLocation.accuracy)}m
                  </span>
                )}
              </div>
              <p className="text-xs text-green-700 font-mono">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {new Date(currentLocation.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={openInMaps}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Open in Maps
              </Button>
              <Button
                onClick={captureLocation}
                disabled={capturing || saving}
                size="sm"
                variant="outline"
              >
                {capturing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={captureLocation}
              disabled={capturing || saving}
              className="w-full"
            >
              {capturing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Capturing Location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Capture Location
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

