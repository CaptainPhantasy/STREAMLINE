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
    const type = searchParams.get('type')
    const active = searchParams.get('active')

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

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('template_type', type)
    }

    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/email-templates:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
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

    const { data: user } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', session.user.id)
      .single()

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, subject, bodyHtml, bodyText, templateType, variables, isActive } = body

    if (!name || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject' },
        { status: 400 }
      )
    }

    const { data: template, error: createError } = await supabase
      .from('email_templates')
      .insert({
        account_id: user.account_id,
        name,
        subject,
        body_html: bodyHtml || null,
        body_text: bodyText || null,
        template_type: templateType || null,
        variables: variables || [],
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating email template:', createError)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/email-templates:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

