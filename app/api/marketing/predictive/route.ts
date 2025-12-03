import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/marketing/predictive
 * Predictive analytics (churn, lifetime value, etc.)
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
    const { analysis_type, contact_ids } = body

    if (!analysis_type) {
      return NextResponse.json(
        { error: 'analysis_type is required (churn, lifetime_value, etc.)' },
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

    // Build query for contacts
    let query = supabase
      .from('contacts')
      .select('*, jobs(*), conversations(*)')
      .eq('account_id', userData.account_id)

    if (contact_ids && Array.isArray(contact_ids) && contact_ids.length > 0) {
      query = query.in('id', contact_ids)
    }

    const { data: contacts, error: contactsError } = await query.limit(100)

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      )
    }

    // Perform predictive analysis based on type
    if (analysis_type === 'churn') {
      const predictions = await Promise.all(
        (contacts || []).map(async (contact) => {
          const result = await generateObject({
            model: openai('gpt-4o'),
            schema: {
              type: 'object',
              properties: {
                churn_risk: {
                  type: 'number',
                  description: 'Churn risk score 0-100',
                },
                predicted_churn_date: {
                  type: 'string',
                  description: 'Predicted date of churn',
                },
                risk_factors: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Factors contributing to churn risk',
                },
                recommended_actions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Recommended actions to prevent churn',
                },
              },
              required: ['churn_risk', 'risk_factors'],
            },
            prompt: `Analyze churn risk for this customer:

Contact: ${contact.first_name} ${contact.last_name}
Total Jobs: ${contact.jobs?.length || 0}
Total Revenue: ${contact.jobs?.reduce((sum: number, j: any) => sum + (j.total_amount || 0), 0) || 0}
Last Job: ${contact.jobs?.[0]?.created_at || 'Never'}
Conversations: ${contact.conversations?.length || 0}
Last Contact: ${contact.conversations?.[0]?.last_message_at || 'Never'}

Predict churn risk and provide recommendations.`,
          })

          return {
            contact_id: contact.id,
            ...result.object,
          }
        })
      )

      return NextResponse.json({
        analysis_type: 'churn',
        predictions,
        total_analyzed: predictions.length,
      })
    }

    if (analysis_type === 'lifetime_value') {
      const predictions = await Promise.all(
        (contacts || []).map(async (contact) => {
          const totalRevenue = contact.jobs?.reduce(
            (sum: number, j: any) => sum + (j.total_amount || 0),
            0
          ) || 0

          const result = await generateObject({
            model: openai('gpt-4o'),
            schema: {
              type: 'object',
              properties: {
                predicted_lifetime_value: {
                  type: 'number',
                  description: 'Predicted total lifetime value',
                },
                predicted_years_active: {
                  type: 'number',
                  description: 'Predicted years of active relationship',
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score 0-100',
                },
                factors: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Factors influencing prediction',
                },
              },
              required: ['predicted_lifetime_value', 'confidence'],
            },
            prompt: `Predict lifetime value for this customer:

Contact: ${contact.first_name} ${contact.last_name}
Current Total Revenue: $${totalRevenue / 100}
Total Jobs: ${contact.jobs?.length || 0}
Average Job Value: $${contact.jobs?.length > 0 ? totalRevenue / (contact.jobs.length * 100) : 0}
Job Frequency: ${contact.jobs?.length || 0} jobs
Customer Since: ${contact.created_at}

Predict lifetime value based on historical patterns.`,
          })

          return {
            contact_id: contact.id,
            current_revenue: totalRevenue,
            ...result.object,
          }
        })
      )

      return NextResponse.json({
        analysis_type: 'lifetime_value',
        predictions,
        total_analyzed: predictions.length,
      })
    }

    return NextResponse.json(
      { error: `Unknown analysis_type: ${analysis_type}` },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error('Error performing predictive analysis:', error)
    return NextResponse.json(
      { error: 'Failed to perform predictive analysis' },
      { status: 500 }
    )
  }
}

