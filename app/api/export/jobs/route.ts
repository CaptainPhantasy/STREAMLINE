import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status')
    const techId = searchParams.get('techId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        id,
        status,
        description,
        scheduled_start,
        scheduled_end,
        total_amount,
        created_at,
        contact:contacts(first_name, last_name, email, phone, address),
        tech:users!tech_assigned_id(full_name, role)
      `)
      .eq('account_id', user.account_id)

    if (status) query = query.eq('status', status)
    if (techId) query = query.eq('tech_assigned_id', techId)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: jobs, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Job ID',
        'Status',
        'Description',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Address',
        'Scheduled Start',
        'Scheduled End',
        'Total Amount',
        'Assigned Tech',
        'Created At'
      ]

      const rows = (jobs || []).map(job => [
        job.id,
        job.status || '',
        job.description || '',
        job.contact ? `${job.contact.first_name || ''} ${job.contact.last_name || ''}`.trim() : '',
        job.contact?.email || '',
        job.contact?.phone || '',
        job.contact?.address || '',
        job.scheduled_start || '',
        job.scheduled_end || '',
        job.total_amount ? `$${(job.total_amount / 100).toFixed(2)}` : '',
        job.tech?.full_name || '',
        job.created_at || ''
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="jobs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json({ jobs: jobs || [] })
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error in GET /api/export/jobs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

