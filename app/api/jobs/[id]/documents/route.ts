import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/jobs/[id]/documents
 * Get all documents for a job (both photos and documents)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'photos' | 'documents' | 'all'

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

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    let photos = []
    let documents = []

    // Fetch photos if requested
    if (!type || type === 'all' || type === 'photos') {
      const { data: photosData, error: photosError } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (photosError) {
        console.error('Error fetching photos:', photosError)
      } else {
        photos = photosData || []
      }
    }

    // Fetch documents if requested
    if (!type || type === 'all' || type === 'documents') {
      const { data: documentsData, error: documentsError } = await supabase
        .from('job_documents')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
      } else {
        documents = documentsData || []
      }
    }

    return NextResponse.json({
      photos,
      documents,
      total: photos.length + documents.length,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/jobs/[id]/documents:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
