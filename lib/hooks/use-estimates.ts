/**
 * useEstimates Hook
 * Manages estimates state with loading, error, and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'
import { getEstimates, createEstimate, updateEstimate, deleteEstimate } from '@/lib/api/estimates'
import type { Estimate, CreateEstimateRequest, GetEstimatesParams } from '@/lib/types/estimates'

export interface UseEstimatesOptions {
  enabled?: boolean
  initialParams?: GetEstimatesParams
  onSuccess?: (data: Estimate[]) => void
  onError?: (error: Error) => void
}

export function useEstimates(options: UseEstimatesOptions = {}) {
  const { enabled = true, initialParams = {}, onSuccess, onError } = options

  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState<number>(0)

  // Fetch estimates
  const fetchEstimates = useCallback(async (params: GetEstimatesParams = {}) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await getEstimates({ ...initialParams, ...params })
      setEstimates(response.estimates)
      setTotal(response.total)
      onSuccess?.(response.estimates)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [enabled, initialParams, onSuccess, onError])

  // Create estimate
  const create = useCallback(async (data: CreateEstimateRequest): Promise<Estimate> => {
    setLoading(true)
    setError(null)

    try {
      const newEstimate = await createEstimate(data)
      setEstimates(prev => [newEstimate, ...prev])
      return newEstimate
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Update estimate
  const update = useCallback(async (id: string, updates: any): Promise<Estimate> => {
    setLoading(true)
    setError(null)

    try {
      const updatedEstimate = await updateEstimate(id, updates)
      setEstimates(prev => prev.map(e => e.id === id ? updatedEstimate : e))
      return updatedEstimate
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Delete estimate
  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await deleteEstimate(id)
      setEstimates(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Fetch on mount
  useEffect(() => {
    if (enabled) {
      fetchEstimates(initialParams)
    }
  }, [enabled, fetchEstimates, initialParams])

  return {
    estimates,
    loading,
    error,
    total,
    refetch: () => fetchEstimates(initialParams),
    create,
    update,
    remove,
  }
}
