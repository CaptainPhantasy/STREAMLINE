import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = params.id

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Verify job belongs to this tech
    const { data: job } = await supabase
      .from('jobs')
      .select('id, tech_assigned_id')
      .eq('id', jobId)
      .eq('tech_assigned_id', session.user.id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found or not assigned to you' }, { status: 404 })
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
    // Note: You need to create a 'job-photos' bucket in Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('job-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload photo', 
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('job-photos')
      .getPublicUrl(filename)

    // Optionally: Store photo reference in database (you might want to add a job_photos table)
    // For now, we'll just return the URL

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: uploadData.path,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

