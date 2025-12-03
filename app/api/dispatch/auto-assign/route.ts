import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateDistance } from '@/lib/gps/tracker'

/**
 * POST /api/dispatch/auto-assign
 *
 * Automatically assigns the best available technician to a job.
 * Uses intelligent scoring algorithm based on:
 * - Distance from job location
 * - Tech's current workload
 * - Job priority
 * - Tech's recent performance
 *
 * Request Body:
 * {
 *   jobId: string  // Job to assign
 *   factors?: {
 *     prioritizeDistance?: boolean  // Weight distance heavily (default: true)
 *     prioritizePerformance?: boolean  // Weight performance (default: false)
 *     requireSkills?: string[]  // Required skills (future)
 *   }
 *   dryRun?: boolean  // If true, returns suggestion without assigning (default: false)
 * }
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Validates job belongs to account
 *
 * Response format:
 * {
 *   success: true
 *   assignment: {
 *     techId: string
 *     techName: string
 *     distance: number  // miles
 *     eta: number  // minutes
 *     score: number
 *     reason: string
 *   }
 *   alternatives?: Array<{ techId, techName, distance, eta, score }>  // Top 3 alternatives
 * }
 */
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and account
  const { data: userData } = await supabase
    .from('users')
    .select('role, account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user has dispatcher permissions
  if (!['owner', 'admin', 'dispatcher'].includes(userData.role || '')) {
    return NextResponse.json({
      error: 'Forbidden: dispatcher, admin, or owner role required'
    }, { status: 403 })
  }

  // Parse request body
  let body: {
    jobId: string
    factors?: {
      prioritizeDistance?: boolean
      prioritizePerformance?: boolean
      requireSkills?: string[]
    }
    dryRun?: boolean
  }

  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { jobId, factors = {}, dryRun = false } = body
  const {
    prioritizeDistance = true,
    prioritizePerformance = false,
    requireSkills = []
  } = factors

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  try {
    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        account_id,
        description,
        status,
        tech_assigned_id,
        contact_id,
        contacts (address)
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.account_id !== userData.account_id) {
      return NextResponse.json({
        error: 'Forbidden: Job belongs to different account'
      }, { status: 403 })
    }

    // Check if job is already assigned
    if (job.tech_assigned_id) {
      return NextResponse.json({
        error: 'Job is already assigned',
        details: 'Unassign the tech first if you want to reassign'
      }, { status: 400 })
    }

    // Get job location (if available)
    const jobRecord = job as any
    let jobLat: number | undefined
    let jobLng: number | undefined

    if (jobRecord.latitude && jobRecord.longitude) {
      jobLat = parseFloat(jobRecord.latitude)
      jobLng = parseFloat(jobRecord.longitude)
    }

    if (!jobLat || !jobLng) {
      return NextResponse.json({
        error: 'Job location not available',
        details: 'Job must have latitude/longitude coordinates for auto-assignment'
      }, { status: 400 })
    }

    // Fetch all techs for this account
    const { data: techs, error: techsError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('account_id', userData.account_id)
      .in('role', ['tech', 'sales'])

    if (techsError) throw techsError

    if (!techs || techs.length === 0) {
      return NextResponse.json({
        error: 'No technicians available',
        details: 'Add techs to your account first'
      }, { status: 400 })
    }

    // Score each tech
    interface TechScore {
      techId: string
      techName: string
      distance: number // meters
      distanceMiles: number
      eta: number // minutes
      score: number
      isEligible: boolean
      reason: string
      gpsAge?: number // minutes
      activeJobs: number
      jobsCompletedToday: number
    }

    const scoredTechs: TechScore[] = []

    for (const tech of techs) {
      // Get tech's latest GPS location
      const { data: lastGps } = await supabase
        .from('gps_logs')
        .select('latitude, longitude, created_at')
        .eq('user_id', tech.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Check GPS age
      const gpsAgeMinutes = lastGps
        ? (Date.now() - new Date(lastGps.created_at).getTime()) / (1000 * 60)
        : Infinity

      // Tech must have recent GPS (within 30 minutes)
      if (!lastGps || gpsAgeMinutes > 30) {
        scoredTechs.push({
          techId: tech.id,
          techName: tech.full_name || 'Unknown',
          distance: Infinity,
          distanceMiles: Infinity,
          eta: Infinity,
          score: 0,
          isEligible: false,
          reason: lastGps ? 'GPS data too old (>30 min)' : 'No GPS data available',
          gpsAge: lastGps ? gpsAgeMinutes : undefined,
          activeJobs: 0,
          jobsCompletedToday: 0
        })
        continue
      }

      // Check if tech is already on a job
      const { data: activeJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('tech_assigned_id', tech.id)
        .in('status', ['en_route', 'in_progress'])

      const activeJobCount = activeJobs?.length || 0

      if (activeJobCount > 0) {
        scoredTechs.push({
          techId: tech.id,
          techName: tech.full_name || 'Unknown',
          distance: Infinity,
          distanceMiles: Infinity,
          eta: Infinity,
          score: 0,
          isEligible: false,
          reason: `Currently on ${activeJobCount} job(s)`,
          gpsAge: gpsAgeMinutes,
          activeJobs: activeJobCount,
          jobsCompletedToday: 0
        })
        continue
      }

      // Calculate distance to job
      const distance = calculateDistance(
        parseFloat(lastGps.latitude),
        parseFloat(lastGps.longitude),
        jobLat,
        jobLng
      )

      const distanceMiles = distance / 1609.34

      // Calculate ETA (assume 30 mph average speed in city)
      const avgSpeedMph = 30
      const etaMinutes = (distanceMiles / avgSpeedMph) * 60

      // Get jobs completed today for performance scoring
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: completedJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('tech_assigned_id', tech.id)
        .eq('status', 'completed')
        .gte('created_at', today.toISOString())

      const jobsCompletedToday = completedJobs?.length || 0

      // Calculate score
      let score = 0

      // Distance factor (closer is better)
      const distanceScore = Math.max(0, 100 - distanceMiles * 2)
      score += prioritizeDistance ? distanceScore * 2 : distanceScore

      // Performance factor (more completions = better)
      const performanceScore = jobsCompletedToday * 5
      score += prioritizePerformance ? performanceScore * 2 : performanceScore

      // GPS freshness bonus (more recent = better)
      const gpsFreshnessScore = Math.max(0, 10 - gpsAgeMinutes / 3)
      score += gpsFreshnessScore

      // Workload balance (favor idle techs)
      const workloadScore = activeJobCount === 0 ? 20 : 0
      score += workloadScore

      scoredTechs.push({
        techId: tech.id,
        techName: tech.full_name || 'Unknown',
        distance,
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        eta: Math.round(etaMinutes),
        score: Math.round(score),
        isEligible: true,
        reason: 'Available',
        gpsAge: Math.round(gpsAgeMinutes),
        activeJobs: activeJobCount,
        jobsCompletedToday
      })
    }

    // Sort by score (highest first)
    scoredTechs.sort((a, b) => b.score - a.score)

    // Get eligible techs
    const eligibleTechs = scoredTechs.filter(t => t.isEligible)

    if (eligibleTechs.length === 0) {
      return NextResponse.json({
        error: 'No eligible technicians available',
        details: 'All techs are either busy or offline',
        ineligibleTechs: scoredTechs.map(t => ({
          techName: t.techName,
          reason: t.reason
        }))
      }, { status: 400 })
    }

    const bestTech = eligibleTechs[0]

    // Generate reason
    const reasons: string[] = []
    if (bestTech.distanceMiles < 5) reasons.push('closest available tech')
    if (bestTech.jobsCompletedToday > 3) reasons.push('high performance today')
    if (bestTech.gpsAge && bestTech.gpsAge < 5) reasons.push('real-time location')

    const reason = reasons.length > 0
      ? `Best match: ${reasons.join(', ')}`
      : 'Best available technician based on all factors'

    // If dry run, return without assigning
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        assignment: {
          techId: bestTech.techId,
          techName: bestTech.techName,
          distance: bestTech.distanceMiles,
          eta: bestTech.eta,
          score: bestTech.score,
          reason
        },
        alternatives: eligibleTechs.slice(1, 4).map(t => ({
          techId: t.techId,
          techName: t.techName,
          distance: t.distanceMiles,
          eta: t.eta,
          score: t.score
        })),
        allScores: scoredTechs
      })
    }

    // Assign the job
    const now = new Date().toISOString()
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        tech_assigned_id: bestTech.techId,
        status: 'scheduled'
      })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) throw updateError

    // Create audit log
    const auditLog = {
      account_id: userData.account_id,
      user_id: user.id,
      action: 'job_auto_assigned',
      entity_type: 'job',
      entity_id: jobId,
      old_values: {
        tech_assigned_id: null,
        status: job.status
      },
      new_values: {
        tech_assigned_id: bestTech.techId,
        status: 'scheduled'
      },
      metadata: {
        auto_assign: true,
        score: bestTech.score,
        distance_miles: bestTech.distanceMiles,
        eta_minutes: bestTech.eta,
        reason,
        alternatives_count: eligibleTechs.length - 1
      }
    }

    const { error: auditError } = await supabase
      .from('crmai_audit')
      .insert(auditLog)

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      assignment: {
        techId: bestTech.techId,
        techName: bestTech.techName,
        distance: bestTech.distanceMiles,
        eta: bestTech.eta,
        score: bestTech.score,
        reason
      },
      alternatives: eligibleTechs.slice(1, 4).map(t => ({
        techId: t.techId,
        techName: t.techName,
        distance: t.distanceMiles,
        eta: t.eta,
        score: t.score
      })),
      meta: {
        assignedAt: now,
        assignedBy: user.id,
        eligibleTechsCount: eligibleTechs.length,
        totalTechsCount: techs.length
      }
    })

  } catch (error) {
    console.error('Error auto-assigning job:', error)
    return NextResponse.json(
      {
        error: 'Failed to auto-assign job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
