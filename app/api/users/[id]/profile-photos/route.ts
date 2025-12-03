import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/[id]/profile-photos
 * Get all profile photos for a user
 */
export async function GET(
  request: NextRequest,
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

    const userId = params.id

    // Verify account access
    const { data: targetUser } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.account_id !== targetUser.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get profile photos
    const { data: photos, error: photosError } = await supabase
      .from('user_profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ photos: photos || [] })
  } catch (error: unknown) {
    console.error('Error fetching profile photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[id]/profile-photos
 * Upload a new profile photo
 */
export async function POST(
  request: NextRequest,
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

    const userId = params.id

    // Only allow users to upload their own photos
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const displayOrder = formData.get('display_order')
      ? parseInt(formData.get('display_order') as string)
      : undefined
    const isPrimary = formData.get('is_primary') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Check current photo count
    const { count: photoCount } = await supabase
      .from('user_profile_photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if ((photoCount || 0) >= 6) {
      return NextResponse.json(
        { error: 'Maximum 6 profile photos allowed' },
        { status: 400 }
      )
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json(
        { error: 'Storage configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Use service role client for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/${timestamp}.${fileExt}`
    const storagePath = `profile-photos/${filename}`

    // Try to upload to Supabase Storage
    // First try 'user-files' bucket, fallback to 'public' if it doesn't exist
    let bucketName = 'user-files'
    let uploadData, uploadError

    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucketName)

    if (!bucketExists) {
      // Fallback to 'public' bucket if 'user-files' doesn't exist
      bucketName = 'public'
      console.warn(`Bucket 'user-files' not found, using 'public' bucket instead`)
    }

    // Upload to Supabase Storage (using File directly, same as avatar upload)
    const uploadResult = await supabaseAdmin.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      })

    uploadData = uploadResult.data
    uploadError = uploadResult.error

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      console.error('Error details:', JSON.stringify(uploadError, null, 2))
      
      // Provide more helpful error message
      let errorMessage = 'Failed to upload photo'
      if (uploadError.message?.includes('Bucket not found')) {
        errorMessage = `Storage bucket '${bucketName}' not found. Please create it in Supabase Storage settings.`
      } else if (uploadError.message?.includes('new row violates row-level security') || uploadError.message?.includes('RLS')) {
        errorMessage = 'Storage permissions error. The bucket may need RLS policies configured for uploads.'
      } else if (uploadError.message?.includes('duplicate') || uploadError.message?.includes('already exists')) {
        errorMessage = 'A file with this name already exists. Please try again.'
      } else {
        errorMessage = uploadError.message || errorMessage
      }
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: uploadError.message,
          bucket: bucketName,
          path: storagePath
        },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(storagePath)

    // Determine display order (use provided or next available)
    let finalDisplayOrder = displayOrder
    if (finalDisplayOrder === undefined) {
      const { data: existingPhotos } = await supabase
        .from('user_profile_photos')
        .select('display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .limit(1)

      finalDisplayOrder =
        existingPhotos && existingPhotos.length > 0
          ? existingPhotos[0].display_order + 1
          : 0
    }

    // Create photo record
    const { data: photo, error: photoError } = await supabase
      .from('user_profile_photos')
      .insert({
        user_id: userId,
        account_id: userData.account_id,
        photo_url: urlData.publicUrl,
        storage_path: storagePath,
        display_order: finalDisplayOrder,
        is_primary: isPrimary,
      })
      .select()
      .single()

    if (photoError) {
      console.error('Error creating photo record:', photoError)
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from(bucketName).remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to create photo record', details: photoError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, photo }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error uploading profile photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

