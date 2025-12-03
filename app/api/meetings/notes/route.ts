/**
 * Meeting Notes API - POST /api/meetings/notes
 *
 * Saves meeting notes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { meeting_id, content } = body

    if (!meeting_id || !content) {
      return NextResponse.json({ error: 'meeting_id and content are required' }, { status: 400 })
    }

    // Check if meeting_notes table exists, if not use meetings table
    const { data: note, error: noteError } = await supabase
      .from('meeting_notes')
      .insert({
        meeting_id,
        content,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    // If meeting_notes table doesn't exist, fall back to updating meetings table
    if (noteError && noteError.code === '42P01') {
      const { data: meeting, error: updateError } = await supabase
        .from('meetings')
        .update({ notes: content })
        .eq('id', meeting_id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({ note: { id: meeting_id, content, created_at: new Date().toISOString() } })
    }

    if (noteError) {
      throw noteError
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Meeting Notes Error:', error)
    return NextResponse.json(
      { error: 'Failed to save note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
