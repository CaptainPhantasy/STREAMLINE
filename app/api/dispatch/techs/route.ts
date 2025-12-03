import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { TechLocation, TechStatus } from '@/types/dispatch'

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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get all techs and sales people for this account
    const { data: techs, error: techsError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        role
      `)
      .eq('account_id', userData.account_id)
      .in('role', ['tech', 'sales'])

    if (techsError) throw techsError

    if (!techs) {
      return NextResponse.json({ techs: [] })
    }

    // Get each tech's latest GPS location and active job
    const techsWithLocations: TechLocation[] = await Promise.all(
      techs.map(async (tech) => {
        // Get latest GPS log
        const { data: lastGps } = await supabase
          .from('gps_logs')
          .select('latitude, longitude, accuracy, created_at')
          .eq('user_id', tech.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get active job assignment
        const { data: activeJob } = await supabase
          .from('jobs')
          .select('id, description, status')
          .eq('tech_assigned_id', tech.id)
          .in('status', ['scheduled', 'en_route', 'in_progress'])
          .order('scheduled_start', { ascending: true })
          .limit(1)
          .single()

        // Get job address if there's an active job
        let jobAddress: string | undefined
        if (activeJob) {
          const { data: jobData } = await supabase
            .from('jobs')
            .select('contact_id, contacts!inner(address)')
            .eq('id', activeJob.id)
            .single()

          // Supabase returns contacts as array even with single join
          const contacts = jobData?.contacts as any
          jobAddress = Array.isArray(contacts) ? contacts[0]?.address : contacts?.address
        }

        // Determine tech status
        let status: TechStatus = 'offline'
        if (activeJob?.status === 'in_progress') {
          status = 'on_job'
        } else if (activeJob?.status === 'en_route') {
          status = 'en_route'
        } else if (lastGps && new Date(lastGps.created_at) > new Date(Date.now() - 30 * 60 * 1000)) {
          // Had GPS update in last 30 minutes
          status = 'idle'
        }

        return {
          id: tech.id,
          name: tech.full_name || 'Unknown',
          role: tech.role as 'tech' | 'sales',
          status,
          currentJob: activeJob ? {
            id: activeJob.id,
            description: activeJob.description || 'No description',
            address: jobAddress || 'Unknown'
          } : undefined,
          lastLocation: lastGps ? {
            lat: parseFloat(lastGps.latitude),
            lng: parseFloat(lastGps.longitude),
            accuracy: lastGps.accuracy ? parseFloat(lastGps.accuracy) : 0,
            updatedAt: lastGps.created_at
          } : undefined
        }
      })
    )

    return NextResponse.json({ techs: techsWithLocations })
  } catch (error) {
    console.error('Error fetching tech locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tech locations' },
      { status: 500 }
    )
  }
}
