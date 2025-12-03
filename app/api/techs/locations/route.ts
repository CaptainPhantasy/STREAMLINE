import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: gpsLogs, error } = await supabase
      .from('gps_logs')
      .select(`
        *,
        user:users(id, full_name, email),
        job:jobs(id, title, description, address)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching GPS logs:', error)
      return NextResponse.json({ techs: [] })
    }

    const techsMap = new Map()
    
    gpsLogs?.forEach((log: any) => {
      if (log.user && !techsMap.has(log.user.id)) {
        techsMap.set(log.user.id, {
          id: log.user.id,
          techName: log.user.full_name || log.user.email,
          latitude: log.latitude || 39.768403,
          longitude: log.longitude || -86.158068,
          currentJob: log.job ? {
            id: log.job.id,
            title: log.job.title || log.job.description || 'Untitled Job',
            address: log.job.address || '',
            status: 'in_progress'
          } : undefined,
          lastUpdate: log.created_at,
          status: log.job ? 'on_job' : 'available'
        })
      }
    })

    const techs = Array.from(techsMap.values())

    return NextResponse.json({ techs })
  } catch (error) {
    console.error('Error fetching tech locations:', error)
    return NextResponse.json({ techs: [] })
  }
}
