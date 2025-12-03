import { Json } from './index'

export type EmailTemplateType = 'review_request' | 'follow_up' | 'invoice' | 'custom' | string

export interface EmailTemplate {
  id: string
  account_id: string
  name: string
  subject: string
  body_html: string | null
  body_text: string | null
  template_type: EmailTemplateType | null
  variables: Json // Array of available variables
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailTemplateCreateRequest {
  name: string
  subject: string
  bodyHtml?: string
  bodyText?: string
  templateType?: EmailTemplateType
  variables?: Json
  isActive?: boolean
}

export interface EmailTemplateUpdateRequest {
  name?: string
  subject?: string
  bodyHtml?: string
  bodyText?: string
  templateType?: EmailTemplateType
  variables?: Json
  isActive?: boolean
}

export interface EmailTemplatePreviewRequest {
  contactId?: string
  jobId?: string
  variables?: Record<string, string>
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[]
}

export interface EmailTemplateDetailResponse {
  template: EmailTemplate
}

export interface EmailTemplateCreateResponse {
  success: true
  template: EmailTemplate
}

export interface EmailTemplatePreviewResponse {
  subject: string
  bodyHtml: string
  bodyText: string
}

