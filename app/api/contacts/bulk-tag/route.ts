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
    const { contactIds, tagId } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid contactIds array' },
        { status: 400 }
      )
    }

    if (!tagId) {
      return NextResponse.json({ error: 'Missing required field: tagId' }, { status: 400 })
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

    // Verify tag exists and belongs to account
    const { data: tag } = await supabase
      .from('contact_tags')
      .select('account_id')
      .eq('id', tagId)
      .single()

    if (!tag || tag.account_id !== user.account_id) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Verify all contacts belong to account
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('account_id', user.account_id)
      .in('id', contactIds)

    if (!contacts || contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts not found or belong to different account' },
        { status: 404 }
      )
    }

    // Create assignments (ignore duplicates)
    const assignments = contactIds.map((contactId: string) => ({
      contact_id: contactId,
      tag_id: tagId,
    }))

    const { data: created, error: createError } = await supabase
      .from('contact_tag_assignments')
      .upsert(assignments, { onConflict: 'contact_id,tag_id', ignoreDuplicates: true })
      .select()

    if (createError) {
      console.error('Error bulk assigning tags:', createError)
      return NextResponse.json({ error: 'Failed to assign tags' }, { status: 500 })
    }

    return NextResponse.json({ success: true, assigned: created?.length || 0 }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/contacts/bulk-tag:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

