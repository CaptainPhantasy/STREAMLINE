import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/leads/[id]/score
 * Calculate AI-powered lead score for a contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const contactId = params.id

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, jobs(*), conversations(*)')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Verify account access
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== contact.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use AI to calculate lead score
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: {
        type: 'object',
        properties: {
          lead_score: {
            type: 'number',
            description: 'Lead score from 0-100',
          },
          conversion_probability: {
            type: 'number',
            description: 'Conversion probability from 0-100',
          },
          scoring_factors: {
            type: 'object',
            description: 'Breakdown of scoring factors',
          },
          recommended_actions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Recommended next actions',
          },
        },
        required: ['lead_score', 'conversion_probability', 'scoring_factors'],
      },
      prompt: `Calculate a lead score for this contact:

Contact: ${contact.first_name} ${contact.last_name}
Email: ${contact.email || 'N/A'}
Phone: ${contact.phone || 'N/A'}
Lead Source: ${contact.lead_source || 'Unknown'}
Jobs: ${contact.jobs?.length || 0}
Conversations: ${contact.conversations?.length || 0}

Consider:
- Contact quality (email, phone completeness)
- Engagement level (conversations, jobs)
- Lead source quality
- Historical conversion patterns

Provide a score 0-100 and conversion probability.`,
    })

    // Update contact with score
    await supabase
      .from('contacts')
      .update({
        lead_score: result.object.lead_score,
        conversion_probability: result.object.conversion_probability,
        scoring_factors: result.object.scoring_factors,
      })
      .eq('id', contactId)

    return NextResponse.json({
      contact_id: contactId,
      score: result.object.lead_score,
      conversion_probability: result.object.conversion_probability,
      scoring_factors: result.object.scoring_factors,
      recommended_actions: result.object.recommended_actions || [],
    })
  } catch (error: unknown) {
    console.error('Error calculating lead score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate lead score' },
      { status: 500 }
    )
  }
}

