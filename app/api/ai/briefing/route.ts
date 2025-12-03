/**
 * AI Briefing API - POST /api/ai/briefing
 *
 * Generates AI-powered meeting briefs with customer history, talking points,
 * and pricing suggestions using the LLM router.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routerCall } from '@/lib/llm/integration/router-client'
import type { AIBriefing, TalkingPoint, PricingSuggestion } from '@/lib/types/sales'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request
    const body = await request.json()
    const { contact_id, meeting_type = 'consultation' } = body

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
    }

    // 3. Fetch contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // 4. Fetch related data in parallel
    const [jobsResult, meetingsResult, conversationsResult] = await Promise.all([
      // Recent jobs
      supabase
        .from('jobs')
        .select('id, description, status, total_amount, created_at, completed_at')
        .eq('contact_id', contact_id)
        .order('created_at', { ascending: false })
        .limit(10),

      // Past meetings
      supabase
        .from('meetings')
        .select('id, scheduled_at, summary, sentiment, notes')
        .eq('contact_id', contact_id)
        .order('scheduled_at', { ascending: false })
        .limit(5),

      // Open conversations
      supabase
        .from('conversations')
        .select('id, subject, status, last_message_at')
        .eq('contact_id', contact_id)
        .eq('status', 'open')
        .order('last_message_at', { ascending: false })
        .limit(5),
    ])

    const jobs = jobsResult.data || []
    const meetings = meetingsResult.data || []
    const openConversations = conversationsResult.data || []

    // 5. Calculate metrics
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)
    const completedJobs = jobs.filter((j) => j.status === 'completed')
    const lastContactDate = meetings[0]?.scheduled_at || jobs[0]?.created_at || contact.created_at

    // 6. Build context for LLM
    const profile = (contact.profile as Record<string, any>) || {}
    const contextData = {
      contact: {
        name: `${contact.first_name} ${contact.last_name}`,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
      },
      profile: {
        family: profile.family,
        preferences: profile.preferences,
        interests: profile.interests || [],
        pain_points: profile.pain_points || [],
      },
      history: {
        total_revenue: totalRevenue,
        total_jobs: jobs.length,
        completed_jobs: completedJobs.length,
        last_contact: lastContactDate,
      },
      recent_jobs: jobs.slice(0, 5).map((j) => ({
        description: j.description,
        status: j.status,
        amount: j.total_amount,
        date: j.created_at,
      })),
      past_meetings: meetings.map((m) => ({
        date: m.scheduled_at,
        summary: m.summary,
        sentiment: m.sentiment,
      })),
      open_issues: openConversations.map((c) => c.subject),
    }

    // 7. Generate AI briefing
    const prompt = `You are a sales assistant preparing a meeting brief for a sales representative.

CONTACT INFORMATION:
${JSON.stringify(contextData, null, 2)}

MEETING TYPE: ${meeting_type}

Generate a comprehensive meeting briefing that includes:
1. A brief summary of the customer's history and current situation (2-3 sentences)
2. 5-7 talking points prioritized as high/medium/low with categories (relationship, technical, pricing, follow_up)
3. Pricing suggestions for common services with low/recommended/high ranges
4. Recommended services based on their history
5. Any warnings or red flags to be aware of
6. Opportunities to upsell or cross-sell
7. Pain points mentioned in previous interactions

Format your response as a JSON object with this structure:
{
  "history_summary": "string",
  "talking_points": [
    {
      "id": "tp-1",
      "text": "string",
      "priority": "high|medium|low",
      "category": "relationship|technical|pricing|follow_up"
    }
  ],
  "pricing_suggestions": [
    {
      "service": "string",
      "low": number,
      "recommended": number,
      "high": number,
      "notes": "string",
      "profit_margin": number (0-1)
    }
  ],
  "recommended_services": ["service1", "service2"],
  "warnings": ["warning1", "warning2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "pain_points": ["pain1", "pain2"]
}

Respond ONLY with valid JSON, no markdown formatting.`

    const llmResponse = await routerCall({
      useCase: 'general',
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    if (!llmResponse.text) {
      throw new Error('LLM returned no response')
    }

    // 8. Parse LLM response
    let aiData: any
    try {
      // Remove markdown code blocks if present
      const cleanText = llmResponse.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      aiData = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', llmResponse.text)
      // Fallback: create basic briefing from data
      aiData = {
        history_summary: `${contact.first_name} has been a customer for ${
          Math.floor(
            (Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
        } days with ${jobs.length} total jobs and $${totalRevenue.toFixed(2)} in revenue.`,
        talking_points: [
          {
            id: 'tp-1',
            text: 'Review past job satisfaction and current needs',
            priority: 'high',
            category: 'relationship',
          },
        ],
        pricing_suggestions: [],
        recommended_services: [],
        warnings: openConversations.length > 0 ? ['Open issues need attention'] : [],
        opportunities: [],
        pain_points: [],
      }
    }

    // 9. Build final briefing
    const briefing: AIBriefing = {
      contact: {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        company: contact.company,
        profile: contact.profile as any,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
      },
      history_summary: aiData.history_summary || '',
      talking_points: (aiData.talking_points || []).map((tp: any, index: number) => ({
        id: tp.id || `tp-${index}`,
        text: tp.text,
        priority: tp.priority || 'medium',
        category: tp.category || 'relationship',
        checked: false,
      })) as TalkingPoint[],
      pricing_suggestions: (aiData.pricing_suggestions || []) as PricingSuggestion[],
      recommended_services: aiData.recommended_services || [],
      pain_points: aiData.pain_points || [],
      opportunities: aiData.opportunities || [],
      warnings: aiData.warnings || [],
      generated_at: new Date().toISOString(),
    }

    // 10. Return briefing
    return NextResponse.json({
      briefing,
      cached: false,
      usage: llmResponse.usage,
    })
  } catch (error) {
    console.error('AI Briefing Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate briefing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
