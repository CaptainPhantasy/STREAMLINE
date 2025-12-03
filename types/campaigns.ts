import { Json } from './index'
import { EmailTemplate } from './email-templates'

export type CampaignType = 'email' | 'sms' | 'review_request' | string
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'

export interface Campaign {
  id: string
  account_id: string
  name: string
  campaign_type: CampaignType
  status: CampaignStatus
  target_segment: Json | null
  scheduled_start: string | null
  scheduled_end: string | null
  email_template_id: string | null
  sent_count: number
  opened_count: number
  clicked_count: number
  created_at: string
  updated_at: string
  // Relations
  email_template?: EmailTemplate
}

export interface CampaignRecipient {
  campaign_id: string
  contact_id: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced: boolean
  unsubscribed: boolean
}

export interface CampaignCreateRequest {
  name: string
  campaignType: CampaignType
  status?: CampaignStatus
  targetSegment?: Json
  scheduledStart?: string
  scheduledEnd?: string
  emailTemplateId?: string
}

export interface CampaignUpdateRequest {
  name?: string
  status?: CampaignStatus
  targetSegment?: Json
  scheduledStart?: string
  scheduledEnd?: string
  emailTemplateId?: string
}

export interface CampaignListResponse {
  campaigns: Campaign[]
}

export interface CampaignDetailResponse {
  campaign: Campaign
}

export interface CampaignCreateResponse {
  success: true
  campaign: Campaign
}

export interface CampaignRecipientsResponse {
  recipients: CampaignRecipient[]
  total: number
}

