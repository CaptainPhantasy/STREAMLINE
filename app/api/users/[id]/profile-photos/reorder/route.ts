import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/users/[id]/profile-photos/reorder
 * Reorder profile photos by providing ordered list of photo IDs
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

    // Only allow users to reorder their own photos
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { photo_ids } = body

    if (!Array.isArray(photo_ids)) {
      return NextResponse.json(
        { error: 'photo_ids must be an array' },
        { status: 400 }
      )
    }

    // Verify all photos belong to user
    const { data: userPhotos, error: photosError } = await supabase
      .from('user_profile_photos')
      .select('id')
      .eq('user_id', userId)

    if (photosError) {
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    const userPhotoIds = new Set(userPhotos?.map(p => p.id) || [])
    const invalidIds = photo_ids.filter(id => !userPhotoIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Some photo IDs do not belong to user' },
        { status: 400 }
      )
    }

    // Update display_order for each photo
    const updates = photo_ids.map((photoId, index) => ({
      id: photoId,
      display_order: index,
    }))

    // Update all photos in a transaction-like manner
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('user_profile_photos')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating photo order:', updateError)
        return NextResponse.json(
          { error: 'Failed to reorder photos' },
          { status: 500 }
        )
      }
    }

    // Fetch updated photos
    const { data: updatedPhotos, error: fetchError } = await supabase
      .from('user_profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch updated photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ photos: updatedPhotos || [] })
  } catch (error: unknown) {
    console.error('Error reordering profile photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

