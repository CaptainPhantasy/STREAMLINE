export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Account {
  id: string
  name: string
  slug: string
  inbound_email_domain: string | null
  settings: Json
  created_at: string
}

export interface User {
  id: string
  account_id: string
  full_name: string | null
  role: 'owner' | 'admin' | 'dispatcher' | 'tech' | null
  avatar_url: string | null
}

export interface Contact {
  id: string
  account_id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  address: string | null
  created_at: string
}

export interface Conversation {
  id: string
  account_id: string
  contact_id: string | null
  status: 'open' | 'closed' | 'snoozed'
  subject: string | null
  channel: string | null
  last_message_at: string
  assigned_to: string | null
  ai_summary: string | null
  // Relations
  contact?: Contact
}

export interface Message {
  id: string
  account_id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  sender_type: 'contact' | 'user' | 'ai_agent'
  sender_id: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  attachments: Json
  message_id: string | null
  in_reply_to: string | null
  is_internal_note: boolean
  created_at: string
}

export interface Job {
  id: string
  account_id: string
  contact_id: string | null
  conversation_id: string | null
  status: 'lead' | 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'invoiced' | 'paid'
  scheduled_start: string | null
  scheduled_end: string | null
  tech_assigned_id: string | null
  description: string | null
  notes: string | null
  total_amount: number | null
  stripe_payment_link: string | null
  created_at: string
  // Relations
  contact?: Contact
  conversation?: Conversation
  tech?: User
}

