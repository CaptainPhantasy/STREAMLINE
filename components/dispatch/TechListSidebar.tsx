'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  ArrowUpDown,
  MapPin,
  Clock
} from 'lucide-react'
import type { TechLocation } from '@/types/dispatch'
import { techStatusColors } from '@/types/dispatch'
import { calculateDistance } from '@/lib/gps/tracker'
import { cn } from '@/lib/utils'

interface TechListSidebarProps {
  techs: TechLocation[]
  onTechClick: (tech: TechLocation) => void
  onTechHover: (techId: string | null) => void
  selectedTechId: string | null
  selectedJobId?: string | null
  selectedJobLocation?: { lat: number; lng: number } | null
}

type StatusFilter = 'all' | 'on_job' | 'en_route' | 'idle' | 'offline'
type SortBy = 'name' | 'status' | 'distance'

export default function TechListSidebar({
  techs,
  onTechClick,
  onTechHover,
  selectedTechId,
  selectedJobId,
  selectedJobLocation,
}: TechListSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Filter and sort techs
  const filteredAndSortedTechs = useMemo(() => {
    let filtered = techs.filter(tech => {
      // Search filter
      if (searchQuery && !tech.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && tech.status !== statusFilter) {
        return false
      }

      return true
    })

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }

      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }

      if (sortBy === 'distance' && selectedJobLocation) {
        const distA = a.lastLocation
          ? calculateDistance(
            a.lastLocation.lat,
            a.lastLocation.lng,
            selectedJobLocation.lat,
            selectedJobLocation.lng
          )
          : Infinity
        const distB = b.lastLocation
          ? calculateDistance(
            b.lastLocation.lat,
            b.lastLocation.lng,
            selectedJobLocation.lat,
            selectedJobLocation.lng
          )
          : Infinity
        return distA - distB
      }

      return 0
    })

    return filtered
  }, [techs, searchQuery, statusFilter, sortBy, selectedJobLocation])

  // Status filter counts
  const statusCounts = useMemo(() => {
    return {
      all: techs.length,
      on_job: techs.filter(t => t.status === 'on_job').length,
      en_route: techs.filter(t => t.status === 'en_route').length,
      idle: techs.filter(t => t.status === 'idle').length,
      offline: techs.filter(t => t.status === 'offline').length,
    }
  }, [techs])

  const clearSearch = () => setSearchQuery('')

  const cycleSortBy = () => {
    if (sortBy === 'name') setSortBy('status')
    else if (sortBy === 'status') setSortBy('distance')
    else setSortBy('name')
  }

  const formatDistance = (meters: number): string => {
    const miles = meters / 1609.34
    if (miles < 1) {
      return `${Math.round(meters)} m`
    }
    return `${miles.toFixed(1)} mi`
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Tech List</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleSortBy}
              title={`Sort by: ${sortBy}`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="ml-1 text-xs capitalize">{sortBy}</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search techs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-[var(--color-accent-primary)]"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              statusFilter === 'all'
                ? 'bg-[var(--color-accent-primary)] text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('on_job')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              statusFilter === 'on_job'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            On Job ({statusCounts.on_job})
          </button>
          <button
            onClick={() => setStatusFilter('en_route')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              statusFilter === 'en_route'
                ? 'bg-[var(--color-accent-primary)] text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            En Route ({statusCounts.en_route})
          </button>
          <button
            onClick={() => setStatusFilter('idle')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              statusFilter === 'idle'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            Idle ({statusCounts.idle})
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              statusFilter === 'offline'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            Offline ({statusCounts.offline})
          </button>
        </div>
      </div>

      {/* Tech List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredAndSortedTechs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No techs found</p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearSearch}
                  className="mt-2 text-[var(--color-accent-primary)]"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTechs.map((tech) => {
                const isSelected = tech.id === selectedTechId
                const distance = selectedJobLocation && tech.lastLocation
                  ? calculateDistance(
                    tech.lastLocation.lat,
                    tech.lastLocation.lng,
                    selectedJobLocation.lat,
                    selectedJobLocation.lng
                  )
                  : null

                return (
                  <button
                    key={tech.id}
                    onClick={() => onTechClick(tech)}
                    onMouseEnter={() => onTechHover(tech.id)}
                    onMouseLeave={() => onTechHover(null)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      "border border-transparent",
                      isSelected
                        ? 'bg-[var(--color-bg-surface)] border-[var(--color-accent-primary)]'
                        : 'bg-gray-800 hover:bg-gray-750 hover:border-gray-600'
                    )}
                  >
                    {/* Tech Name and Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{tech.name}</h3>
                        <Badge
                          className={cn(
                            techStatusColors[tech.status].bg,
                            techStatusColors[tech.status].text,
                            "text-xs"
                          )}
                        >
                          {tech.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {tech.lastLocation && (
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* Current Job */}
                    {tech.currentJob && (
                      <div className="text-xs text-gray-300 mb-2">
                        <span className="font-medium">Job:</span> {tech.currentJob.description}
                      </div>
                    )}

                    {/* Distance to Selected Job */}
                    {distance !== null && (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-accent-primary)] mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(distance)} from job</span>
                      </div>
                    )}

                    {/* Last GPS Update */}
                    {tech.lastLocation && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(tech.lastLocation.updatedAt)}</span>
                        {tech.lastLocation.accuracy && (
                          <span className="text-gray-500">
                            (±{Math.round(tech.lastLocation.accuracy)}m)
                          </span>
                        )}
                      </div>
                    )}

                    {/* No Location Warning */}
                    {!tech.lastLocation && (
                      <div className="text-xs text-gray-500 italic">
                        No location data
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        Showing {filteredAndSortedTechs.length} of {techs.length} techs
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-20">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out relative overflow-visible",
            isCollapsed ? "w-0" : "w-[320px]"
          )}
        >
          {!isCollapsed && (
            <div className="w-[320px] h-full border-r border-gray-700">
              <SidebarContent />
            </div>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "absolute top-4 -right-10 z-50",
              "w-8 h-12 rounded-r-lg", // Tab shape
              "bg-[var(--color-accent-primary)] border-y border-r border-white/20",
              "flex items-center justify-center",
              "text-white shadow-xl",
              "hover:bg-[var(--color-accent-primary)]/80 hover:w-10 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2"
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="fixed top-20 left-4 z-50 shadow-lg"
            >
              <Menu className="w-4 h-4 mr-2" />
              Techs
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[320px] bg-gray-900">
            <SheetHeader className="sr-only">
              <SheetTitle>Tech List</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
