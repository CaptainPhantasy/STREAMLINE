import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/marketing-roi
 * Get marketing ROI analysis
 */
export async function GET(request: NextRequest) {
  try {
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
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only owner/admin can view marketing ROI
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Owner/Admin access required' },
        { status: 403 }
      )
    }

    // Get contacts by lead source
    let contactsQuery = supabase
      .from('contacts')
      .select('lead_source, created_at')
      .eq('account_id', userData.account_id)
      .not('lead_source', 'is', null)

    if (startDate) {
      contactsQuery = contactsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      contactsQuery = contactsQuery.lte('created_at', endDate)
    }

    const { data: contacts } = await contactsQuery

    // Get jobs from these contacts
    const contactIds = contacts?.map(c => c.id) || []
    const { data: jobs } = await supabase
      .from('jobs')
      .select('contact_id, total_amount, status')
      .eq('account_id', userData.account_id)
      .in('contact_id', contactIds)

    // Calculate ROI by lead source
    const sourceMetrics: Record<string, any> = {}

    contacts?.forEach((contact) => {
      const source = contact.lead_source || 'unknown'
      if (!sourceMetrics[source]) {
        sourceMetrics[source] = {
          source,
          contacts: 0,
          jobs: 0,
          revenue: 0,
        }
      }
      sourceMetrics[source].contacts++

      const sourceJobs = jobs?.filter((j) => j.contact_id === contact.id) || []
      sourceMetrics[source].jobs += sourceJobs.length
      sourceMetrics[source].revenue += sourceJobs
        .filter((j) => j.status === 'paid' || j.status === 'completed')
        .reduce((sum, j) => sum + (j.total_amount || 0), 0)
    })

    // Calculate overall ROI (simplified - assumes marketing spend is tracked elsewhere)
    const totalContacts = contacts?.length || 0
    const totalJobs = jobs?.length || 0
    const totalRevenue = jobs
      ?.filter((j) => j.status === 'paid' || j.status === 'completed')
      .reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0

    return NextResponse.json({
      period: {
        start: startDate || null,
        end: endDate || null,
      },
      overall: {
        total_contacts: totalContacts,
        total_jobs: totalJobs,
        conversion_rate: totalContacts > 0 ? (totalJobs / totalContacts) * 100 : 0,
        total_revenue: totalRevenue,
        revenue_per_contact: totalContacts > 0 ? totalRevenue / totalContacts : 0,
      },
      by_source: Object.values(sourceMetrics),
    })
  } catch (error: unknown) {
    console.error('Error generating marketing ROI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

