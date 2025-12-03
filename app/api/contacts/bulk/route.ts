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
    const { action, contactIds } = body

    if (!action || !contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action, contactIds (array)' },
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

    if (action === 'delete') {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds)

      if (deleteError) {
        console.error('Error deleting contacts:', deleteError)
        return NextResponse.json({ error: 'Failed to delete contacts' }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: contactIds.length })
    } else if (action === 'export') {
      // Get full contact data for export
      const { data: exportData, error: exportError } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds)

      if (exportError) {
        console.error('Error fetching contacts for export:', exportError)
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
      }

      // Convert to CSV format (simple implementation)
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Created At']
      const rows = exportData?.map((contact) => [
        contact.first_name || '',
        contact.last_name || '',
        contact.email || '',
        contact.phone || '',
        contact.address || '',
        contact.created_at || '',
      ]) || []

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      return NextResponse.json({
        success: true,
        csv,
        count: exportData?.length || 0,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "delete" or "export"' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error in POST /api/contacts/bulk:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

