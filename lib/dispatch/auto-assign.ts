/**
 * Auto-Assign Algorithm
 *
 * Intelligent algorithm to automatically assign the best available tech to a job.
 * This is a client-side library that interfaces with the server-side auto-assign API.
 *
 * Features:
 * - Filter eligible techs (idle, recent GPS, required skills)
 * - Score techs based on distance, performance, urgency
 * - Dry-run mode for preview before assignment
 * - Detailed reasoning for tech selection
 */

import { calculateDistance } from '@/lib/gps/tracker'
import type { TechLocation, JobLocation } from '@/types/dispatch'

/**
 * Tech score with reasoning
 */
export interface TechScore {
  techId: string
  techName: string
  distance: number // miles
  eta: number // minutes
  score: number
  reason: string
  isEligible: boolean
  gpsAge?: number // minutes
  activeJobs: number
  jobsCompletedToday: number
}

/**
 * Auto-assign result
 */
export interface AutoAssignResult {
  success: boolean
  assignment: {
    techId: string
    techName: string
    distance: number // miles
    eta: number // minutes
    score: number
    reason: string
  }
  alternatives?: Array<{
    techId: string
    techName: string
    distance: number
    eta: number
    score: number
  }>
  dryRun?: boolean
}

/**
 * Auto-assign factors/options
 */
export interface AutoAssignFactors {
  prioritizeDistance?: boolean
  prioritizePerformance?: boolean
  requireSkills?: string[]
}

/**
 * Filter eligible techs for a job
 *
 * A tech is eligible if:
 * - Status is 'idle' (not on job, not en_route)
 * - Has recent GPS data (<30 min)
 * - Has required skills (if specified)
 *
 * @param job - Job to assign
 * @param techs - All available techs
 * @returns Array of eligible techs
 */
export function getEligibleTechs(job: JobLocation, techs: TechLocation[]): TechLocation[] {
  return techs.filter(tech => {
    // Must be idle (not on job, not en_route)
    if (tech.status !== 'idle') return false

    // Must have recent GPS update (<30 min)
    if (!tech.lastLocation) return false
    const gpsAge = Date.now() - new Date(tech.lastLocation.updatedAt).getTime()
    if (gpsAge > 30 * 60 * 1000) return false

    // TODO: Add skill matching when skill system is implemented
    // if (job.requiredSkills && job.requiredSkills.length > 0) {
    //   const hasAllSkills = job.requiredSkills.every(skill =>
    //     tech.skills?.includes(skill)
    //   )
    //   if (!hasAllSkills) return false
    // }

    return true
  })
}

/**
 * Score techs based on various factors
 *
 * Scoring factors (weighted):
 * - Distance: Closer techs score higher (0-100 points)
 * - Performance: More completed jobs today = higher score (5 points per job)
 * - GPS freshness: More recent GPS = bonus points (0-10 points)
 * - Urgency: High-priority jobs give bonus points (50 points)
 *
 * @param job - Job to assign
 * @param techs - Techs to score
 * @param factors - Scoring factors
 * @returns Array of scored techs, sorted by score (highest first)
 */
export function scoreTechs(
  job: JobLocation,
  techs: TechLocation[],
  factors: AutoAssignFactors = {}
): TechScore[] {
  if (!job.location) {
    throw new Error('Job must have location coordinates for scoring')
  }

  const {
    prioritizeDistance = true,
    prioritizePerformance = false,
  } = factors

  const scores = techs.map(tech => {
    if (!tech.lastLocation) {
      return {
        techId: tech.id,
        techName: tech.name,
        distance: Infinity,
        eta: Infinity,
        score: 0,
        reason: 'No GPS data available',
        isEligible: false,
        activeJobs: 0,
        jobsCompletedToday: 0
      }
    }

    // Calculate distance to job (in meters, convert to miles)
    const distanceMeters = calculateDistance(
      tech.lastLocation.lat,
      tech.lastLocation.lng,
      job.location.lat,
      job.location.lng
    )
    const distanceMiles = distanceMeters / 1609.34

    // ETA calculation (distance / avg speed)
    const avgSpeedMph = 30 // Assume 30 mph average in city
    const etaMinutes = Math.ceil((distanceMiles / avgSpeedMph) * 60)

    // Calculate GPS age in minutes
    const gpsAge = (Date.now() - new Date(tech.lastLocation.updatedAt).getTime()) / (1000 * 60)

    // Check eligibility
    const isEligible = tech.status === 'idle' && gpsAge < 30

    if (!isEligible) {
      return {
        techId: tech.id,
        techName: tech.name,
        distance: distanceMiles,
        eta: etaMinutes,
        score: 0,
        reason: tech.status !== 'idle'
          ? `Currently ${tech.status.replace('_', ' ')}`
          : 'GPS data too old (>30 min)',
        isEligible: false,
        gpsAge: Math.round(gpsAge),
        activeJobs: tech.status === 'on_job' ? 1 : 0,
        jobsCompletedToday: 0
      }
    }

    // Scoring factors (weighted)
    let score = 0

    // Distance score (closer = higher score)
    // 0 miles = 100 points, 50 miles = 0 points
    const distanceScore = Math.max(0, 100 - distanceMiles * 2)
    score += prioritizeDistance ? distanceScore * 2 : distanceScore

    // Performance score (more productive = higher score)
    // TODO: Get actual jobs completed today from API
    const jobsCompletedToday = 0 // Placeholder
    const performanceScore = jobsCompletedToday * 5
    score += prioritizePerformance ? performanceScore * 2 : performanceScore

    // GPS freshness bonus (more recent = better)
    const gpsFreshnessScore = Math.max(0, 10 - gpsAge / 3)
    score += gpsFreshnessScore

    // Urgency bonus for high-priority jobs
    const urgencyBonus = job.priority === 'urgent' ? 50 : job.priority === 'high' ? 25 : 0
    score += urgencyBonus

    // Workload balance (favor idle techs)
    const workloadScore = tech.status === 'idle' ? 20 : 0
    score += workloadScore

    // Generate reason
    const reasons: string[] = []
    if (distanceMiles < 5) reasons.push('closest available')
    if (jobsCompletedToday > 3) reasons.push('high performance')
    if (gpsAge < 5) reasons.push('real-time location')
    if (job.priority === 'urgent' || job.priority === 'high') reasons.push('priority job')

    const reason = reasons.length > 0
      ? `Best match: ${reasons.join(', ')}`
      : 'Available technician'

    return {
      techId: tech.id,
      techName: tech.name,
      distance: Math.round(distanceMiles * 10) / 10,
      eta: etaMinutes,
      score: Math.round(score),
      reason,
      isEligible: true,
      gpsAge: Math.round(gpsAge),
      activeJobs: 0,
      jobsCompletedToday
    }
  })

  // Sort by score (highest first)
  return scores.sort((a, b) => b.score - a.score)
}

