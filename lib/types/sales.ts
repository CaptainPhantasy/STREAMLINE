/**
 * Sales Types
 * TypeScript interfaces for mobile sales components
 */

// ================================================================
// Contact & Customer Types
// ================================================================

export interface ContactProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address?: string
  company?: string
  profile?: {
    family?: string
    preferences?: string
    interests?: string[]
    pain_points?: string[]
  }
  created_at: string
  updated_at: string
}

export interface ContactHistory {
  jobs: JobHistoryItem[]
  meetings: MeetingHistoryItem[]
  conversations: ConversationHistoryItem[]
  total_revenue: number
  last_contact_date: string
}

export interface JobHistoryItem {
  id: string
  description: string
  status: string
  total_amount: number
  completed_at?: string
  created_at: string
}

export interface MeetingHistoryItem {
  id: string
  scheduled_at: string
  summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  notes?: string
}

export interface ConversationHistoryItem {
  id: string
  subject: string
  status: 'open' | 'closed'
  last_message_at: string
}

// ================================================================
// AI Briefing Types
// ================================================================

export interface AIBriefing {
  contact: ContactProfile
  history_summary: string
  talking_points: TalkingPoint[]
  pricing_suggestions: PricingSuggestion[]
  recommended_services: string[]
  pain_points: string[]
  opportunities: string[]
  warnings: string[]
  generated_at: string
}

export interface TalkingPoint {
  id: string
  text: string
  priority: 'high' | 'medium' | 'low'
  category: 'relationship' | 'technical' | 'pricing' | 'follow_up'
  checked?: boolean
}

export interface PricingSuggestion {
  service: string
  low: number
  recommended: number
  high: number
  notes?: string
  profit_margin?: number
}

// ================================================================
// Lead Types
// ================================================================

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Lead {
  id: string
  name: string
  company?: string
  contact_id?: string
  stage: LeadStage
  value: number
  probability: number
  next_action: string
  next_action_date?: string
  source?: string
  notes?: string
  created_at: string
  updated_at: string
  assigned_to?: string
}

export interface LeadPipeline {
  stages: {
    [key in LeadStage]: {
      leads: Lead[]
      total_value: number
      count: number
    }
  }
  total_leads: number
  total_value: number
  conversion_rate: number
}

// ================================================================
// Meeting Types
// ================================================================

export interface Meeting {
  id: string
  contact_id: string
  scheduled_at: string
  duration_minutes: number
  location?: string
  meeting_type: 'consultation' | 'follow_up' | 'proposal' | 'closing'
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  action_items?: string[]
  created_at: string
}

export interface MeetingNote {
  id: string
  meeting_id: string
  content: string
  created_at: string
  created_by: string
}

export interface MeetingSummary {
  meeting_id: string
  key_points: string[]
  decisions_made: string[]
  action_items: ActionItem[]
  next_steps: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  follow_up_date?: string
}

export interface ActionItem {
  id: string
  description: string
  assigned_to?: string
  due_date?: string
  completed: boolean
}

// ================================================================
// Estimate Types
// ================================================================

export interface QuickEstimate {
  id: string
  contact_id: string
  services: EstimateService[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  valid_until: string
  created_at: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
}

export interface EstimateService {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
}

export interface ServiceTemplate {
  id: string
  name: string
  description: string
  default_price: number
  unit: string
  category: string
}

// ================================================================
// Component Props Types
// ================================================================

export interface AIBriefingCardProps {
  contactId: string
  onRefresh?: () => void
  className?: string
}

export interface TalkingPointsListProps {
  points: TalkingPoint[]
  onCheck?: (pointId: string, checked: boolean) => void
  onAdd?: (text: string) => void
  onReorder?: (points: TalkingPoint[]) => void
  editable?: boolean
  className?: string
}

export interface ContactHistorySummaryProps {
  contactId: string
  history: ContactHistory
  className?: string
}

export interface LeadPipelineViewProps {
  pipeline: LeadPipeline
  onMoveStage?: (leadId: string, newStage: LeadStage) => void
  onLeadClick?: (lead: Lead) => void
  className?: string
}

export interface LeadCardProps {
  lead: Lead
  onSwipeCall?: (lead: Lead) => void
  onSwipeEmail?: (lead: Lead) => void
  onSwipeMeet?: (lead: Lead) => void
  onClick?: (lead: Lead) => void
  className?: string
}

export interface MeetingNoteCaptureProps {
  meetingId: string
  onSave?: (note: string) => void
  autoSave?: boolean
  className?: string
}

export interface QuickEstimateBuilderProps {
  contactId: string
  onSend?: (estimate: QuickEstimate) => void
  serviceTemplates?: ServiceTemplate[]
  className?: string
}

export interface PricingSuggestionsProps {
  suggestions: PricingSuggestion[]
  onSelect?: (suggestion: PricingSuggestion) => void
  className?: string
}

export interface MeetingSummaryAIProps {
  meetingId: string
  summary?: MeetingSummary
  onGenerate?: () => void
  onShare?: () => void
  className?: string
}

// ================================================================
// API Request/Response Types
// ================================================================

export interface GenerateBriefingRequest {
  contact_id: string
  meeting_type?: Meeting['meeting_type']
}

export interface GenerateBriefingResponse {
  briefing: AIBriefing
  cached: boolean
}

export interface GeneratePricingRequest {
  contact_id: string
  services: string[]
  job_details?: string
}

export interface GeneratePricingResponse {
  suggestions: PricingSuggestion[]
}

export interface GenerateMeetingSummaryRequest {
  meeting_id: string
  notes?: string
  force_regenerate?: boolean
}

export interface GenerateMeetingSummaryResponse {
  summary: MeetingSummary
}

export interface GetLeadsPipelineResponse {
  pipeline: LeadPipeline
}

export interface MoveLeadStageRequest {
  lead_id: string
  new_stage: LeadStage
}

export interface SaveMeetingNoteRequest {
  meeting_id: string
  content: string
}

export interface CreateQuickEstimateRequest {
  contact_id: string
  services: EstimateService[]
  notes?: string
  send_immediately?: boolean
}
