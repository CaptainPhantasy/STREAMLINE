import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const { variables } = body // e.g., { contact_name: "John", job_id: "123" }

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

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Replace variables in template
    let previewSubject = template.subject
    let previewBodyHtml = template.body_html || ''
    let previewBodyText = template.body_text || ''

    const vars = variables || {}
    Object.keys(vars).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      previewSubject = previewSubject.replace(regex, vars[key])
      previewBodyHtml = previewBodyHtml.replace(regex, vars[key])
      previewBodyText = previewBodyText.replace(regex, vars[key])
    })

    return NextResponse.json({
      preview: {
        subject: previewSubject,
        bodyHtml: previewBodyHtml,
        bodyText: previewBodyText,
      },
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/email-templates/[id]/preview:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

