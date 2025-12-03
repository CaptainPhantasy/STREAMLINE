import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, description, address, status, assigned_to')
      .not('address', 'is', null)
      .limit(100)

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ jobs: [] })
    }

    const jobsWithLocations = (jobs || []).map(job => ({
      id: job.id,
      title: job.title || job.description || 'Untitled Job',
      address: job.address || '',
      latitude: 39.768403,
      longitude: -86.158068,
      status: job.status || 'pending',
      assignedTech: job.assigned_to
    }))

    return NextResponse.json({ jobs: jobsWithLocations })
  } catch (error) {
    console.error('Error fetching job locations:', error)
    return NextResponse.json({ jobs: [] })
  }
}
