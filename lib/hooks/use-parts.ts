/**
 * useParts Hook
 * Manages parts state with loading, error, and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'
import { getParts, createPart, updatePart, deletePart, getLowStockAlerts } from '@/lib/api/parts'
import type { Part, CreatePartRequest, GetPartsParams, LowStockAlert } from '@/lib/types/parts'

export interface UsePartsOptions {
  enabled?: boolean
  initialParams?: GetPartsParams
  onSuccess?: (data: Part[]) => void
  onError?: (error: Error) => void
}

export function useParts(options: UsePartsOptions = {}) {
  const { enabled = true, initialParams = {}, onSuccess, onError } = options

  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState<number>(0)
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])

  // Fetch parts
  const fetchParts = useCallback(async (params: GetPartsParams = {}) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await getParts({ ...initialParams, ...params })
      setParts(response.parts)
      setTotal(response.total)
      onSuccess?.(response.parts)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [enabled, initialParams, onSuccess, onError])

  // Fetch low stock alerts
  const fetchLowStock = useCallback(async () => {
    try {
      const alerts = await getLowStockAlerts()
      setLowStockAlerts(alerts)
    } catch (err) {
      console.error('Failed to fetch low stock alerts:', err)
    }
  }, [])

  // Create part
  const create = useCallback(async (data: CreatePartRequest): Promise<Part> => {
    setLoading(true)
    setError(null)

    try {
      const newPart = await createPart(data)
      setParts(prev => [newPart, ...prev])
      return newPart
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Update part
  const update = useCallback(async (id: string, updates: any): Promise<Part> => {
    setLoading(true)
    setError(null)

    try {
      const updatedPart = await updatePart(id, updates)
      setParts(prev => prev.map(p => p.id === id ? updatedPart : p))
      return updatedPart
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Delete part
  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await deletePart(id)
      setParts(prev => prev.filter(p => p.id !== id))
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
      fetchParts(initialParams)
      fetchLowStock()
    }
  }, [enabled, fetchParts, fetchLowStock, initialParams])

  return {
    parts,
    loading,
    error,
    total,
    lowStockAlerts,
    refetch: () => {
      fetchParts(initialParams)
      fetchLowStock()
    },
    create,
    update,
    remove,
  }
}
