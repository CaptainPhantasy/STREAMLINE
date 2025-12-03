import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Bearer token if available, otherwise use cookies
    const authHeader = request.headers.get('authorization')
    let supabase: any

    if (authHeader?.startsWith('Bearer ')) {
      // Use token-based client for Bearer auth
      const { createClient } = await import('@supabase/supabase-js')
      const token = authHeader.substring(7)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
    } else {
      // Use cookie-based client
      const cookieStore = await cookies()
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
              } catch { }
            },
          },
        }
      )
    }

    const body = await request.json()
    const { email, phone, firstName, lastName, address } = body

    if (!email || !firstName) {
      return NextResponse.json({
        error: 'Missing required fields: email, firstName'
      }, { status: 400 })
    }

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .eq('account_id', user.account_id)
      .single()

    if (existing) {
      return NextResponse.json({
        error: 'Contact with this email already exists',
        contact: existing
      }, { status: 409 })
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        account_id: user.account_id,
        email,
        phone: phone || null,
        first_name: firstName,
        last_name: lastName || null,
        address: address || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: 'Failed to create contact', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, contact }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Bearer token if available, otherwise use cookies
    const authHeader = request.headers.get('authorization')
    let supabase: any

    if (authHeader?.startsWith('Bearer ')) {
      // Use token-based client for Bearer auth
      const { createClient } = await import('@supabase/supabase-js')
      const token = authHeader.substring(7)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
    } else {
      // Use cookie-based client
      const cookieStore = await cookies()
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
              } catch { }
            },
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const status = searchParams.get('status')?.split(',').filter(Boolean) || []
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', auth.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build base query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('account_id', user.account_id)

    // Apply tags filter using subquery (FIXED: prevents N+1 query)
    if (tags.length > 0) {
      // Use subquery to filter contacts by tags in a SINGLE query
      // This avoids the two-round-trip approach
      query = query.in('id', (qb: any) =>
        qb
          .from('contact_tags')
          .select('contact_id')
          .in('tag_id', tags)
          .eq('account_id', user.account_id)
      )
    }

    // Apply search filter
    if (search) {
      // Normalize phone number search - remove formatting for 10-digit match
      const { normalizePhoneNumber } = await import('@/lib/utils/phone-normalize')
      const normalizedSearch = normalizePhoneNumber(search)
      
      // Build search conditions
      const searchConditions = [
        `first_name.ilike.%${search}%`,
        `last_name.ilike.%${search}%`,
        `email.ilike.%${search}%`,
      ]
      
      // Add phone search - use normalized if available, otherwise use original
      if (normalizedSearch) {
        // Search both normalized and formatted versions
        searchConditions.push(`phone.ilike.%${normalizedSearch}%`)
        // Also search for formatted versions like (555) 123-4567
        const formatted = `(${normalizedSearch.substring(0, 3)}) ${normalizedSearch.substring(3, 6)}-${normalizedSearch.substring(6)}`
        searchConditions.push(`phone.ilike.%${formatted}%`)
      } else {
        // Fallback to original search if normalization fails
        searchConditions.push(`phone.ilike.%${search}%`)
      }
      
      query = query.or(searchConditions.join(','))
    }

    // Apply date range filter (on created_at)
    if (dateStart) {
      query = query.gte('created_at', dateStart)
    }
    if (dateEnd) {
      // Add one day to include the entire end date
      const endDate = new Date(dateEnd)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('created_at', endDate.toISOString())
    }

    // Apply status filter (if contacts table has status field)
    // Note: This assumes contacts might have a status field. If not, this will be ignored.
    if (status.length > 0) {
      query = query.in('status', status)
    }

    // Apply ordering and pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: contacts, error, count } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json({
      contacts: contacts || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

