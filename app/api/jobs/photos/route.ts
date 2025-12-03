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
    const photos = formData.getAll('photos') as File[]
    const jobId = formData.get('jobId') as string

    if (!photos || photos.length === 0 || !jobId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const uploadedPhotos = []

    for (const photo of photos) {
      const fileName = `job-photos/${jobId}/${Date.now()}-${photo.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(fileName, photo)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: publicUrlData } = supabase.storage
        .from('job-files')
        .getPublicUrl(fileName)

      const { data: photoRecord, error: dbError } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          url: publicUrlData.publicUrl,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (!dbError && photoRecord) {
        uploadedPhotos.push(photoRecord)
      }
    }

    return NextResponse.json({ photos: uploadedPhotos, path: uploadedPhotos[0]?.url })
  } catch (error) {
    console.error('Error uploading photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
