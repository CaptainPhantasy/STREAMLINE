import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { data: tags, error } = await supabase
      .from('contact_tag_assignments')
      .select('tag:contact_tags(*)')
      .eq('contact_id', params.id)

    if (error) {
      console.error('Error fetching contact tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags: tags?.map((t) => t.tag) || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/contacts/[id]/tags:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tagId } = body

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

    // Verify contact exists and belongs to account
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', params.id)
      .single()

    if (!contact || contact.account_id !== user.account_id) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
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

    const { data: assignment, error: createError } = await supabase
      .from('contact_tag_assignments')
      .insert({
        contact_id: params.id,
        tag_id: tagId,
      })
      .select('tag:contact_tags(*)')
      .single()

    if (createError) {
      // Check if it's a duplicate key error (tag already assigned)
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Tag already assigned to contact' }, { status: 409 })
      }
      console.error('Error assigning tag:', createError)
      return NextResponse.json({ error: 'Failed to assign tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tag: assignment.tag }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/contacts/[id]/tags:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


