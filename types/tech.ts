import { Job, User } from './index'

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number | null
  timestamp: string
}

export interface TechJobStats {
  today: number
  completed: number
  inProgress: number
  revenue: number
}

export interface TechJobsResponse {
  jobs: Job[]
  stats: TechJobStats
}

export interface TimeEntry {
  id: string
  account_id: string
  job_id: string
  user_id: string
  clock_in_at: string
  clock_out_at: string | null
  duration_minutes: number | null
  notes: string | null
  is_billable: boolean
  hourly_rate: number | null
  created_at: string
  // Relations
  job?: Job
  user?: User
}

