'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'

interface NativeMapsNavigationProps {
  destination: {
    address?: string
    latitude?: number
    longitude?: number
  }
  origin?: {
    address?: string
    latitude?: number
    longitude?: number
  }
}

export function NativeMapsNavigation({ destination, origin }: NativeMapsNavigationProps) {
  function openInGoogleMaps() {
    if (!destination.latitude || !destination.longitude) {
      // Fallback to address search
      const query = encodeURIComponent(destination.address || '')
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
      return
    }

    const dest = `${destination.latitude},${destination.longitude}`
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`

    if (origin?.latitude && origin?.longitude) {
      url += `&origin=${origin.latitude},${origin.longitude}`
    }

    window.open(url, '_blank')
  }

  function openInAppleMaps() {
    if (!destination.latitude || !destination.longitude) {
      const query = encodeURIComponent(destination.address || '')
      window.open(`https://maps.apple.com/?q=${query}`, '_blank')
      return
    }

    const dest = `${destination.latitude},${destination.longitude}`
    let url = `https://maps.apple.com/?daddr=${dest}`

    if (origin?.latitude && origin?.longitude) {
      url += `&saddr=${origin.latitude},${origin.longitude}`
    }

    window.open(url, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Navigation
        </CardTitle>
        <CardDescription>
          {destination.address || `${destination.latitude}, ${destination.longitude}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={openInGoogleMaps} className="w-full" variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in Google Maps
        </Button>
        <Button onClick={openInAppleMaps} className="w-full" variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in Apple Maps
        </Button>
      </CardContent>
    </Card>
  )
}

