import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/contacts/[id]/history
 * Get customer history (jobs, conversations, notes)
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

    const contactId = params.id

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify contact belongs to account
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.account_id !== userData.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, status, description, scheduled_start, total_amount, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, status, subject, last_message_at, created_at')
      .eq('contact_id', contactId)
      .order('last_message_at', { ascending: false })
      .limit(50)

    // Get notes (if notes table exists)
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(50)
      .catch(() => ({ data: null }))

    return NextResponse.json({
      contact_id: contactId,
      jobs: jobs || [],
      conversations: conversations || [],
      notes: notes || [],
      summary: {
        total_jobs: jobs?.length || 0,
        total_conversations: conversations?.length || 0,
        total_revenue: jobs?.reduce((sum, j) => sum + (j.total_amount || 0), 0) || 0,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching contact history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

