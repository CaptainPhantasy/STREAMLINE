import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/users/[id]/profile-photos/[photoId]
 * Update a profile photo (display order, primary status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
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
    const photoId = params.photoId

    // Only allow users to update their own photos
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify photo belongs to user
    const { data: photo, error: photoError } = await supabase
      .from('user_profile_photos')
      .select('*')
      .eq('id', photoId)
      .eq('user_id', userId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const body = await request.json()
    const { display_order, is_primary } = body

    const updateData: Record<string, unknown> = {}
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_primary !== undefined) updateData.is_primary = is_primary

    const { data: updatedPhoto, error: updateError } = await supabase
      .from('user_profile_photos')
      .update(updateData)
      .eq('id', photoId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating photo:', updateError)
      return NextResponse.json(
        { error: 'Failed to update photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ photo: updatedPhoto })
  } catch (error: unknown) {
    console.error('Error updating profile photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]/profile-photos/[photoId]
 * Delete a profile photo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
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
    const photoId = params.photoId

    // Only allow users to delete their own photos
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get photo to delete (for storage cleanup)
    const { data: photo, error: photoError } = await supabase
      .from('user_profile_photos')
      .select('storage_path')
      .eq('id', photoId)
      .eq('user_id', userId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('user_profile_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting photo:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      )
    }

    // Delete from storage (using service role)
    if (photo.storage_path) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabaseAdmin.storage
        .from('user-files')
        .remove([photo.storage_path])
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting profile photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

