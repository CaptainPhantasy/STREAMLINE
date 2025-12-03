import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: voiceNotes, error } = await supabase
      .from('voice_notes')
      .select('*')
      .eq('job_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ voiceNotes })
  } catch (error) {
    console.error('Error fetching voice notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
