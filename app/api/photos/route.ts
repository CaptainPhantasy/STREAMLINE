import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const jobId = formData.get('jobId') as string
    const type = formData.get('type') as string // 'before' or 'after'
    const gateId = formData.get('gateId') as string | null

    if (!photo || !jobId) {
      return NextResponse.json({ error: 'Photo and jobId required' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = photo.name.split('.').pop() || 'jpg'
    const filename = `${jobId}/${type || 'general'}/${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filename, photo, {
        contentType: photo.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('job-photos')
      .getPublicUrl(filename)

    // Create photo record
    // Note: 'taken_by' now references auth.users(id) directly
    const { data: photoRecord, error: recordError } = await supabase
      .from('job_photos')
      .insert({
        job_id: jobId,
        gate_id: gateId || null,
        taken_by: user.id, // Use auth user ID directly
        storage_path: uploadData.path,
        metadata: {
          type,
          originalName: photo.name,
          size: photo.size,
          mimeType: photo.type,
        },
      })
      .select()
      .single()

    if (recordError) {
      console.error('Record error:', recordError)
      return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      photo: photoRecord,
    })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  const { data: photos, error } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add public URLs
  const photosWithUrls = photos?.map(photo => {
    const { data } = supabase.storage
      .from('job-photos')
      .getPublicUrl(photo.storage_path)
    return {
      ...photo,
      url: data.publicUrl,
    }
  })

  return NextResponse.json({ photos: photosWithUrls })
}
