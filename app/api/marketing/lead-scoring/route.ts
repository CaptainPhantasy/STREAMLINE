import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/marketing/lead-scoring
 * AI-powered lead scoring for marketing automation
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
    const { contact_ids } = body

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids array is required' },
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

    // Get contacts with related data
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*, jobs(*), conversations(*)')
      .in('id', contact_ids)
      .eq('account_id', userData.account_id)

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      )
    }

    // Score each contact using AI
    const scoredContacts = await Promise.all(
      (contacts || []).map(async (contact) => {
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
          .eq('id', contact.id)

        return {
          contact_id: contact.id,
          score: result.object.lead_score,
          conversion_probability: result.object.conversion_probability,
          scoring_factors: result.object.scoring_factors,
        }
      })
    )

    return NextResponse.json({
      success: true,
      scored_contacts: scoredContacts,
      total_scored: scoredContacts.length,
    })
  } catch (error: unknown) {
    console.error('Error scoring leads:', error)
    return NextResponse.json(
      { error: 'Failed to score leads' },
      { status: 500 }
    )
  }
}

