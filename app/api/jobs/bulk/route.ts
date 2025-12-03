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
    const { action, jobIds, ...actionData } = body

    if (!action || !jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action, jobIds (array)' },
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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify all jobs belong to account
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('account_id', user.account_id)
      .in('id', jobIds)

    if (!jobs || jobs.length !== jobIds.length) {
      return NextResponse.json(
        { error: 'Some jobs not found or belong to different account' },
        { status: 404 }
      )
    }

    let results: Array<{ jobId: string; success: boolean; error?: string }> = []

    if (action === 'assign') {
      const { techId } = actionData
      if (!techId) {
        return NextResponse.json({ error: 'Missing techId for assign action' }, { status: 400 })
      }

      // Verify tech belongs to account
      const { data: tech } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', techId)
        .eq('account_id', user.account_id)
        .single()

      if (!tech || tech.role !== 'tech') {
        return NextResponse.json({ error: 'Tech not found or invalid role' }, { status: 404 })
      }

      // Bulk assign
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ tech_assigned_id: techId })
        .in('id', jobIds)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to assign jobs' }, { status: 500 })
      }

      results = jobIds.map((jobId: string) => ({ jobId, success: true }))
    } else if (action === 'status') {
      const { status } = actionData
      if (!status) {
        return NextResponse.json({ error: 'Missing status for status action' }, { status: 400 })
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status })
        .in('id', jobIds)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 })
      }

      results = jobIds.map((jobId: string) => ({ jobId, success: true }))
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "assign" or "status"' }, { status: 400 })
    }

    return NextResponse.json({ success: true, results, count: results.length })
  } catch (error: unknown) {
    console.error('Error in POST /api/jobs/bulk:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

