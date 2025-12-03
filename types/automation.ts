import { Json } from './index'

export type AutomationTrigger =
  | 'unreplied_time'
  | 'status_change'
  | 'keyword'
  | 'sentiment'
  | 'conversation_created'
  | 'message_received'
  | 'job_status_changed'
  | 'job_created'
  | string

export type AutomationAction =
  | 'create_draft'
  | 'assign_tech'
  | 'send_notification'
  | 'create_job'
  | 'send_email'
  | 'update_status'
  | string

export interface AutomationRule {
  id: string
  account_id: string
  name: string
  trigger: AutomationTrigger
  trigger_config: Json
  action: AutomationAction
  action_config: Json
  is_active: boolean
  created_at: string
}

export interface AutomationRuleCreateRequest {
  name: string
  trigger: AutomationTrigger
  triggerConfig?: Json
  action: AutomationAction
  actionConfig?: Json
  isActive?: boolean
}

export interface AutomationRuleUpdateRequest {
  name?: string
  trigger?: AutomationTrigger
  triggerConfig?: Json
  action?: AutomationAction
  actionConfig?: Json
  isActive?: boolean
}

export interface AutomationRuleListResponse {
  rules: AutomationRule[]
}

export interface AutomationRuleDetailResponse {
  rule: AutomationRule
}

export interface AutomationRuleCreateResponse {
  success: true
  rule: AutomationRule
}

