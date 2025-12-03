import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audio = formData.get('audio') as File
    const jobId = formData.get('jobId') as string
    const duration = formData.get('duration') as string

    if (!audio || !jobId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fileName = `voice-notes/${jobId}/${Date.now()}-${audio.name}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-files')
      .upload(fileName, audio)

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('job-files')
      .getPublicUrl(fileName)

    const { data: voiceNote, error: dbError } = await supabase
      .from('voice_notes')
      .insert({
        job_id: jobId,
        audio_url: publicUrlData.publicUrl,
        duration: parseInt(duration),
        created_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ voiceNote })
  } catch (error) {
    console.error('Error uploading voice note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
