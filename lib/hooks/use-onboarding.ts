/**
 * useOnboarding Hook
 *
 * Reusable hook for managing onboarding state.
 * Handles loading, error states, and provides convenient methods.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getOnboardingStatus,
  updateOnboardingStatus,
  completeOnboarding,
  dismissOnboarding,
  restartOnboarding,
  trackOnboardingEvent,
} from '@/lib/api/onboarding'
import type { UserOnboardingStatus, UseOnboardingReturn } from '@/lib/types/onboarding'

/**
 * Hook options
 */
export interface UseOnboardingOptions {
  userId: string
  enabled?: boolean
  onSuccess?: (status: UserOnboardingStatus | null) => void
  onError?: (error: Error) => void
  onComplete?: () => void
  onDismiss?: () => void
}

/**
 * useOnboarding - Manage onboarding state with loading and error handling
 *
 * @example
 * ```tsx
 * const { status, loading, completeOnboarding } = useOnboarding({
 *   userId: user.id,
 *   onComplete: () => navigate('/dashboard')
 * })
 * ```
 */
export function useOnboarding(options: UseOnboardingOptions): UseOnboardingReturn {
  const {
    userId,
    enabled = true,
    onSuccess,
    onError,
    onComplete: onCompleteCallback,
    onDismiss: onDismissCallback,
  } = options

  const [status, setStatus] = useState<UserOnboardingStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch onboarding status from API
   */
  const fetchStatus = useCallback(async () => {
    if (!enabled || !userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getOnboardingStatus(userId)
      setStatus(data)
      onSuccess?.(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [enabled, userId, onSuccess, onError])

  /**
   * Update onboarding status
   */
  const updateStatus = useCallback(
    async (updates: Partial<UserOnboardingStatus>) => {
      if (!userId) return

      setLoading(true)
      setError(null)

      try {
        const updatedStatus = await updateOnboardingStatus(userId, updates)
        setStatus(updatedStatus)

        // Track analytics
        if (updates.current_step !== undefined) {
          await trackOnboardingEvent({
            event: 'onboarding_step_completed',
            userId,
            role: updatedStatus.role,
            stepNumber: updates.current_step,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (err) {
        const error = err as Error
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [userId, onError]
  )

  /**
   * Complete onboarding
   */
  const complete = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const success = await completeOnboarding(userId)
      if (success) {
        // Refetch status to get updated data
        await fetchStatus()

        // Track analytics
        await trackOnboardingEvent({
          event: 'onboarding_completed',
          userId,
          role: status?.role,
          timestamp: new Date().toISOString(),
        })

        onCompleteCallback?.()
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [userId, status?.role, fetchStatus, onCompleteCallback, onError])

  /**
   * Dismiss onboarding
   */
  const dismiss = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const success = await dismissOnboarding(userId)
      if (success) {
        // Refetch status to get updated data
        await fetchStatus()

        // Track analytics
        await trackOnboardingEvent({
          event: 'onboarding_dismissed',
          userId,
          role: status?.role,
          timestamp: new Date().toISOString(),
        })

        onDismissCallback?.()
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [userId, status?.role, fetchStatus, onDismissCallback, onError])

  /**
   * Restart onboarding
   */
  const restart = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const success = await restartOnboarding(userId)
      if (success) {
        // Refetch status to get fresh data
        await fetchStatus()

        // Track analytics
        await trackOnboardingEvent({
          event: 'onboarding_started',
          userId,
          role: status?.role,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [userId, status?.role, fetchStatus, onError])

  /**
   * Fetch status on mount
   */
  useEffect(() => {
    if (enabled && userId) {
      fetchStatus()
    }
  }, [enabled, userId, fetchStatus])

  return {
    status,
    loading,
    error,
    updateStatus,
    completeOnboarding: complete,
    dismissOnboarding: dismiss,
    restartOnboarding: restart,
    refetch: fetchStatus,
  }
}
