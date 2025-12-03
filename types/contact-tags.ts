import { Contact } from './index'

export interface ContactTag {
  id: string
  account_id: string
  name: string
  color: string | null
  description: string | null
  created_at: string
}

export interface ContactTagAssignment {
  contact_id: string
  tag_id: string
  assigned_at: string
}

export interface ContactTagCreateRequest {
  name: string
  color?: string
  description?: string
}

export interface ContactTagUpdateRequest {
  name?: string
  color?: string
  description?: string
}

export interface ContactTagListResponse {
  tags: ContactTag[]
}

export interface ContactTagDetailResponse {
  tag: ContactTag
}

export interface ContactTagCreateResponse {
  success: true
  tag: ContactTag
}

export interface ContactTagAssignResponse {
  success: true
  assignment: ContactTagAssignment
}

export interface ContactWithTags extends Contact {
  tags?: ContactTag[]
}

