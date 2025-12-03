import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    const { data: photos, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching job photos:', error)
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
    }

    return NextResponse.json({ photos: photos || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/job-photos:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string
    const caption = formData.get('caption') as string | null

    if (!file || !jobId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, jobId' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Verify job exists and get account_id
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${jobId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Use service role client for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('job-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('job-photos')
      .getPublicUrl(filename)

    // Create thumbnail URL (same as main for now, can be enhanced later)
    const thumbnailUrl = urlData.publicUrl

    // Store photo reference in database
    const { data: photo, error: photoError } = await supabase
      .from('job_photos')
      .insert({
        account_id: job.account_id,
        job_id: jobId,
        photo_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption || null,
        taken_by: session.user.id,
      })
      .select()
      .single()

    if (photoError) {
      console.error('Error creating photo record:', photoError)
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from('job-photos').remove([filename])
      return NextResponse.json({ error: 'Failed to create photo record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/job-photos:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