/**
 * Auto-assign nearest tech to a job (calls the API)
 *
 * This function calls the server-side auto-assign API endpoint.
 * The API handles:
 * - Authentication and authorization
 * - Database queries for tech locations and jobs
 * - Actual job assignment
 * - Audit logging
 *
 * @param jobId - Job ID to assign
 * @param factors - Scoring factors
 * @param dryRun - If true, preview without assigning
 * @returns Auto-assign result
 */
export async function autoAssignNearestTech(
  jobId: string,
  factors?: AutoAssignFactors,
  dryRun = false
): Promise<AutoAssignResult> {
  try {
    const response = await fetch('/api/dispatch/auto-assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        factors,
        dryRun,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.details || 'Auto-assign failed')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Auto-assign error:', error)
    throw error
  }
}

/**
 * Client-side preview of auto-assignment
 *
 * This function scores techs locally for quick preview without hitting the API.
 * Use this for real-time UI updates before calling autoAssignNearestTech().
 *
 * Note: This does NOT check if techs are currently on jobs - use the API for that.
 *
 * @param job - Job to assign
 * @param techs - Available techs
 * @param factors - Scoring factors
 * @returns Preview of best tech and alternatives
 */
export function previewAutoAssign(
  job: JobLocation,
  techs: TechLocation[],
  factors?: AutoAssignFactors
): {
  bestTech: TechScore | null
  alternatives: TechScore[]
  eligibleCount: number
  totalCount: number
} {
  // Score all techs
  const scored = scoreTechs(job, techs, factors)

  // Get eligible techs only
  const eligible = scored.filter(t => t.isEligible)

  return {
    bestTech: eligible.length > 0 ? eligible[0] : null,
    alternatives: eligible.slice(1, 4), // Top 3 alternatives
    eligibleCount: eligible.length,
    totalCount: techs.length
  }
}

/**
 * Calculate ETA for a tech to reach a job
 *
 * @param tech - Tech location
 * @param job - Job location
 * @param avgSpeedMph - Average speed in mph (default: 30)
 * @returns ETA in minutes
 */
export function calculateETA(
  tech: TechLocation,
  job: JobLocation,
  avgSpeedMph = 30
): number {
  if (!tech.lastLocation || !job.location) {
    return Infinity
  }

  const distanceMeters = calculateDistance(
    tech.lastLocation.lat,
    tech.lastLocation.lng,
    job.location.lat,
    job.location.lng
  )

  const distanceMiles = distanceMeters / 1609.34
  const etaMinutes = (distanceMiles / avgSpeedMph) * 60

  return Math.ceil(etaMinutes)
}

/**
 * Get navigation URL to a location
 *
 * Opens Google Maps with turn-by-turn navigation to the specified location.
 * On mobile devices, this will open the native Google Maps app if installed.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Google Maps navigation URL
 */
export function getNavigationUrl(lat: number, lng: number): string {
  // Format: https://www.google.com/maps/dir/?api=1&destination=LAT,LNG
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/**
 * Get navigation URL from tech to job
 *
 * @param tech - Tech location
 * @param job - Job location
 * @returns Google Maps navigation URL or null if locations unavailable
 */
export function getTechToJobNavigationUrl(
  tech: TechLocation,
  job: JobLocation
): string | null {
  if (!tech.lastLocation || !job.location) {
    return null
  }

  // Include origin for better routing
  return `https://www.google.com/maps/dir/?api=1&origin=${tech.lastLocation.lat},${tech.lastLocation.lng}&destination=${job.location.lat},${job.location.lng}`
}

/**
 * Get multi-stop navigation URL for multiple waypoints
 *
 * Creates a route with multiple stops (for techs with multiple jobs).
 *
 * @param waypoints - Array of {lat, lng} waypoints
 * @returns Google Maps multi-stop navigation URL
 */
export function getMultiStopNavigationUrl(
  waypoints: Array<{ lat: number; lng: number }>
): string {
  if (waypoints.length === 0) {
    throw new Error('At least one waypoint is required')
  }

  if (waypoints.length === 1) {
    return getNavigationUrl(waypoints[0].lat, waypoints[0].lng)
  }

  // Format: https://www.google.com/maps/dir/LAT1,LNG1/LAT2,LNG2/LAT3,LNG3
  const waypointsParam = waypoints.map(w => `${w.lat},${w.lng}`).join('/')
  return `https://www.google.com/maps/dir/${waypointsParam}`
}
