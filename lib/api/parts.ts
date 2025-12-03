/**
 * Parts/Inventory API Client
 *
 * Reusable API functions for parts and inventory management
 * Can be extracted to other projects by changing baseUrl
 */

import type {
  Part,
  JobPart,
  CreatePartRequest,
  UpdatePartRequest,
  GetPartsParams,
  GetPartsResponse,
  AddJobPartRequest,
  GetJobPartsResponse,
  LowStockAlert,
} from '@/lib/types/parts'

/**
 * API Configuration
 * Allows customization for different projects
 */
export interface PartsAPIConfig {
  baseUrl?: string
  headers?: Record<string, string>
  onError?: (error: Error) => void
}

/**
 * Parts API Client
 * Reusable API functions that can work in any project
 */
export class PartsAPI {
  private baseUrl: string
  private headers: Record<string, string>
  private onError?: (error: Error) => void

  constructor(config: PartsAPIConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/parts'
    this.headers = config.headers || {}
    this.onError = config.onError
  }

  /**
   * Get all parts with optional filtering
   */
  async getParts(params: GetPartsParams = {}): Promise<GetPartsResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.category) searchParams.set('category', params.category)
      if (params.search) searchParams.set('search', params.search)
      if (params.low_stock !== undefined) searchParams.set('low_stock', String(params.low_stock))
      if (params.sort) searchParams.set('sort', params.sort)
      if (params.sort_by) searchParams.set('sort_by', params.sort_by)

      const response = await fetch(
        `${this.baseUrl}?${searchParams}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Get single part by ID
   */
  async getPart(id: string): Promise<Part> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${id}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Create new part
   */
  async createPart(data: CreatePartRequest): Promise<Part> {
    try {
      const response = await fetch(
        this.baseUrl,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Update existing part
   */
  async updatePart(id: string, updates: UpdatePartRequest): Promise<Part> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${id}`,
        {
          method: 'PUT',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Delete part
   */
  async deletePart(id: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${id}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/low-stock`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Get parts used on a specific job
   */
  async getJobParts(jobId: string): Promise<GetJobPartsResponse> {
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/parts`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Add part to a job
   */
  async addJobPart(jobId: string, data: AddJobPartRequest): Promise<JobPart> {
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/parts`,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Remove part from a job
   */
  async removeJobPart(jobId: string, partId: string): Promise<void> {
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/parts/${partId}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Adjust inventory quantity
   */
  async adjustInventory(
    partId: string,
    quantityChange: number,
    reason: string,
    notes?: string
  ): Promise<Part> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${partId}/adjust`,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity_change: quantityChange, reason, notes })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }
}

/**
 * Default instance for this project
 * Other projects can create their own with different config
 */
export const partsAPI = new PartsAPI({
  baseUrl: '/api/parts',
  onError: (error) => {
    console.error('Parts API Error:', error)
    // Project-specific error handling (e.g., toast notification)
  }
})

/**
 * Convenience functions that use the default instance
 * These make it easy to use in components without creating an API instance
 */
export const getParts = (params?: GetPartsParams) =>
  partsAPI.getParts(params)

export const getPart = (id: string) =>
  partsAPI.getPart(id)

export const createPart = (data: CreatePartRequest) =>
  partsAPI.createPart(data)

export const updatePart = (id: string, updates: UpdatePartRequest) =>
  partsAPI.updatePart(id, updates)

export const deletePart = (id: string) =>
  partsAPI.deletePart(id)

export const getLowStockAlerts = () =>
  partsAPI.getLowStockAlerts()

export const getJobParts = (jobId: string) =>
  partsAPI.getJobParts(jobId)

export const addJobPart = (jobId: string, data: AddJobPartRequest) =>
  partsAPI.addJobPart(jobId, data)

export const removeJobPart = (jobId: string, partId: string) =>
  partsAPI.removeJobPart(jobId, partId)

export const adjustInventory = (partId: string, quantityChange: number, reason: string, notes?: string) =>
  partsAPI.adjustInventory(partId, quantityChange, reason, notes)
