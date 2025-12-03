import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales/competitors
 * Get all competitors or competitors for a specific contact
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (contactId) {
      // Get competitors for specific contact
      const { data: contactCompetitors, error: ccError } = await supabase
        .from('contact_competitors')
        .select('*, competitor:competitors(*)')
        .eq('contact_id', contactId)

      if (ccError) {
        console.error('Error fetching contact competitors:', ccError)
        return NextResponse.json(
          { error: 'Failed to fetch competitors' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        competitors: contactCompetitors?.map((cc: any) => cc.competitor) || [],
      })
    } else {
      // Get all competitors
      const { data: competitors, error: competitorsError } = await supabase
        .from('competitors')
        .select('*')
        .eq('account_id', userData.account_id)
        .order('name', { ascending: true })

      if (competitorsError) {
        console.error('Error fetching competitors:', competitorsError)
        return NextResponse.json(
          { error: 'Failed to fetch competitors' },
          { status: 500 }
        )
      }

      return NextResponse.json({ competitors: competitors || [] })
    }
  } catch (error: unknown) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales/competitors
 * Create a new competitor or link to contact
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, website, notes, contact_id } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get competitor
    const { data: existingCompetitor } = await supabase
      .from('competitors')
      .select('id')
      .eq('account_id', userData.account_id)
      .eq('name', name)
      .single()

    let competitorId: string

    if (existingCompetitor) {
      competitorId = existingCompetitor.id
    } else {
      const { data: newCompetitor, error: competitorError } = await supabase
        .from('competitors')
        .insert({
          account_id: userData.account_id,
          name,
          website: website || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (competitorError) {
        console.error('Error creating competitor:', competitorError)
        return NextResponse.json(
          { error: 'Failed to create competitor' },
          { status: 500 }
        )
      }

      competitorId = newCompetitor.id
    }

    // Link to contact if provided
    if (contact_id) {
      // Verify contact belongs to account
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('account_id')
        .eq('id', contact_id)
        .single()

      if (contactError || !contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }

      if (contact.account_id !== userData.account_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Create link
      await supabase
        .from('contact_competitors')
        .insert({
          contact_id: contact_id,
          competitor_id: competitorId,
          notes: notes || null,
        })
        .catch(() => {
          // Ignore if link already exists
        })
    }

    // Get complete competitor
    const { data: competitor } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .single()

    return NextResponse.json({ competitor }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating competitor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

