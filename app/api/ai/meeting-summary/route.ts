/**
 * AI Meeting Summary API - POST /api/ai/meeting-summary
 *
 * Generates AI-powered meeting summaries with key points and action items.
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
    const { meeting_id, notes, force_regenerate = false } = body

    if (!meeting_id) {
      return NextResponse.json({ error: 'meeting_id is required' }, { status: 400 })
    }

    // Fetch meeting data
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, contacts(first_name, last_name)')
      .eq('id', meeting_id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Check if summary already exists and not forcing regeneration
    if (meeting.summary && !force_regenerate) {
      try {
        const existingSummary = typeof meeting.summary === 'string' ? JSON.parse(meeting.summary) : meeting.summary
        return NextResponse.json({ summary: existingSummary, cached: true })
      } catch (e) {
        // If parsing fails, regenerate
      }
    }

    // Fetch meeting notes
    const { data: meetingNotes } = await supabase
      .from('meeting_notes')
      .select('content')
      .eq('meeting_id', meeting_id)
      .order('created_at', { ascending: false })

    const allNotes = notes || (meetingNotes?.map((n) => n.content).join('\n\n') || meeting.notes || '')

    if (!allNotes) {
      return NextResponse.json({ error: 'No meeting notes available to summarize' }, { status: 400 })
    }

    const prompt = `You are a meeting summary assistant.

MEETING INFORMATION:
Contact: ${(meeting as any).contacts?.first_name} ${(meeting as any).contacts?.last_name}
Type: ${meeting.meeting_type}
Date: ${meeting.scheduled_at}

MEETING NOTES:
${allNotes}

Generate a comprehensive meeting summary with:
1. Key points discussed (3-5 bullet points)
2. Decisions made (if any)
3. Action items with descriptions
4. Next steps
5. Overall sentiment (positive, neutral, or negative)
6. Suggested follow-up date (if applicable)

Respond ONLY with valid JSON in this format:
{
  "key_points": ["point1", "point2", "point3"],
  "decisions_made": ["decision1", "decision2"],
  "action_items": [
    {
      "id": "action-1",
      "description": "Task description",
      "assigned_to": "Person name or null",
      "due_date": "ISO date or null",
      "completed": false
    }
  ],
  "next_steps": ["step1", "step2"],
  "sentiment": "positive|neutral|negative",
  "follow_up_date": "ISO date or null"
}

No markdown formatting.`

    const llmResponse = await routerCall({
      useCase: 'summary',
      prompt,
      maxTokens: 1500,
      temperature: 0.5,
    })

    if (!llmResponse.text) {
      throw new Error('LLM returned no response')
    }

    const cleanText = llmResponse.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const summaryData = JSON.parse(cleanText)

    // Save summary back to meeting
    await supabase
      .from('meetings')
      .update({
        summary: JSON.stringify(summaryData),
        sentiment: summaryData.sentiment,
      })
      .eq('id', meeting_id)

    return NextResponse.json({
      summary: {
        meeting_id,
        ...summaryData,
      },
      cached: false,
    })
  } catch (error) {
    console.error('AI Meeting Summary Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
