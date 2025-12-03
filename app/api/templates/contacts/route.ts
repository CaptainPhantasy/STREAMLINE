import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Default contact templates
    const defaultTemplates = [
      {
        id: 'residential-customer',
        name: 'Residential Customer',
        description: 'Standard residential customer template',
        category: 'contact' as const,
        data: {
          tags: ['residential'],
          status: 'active',
        },
        isDefault: true,
      },
      {
        id: 'commercial-customer',
        name: 'Commercial Customer',
        description: 'Commercial customer template',
        category: 'contact' as const,
        data: {
          tags: ['commercial'],
          status: 'active',
        },
      },
      {
        id: 'repeat-customer',
        name: 'Repeat Customer',
        description: 'Template for returning customers',
        category: 'contact' as const,
        data: {
          tags: ['repeat-customer', 'priority'],
          status: 'active',
        },
      },
    ]

    return NextResponse.json({
      success: true,
      templates: defaultTemplates,
    })
  } catch (error) {
    console.error('Error fetching contact templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

