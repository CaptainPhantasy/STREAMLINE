import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get photo record to get file path
    const { data: photo, error: photoError } = await supabase
      .from('job_photos')
      .select('photo_url, thumbnail_url')
      .eq('id', params.id)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('job_photos')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting photo record:', deleteError)
      return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 })
    }

    // Extract filename from URL and delete from storage
    try {
      const photoUrl = photo.photo_url
      if (photoUrl) {
        // Extract path from URL (format: https://...supabase.co/storage/v1/object/public/job-photos/path)
        const urlParts = photoUrl.split('/job-photos/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          await supabaseAdmin.storage.from('job-photos').remove([filePath])
        }
      }
    } catch (storageError) {
      console.error('Error deleting from storage (non-critical):', storageError)
      // Continue even if storage deletion fails
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in DELETE /api/job-photos/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

