/**
 * Move Lead Stage API - PUT /api/leads/[id]/move
 *
 * Moves a lead to a different pipeline stage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { new_stage } = body

    if (!new_stage) {
      return NextResponse.json({ error: 'new_stage is required' }, { status: 400 })
    }

    // Update lead stage
    const { data: lead, error: updateError } = await supabase
      .from('leads')
      .update({ stage: new_stage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Move Lead Error:', error)
    return NextResponse.json(
      { error: 'Failed to move lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
