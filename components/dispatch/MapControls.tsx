'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  Navigation,
  Home,
  LocateFixed,
  RefreshCw,
  Layers,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TechLocation, JobLocation } from '@/types/dispatch'

interface MapControlsProps {
  map: google.maps.Map | null
  techs: TechLocation[]
  jobs: JobLocation[]
  selectedTechId: string | null
  onRefresh: () => void
  businessLocation?: { lat: number; lng: number }
  showTechMarkers?: boolean
  showJobMarkers?: boolean
  showTrafficLayer?: boolean
  showHeatmap?: boolean
  onToggleTechMarkers?: (show: boolean) => void
  onToggleJobMarkers?: (show: boolean) => void
  onToggleTrafficLayer?: (show: boolean) => void
  onToggleHeatmap?: (show: boolean) => void
}

/**
 * MapControls Component
 *
 * Floating control panel for map navigation and layer management
 *
 * Features:
 * - Zoom to Fit All: Fit all markers in viewport
 * - Center on Business: Center map on business location
 * - Follow Mode: Lock on selected tech, follows movement
 * - Refresh: Manual data refresh with timestamp
 * - Layer Toggles: Show/hide techs, jobs, traffic, heatmap
 * - Fullscreen: Toggle fullscreen mode
 */
export function MapControls({
  map,
  techs,
  jobs,
  selectedTechId,
  onRefresh,
  businessLocation = { lat: 39.7684, lng: -86.1581 }, // Default: Indianapolis
  showTechMarkers = true,
  showJobMarkers = true,
  showTrafficLayer = false,
  showHeatmap = false,
  onToggleTechMarkers,
  onToggleJobMarkers,
  onToggleTrafficLayer,
  onToggleHeatmap,
}: MapControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [followMode, setFollowMode] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Zoom to fit all markers (techs and jobs) in viewport
   */
  const handleZoomToFitAll = useCallback(() => {
    if (!map) return

    const bounds = new google.maps.LatLngBounds()
    let hasMarkers = false

    // Add tech markers to bounds
    techs.forEach((tech) => {
      if (tech.lastLocation) {
        bounds.extend({
          lat: tech.lastLocation.lat,
          lng: tech.lastLocation.lng,
        })
        hasMarkers = true
      }
    })

    // Add job markers to bounds
    jobs.forEach((job) => {
      if (job.location) {
        bounds.extend({
          lat: job.location.lat,
          lng: job.location.lng,
        })
        hasMarkers = true
      }
    })

    if (hasMarkers) {
      map.fitBounds(bounds)
      // Add padding for better visibility
      const padding = { top: 50, right: 50, bottom: 50, left: 50 }
      map.fitBounds(bounds, padding)
    }
  }, [map, techs, jobs])

  /**
   * Center map on business location
   */
  const handleCenterOnBusiness = useCallback(() => {
    if (!map) return

    map.panTo(businessLocation)
    map.setZoom(13) // Zoom level for city view
  }, [map, businessLocation])

  /**
   * Toggle follow mode for selected tech
   */
  const handleToggleFollowMode = useCallback(() => {
    if (!selectedTechId) {
      // If no tech selected, disable follow mode
      setFollowMode(false)
      return
    }

    setFollowMode((prev) => !prev)
  }, [selectedTechId])

  /**
   * Follow selected tech (centers map on tech location)
   */
  useEffect(() => {
    if (!map || !followMode || !selectedTechId) return

    const selectedTech = techs.find((tech) => tech.id === selectedTechId)
    if (selectedTech?.lastLocation) {
      map.panTo({
        lat: selectedTech.lastLocation.lat,
        lng: selectedTech.lastLocation.lng,
      })
    }
  }, [map, followMode, selectedTechId, techs])

  /**
   * Disable follow mode when user pans map manually
   */
  useEffect(() => {
    if (!map || !followMode) return

    const listener = map.addListener('dragstart', () => {
      setFollowMode(false)
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [map, followMode])

  /**
   * Handle refresh button click
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await onRefresh()
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }, [onRefresh])

  /**
   * Toggle fullscreen mode
   */
  const handleToggleFullscreen = useCallback(() => {
    const mapContainer = map?.getDiv()
    if (!mapContainer) return

    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }, [map])

  /**
   * Listen for fullscreen changes
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  /**
   * Format last refresh time
   */
  const formatLastRefresh = () => {
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)

    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    return lastRefresh.toLocaleTimeString()
  }

  return (
    <TooltipProvider>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
        {/* Zoom to Fit All */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomToFitAll}
              disabled={!map || (techs.length === 0 && jobs.length === 0)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Square className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Zoom to Fit All</p>
            <p className="text-xs text-gray-400">Show all markers</p>
          </TooltipContent>
        </Tooltip>

        {/* Center on Business */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCenterOnBusiness}
              disabled={!map}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Home className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Center on Business</p>
            <p className="text-xs text-gray-400">Return to home location</p>
          </TooltipContent>
        </Tooltip>

        {/* Follow Mode */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={followMode ? 'default' : 'ghost'}
              size="icon"
              onClick={handleToggleFollowMode}
              disabled={!map || !selectedTechId}
              className={cn(
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                followMode && 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              <LocateFixed className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Follow Mode</p>
            <p className="text-xs text-gray-400">
              {selectedTechId
                ? followMode
                  ? 'Following selected tech'
                  : 'Click to follow selected tech'
                : 'Select a tech to follow'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw
                className={cn('h-5 w-5', isRefreshing && 'animate-spin')}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Refresh Data</p>
            <p className="text-xs text-gray-400">Last: {formatLastRefresh()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Layer Toggles Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Layers className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Layer Toggles</p>
              <p className="text-xs text-gray-400">Show/hide map layers</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showTechMarkers}
              onCheckedChange={onToggleTechMarkers}
            >
              <Navigation className="h-4 w-4 mr-2 text-blue-500" />
              Tech Markers
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showJobMarkers}
              onCheckedChange={onToggleJobMarkers}
            >
              <Navigation className="h-4 w-4 mr-2 text-red-500" />
              Job Markers
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showTrafficLayer}
              onCheckedChange={onToggleTrafficLayer}
            >
              Traffic Layer
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showHeatmap}
              onCheckedChange={onToggleHeatmap}
            >
              Tech Density Heatmap
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Fullscreen Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFullscreen}
              disabled={!map}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</p>
            <p className="text-xs text-gray-400">
              {isFullscreen ? 'Press ESC to exit' : 'Expand to fullscreen'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
