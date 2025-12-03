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
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

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

    // Get contacts
    let contactQuery = supabase
      .from('contacts')
      .select('id, created_at')
      .eq('account_id', user.account_id)

    if (dateFrom) {
      contactQuery = contactQuery.gte('created_at', dateFrom)
    }

    if (dateTo) {
      contactQuery = contactQuery.lte('created_at', dateTo)
    }

    const { data: contacts, error: contactsError } = await contactQuery

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    // Get jobs for contacts
    const contactIds = contacts?.map((c) => c.id) || []
    let jobsQuery = supabase
      .from('jobs')
      .select('contact_id, total_amount')
      .eq('account_id', user.account_id)
      .in('contact_id', contactIds)

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Calculate analytics
    const newContacts = contacts?.length || 0
    const contactsWithJobs = new Set(jobs?.map((j) => j.contact_id) || []).size
    const totalRevenueFromContacts = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0

    // Group by date
    const dateBreakdown = contacts?.reduce((acc, contact) => {
      const date = new Date(contact.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      newContacts,
      contactsWithJobs,
      totalRevenueFromContacts,
      dateBreakdown,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/analytics/contacts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

