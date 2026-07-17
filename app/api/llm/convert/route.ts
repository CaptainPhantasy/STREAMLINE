import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { z } from 'zod'

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(10_000),
  context: z.string().trim().max(20_000).optional(),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/llm/convert
 * Convert natural language to JSON using LLM router
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = requestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Invalid conversion request' }, { status: 400 })
    const { prompt, context } = parsed.data

    // Use LLM router to convert natural language to JSON
    const llmResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({
        useCase: 'general',
        prompt: `${context ? `${context}\n\n` : ''}Convert this natural language description to valid JSON. Return only the JSON object, no explanation or markdown formatting: ${prompt}`,
        maxTokens: 500,
        temperature: 0.3,
      }),
    })

    if (!llmResponse.ok) {
      console.error('LLM Router failed with status:', llmResponse.status)
      return NextResponse.json({ error: 'Conversion failed' }, { status: 503 })
    }

    const data = await llmResponse.json() as { text?: unknown }
    const responseText = typeof data.text === 'string' ? data.text : ''
    
    // Try to parse JSON from response
    let jsonResult
    try {
      jsonResult = JSON.parse(responseText)
    } catch {
      // If parsing fails, try to extract JSON from text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[0])
      } else {
        jsonResult = { raw: responseText }
      }
    }

    return NextResponse.json({
      success: true,
      text: JSON.stringify(jsonResult, null, 2),
      json: jsonResult
    })
  } catch (error: unknown) {
    console.error('Convert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
