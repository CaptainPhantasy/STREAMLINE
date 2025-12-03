import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params
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

  // Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  // Fetch recent jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, description, status, total_amount, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate total spent
  const totalSpent = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0

  // Fetch recent meetings
  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, scheduled_at, summary, sentiment')
    .eq('contact_id', contactId)
    .order('scheduled_at', { ascending: false })
    .limit(3)

  // Fetch open conversations (potential issues)
  const { data: openConversations } = await supabase
    .from('conversations')
    .select('subject')
    .eq('contact_id', contactId)
    .eq('status', 'open')

  const openIssues = openConversations?.map(c => c.subject).filter(Boolean) || []

  // Generate suggested topics based on data
  const suggestedTopics: string[] = []
  
  if (jobs && jobs.length > 0) {
    const lastJob = jobs[0]
    if (lastJob.status === 'completed') {
      suggestedTopics.push(`Follow up on recent ${lastJob.description}`)
    }
  }
  
  if (openIssues.length > 0) {
    suggestedTopics.push(`Address open issue: ${openIssues[0]}`)
  }

  const profile = (contact.profile as Record<string, unknown>) || {}
  if (profile.preferences) {
    suggestedTopics.push(`Remember their preference: ${profile.preferences}`)
  }

  // Build briefing response
  const briefing = {
    contact: {
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
    },
    profile: {
      familyNotes: profile.family as string | undefined,
      preferences: profile.preferences as string | undefined,
      interests: profile.interests as string[] | undefined,
    },
    recentJobs: jobs?.map(j => ({
      id: j.id,
      description: j.description,
      status: j.status,
      totalAmount: j.total_amount,
      completedAt: j.created_at,
    })) || [],
    totalSpent,
    meetingHistory: meetings?.map(m => ({
      id: m.id,
      date: new Date(m.scheduled_at).toLocaleDateString(),
      summary: m.summary || 'No summary available',
      sentiment: m.sentiment || 'neutral',
    })) || [],
    openIssues,
    suggestedTopics,
  }

  return NextResponse.json({ briefing })
}

