/**
 * Estimates API Client
 *
 * Reusable API functions for estimates/quotes management
 * Can be extracted to other projects by changing baseUrl
 */

import type {
  Estimate,
  CreateEstimateRequest,
  UpdateEstimateRequest,
  GetEstimatesParams,
  GetEstimatesResponse,
  SendEstimateRequest,
  ConvertEstimateToJobRequest,
  EstimatePDFOptions,
} from '@/lib/types/estimates'

/**
 * API Configuration
 * Allows customization for different projects
 */
export interface EstimatesAPIConfig {
  baseUrl?: string
  headers?: Record<string, string>
  onError?: (error: Error) => void
}

/**
 * Estimates API Client
 * Reusable API functions that can work in any project
 */
export class EstimatesAPI {
  private baseUrl: string
  private headers: Record<string, string>
  private onError?: (error: Error) => void

  constructor(config: EstimatesAPIConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/estimates'
    this.headers = config.headers || {}
    this.onError = config.onError
  }

  /**
   * Get all estimates with optional filtering
   */
  async getEstimates(params: GetEstimatesParams = {}): Promise<GetEstimatesResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.status) searchParams.set('status', params.status)
      if (params.contact_id) searchParams.set('contact_id', params.contact_id)
      if (params.search) searchParams.set('search', params.search)
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
   * Get single estimate by ID
   */
  async getEstimate(id: string): Promise<Estimate> {
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
   * Create new estimate
   */
  async createEstimate(data: CreateEstimateRequest): Promise<Estimate> {
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
   * Update existing estimate
   */
  async updateEstimate(id: string, updates: UpdateEstimateRequest): Promise<Estimate> {
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
   * Delete estimate
   */
  async deleteEstimate(id: string): Promise<void> {
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
   * Send estimate to customer via email
   */
  async sendEstimate(id: string, data: SendEstimateRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${id}/send`,
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
   * Convert estimate to job
   */
  async convertToJob(id: string, data: ConvertEstimateToJobRequest = {}): Promise<{ job_id: string; message: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${id}/convert`,
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
   * Download estimate as PDF
   */
  async downloadPDF(id: string, options: EstimatePDFOptions = {}): Promise<Blob> {
    try {
      const searchParams = new URLSearchParams()
      if (options.include_terms !== undefined) searchParams.set('include_terms', String(options.include_terms))
      if (options.include_notes !== undefined) searchParams.set('include_notes', String(options.include_notes))
      if (options.watermark) searchParams.set('watermark', options.watermark)
      if (options.logo_url) searchParams.set('logo_url', options.logo_url)

      const response = await fetch(
        `${this.baseUrl}/${id}/pdf?${searchParams}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Duplicate an existing estimate
   */
  async duplicateEstimate(id: string): Promise<Estimate> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${id}/duplicate`,
        {
          method: 'POST',
          headers: this.headers
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
export const estimatesAPI = new EstimatesAPI({
  baseUrl: '/api/estimates',
  onError: (error) => {
    console.error('Estimates API Error:', error)
    // Project-specific error handling (e.g., toast notification)
  }
})

/**
 * Convenience functions that use the default instance
 * These make it easy to use in components without creating an API instance
 */
export const getEstimates = (params?: GetEstimatesParams) =>
  estimatesAPI.getEstimates(params)

export const getEstimate = (id: string) =>
  estimatesAPI.getEstimate(id)

export const createEstimate = (data: CreateEstimateRequest) =>
  estimatesAPI.createEstimate(data)

export const updateEstimate = (id: string, updates: UpdateEstimateRequest) =>
  estimatesAPI.updateEstimate(id, updates)

export const deleteEstimate = (id: string) =>
  estimatesAPI.deleteEstimate(id)

export const sendEstimate = (id: string, data: SendEstimateRequest) =>
  estimatesAPI.sendEstimate(id, data)

export const convertEstimateToJob = (id: string, data?: ConvertEstimateToJobRequest) =>
  estimatesAPI.convertToJob(id, data)

export const downloadEstimatePDF = (id: string, options?: EstimatePDFOptions) =>
  estimatesAPI.downloadPDF(id, options)

export const duplicateEstimate = (id: string) =>
  estimatesAPI.duplicateEstimate(id)
