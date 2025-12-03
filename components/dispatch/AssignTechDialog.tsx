'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/lib/toast'
import { calculateDistance } from '@/lib/gps/tracker'
import { autoAssignNearestTech } from '@/lib/dispatch/auto-assign'
import { getRouteUrl, openNavigation } from '@/lib/dispatch/navigation'
import { techStatusColors } from '@/types/dispatch'
import type { JobLocation, TechLocation } from '@/types/dispatch'
import { MapPin, Clock, User, AlertTriangle, Navigation, Zap, Target, ExternalLink } from 'lucide-react'

interface AssignTechDialogProps {
  open: boolean
  onClose: () => void
  job: JobLocation | null
  techs: TechLocation[]
  onAssign: (jobId: string, techId: string) => Promise<void>
}

interface TechWithDistance extends TechLocation {
  distanceFromJob: number // in miles
  eta: number // in minutes
}

interface ConfirmDialogState {
  open: boolean
  tech: TechWithDistance | null
  warningMessage: string
}

interface AutoAssignConfirmState {
  open: boolean
  techId: string | null
  techName: string | null
  distance: number | null
  eta: number | null
  reason: string | null
  score: number | null
}

/**
 * AssignTechDialog Component
 *
 * Modal dialog for assigning a technician to a job.
 * Features:
 * - Job details display (address, description, priority)
 * - Tech selection list with distances and ETAs
 * - Filter to show only available techs
 * - Distance-based sorting (nearest first)
 * - Validation (can't assign busy or offline techs)
 * - Confirmation dialogs for edge cases
 * - Success/error toast notifications
 * - "Assign Nearest Available" quick action
 */
