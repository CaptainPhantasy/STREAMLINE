import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/email-templates/[id]/clone
 * Clone an existing email template
 */
export async function POST(
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

    const body = await request.json()
    const { name } = body // Optional new name for cloned template

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get original template
    const { data: originalTemplate, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .eq('account_id', userData.account_id)
      .single()

    if (templateError || !originalTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Create cloned template
    const { data: clonedTemplate, error: cloneError } = await supabase
      .from('email_templates')
      .insert({
        account_id: userData.account_id,
        name: name || `${originalTemplate.name} (Copy)`,
        subject: originalTemplate.subject,
        body_html: originalTemplate.body_html,
        body_text: originalTemplate.body_text,
        template_type: originalTemplate.template_type,
        variables: originalTemplate.variables,
        is_active: false, // Cloned templates start as inactive
      })
      .select()
      .single()

    if (cloneError) {
      console.error('Error cloning template:', cloneError)
      return NextResponse.json(
        { error: 'Failed to clone template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: clonedTemplate }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error cloning template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

