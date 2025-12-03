import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Build query
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('account_id', user.account_id)

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: contacts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Contact ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Address',
        'Created At'
      ]

      const rows = (contacts || []).map(contact => [
        contact.id,
        contact.first_name || '',
        contact.last_name || '',
        contact.email || '',
        contact.phone || '',
        contact.address || '',
        contact.created_at || ''
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json({ contacts: contacts || [] })
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error in GET /api/export/contacts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

