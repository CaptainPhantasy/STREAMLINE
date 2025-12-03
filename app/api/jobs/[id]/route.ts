import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's account_id to verify job belongs to their account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify job exists and belongs to user's account
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id, account_id, tech_assigned_id')
      .eq('id', params.id)
      .single()

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (existingJob.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden: Job does not belong to your account' }, { status: 403 })
    }

    // SECURITY: If user is a tech, only allow updating jobs assigned to them
    if (userData.role === 'tech' && existingJob.tech_assigned_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update jobs assigned to you' }, { status: 403 })
    }

    const body = await request.json()

    const { data: job, error } = await supabase
      .from('jobs')
      .update(body)
      .eq('id', params.id)
      .eq('account_id', userData.account_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