export function AssignTechDialog({
  open,
  onClose,
  job,
  techs,
  onAssign,
}: AssignTechDialogProps) {
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    tech: null,
    warningMessage: '',
  })
  const [autoAssignConfirm, setAutoAssignConfirm] = useState<AutoAssignConfirmState>({
    open: false,
    techId: null,
    techName: null,
    distance: null,
    eta: null,
    reason: null,
    score: null,
  })

  // Calculate distances and ETAs for all techs
  const techsWithDistance = useMemo<TechWithDistance[]>(() => {
    if (!job || !job.location) return []

    return techs
      .filter((tech) => tech.lastLocation) // Only techs with GPS data
      .map((tech) => {
        // Calculate distance in meters, convert to miles
        const distanceMeters = calculateDistance(
          job.location.lat,
          job.location.lng,
          tech.lastLocation!.lat,
          tech.lastLocation!.lng
        )
        const distanceMiles = distanceMeters / 1609.34

        // Estimate ETA based on distance (assume 30 mph average)
        const eta = Math.ceil((distanceMiles / 30) * 60) // minutes

        return {
          ...tech,
          distanceFromJob: distanceMiles,
          eta,
        }
      })
      .sort((a, b) => a.distanceFromJob - b.distanceFromJob) // Sort by distance (nearest first)
  }, [job, techs])

  // Filter techs based on availability
  const filteredTechs = useMemo(() => {
    if (!showOnlyAvailable) return techsWithDistance

    // Only show idle techs when filter is enabled
    return techsWithDistance.filter((tech) => tech.status === 'idle')
  }, [techsWithDistance, showOnlyAvailable])

  // Get nearest available tech for quick assign
  const nearestAvailableTech = useMemo(() => {
    return techsWithDistance.find((tech) => tech.status === 'idle')
  }, [techsWithDistance])

  /**
   * Handle tech assignment with validation
   */
  const handleAssignTech = async (tech: TechWithDistance) => {
    // Validation: Can't assign offline tech
    if (tech.status === 'offline') {
      toast({
        title: 'Cannot Assign Offline Tech',
        description: `${tech.name} is currently offline. Please select an online tech.`,
        variant: 'error',
      })
      return
    }

    // Validation: Can't assign tech already on job
    if (tech.status === 'on_job') {
      setConfirmDialog({
        open: true,
        tech,
        warningMessage: `${tech.name} is currently on another job: ${tech.currentJob?.description || 'Unknown'}. Are you sure you want to reassign them?`,
      })
      return
    }

    // Validation: Confirm if assigning tech that's en route
    if (tech.status === 'en_route') {
      setConfirmDialog({
        open: true,
        tech,
        warningMessage: `${tech.name} is currently en route to another job. Are you sure you want to reassign them?`,
      })
      return
    }

    // All validations passed, proceed with assignment
    await performAssignment(tech)
  }

  /**
   * Perform the actual assignment API call
   */
  const performAssignment = async (tech: TechWithDistance) => {
    if (!job) return

    setIsAssigning(true)

    try {
      await onAssign(job.id, tech.id)

      // Success notification
      toast({
        title: 'Tech Assigned Successfully',
        description: `${tech.name} has been assigned to job #${job.id.slice(0, 8)}`,
        variant: 'success',
      })

      // Close dialog
      onClose()
    } catch (error) {
      // Error notification
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      toast({
        title: 'Assignment Failed',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  /**
   * Handle confirmation dialog result
   */
  const handleConfirmAssignment = async () => {
    if (confirmDialog.tech) {
      await performAssignment(confirmDialog.tech)
    }
    setConfirmDialog({ open: false, tech: null, warningMessage: '' })
  }

  /**
   * Quick assign to nearest available tech (manual selection)
   */
  const handleAssignNearest = async () => {
    if (!nearestAvailableTech) {
      toast({
        title: 'No Available Techs',
        description: 'There are no available techs to assign. Please try again later.',
        variant: 'warning',
      })
      return
    }

    await handleAssignTech(nearestAvailableTech)
  }

  /**
   * Auto-assign using intelligent algorithm
   */
  const handleAutoAssign = async () => {
    if (!job) return

    setIsAutoAssigning(true)

    try {
      // First, do a dry run to preview the assignment
      const result = await autoAssignNearestTech(job.id, {
        prioritizeDistance: true,
        prioritizePerformance: false,
      }, true) // dryRun = true

      if (!result.success || !result.assignment) {
        throw new Error('No eligible techs found by auto-assign algorithm')
      }

      // Show confirmation dialog with calculated result
      setAutoAssignConfirm({
        open: true,
        techId: result.assignment.techId,
        techName: result.assignment.techName,
        distance: result.assignment.distance,
        eta: result.assignment.eta,
        reason: result.assignment.reason,
        score: result.assignment.score,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-assign failed'

      toast({
        title: 'Auto-Assign Failed',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsAutoAssigning(false)
    }
  }

  /**
   * Confirm and execute auto-assignment
   */
  const handleConfirmAutoAssign = async () => {
    if (!job || !autoAssignConfirm.techId) return

    setIsAssigning(true)

    try {
      // Call the API to actually assign (no dry run this time)
      const result = await autoAssignNearestTech(job.id, {
        prioritizeDistance: true,
        prioritizePerformance: false,
      }, false) // dryRun = false

      if (!result.success) {
        throw new Error('Auto-assign failed')
      }

      // Success notification
      toast({
        title: 'Tech Auto-Assigned Successfully',
        description: `${result.assignment.techName} has been assigned to job #${job.id.slice(0, 8)}`,
        variant: 'success',
      })

      // Close dialogs
      setAutoAssignConfirm({
        open: false,
        techId: null,
        techName: null,
        distance: null,
        eta: null,
        reason: null,
        score: null,
      })
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      toast({
        title: 'Assignment Failed',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  /**
   * Get distance color based on distance
   */
  const getDistanceColor = (miles: number): string => {
    if (miles < 5) return 'text-green-400'
    if (miles < 10) return 'text-yellow-400'
    if (miles < 20) return 'text-orange-400'
    return 'text-red-400'
  }

  /**
   * Get status badge for tech
   */
  const getStatusBadge = (status: TechLocation['status']) => {
    const colors = techStatusColors[status]
    return (
      <Badge variant="outline" className={`${colors.bg} ${colors.text} border-${colors.text.replace('text-', '')}`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (!job) return null

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-theme-accent-primary" />
              Assign Tech to Job
            </DialogTitle>
            <DialogDescription>
              Select a technician to assign to this job. Techs are sorted by distance (nearest first).
            </DialogDescription>
          </DialogHeader>

          {/* Job Summary Section */}
          <div className="border-2 border-theme-border rounded-lg p-4 bg-theme-secondary/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Job Details</h3>
                <p className="text-sm text-theme-subtle mt-1">{job.description}</p>
              </div>
              {job.status && (
                <Badge variant="default" className="ml-2">
                  {job.status.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-theme-accent-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-theme-subtle/70 text-xs">Address</p>
                  <p className="text-white">{job.customer.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-theme-accent-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-theme-subtle/70 text-xs">Customer</p>
                  <p className="text-white">{job.customer.name}</p>
                  <p className="text-theme-subtle text-xs">{job.customer.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-theme-accent-primary" />
              <div>
                <p className="text-theme-subtle/70 text-xs">Scheduled Time</p>
                <p className="text-white text-sm">
                  {new Date(job.scheduledStart).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-3 border-b border-theme-border pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showOnlyAvailable}
                onCheckedChange={(checked) => setShowOnlyAvailable(checked as boolean)}
              />
              <span className="text-sm text-white">Show only available techs</span>
            </label>
            {filteredTechs.length === 0 && (
              <p className="text-sm text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                No available techs found
              </p>
            )}
          </div>

          {/* Tech Selection List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredTechs.length > 0 ? (
              filteredTechs.map((tech) => {
                const isDisabled = tech.status === 'offline' || isAssigning
                const distanceColor = getDistanceColor(tech.distanceFromJob)

                return (
                  <div
                    key={tech.id}
                    className={`border-2 border-theme-border rounded-lg p-4 transition-all ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-theme-accent-primary hover:bg-theme-secondary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium truncate">{tech.name}</h4>
                          {getStatusBadge(tech.status)}
                          <Badge variant="outline" className="text-theme-accent-secondary border-theme-accent-secondary">
                            {tech.role.toUpperCase()}
                          </Badge>
                        </div>

                        {tech.currentJob && (
                          <p className="text-sm text-theme-subtle mb-2">
                            Current job: {tech.currentJob.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Navigation className={`h-4 w-4 ${distanceColor}`} />
                            <span className={`font-medium ${distanceColor}`}>
                              {tech.distanceFromJob.toFixed(1)} mi
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-theme-subtle" />
                            <span className="text-theme-subtle">
                              ETA: {tech.eta} min
                            </span>
                          </div>
                        </div>

                        {tech.lastLocation && (
                          <p className="text-xs text-theme-subtle/70 mt-2">
                            Last update: {new Date(tech.lastLocation.updatedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleAssignTech(tech)}
                          disabled={isDisabled}
                          size="sm"
                          variant={tech.status === 'idle' ? 'default' : 'outline'}
                        >
                          Assign
                        </Button>
                        {tech.lastLocation && job.location && (
                          <Button
                            onClick={() => {
                              const url = getRouteUrl(
                                tech.lastLocation!.lat,
                                tech.lastLocation!.lng,
                                job.location.lat,
                                job.location.lng
                              )
                              openNavigation(url)
                            }}
                            disabled={isDisabled}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Preview Route
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">No Techs Available</p>
                <p className="text-theme-subtle text-sm">
                  {showOnlyAvailable
                    ? 'Try disabling the "Show only available techs" filter'
                    : 'No techs found with GPS data'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={isAssigning || isAutoAssigning}>
              Cancel
            </Button>
            <div className="flex gap-2 flex-wrap">
              {nearestAvailableTech && (
                <Button
                  onClick={handleAssignNearest}
                  disabled={isAssigning || isAutoAssigning}
                  variant="secondary"
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Quick Assign
                  <span className="text-xs opacity-70">
                    ({nearestAvailableTech.name} - {nearestAvailableTech.distanceFromJob.toFixed(1)} mi)
                  </span>
                </Button>
              )}
              <Button
                onClick={handleAutoAssign}
                disabled={isAssigning || isAutoAssigning}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Auto-Assign Best Tech
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Busy Techs */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(isOpen) => !isOpen && setConfirmDialog({ open: false, tech: null, warningMessage: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Confirm Tech Assignment
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.warningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAssignment}
              variant="default"
            >
              Yes, Assign Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto-Assign Confirmation Dialog */}
      <AlertDialog
        open={autoAssignConfirm.open}
        onOpenChange={(isOpen) => !isOpen && setAutoAssignConfirm({
          open: false,
          techId: null,
          techName: null,
          distance: null,
          eta: null,
          reason: null,
          score: null,
        })}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-theme-accent-primary" />
              Confirm Auto-Assignment
            </AlertDialogTitle>
            <AlertDialogDescription>
              The algorithm has selected the best available tech based on distance, availability, and performance.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {autoAssignConfirm.techName && (
            <div className="space-y-3 py-4">
              {/* Selected Tech */}
              <div className="border-2 border-theme-accent-primary/30 rounded-lg p-4 bg-theme-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-theme-accent-primary" />
                  <h3 className="text-lg font-semibold text-white">{autoAssignConfirm.techName}</h3>
                  <Badge variant="outline" className="bg-green-900 text-green-400 border-green-400 ml-auto">
                    SELECTED
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-theme-subtle/70 text-xs mb-1">Distance</p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <Navigation className="h-4 w-4 text-green-400" />
                      {autoAssignConfirm.distance?.toFixed(1)} mi
                    </p>
                  </div>
                  <div>
                    <p className="text-theme-subtle/70 text-xs mb-1">ETA</p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-400" />
                      {autoAssignConfirm.eta} min
                    </p>
                  </div>
                </div>

                {autoAssignConfirm.score !== null && (
                  <div className="mt-3 pt-3 border-t border-theme-border">
                    <p className="text-theme-subtle/70 text-xs mb-1">Algorithm Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-theme-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-theme-accent-primary to-green-400 h-full transition-all"
                          style={{ width: `${Math.min((autoAssignConfirm.score / 200) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-white font-medium text-sm">{autoAssignConfirm.score}</span>
                    </div>
                  </div>
                )}

                {autoAssignConfirm.reason && (
                  <div className="mt-3 pt-3 border-t border-theme-border">
                    <p className="text-theme-subtle/70 text-xs mb-1">Reason</p>
                    <p className="text-white text-sm">{autoAssignConfirm.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAutoAssign}
              disabled={isAssigning}
              className="bg-theme-accent-primary hover:bg-theme-accent-primary/80"
            >
              {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
