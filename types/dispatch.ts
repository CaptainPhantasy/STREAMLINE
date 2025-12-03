/**
 * Dispatch Map Dashboard TypeScript Interfaces
 *
 * Type definitions for real-time field tech and sales tracking
 */

export interface TechLocation {
  id: string
  name: string
  role: 'tech' | 'sales'
  status: 'on_job' | 'en_route' | 'idle' | 'offline'
  currentJob?: {
    id: string
    description: string
    address: string
  }
  lastLocation?: {
    lat: number
    lng: number
    accuracy: number
    updatedAt: string
  }
}

export interface JobLocation {
  id: string
  description: string
  status: 'scheduled' | 'en_route' | 'in_progress'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  scheduledStart: string
  customer: {
    name: string
    phone: string
    address: string
  }
  location: {
    lat: number
    lng: number
  }
  assignedTech?: {
    id: string
    name: string
    distanceFromJob?: number  // meters
  }
}

export interface DispatchStats {
  activeTechs: number
  idleTechs: number
  jobsToday: number
  jobsCompleted: number
  unassignedJobs: number
  avgResponseTime: number  // minutes
}

export type TechStatus = 'on_job' | 'en_route' | 'idle' | 'offline'

export type JobStatus = 'scheduled' | 'en_route' | 'in_progress'

export interface TechStatusColors {
  bg: string
  text: string
  marker: string
}

export interface JobStatusColors {
  bg: string
  text: string
  marker: string
}

// Color maps for UI consistency
export const techStatusColors: Record<TechStatus, TechStatusColors> = {
  'on_job': {
    bg: 'bg-green-900',
    text: 'text-green-400',
    marker: '#10B981'  // green-500
  },
  'en_route': {
    bg: 'bg-blue-900',
    text: 'text-blue-400',
    marker: '#3B82F6'  // blue-500
  },
  'idle': {
    bg: 'bg-yellow-900',
    text: 'text-yellow-400',
    marker: '#F59E0B'  // yellow-500
  },
  'offline': {
    bg: 'bg-gray-700',
    text: 'text-gray-400',
    marker: '#6B7280'  // gray-500
  }
}

export const jobStatusColors: Record<JobStatus, JobStatusColors> = {
  'scheduled': {
    bg: 'bg-red-900',
    text: 'text-red-400',
    marker: '#EF4444'  // red-500
  },
  'en_route': {
    bg: 'bg-orange-900',
    text: 'text-orange-400',
    marker: '#F97316'  // orange-500
  },
  'in_progress': {
    bg: 'bg-blue-900',
    text: 'text-blue-400',
    marker: '#3B82F6'  // blue-500
  }
}
