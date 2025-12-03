# TechListSidebar Integration Guide

This guide shows how to integrate the TechListSidebar component into the dispatch map page.

## Step 1: Update Dispatch Map Page Imports

Add the TechListSidebar import to `app/(dashboard)/dispatch/map/page.tsx`:

```tsx
import TechListSidebar from '@/components/dispatch/TechListSidebar'
```

## Step 2: Add State for Sidebar Interactions

Add these state variables to your dispatch map page component:

```tsx
const [selectedTechId, setSelectedTechId] = useState<string | null>(null)
const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
const [selectedJobLocation, setSelectedJobLocation] = useState<{ lat: number; lng: number } | null>(null)
const [hoveredTechId, setHoveredTechId] = useState<string | null>(null)
```

## Step 3: Implement Tech Click Handler

Add this function to handle tech selection and map panning:

```tsx
const handleTechClick = (tech: TechLocation) => {
  setSelectedTechId(tech.id)

  // Pan map to tech's location
  if (tech.lastLocation) {
    setMapCenter({
      lat: tech.lastLocation.lat,
      lng: tech.lastLocation.lng
    })
    setZoom(15) // Zoom in for detail
  }

  // Optionally close any open info windows
  setSelectedTech(tech)
}
```

## Step 4: Implement Tech Hover Handler

Add this function to handle marker highlighting on hover:

```tsx
const handleTechHover = (techId: string | null) => {
  setHoveredTechId(techId)

  // Optional: Implement marker animation/highlighting
  // You can store this in state and use it in marker rendering
}
```

## Step 5: Update Layout Structure

Modify your page layout to include the sidebar:

```tsx
return (
  <div className="h-screen flex flex-col">
    {/* Header - same as before */}
    <div className="bg-white border-b p-4 flex items-center justify-between">
      {/* ... existing header code ... */}
    </div>

    {/* Stats Bar - same as before */}
    <div className="bg-gray-50 border-b p-4">
      {/* ... existing stats code ... */}
    </div>

    {/* Main Content Area with Sidebar + Map */}
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <TechListSidebar
        techs={techs}
        onTechClick={handleTechClick}
        onTechHover={handleTechHover}
        selectedTechId={selectedTechId}
        selectedJobId={selectedJobId}
        selectedJobLocation={selectedJobLocation}
      />

      {/* Map */}
      <div className="flex-1 p-4">
        <LoadScript googleMapsApiKey={googleMapsApiKey}>
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={mapCenter}
            zoom={zoom}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Tech Markers */}
            {techs.map((tech) => {
              if (!tech.lastLocation) return null

              const isHovered = tech.id === hoveredTechId
              const isSelected = tech.id === selectedTechId

              return (
                <Marker
                  key={tech.id}
                  position={{
                    lat: tech.lastLocation.lat,
                    lng: tech.lastLocation.lng
                  }}
                  icon={getMarkerIcon(tech.status, isHovered, isSelected)}
                  onClick={() => handleTechClick(tech)}
                  title={tech.name}
                />
              )
            })}

            {/* Info Window for selected tech */}
            {selectedTech && selectedTech.lastLocation && (
              <InfoWindow
                position={{
                  lat: selectedTech.lastLocation.lat,
                  lng: selectedTech.lastLocation.lng
                }}
                onCloseClick={() => {
                  setSelectedTech(null)
                  setSelectedTechId(null)
                }}
              >
                {/* ... existing info window content ... */}
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  </div>
)
```

## Step 6: Update Marker Icon for Hover State

Enhance the `getMarkerIcon` function to support hover highlighting:

```tsx
const getMarkerIcon = (
  status: TechLocation['status'],
  isHovered: boolean = false,
  isSelected: boolean = false
) => {
  const baseIcon = {
    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
    fillColor: techStatusColors[status].marker,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 10,
  }

  // Enlarge marker on hover or selection
  if (isHovered || isSelected) {
    return {
      ...baseIcon,
      scale: 12,
      strokeWeight: 3,
    }
  }

  return baseIcon
}
```

## Step 7: Add Job Selection Support (Optional)

If you're also implementing job markers, add job selection handlers:

```tsx
const handleJobClick = (job: JobLocation) => {
  setSelectedJobId(job.id)
  setSelectedJobLocation(job.location)

  // Pan map to job location
  setMapCenter(job.location)
  setZoom(14)
}
```

## Step 8: CSS Updates (if needed)

If you notice layout issues, ensure your CSS has these utilities:

```css
/* In globals.css or relevant stylesheet */
.bg-gray-750 {
  background-color: #2d3748; /* Between gray-800 and gray-700 */
}
```

