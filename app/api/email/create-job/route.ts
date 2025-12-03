import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, contactId, contactName, emailBody } = body

    // Use LLM to extract job details from email
    let jobData: any = {
      description: emailBody?.substring(0, 200) || 'Job from email',
    }

    try {
      const llmResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          useCase: 'complex',
          prompt: `Extract job details from this email conversation:\n\n${emailBody}\n\nReturn JSON with: description, scheduledStart (ISO 8601), scheduledEnd (ISO 8601), urgency (high/medium/low).`,
          systemPrompt: 'You are an AI assistant that extracts job information from emails. Return only valid JSON.',
          maxTokens: 500,
          temperature: 0.3,
        }),
      })

      if (llmResponse.ok) {
        const llmData = await llmResponse.json()
        try {
          jobData = JSON.parse(llmData.text || '{}')
        } catch (parseError) {
          console.error('Failed to parse LLM response:', parseError)
          // Keep fallback job data
        }
      } else {
        console.error('LLM Router request failed, using fallback data')
      }
    } catch (llmError) {
      console.error('LLM Router unavailable, using fallback data:', llmError)
      // Continue with fallback job data
    }

    // Create job via API
    const jobResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        contactId: contactId || null,
        contactName: contactName || null,
        ...jobData,
      }),
    })

    if (!jobResponse.ok) {
      const errorData = await jobResponse.json()
      throw new Error(errorData.error || 'Failed to create job')
    }

    const jobResult = await jobResponse.json()

    return NextResponse.json({
      success: true,
      job: jobResult.job,
    })
  } catch (error) {
    console.error('Error creating job from email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create job' },
      { status: 500 }
    )
  }
}

