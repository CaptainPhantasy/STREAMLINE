/**
 * AI Pricing API - POST /api/ai/pricing
 *
 * Generates AI-powered pricing suggestions based on services and customer history.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routerCall } from '@/lib/llm/integration/router-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contact_id, services, job_details } = body

    if (!services || services.length === 0) {
      return NextResponse.json({ error: 'services array is required' }, { status: 400 })
    }

    // Fetch contact history if provided
    let historyContext = ''
    if (contact_id) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('description, total_amount')
        .eq('contact_id', contact_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

      if (jobs && jobs.length > 0) {
        const avgJobValue = jobs.reduce((sum, j) => sum + (j.total_amount || 0), 0) / jobs.length
        historyContext = `Customer history: Average past job value: $${avgJobValue.toFixed(2)}. Past jobs: ${jobs
          .map((j) => `${j.description} ($${j.total_amount})`)
          .join(', ')}`
      }
    }

    const prompt = `You are a pricing expert for a service business.

SERVICES TO PRICE:
${services.join(', ')}

${historyContext ? `CUSTOMER CONTEXT:\n${historyContext}\n` : ''}
${job_details ? `JOB DETAILS:\n${job_details}\n` : ''}

Generate pricing suggestions for each service with:
- Low price (competitive/entry level)
- Recommended price (optimal value)
- High price (premium/rush)
- Notes explaining the pricing strategy
- Profit margin estimate (0-1 decimal)

Consider:
- Market rates for these services
- Customer's past spending patterns
- Job complexity
- Competitive positioning

Respond ONLY with valid JSON in this format:
{
  "suggestions": [
    {
      "service": "Service Name",
      "low": 100,
      "recommended": 150,
      "high": 200,
      "notes": "Explanation",
      "profit_margin": 0.35
    }
  ]
}

No markdown formatting.`

    const llmResponse = await routerCall({
      useCase: 'general',
      prompt,
      maxTokens: 1000,
      temperature: 0.5,
    })

    if (!llmResponse.text) {
      throw new Error('LLM returned no response')
    }

    const cleanText = llmResponse.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const data = JSON.parse(cleanText)

    return NextResponse.json(data)
  } catch (error) {
    console.error('AI Pricing Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pricing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
