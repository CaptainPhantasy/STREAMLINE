/**
 * AI Email Template Generator
 * Generates professional email templates from natural language input
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export interface TemplateGenerationRequest {
  description: string
  template_type?: 'review_request' | 'follow_up' | 'invoice' | 'custom'
  tone?: 'professional' | 'friendly' | 'formal' | 'casual'
  include_variables?: string[]
}

export interface GeneratedTemplate {
  name: string
  subject: string
  body_html: string
  body_text: string
  variables: string[]
  template_type: string
}

/**
 * Generate email template from natural language description
 */
export async function generateEmailTemplate(
  request: TemplateGenerationRequest
): Promise<GeneratedTemplate> {
  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template name',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
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
          description: 'List of template variables (e.g., {{contact_name}})',
        },
        template_type: {
          type: 'string',
          enum: ['review_request', 'follow_up', 'invoice', 'custom'],
          description: 'Template type',
        },
      },
      required: ['name', 'subject', 'body_html', 'body_text', 'variables', 'template_type'],
    },
    prompt: `Create a professional email template based on this description:

Description: ${request.description}
Template Type: ${request.template_type || 'custom'}
Tone: ${request.tone || 'professional'}

Requirements:
1. Create a professional ${request.tone || 'professional'} email template
2. Use template variables like {{contact_name}}, {{job_id}}, {{date}}, etc. for dynamic content
3. Include both HTML and plain text versions
4. Make it suitable for ${request.template_type || 'custom'} use case
5. List all variables used
6. Generate an appropriate template name

${request.include_variables && request.include_variables.length > 0
  ? `Must include these variables: ${request.include_variables.join(', ')}`
  : ''}`,
  })

  return result.object as GeneratedTemplate
}

