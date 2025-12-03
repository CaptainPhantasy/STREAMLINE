import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/[id]/profile
 * Get user profile with bio and profile photos
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

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, account_id, full_name, role, avatar_url, bio, timezone, language, notification_preferences')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify account access
    const { data: currentUser } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.account_id !== userProfile.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get profile photos
    const { data: photos, error: photosError } = await supabase
      .from('user_profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    const primaryPhoto = photos?.find(p => p.is_primary) || null

    return NextResponse.json({
      profile: {
        ...userProfile,
        profile_photos: photos || [],
        primary_photo: primaryPhoto,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]/profile
 * Update user profile (bio, name, etc.)
 */
export async function PUT(
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

    // Only allow users to update their own profile
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, bio, phone, timezone, language, notification_preferences } = body

    const updateData: Record<string, unknown> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (bio !== undefined) updateData.bio = bio
    if (phone !== undefined) updateData.phone = phone
    if (timezone !== undefined) updateData.timezone = timezone
    if (language !== undefined) updateData.language = language
    if (notification_preferences !== undefined) {
      updateData.notification_preferences = notification_preferences
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error: unknown) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

