import { User, Contact, Job } from './index'

export type CallDirection = 'inbound' | 'outbound'
export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'answered'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer'

export interface CallLog {
  id: string
  account_id: string
  user_id: string | null
  contact_id: string | null
  job_id: string | null
  direction: CallDirection
  phone_number: string
  duration_seconds: number | null
  status: CallStatus
  recording_url: string | null
  transcription: string | null
  notes: string | null
  started_at: string
  ended_at: string | null
  created_at: string
  // Relations
  user?: User
  contact?: Contact
  job?: Job
}

export interface CallLogCreateRequest {
  contactId?: string
  jobId?: string
  direction: CallDirection
  phoneNumber: string
  status?: CallStatus
  notes?: string
}

export interface CallLogUpdateRequest {
  durationSeconds?: number
  status?: CallStatus
  recordingUrl?: string
  transcription?: string
  notes?: string
  endedAt?: string
}

export interface CallLogListResponse {
  callLogs: CallLog[]
  total: number
}

export interface CallLogDetailResponse {
  callLog: CallLog
}

export interface CallLogCreateResponse {
  success: true
  callLog: CallLog
}

