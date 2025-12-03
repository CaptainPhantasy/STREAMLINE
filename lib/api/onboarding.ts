/**
 * Onboarding API Client
 *
 * Reusable API functions for onboarding system.
 * Can be configured for different projects with different base URLs.
 */

import type {
  UserOnboardingStatus,
  GetOnboardingStatusResponse,
  UpdateOnboardingStatusParams,
  UpdateOnboardingStatusResponse,
  CompleteOnboardingResponse,
  DismissOnboardingResponse,
  RestartOnboardingResponse,
} from '@/lib/types/onboarding'

/**
 * API Configuration
 */
export interface OnboardingAPIConfig {
  baseUrl?: string
  headers?: Record<string, string>
  onError?: (error: Error) => void
}

/**
 * Onboarding API Client
 * Reusable API functions that can work in any project
 */
export class OnboardingAPI {
  private baseUrl: string
  private headers: Record<string, string>
  private onError?: (error: Error) => void

  constructor(config: OnboardingAPIConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/onboarding'
    this.headers = config.headers || {}
    this.onError = config.onError
  }

  /**
   * Get onboarding status for a user
   */
  async getStatus(userId: string): Promise<UserOnboardingStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status?userId=${userId}`, {
        headers: this.headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: GetOnboardingStatusResponse = await response.json()
      return data.status
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Update onboarding status
   */
  async updateStatus(
    userId: string,
    updates: Partial<UserOnboardingStatus>
  ): Promise<UserOnboardingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'PUT',
        headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: UpdateOnboardingStatusResponse = await response.json()
      return data.status
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Mark onboarding as complete
   */
  async complete(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/complete`, {
        method: 'POST',
        headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: CompleteOnboardingResponse = await response.json()
      return data.success
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Dismiss/skip onboarding
   */
  async dismiss(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/dismiss`, {
        method: 'POST',
        headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: DismissOnboardingResponse = await response.json()
      return data.success
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Restart onboarding (clear completion/dismissal)
   */
  async restart(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/restart`, {
        method: 'POST',
        headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: RestartOnboardingResponse = await response.json()
      return data.success
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: any): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      // Don't throw errors for analytics
    } catch (error) {
      console.warn('Failed to track onboarding event:', error)
    }
  }
}

/**
 * Default instance for this project
 */
export const onboardingAPI = new OnboardingAPI({
  baseUrl: '/api/onboarding',
  onError: (error) => {
    console.error('Onboarding API Error:', error)
  },
})

/**
 * Convenience functions using the default instance
 */
export const getOnboardingStatus = (userId: string) =>
  onboardingAPI.getStatus(userId)

export const updateOnboardingStatus = (
  userId: string,
  updates: Partial<UserOnboardingStatus>
) => onboardingAPI.updateStatus(userId, updates)

export const completeOnboarding = (userId: string) =>
  onboardingAPI.complete(userId)

export const dismissOnboarding = (userId: string) =>
  onboardingAPI.dismiss(userId)

export const restartOnboarding = (userId: string) =>
  onboardingAPI.restart(userId)

export const trackOnboardingEvent = (event: any) =>
  onboardingAPI.trackEvent(event)
