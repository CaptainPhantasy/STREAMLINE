/**
 * Centralized job status colors matching Kanban board columns
 * These colors are used consistently across the application
 */

export const JOB_STATUS_COLORS: Record<string, {
  bg: string
  text: string
  border: string
  kanbanBg: string
}> = {
  lead: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    border: 'border-gray-300',
    kanbanBg: 'bg-gray-100'
  },
  scheduled: {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-300',
    kanbanBg: 'bg-blue-100'
  },
  en_route: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-900',
    border: 'border-yellow-300',
    kanbanBg: 'bg-yellow-100'
  },
  in_progress: {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    kanbanBg: 'bg-orange-100'
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-300',
    kanbanBg: 'bg-green-100'
  },
  invoiced: {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300',
    kanbanBg: 'bg-purple-100'
  },
  paid: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    kanbanBg: 'bg-emerald-100'
  },
  delayed: {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    kanbanBg: 'bg-amber-100'
  },
  cancelled: {
    bg: 'bg-red-100',
    text: 'text-red-900',
    border: 'border-red-300',
    kanbanBg: 'bg-red-100'
  },
}

/**
 * Get job status colors - matches Kanban board columns
 */
export function getJobStatusColors(status: string | null | undefined) {
  if (!status) return JOB_STATUS_COLORS.lead
  return JOB_STATUS_COLORS[status.toLowerCase()] || JOB_STATUS_COLORS.lead
}

