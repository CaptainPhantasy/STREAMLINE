import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SearchResults, SearchResponse } from '@/types/search'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // all, jobs, contacts, conversations

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
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

    const query = q.trim().toLowerCase()
    const results: SearchResults = {
      jobs: [],
      contacts: [],
      conversations: [],
    }

    // Search jobs
    if (type === 'all' || type === 'jobs') {
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id,
          status,
          description,
          created_at,
          contact:contacts(id, first_name, last_name, email)
        `)
        .eq('account_id', user.account_id)
        .or(`description.ilike.%${query}%,status.ilike.%${query}%`)
        .limit(10)

      if (jobs) {
        // Also search by contact name
        const { data: jobsByContact } = await supabase
          .from('jobs')
          .select(`
            id,
            status,
            description,
            created_at,
            contact:contacts!inner(id, first_name, last_name, email)
          `)
          .eq('account_id', user.account_id)
          .or(`contact.first_name.ilike.%${query}%,contact.last_name.ilike.%${query}%,contact.email.ilike.%${query}%`)
          .limit(10)

        const allJobs = [...(jobs || []), ...(jobsByContact || [])]
        const uniqueJobs = Array.from(
          new Map(allJobs.map(job => [job.id, job])).values()
        )
        results.jobs = uniqueJobs.slice(0, 10)
      }
    }

    // Search contacts
    if (type === 'all' || type === 'contacts') {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, address, created_at')
        .eq('account_id', user.account_id)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%`)
        .limit(10)

      results.contacts = contacts || []
    }

    // Search conversations
    if (type === 'all' || type === 'conversations') {
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          subject,
          status,
          last_message_at,
          contact:contacts(id, first_name, last_name, email)
        `)
        .eq('account_id', user.account_id)
        .or(`subject.ilike.%${query}%,status.ilike.%${query}%`)
        .limit(10)

      if (conversations) {
        // Also search by contact name
        const { data: conversationsByContact } = await supabase
          .from('conversations')
          .select(`
            id,
            subject,
            status,
            last_message_at,
            contact:contacts!inner(id, first_name, last_name, email)
          `)
          .eq('account_id', user.account_id)
          .or(`contact.first_name.ilike.%${query}%,contact.last_name.ilike.%${query}%,contact.email.ilike.%${query}%`)
          .limit(10)

        const allConversations = [...(conversations || []), ...(conversationsByContact || [])]
        const uniqueConversations = Array.from(
          new Map(allConversations.map(conv => [conv.id, conv])).values()
        )
        results.conversations = uniqueConversations.slice(0, 10)
      }
    }

    const response: SearchResponse = {
      query,
      results,
      counts: {
        jobs: results.jobs.length,
        contacts: results.contacts.length,
        conversations: results.conversations.length,
      },
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Error in GET /api/search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