Or use Tailwind config extension:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2d3748',
        }
      }
    }
  }
}
```

## Complete Example

Here's a complete minimal example of the dispatch map page with sidebar:

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import type { TechLocation } from '@/types/dispatch'
import { techStatusColors } from '@/types/dispatch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TechListSidebar from '@/components/dispatch/TechListSidebar'

const DEFAULT_CENTER = { lat: 39.7684, lng: -86.1581 }
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%'
}

export default function DispatchMapPage() {
  const [techs, setTechs] = useState<TechLocation[]>([])
  const [selectedTech, setSelectedTech] = useState<TechLocation | null>(null)
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJobLocation, setSelectedJobLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(12)

  const fetchTechs = useCallback(async () => {
    try {
      const res = await fetch('/api/dispatch/techs')
      if (res.ok) {
        const data = await res.json()
        setTechs(data.techs)
      }
    } catch (error) {
      console.error('Failed to fetch tech locations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTechs()
  }, [fetchTechs])

  const handleTechClick = (tech: TechLocation) => {
    setSelectedTechId(tech.id)
    setSelectedTech(tech)

    if (tech.lastLocation) {
      setMapCenter({
        lat: tech.lastLocation.lat,
        lng: tech.lastLocation.lng
      })
      setZoom(15)
    }
  }

  const handleTechHover = (techId: string | null) => {
    setHoveredTechId(techId)
  }

  const getMarkerIcon = (
    status: TechLocation['status'],
    isHovered: boolean = false,
    isSelected: boolean = false
  ) => {
    return {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      fillColor: techStatusColors[status].marker,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: isHovered || isSelected ? 3 : 2,
      scale: isHovered || isSelected ? 12 : 10,
    }
  }

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!googleMapsApiKey) {
    return <div>Google Maps API key not configured</div>
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Dispatch Map</h1>
        </div>
        <Button onClick={fetchTechs} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-50 border-b p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {techs.filter(t => t.status === 'on_job').length}
              </div>
              <div className="text-sm text-gray-600">On Job</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {techs.filter(t => t.status === 'en_route').length}
              </div>
              <div className="text-sm text-gray-600">En Route</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">
                {techs.filter(t => t.status === 'idle').length}
              </div>
              <div className="text-sm text-gray-600">Idle</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">
                {techs.filter(t => t.status === 'offline').length}
              </div>
              <div className="text-sm text-gray-600">Offline</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content: Sidebar + Map */}
      <div className="flex-1 flex overflow-hidden">
        <TechListSidebar
          techs={techs}
          onTechClick={handleTechClick}
          onTechHover={handleTechHover}
          selectedTechId={selectedTechId}
          selectedJobId={selectedJobId}
          selectedJobLocation={selectedJobLocation}
        />

        <div className="flex-1 p-4">
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={mapCenter}
              zoom={zoom}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {techs.map((tech) => {
                if (!tech.lastLocation) return null

                const isHovered = tech.id === hoveredTechId
                const isSelected = tech.id === selectedTechId

                return (
                  <Marker
                    key={tech.id}
                    position={{
                      lat: tech.lastLocation.lat,
                      lng: tech.lastLocation.lng
                    }}
                    icon={getMarkerIcon(tech.status, isHovered, isSelected)}
                    onClick={() => handleTechClick(tech)}
                    title={tech.name}
                  />
                )
              })}

              {selectedTech && selectedTech.lastLocation && (
                <InfoWindow
                  position={{
                    lat: selectedTech.lastLocation.lat,
                    lng: selectedTech.lastLocation.lng
                  }}
                  onCloseClick={() => {
                    setSelectedTech(null)
                    setSelectedTechId(null)
                  }}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{selectedTech.name}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={`text-sm px-2 py-1 rounded ${techStatusColors[selectedTech.status].bg} ${techStatusColors[selectedTech.status].text}`}>
                          {selectedTech.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </div>
  )
}
```

## Testing the Integration

### Manual Test Checklist

1. **Visual Test**
   - [ ] Sidebar appears on left side (desktop)
   - [ ] Sidebar is 320px wide
   - [ ] Dark theme applied correctly
   - [ ] All techs listed with correct info

2. **Search Test**
   - [ ] Type in search box
   - [ ] List filters in real-time
   - [ ] Clear button works
   - [ ] "No techs found" shows when no matches

3. **Filter Test**
   - [ ] Click each status filter
   - [ ] List updates to show only matching techs
   - [ ] Counts are correct
   - [ ] Active filter highlighted

4. **Sort Test**
   - [ ] Click sort button
   - [ ] Cycles through: name → status → distance → name
   - [ ] List reorders correctly

5. **Click Test**
   - [ ] Click a tech in sidebar
   - [ ] Tech highlighted in sidebar
   - [ ] Map pans to tech location
   - [ ] Map zooms to 15

6. **Hover Test**
   - [ ] Hover over tech in sidebar
   - [ ] Marker on map enlarges
   - [ ] Hover off tech
   - [ ] Marker returns to normal size

7. **Collapse Test**
   - [ ] Click collapse button
   - [ ] Sidebar hides smoothly
   - [ ] Map expands to fill space
   - [ ] Click expand button
   - [ ] Sidebar shows again

8. **Mobile Test**
   - [ ] Resize to mobile (<1024px)
   - [ ] Sidebar hidden
   - [ ] Hamburger button appears at top-left
   - [ ] Click hamburger
   - [ ] Drawer opens from left
   - [ ] Click outside drawer
   - [ ] Drawer closes

## Troubleshooting

### Sidebar not showing
- Check that parent container has `flex` class
- Verify `lg:block` breakpoint is correct
- Check z-index if behind other elements

### Map not expanding when sidebar collapses
- Ensure parent has `flex-1` class
- Check for fixed widths on map container

### Hover not working
- Verify `hoveredTechId` state is passed to marker rendering
- Check that `getMarkerIcon` receives `isHovered` parameter

### Distance not showing
- Ensure `selectedJobLocation` prop is set when job selected
- Check that job location has valid lat/lng

### Mobile drawer not opening
- Verify Sheet component is imported from shadcn/ui
- Check that `lg:hidden` class is applied

## Next Steps

After integration:
1. Test with real GPS data
2. Add job markers to map
3. Implement TechDetailPanel (Phase 3)
4. Implement JobDetailPanel (Phase 3)
5. Add AssignTechDialog (Phase 3)
6. Deploy and test on mobile devices
