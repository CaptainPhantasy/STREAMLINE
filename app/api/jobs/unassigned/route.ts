import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Get user's account_id and role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only dispatchers, owners, and admins can view unassigned jobs
    const { hasPermission } = await import('@/lib/auth/permissions')
    if (!hasPermission(user.role, 'manage_dispatch')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Get unassigned job requests (pending approval)
    const { data: unassignedJobs, error } = await supabase
      .from('jobs')
      .select('*, contact:contacts(*), tech_assigned:users!tech_assigned_id(*)')
      .eq('account_id', user.account_id)
      .eq('request_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unassigned jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch unassigned jobs' }, { status: 500 })
    }

    return NextResponse.json({ jobs: unassignedJobs || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Get user's account_id and role
    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only dispatchers, owners, and admins can approve/reject requests
    const { hasPermission } = await import('@/lib/auth/permissions')
    if (!hasPermission(user.role, 'manage_dispatch')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { jobId, action, techId } = body // action: 'approve' | 'reject', techId: optional for assignment

    if (!jobId || !action) {
      return NextResponse.json({ error: 'Job ID and action are required' }, { status: 400 })
    }

    if (action === 'approve') {
      // Approve the request and optionally assign to a tech
      const updateData: any = {
        request_status: 'approved',
        status: 'scheduled',
      }

      if (techId) {
        updateData.tech_assigned_id = techId
      }

      const { data: job, error: updateError } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('account_id', user.account_id)
        .select()
        .single()

      if (updateError) {
        console.error('Error approving job request:', updateError)
        return NextResponse.json({ error: 'Failed to approve job request' }, { status: 500 })
      }

      return NextResponse.json({ success: true, job })
    } else if (action === 'reject') {
      // Reject the request
      const { data: job, error: updateError } = await supabase
        .from('jobs')
        .update({
          request_status: 'rejected',
          status: 'lead',
        })
        .eq('id', jobId)
        .eq('account_id', user.account_id)
        .select()
        .single()

      if (updateError) {
        console.error('Error rejecting job request:', updateError)
        return NextResponse.json({ error: 'Failed to reject job request' }, { status: 500 })
      }

      return NextResponse.json({ success: true, job })
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

