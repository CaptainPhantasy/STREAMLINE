import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage') // new, contacted, qualified, proposal
  const assignedToMe = searchParams.get('assignedToMe') === 'true'

  // Build query
  let query = supabase
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
      created_at
    `)
    .eq('account_id', userData.account_id)
    .eq('type', 'lead')
    .order('lead_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (stage) {
    query = query.eq('lead_stage', stage)
  }

  if (assignedToMe) {
    query = query.eq('assigned_to', user.id)
  }

  const { data: leads, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to camelCase
  const transformedLeads = leads?.map(lead => ({
    id: lead.id,
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    leadStatus: lead.lead_status,
    leadStage: lead.lead_stage,
    leadScore: lead.lead_score,
    assignedTo: lead.assigned_to,
    lastContactDate: lead.last_contact_date,
    notes: lead.notes,
    createdAt: lead.created_at,
  })) || []

  return NextResponse.json({ leads: transformedLeads })
}
