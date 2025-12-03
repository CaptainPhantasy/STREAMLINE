import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's account
  const { data: userData } = await supabase
    .from('users')
    .select('account_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { id } = params

  // Get lead details with related data
  const { data: lead, error } = await supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      address,
      lead_status,
      lead_stage,
      lead_score,
      assigned_to,
      last_contact_date,
      notes,
      created_at,
      jobs:jobs(
        id,
        description,
        total_amount,
        status,
        created_at
      )
    `)
    .eq('account_id', userData.account_id)
    .eq('id', id)
    .eq('type', 'lead')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Get contact history (meetings, calls, etc.)
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      id,
      meeting_type,
      scheduled_at,
      summary,
      sentiment,
      created_at
    `)
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Transform data
  const transformedLead = {
    id: lead.id,
    contactName: `${lead.first_name} ${lead.last_name}`,
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    status: lead.lead_status || 'new',
    stage: lead.lead_stage || 'new',
    value: lead.jobs?.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0) || 0,
    score: lead.lead_score || 0,
    assignedTo: lead.assigned_to,
    lastContact: lead.last_contact_date,
    notes: lead.notes,
    createdAt: lead.created_at,
    opportunities: lead.jobs?.map((job: any) => ({
      id: job.id,
      title: job.description,
      value: job.total_amount || 0,
      status: job.status,
      createdAt: job.created_at
    })) || [],
    contactHistory: meetings?.map((meeting: any) => ({
      type: meeting.meeting_type === 'in_person' ? 'meeting' : meeting.meeting_type,
      date: meeting.created_at,
      summary: meeting.summary || `${meeting.meeting_type} scheduled`,
      sentiment: meeting.sentiment
    })) || []
  }

  return NextResponse.json({ lead: transformedLead })
}