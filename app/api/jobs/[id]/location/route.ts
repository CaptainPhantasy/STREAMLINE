import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, accuracy, locationType } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get job to verify access
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Determine which location fields to update based on job status or locationType
    // If job is starting (en_route or in_progress), save to start_location
    // If job is completed, save to complete_location
    // If locationType is specified, use that
    const updateData: Record<string, unknown> = {}
    
    if (locationType === 'start' || (!locationType && (job.status === 'en_route' || job.status === 'in_progress'))) {
      updateData.start_location_lat = latitude
      updateData.start_location_lng = longitude
    } else if (locationType === 'complete' || (!locationType && job.status === 'completed')) {
      updateData.complete_location_lat = latitude
      updateData.complete_location_lng = longitude
    } else {
      // Default to start location if status doesn't match
      updateData.start_location_lat = latitude
      updateData.start_location_lng = longitude
    }

    const { data: updatedJob, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job location:', error)
      return NextResponse.json({ error: 'Failed to save location' }, { status: 500 })
    }

    return NextResponse.json({ job: updatedJob })
  } catch (error: unknown) {
    console.error('Error in POST /api/jobs/[id]/location:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

