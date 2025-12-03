'use client'

import { Contact } from '@/types'

export interface AutoFillData {
  contact?: Partial<Contact>
  job?: {
    description?: string
    scheduledStart?: string
    scheduledEnd?: string
  }
  defaults?: {
    techId?: string
    status?: string
  }
}

export async function getAutoFillData(
  emailDomain?: string,
  contactName?: string
): Promise<AutoFillData> {
  const data: AutoFillData = {}

  // Auto-fill contact info from email domain
  if (emailDomain) {
    try {
      const response = await fetch(`/api/contacts?search=${encodeURIComponent(emailDomain)}`)
      if (response.ok) {
        const result = await response.json()
        if (result.contacts && result.contacts.length > 0) {
          data.contact = result.contacts[0]
        }
      }
    } catch (error) {
      console.error('Failed to auto-fill contact:', error)
    }
  }

  // Auto-fill contact by name
  if (contactName && !data.contact) {
    try {
      const response = await fetch(`/api/contacts?search=${encodeURIComponent(contactName)}`)
      if (response.ok) {
        const result = await response.json()
        if (result.contacts && result.contacts.length > 0) {
          data.contact = result.contacts[0]
        }
      }
    } catch (error) {
      console.error('Failed to auto-fill contact:', error)
    }
  }

  return data
}

export function getSmartDefaults(context?: {
  jobType?: string
  location?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
}): AutoFillData['defaults'] {
  const defaults: AutoFillData['defaults'] = {}

  // Smart time defaults based on time of day
  if (context?.timeOfDay === 'morning') {
    // Default to afternoon slots
    const now = new Date()
    now.setHours(14, 0, 0, 0) // 2 PM
    defaults.status = 'scheduled'
  } else if (context?.timeOfDay === 'afternoon') {
    // Default to next day morning
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // 9 AM
    defaults.status = 'scheduled'
  }

  return defaults
}

export function rememberLastUsed(key: string, value: any): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`lastUsed_${key}`, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to remember last used:', error)
  }
}

export function getLastUsed(key: string): any | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(`lastUsed_${key}`)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to get last used:', error)
    return null
  }
}

