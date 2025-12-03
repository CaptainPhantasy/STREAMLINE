import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * AI-powered meeting transcript analysis endpoint
 * Uses LLM router to extract summary, action items, sentiment, and key points
 */
export async function POST(request: Request) {
  try {
    const { transcript } = await request.json()

    // Validate transcript
    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcript too short for analysis (minimum 50 characters)' },
        { status: 400 }
      )
    }

    // Use LLM router for analysis (supports multi-provider routing)
    const analysisRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/llm-router`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useCase: 'summary',
          prompt: `Analyze this sales meeting transcript and extract key information.

Transcript:
"""
${transcript}
"""

Extract the following in JSON format:
{
  "summary": "2-3 sentence summary of the meeting",
  "actionItems": ["specific task 1", "specific task 2", ...],
  "sentiment": "positive|neutral|negative|mixed",
  "keyPoints": ["important point 1", "important point 2", ...],
  "nextSteps": "what needs to happen next",
  "personalDetails": {"key": "value for any personal info mentioned about the customer"},
  "followUpDate": "YYYY-MM-DD or null",
  "followUpNotes": "any commitments or deadlines mentioned"
}

Be concise and specific. Extract only factual information from the transcript.`,
          maxTokens: 800,
          temperature: 0.3,
        }),
      }
    )

    if (!analysisRes.ok) {
      const error = await analysisRes.text()
      console.error('LLM Router error:', error)
      return NextResponse.json(
        { error: 'AI analysis service unavailable', details: error },
        { status: 503 }
      )
    }

    const llmResponse = await analysisRes.json()

    // Parse JSON from LLM response
    let analysis
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = llmResponse.text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(llmResponse.text)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', llmResponse.text)
      return NextResponse.json(
        {
          error: 'Failed to parse AI analysis',
          rawResponse: llmResponse.text.substring(0, 500)
        },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!analysis.summary || !Array.isArray(analysis.actionItems)) {
      return NextResponse.json(
        { error: 'Invalid analysis format', analysis },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        actionItems: analysis.actionItems,
        sentiment: analysis.sentiment || 'neutral',
        keyPoints: analysis.keyPoints || [],
        nextSteps: analysis.nextSteps || '',
        personalDetails: analysis.personalDetails || {},
        followUpDate: analysis.followUpDate || null,
        followUpNotes: analysis.followUpNotes || '',
      },
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        tokensUsed: llmResponse.usage?.total_tokens || 0,
      },
    })
  } catch (error) {
    console.error('Meeting analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
