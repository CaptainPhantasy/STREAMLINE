'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MapPin, Clock, Navigation } from 'lucide-react'
import { toast } from 'sonner'

interface TravelTimeEstimatorProps {
  origin?: { lat: number; lng: number }
  destination?: { lat: number; lng: number }
  onTravelTimeCalculated?: (result: {
    duration_seconds: number
    duration_text: string
    distance_meters: number
    distance_text: string
  }) => void
}

export function TravelTimeEstimator({
  origin,
  destination,
  onTravelTimeCalculated,
}: TravelTimeEstimatorProps) {
  const [originAddress, setOriginAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [mode, setMode] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<{
    duration_seconds: number
    duration_text: string
    distance_meters: number
    distance_text: string
  } | null>(null)

  async function handleCalculate() {
    if (!origin || !destination) {
      toast.error('Origin and destination coordinates are required')
      return
    }

    setCalculating(true)

    try {
      const response = await fetch('/api/schedule/travel-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          mode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to calculate travel time')
      }

      const data = await response.json()
      setResult(data)
      onTravelTimeCalculated?.(data)
      toast.success('Travel time calculated')
    } catch (error: any) {
      console.error('Error calculating travel time:', error)
      toast.error(error.message || 'Failed to calculate travel time')
    } finally {
      setCalculating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Travel Time Estimator
        </CardTitle>
        <CardDescription>
          Calculate travel time between locations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Travel Mode</Label>
          <Select value={mode} onValueChange={(v: any) => setMode(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driving">Driving</SelectItem>
              <SelectItem value="walking">Walking</SelectItem>
              <SelectItem value="bicycling">Bicycling</SelectItem>
              <SelectItem value="transit">Transit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {origin && destination && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Origin: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Destination: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleCalculate}
          disabled={calculating || !origin || !destination}
          className="w-full"
        >
          {calculating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Calculate Travel Time
            </>
          )}
        </Button>

        {result && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duration:</span>
                <span className="text-lg font-semibold">{result.duration_text}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Distance:</span>
                <span className="text-sm">{result.distance_text}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

