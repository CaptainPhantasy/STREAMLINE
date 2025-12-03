'use client'

import { getLastUsed, rememberLastUsed } from './auto-fill'

export interface SmartDefaults {
  techId?: string
  status?: string
  scheduledStart?: string
  scheduledEnd?: string
  description?: string
}

export function getSmartDefaultsForJob(
  jobType?: string,
  location?: string
): SmartDefaults {
  const defaults: SmartDefaults = {}

  // Get last used values
  const lastTech = getLastUsed('techId')
  const lastStatus = getLastUsed('status')
  const lastDescription = getLastUsed('description')

  if (lastTech) defaults.techId = lastTech
  if (lastStatus) defaults.status = lastStatus
  if (lastDescription && jobType) {
    // Use similar description if job type matches
    defaults.description = lastDescription
  }

  // Smart time defaults - next available slot
  const now = new Date()
  const hour = now.getHours()
  
  if (hour < 14) {
    // Before 2 PM - suggest 2 PM today
    const today = new Date(now)
    today.setHours(14, 0, 0, 0)
    defaults.scheduledStart = today.toISOString()
    today.setHours(16, 0, 0, 0)
    defaults.scheduledEnd = today.toISOString()
  } else {
    // After 2 PM - suggest 9 AM tomorrow
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    defaults.scheduledStart = tomorrow.toISOString()
    tomorrow.setHours(11, 0, 0, 0)
    defaults.scheduledEnd = tomorrow.toISOString()
  }

  // Default status
  if (!defaults.status) {
    defaults.status = 'scheduled'
  }

  return defaults
}

export function getSmartDefaultsForContact(): Partial<{
  tags: string[]
  status: string
}> {
  const defaults: Partial<{ tags: string[]; status: string }> = {}

  // Get last used tags
  const lastTags = getLastUsed('contactTags')
  if (lastTags && Array.isArray(lastTags)) {
    defaults.tags = lastTags
  }

  // Default status
  defaults.status = 'active'

  return defaults
}

export function updateSmartDefaults(key: string, value: any): void {
  rememberLastUsed(key, value)
}

