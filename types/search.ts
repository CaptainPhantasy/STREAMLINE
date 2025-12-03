import { Contact, Job, Conversation } from './index'

// Search result types - used by /api/search
export interface SearchResultJob {
  id: string
  status: string
  description: string | null
  created_at: string
  contact?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }
}

export interface SearchResultContact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export interface SearchResultConversation {
  id: string
  subject: string | null
  status: string
  last_message_at: string
  contact?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }
}

export interface SearchResults {
  jobs: SearchResultJob[]
  contacts: SearchResultContact[]
  conversations: SearchResultConversation[]
}

export interface SearchResponse {
  query: string
  results: SearchResults
  counts: {
    jobs: number
    contacts: number
    conversations: number
  }
}

