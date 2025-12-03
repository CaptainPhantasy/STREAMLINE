import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/builder
 * Get saved report configurations
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

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get saved reports (stored in saved_reports table or similar)
    // For now, return available data sources
    return NextResponse.json({
      data_sources: [
        { id: 'jobs', name: 'Jobs', fields: ['status', 'total_amount', 'created_at', 'scheduled_start'] },
        { id: 'contacts', name: 'Contacts', fields: ['first_name', 'last_name', 'email', 'created_at'] },
        { id: 'conversations', name: 'Conversations', fields: ['status', 'channel', 'created_at'] },
        { id: 'estimates', name: 'Estimates', fields: ['status', 'total_amount', 'created_at'] },
      ],
      chart_types: ['line', 'bar', 'pie', 'area', 'table'],
    })
  } catch (error: unknown) {
    console.error('Error fetching report builder data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports/builder
 * Generate report based on builder configuration
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      data_source,
      fields,
      filters,
      chart_type,
      group_by,
      date_range,
    } = body

    if (!data_source || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'data_source and fields array are required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query based on data source
    let query = supabase.from(data_source).select(fields.join(',')).eq('account_id', userData.account_id)

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Apply date range
    if (date_range?.start) {
      query = query.gte('created_at', date_range.start)
    }
    if (date_range?.end) {
      query = query.lte('created_at', date_range.end)
    }

    const { data: results, error: queryError } = await query

    if (queryError) {
      console.error('Error executing report query:', queryError)
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      )
    }

    // Process data for chart
    const processedData = processDataForChart(results || [], group_by, chart_type)

    return NextResponse.json({
      data: results || [],
      chart_data: processedData,
      chart_type: chart_type || 'table',
      summary: {
        total_records: results?.length || 0,
      },
    })
  } catch (error: unknown) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function processDataForChart(
  data: any[],
  groupBy?: string,
  chartType?: string
): any {
  if (!groupBy || chartType === 'table') {
    return data
  }

  // Group data
  const grouped: Record<string, any[]> = {}
  data.forEach((item) => {
    const key = item[groupBy] || 'Unknown'
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(item)
  })

  // Format for chart
  return Object.entries(grouped).map(([key, values]) => ({
    name: key,
    value: values.length,
    data: values,
  }))
}

