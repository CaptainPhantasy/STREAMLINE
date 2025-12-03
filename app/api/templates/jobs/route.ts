import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get account ID from session
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get templates from database (if templates table exists)
    // For now, return default templates
    const defaultTemplates = [
      {
        id: 'plumbing-repair',
        name: 'Plumbing Repair',
        description: 'Standard plumbing repair job',
        category: 'job' as const,
        data: {
          description: 'Plumbing repair',
          status: 'scheduled',
        },
        isDefault: true,
      },
      {
        id: 'hvac-service',
        name: 'HVAC Service',
        description: 'Standard HVAC service call',
        category: 'job' as const,
        data: {
          description: 'HVAC service call',
          status: 'scheduled',
        },
      },
      {
        id: 'electrical-installation',
        name: 'Electrical Installation',
        description: 'Electrical installation job',
        category: 'job' as const,
        data: {
          description: 'Electrical installation',
          status: 'scheduled',
        },
      },
    ]

    return NextResponse.json({
      success: true,
      templates: defaultTemplates,
    })
  } catch (error) {
    console.error('Error fetching job templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, data, isDefault } = body

    // TODO: Save template to database
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Template saved (not yet persisted to database)',
    })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

