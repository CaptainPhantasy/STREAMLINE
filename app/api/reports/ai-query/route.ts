import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/reports/ai-query
 * Convert natural language query to report
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
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
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

    // Use AI to convert natural language to report configuration
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: {
        type: 'object',
        properties: {
          data_source: {
            type: 'string',
            enum: ['jobs', 'contacts', 'conversations', 'estimates'],
            description: 'Primary data source for the query',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Fields to include in the report',
          },
          filters: {
            type: 'object',
            description: 'Filters to apply',
          },
          chart_type: {
            type: 'string',
            enum: ['line', 'bar', 'pie', 'area', 'table'],
            description: 'Recommended chart type',
          },
          group_by: {
            type: 'string',
            description: 'Field to group by (optional)',
          },
          date_range: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
            },
            description: 'Date range for the query',
          },
        },
        required: ['data_source', 'fields', 'chart_type'],
      },
      prompt: `Convert this natural language query into a report configuration:

Query: "${query}"

Available data sources:
- jobs: status, total_amount, created_at, scheduled_start, tech_assigned_id
- contacts: first_name, last_name, email, created_at, lead_source
- conversations: status, channel, created_at, assigned_to
- estimates: status, total_amount, created_at, contact_id

Determine:
1. Which data source to use
2. Which fields to include
3. What filters to apply
4. What chart type would best visualize this
5. What to group by (if applicable)
6. What date range to use (if mentioned)

Examples:
- "Show me revenue by tech this month" -> jobs, group_by: tech_assigned_id, chart_type: bar, date_range: this month
- "How many new contacts last week?" -> contacts, chart_type: table, date_range: last week`,
    })

    // Generate the actual report using the builder endpoint logic
    const reportResponse = await fetch(`${request.nextUrl.origin}/api/reports/builder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(result.object),
    })

    if (!reportResponse.ok) {
      throw new Error('Failed to generate report')
    }

    const reportData = await reportResponse.json()

    return NextResponse.json({
      query: query,
      configuration: result.object,
      report: reportData,
    })
  } catch (error: unknown) {
    console.error('Error processing AI query:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}

