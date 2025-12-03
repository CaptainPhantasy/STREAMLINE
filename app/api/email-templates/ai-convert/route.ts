import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/email-templates/ai-convert
 * Convert a pasted email into a professional template
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
    const { email_content, email_subject } = body

    if (!email_content) {
      return NextResponse.json(
        { error: 'email_content is required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use AI to convert email to template
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Template name based on email content',
          },
          subject: {
            type: 'string',
            description: 'Professional email subject line',
          },
          body_html: {
            type: 'string',
            description: 'HTML email body with template variables',
          },
          body_text: {
            type: 'string',
            description: 'Plain text email body with template variables',
          },
          variables: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of template variables found (e.g., {{contact_name}}, {{job_id}})',
          },
          template_type: {
            type: 'string',
            enum: ['review_request', 'follow_up', 'invoice', 'custom'],
            description: 'Template type category',
          },
        },
        required: ['name', 'subject', 'body_html', 'body_text', 'variables'],
      },
      prompt: `Convert this email into a professional email template with variables:

Original Subject: ${email_subject || 'N/A'}
Original Content:
${email_content}

Instructions:
1. Extract the core message and make it professional
2. Replace specific names, dates, and values with template variables like {{contact_name}}, {{job_id}}, {{date}}, etc.
3. Create both HTML and plain text versions
4. Identify all variables used
5. Suggest a template name and type
6. Make the language professional and consistent`,
    })

    const template = result.object

    // Generate subject line suggestions
    const subjectSuggestions = await generateObject({
      model: openai('gpt-4o'),
      schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Alternative subject line suggestions',
          },
        },
        required: ['suggestions'],
      },
      prompt: `Generate 3 alternative professional subject lines for this email template:

Template Subject: ${template.subject}
Template Type: ${template.template_type}

Provide 3 variations that are professional, clear, and engaging.`,
    })

    return NextResponse.json({
      template: {
        ...template,
        subject_suggestions: subjectSuggestions.object.suggestions,
      },
    })
  } catch (error: unknown) {
    console.error('Error converting email to template:', error)
    return NextResponse.json(
      { error: 'Failed to convert email to template' },
      { status: 500 }
    )
  }
}

