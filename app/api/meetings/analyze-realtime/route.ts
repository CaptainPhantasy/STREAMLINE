import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSession()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript, analysisType } = await request.json()

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Transcript too short for analysis',
        insights: null 
      }, { status: 400 })
    }

    let systemPrompt = ''
    let userPrompt = ''

    switch (analysisType) {
      case 'sentiment':
        systemPrompt = 'You are a sales meeting analyst. Analyze the sentiment and emotional tone of the conversation.'
        userPrompt = `Analyze the sentiment of this meeting transcript. Provide a brief 1-2 sentence assessment of the overall tone and customer engagement level:\n\n${transcript}`
        break
      
      case 'action_items':
        systemPrompt = 'You are a sales meeting analyst. Extract actionable next steps from conversations.'
        userPrompt = `Extract action items from this meeting transcript. List only clear, actionable tasks. Format as a JSON array of strings:\n\n${transcript}`
        break
      
      case 'key_points':
        systemPrompt = 'You are a sales meeting analyst. Identify key discussion points and important topics.'
        userPrompt = `Identify the 3-5 most important points discussed in this meeting. Be concise and specific:\n\n${transcript}`
        break
      
      case 'objections':
        systemPrompt = 'You are a sales meeting analyst. Identify customer concerns, objections, or hesitations.'
        userPrompt = `Identify any customer objections, concerns, or hesitations in this transcript. If none are present, say "No objections detected":\n\n${transcript}`
        break
      
      case 'opportunities':
        systemPrompt = 'You are a sales meeting analyst. Identify sales opportunities and potential upsells.'
        userPrompt = `Identify potential sales opportunities, upsell possibilities, or areas of strong customer interest in this transcript:\n\n${transcript}`
        break
      
      default:
        systemPrompt = 'You are a sales meeting analyst providing real-time insights.'
        userPrompt = `Provide a brief insight about this meeting transcript:\n\n${transcript}`
    }

    const llmResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.session.access_token}`
      },
      body: JSON.stringify({
        accountId: auth.user.user_metadata?.account_id,
        useCase: 'general',
        prompt: userPrompt,
        systemPrompt,
        maxTokens: 300,
        temperature: 0.3,
        stream: false
      })
    })

    if (!llmResponse.ok) {
      throw new Error('LLM Router request failed')
    }

    const result = await llmResponse.json()

    return NextResponse.json({
      insights: result.text || 'No insights available',
      type: analysisType,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Real-time analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze transcript',
      insights: null 
    }, { status: 500 })
  }
}
