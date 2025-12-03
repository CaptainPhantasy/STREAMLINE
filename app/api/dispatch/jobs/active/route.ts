import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/dispatch/jobs/active
 *
 * Fetches all active jobs for the dispatch map dashboard.
 * Returns jobs with status: scheduled, en_route, or in_progress.
 * Includes job location (lat/lng), customer info, and assigned tech details.
 *
 * Authorization: dispatcher, admin, or owner role required
 * Multi-tenant: Filters by account_id
 *
 * Response format:
 * {
 *   jobs: Array<{
 *     id: string
 *     description: string
 *     status: 'scheduled' | 'en_route' | 'in_progress'
 *     scheduledStart: string
 *     customer: {
 *       name: string
 *       phone: string
 *       address: string
 *     }
 *     location?: {
 *       lat: number
 *       lng: number
 *     }
 *     assignedTech?: {
 *       id: string
 *       name: string
 *     }
 *   }>
 * }
 */
export async function GET(request: Request) {
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

  try {
    // Fetch active jobs with contact and tech information
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        description,
        status,
        scheduled_start,
        total_amount,
        tech_assigned_id,
        contact_id,
        contacts (
          first_name,
          last_name,
          phone,
          address,
          email
        ),
        users:tech_assigned_id (
          id,
          full_name
        )
      `)
      .eq('account_id', userData.account_id)
      .in('status', ['scheduled', 'en_route', 'in_progress'])
      .order('scheduled_start', { ascending: true })

    if (jobsError) throw jobsError

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ jobs: [] })
    }

    // Transform data to match expected format
    const transformedJobs = await Promise.all(
      jobs.map(async (job) => {
        const contact = Array.isArray(job.contacts) ? job.contacts[0] : job.contacts
        const techUser = Array.isArray(job.users) ? job.users[0] : job.users

        // Get GPS coordinates for job location from contact address
        // For now, we'll return null if no lat/lng exists in database
        // TODO: Add geocoding service to convert addresses to coordinates
        let location: { lat: number; lng: number } | undefined = undefined

        // Check if job has latitude/longitude fields (if schema was updated)
        const jobRecord = job as any
        if (jobRecord.latitude && jobRecord.longitude) {
          location = {
            lat: parseFloat(jobRecord.latitude),
            lng: parseFloat(jobRecord.longitude)
          }
        }

        return {
          id: job.id,
          description: job.description || 'No description',
          status: job.status as 'scheduled' | 'en_route' | 'in_progress',
          scheduledStart: job.scheduled_start || new Date().toISOString(),
          customer: {
            name: contact
              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
              : 'Unknown',
            phone: contact?.phone || '',
            address: contact?.address || '',
            email: contact?.email || ''
          },
          location,
          assignedTech: techUser ? {
            id: techUser.id,
            name: techUser.full_name || 'Unknown'
          } : undefined,
          totalAmount: job.total_amount
        }
      })
    )

    // Filter out jobs without locations (optional - commented out to show all jobs)
    // const jobsWithLocations = transformedJobs.filter(job => job.location !== undefined)

    return NextResponse.json({
      jobs: transformedJobs,
      meta: {
        total: transformedJobs.length,
        withLocations: transformedJobs.filter(j => j.location).length,
        withoutLocations: transformedJobs.filter(j => !j.location).length
      }
    })

  } catch (error) {
    console.error('Error fetching active jobs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch active jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
