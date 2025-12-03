import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, contactId, signatureData, signedByName } = body

    if (!jobId || !contactId || !signatureData) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, contactId, signatureData' },
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

    // Get account_id from job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Create signature record
    const { data: signature, error } = await supabase
      .from('signatures')
      .insert({
        account_id: job.account_id,
        job_id: jobId,
        contact_id: contactId,
        signature_data: signatureData,
        signature_url: signatureData, // Store base64 data as URL for now
        signed_by_name: signedByName || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating signature:', error)
      return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
    }

    return NextResponse.json({ signature })
  } catch (error: unknown) {
    console.error('Error in POST /api/signatures:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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

    const { data: signatures, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('job_id', jobId)
      .order('signed_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching signature:', error)
      return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 })
    }

    return NextResponse.json({ signature: signatures?.[0] || null })
  } catch (error: unknown) {
    console.error('Error in GET /api/signatures:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

