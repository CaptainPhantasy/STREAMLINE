import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { context } = body

    // Generate smart suggestions based on context
    const suggestions = []

    // Context-aware suggestions
    if (context?.entityType === 'contact') {
      suggestions.push({
        id: 'create-job-for-contact',
        text: `Create a job for this contact?`,
        action: () => {
          // This will be handled client-side
        },
        type: 'action' as const,
      })
    }

    if (context?.entityType === 'job' && context?.entityId) {
      suggestions.push({
        id: 'create-invoice-for-job',
        text: `Create an invoice for this job?`,
        action: () => {},
        type: 'action' as const,
      })
    }

    if (context?.currentPage === 'jobs') {
      suggestions.push({
        id: 'bulk-update-status',
        text: `You have multiple jobs selected. Update their status?`,
        action: () => {},
        type: 'hint' as const,
      })
    }

    // General suggestions based on time/patterns
    const hour = new Date().getHours()
    if (hour >= 8 && hour <= 10) {
      suggestions.push({
        id: 'morning-briefing',
        text: `View today's schedule and priorities?`,
        action: () => {},
        type: 'hint' as const,
      })
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

