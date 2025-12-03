import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { withSecurity } from '@/lib/security/api-middleware'
import { fileSchemas } from '@/lib/security/validation-schemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Validate uploaded file
 */
function validateUploadedFile(file: File): { valid: boolean; error?: string } {
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is 50MB, got ${Math.round(file.size / 1024 / 1024)}MB`
    }
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  // Check filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (sanitizedName !== file.name) {
    return {
      valid: false,
      error: 'Filename contains invalid characters'
    }
  }

  if (sanitizedName.length > 255) {
    return {
      valid: false,
      error: 'Filename too long (max 255 characters)'
    }
  }

  return { valid: true }
}

/**
 * Sanitize filename for storage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

/**
 * POST /api/documents/upload
 * Upload a document to a job
 */
async function handleDocumentUpload(request: NextRequest, context: any) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string
    const type = formData.get('type') as string
    const caption = formData.get('caption') as string | null

    // Validate required fields
    if (!file || !jobId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: file, jobId, type' },
        { status: 400 }
      )
    }

    // Validate file
    const fileValidation = validateUploadedFile(file)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }

    // Validate form data with schema
    const validation = fileSchemas.upload.safeParse({
      jobId,
      type,
      caption: caption || undefined
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }

    const validated = validation.data

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
            Authorization: `Bearer ${context.session.access_token}`,
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

    // Generate unique filename with sanitized name
    const timestamp = Date.now()
    const sanitizedName = sanitizeFilename(file.name)
    const filename = `${jobId}/${type}/${timestamp}-${sanitizedName}`

    // Use service role client for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('job-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload document', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('job-documents')
      .getPublicUrl(filename)

    // Create thumbnail URL for images
    let thumbnailUrl = null
    if (file.type.startsWith('image/')) {
      thumbnailUrl = urlData.publicUrl // Can be enhanced with actual thumbnail generation
    }

    // Store document reference in database
    const { data: document, error: documentError } = await supabase
      .from('job_documents')
      .insert({
        account_id: job.account_id,
        job_id: jobId,
        type,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filename,
        public_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        caption: validated.caption || null,
        uploaded_by: context.user.id,
      })
      .select()
      .single()

    if (documentError) {
      console.error('Error creating document record:', documentError)
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from('job-documents').remove([filename])
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    // Log successful upload for audit
    console.log(`Document Uploaded - User: ${context.user.id}, Account: ${job.account_id}, Job: ${jobId}, Type: ${type}, Size: ${file.size} bytes`)

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/documents/upload:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    handleDocumentUpload,
    {
      requireAuth: true,
      rateLimit: 'upload',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMethods: ['POST'],
      enableCORS: true
    }
  )
}
