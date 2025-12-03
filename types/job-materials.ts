import { Job } from './index'

export type MaterialUnit = 'each' | 'ft' | 'lb' | 'gal' | 'sqft' | string

export interface JobMaterial {
  id: string
  account_id: string
  job_id: string
  material_name: string
  quantity: number
  unit: MaterialUnit
  unit_cost: number | null // In cents
  total_cost: number | null // In cents
  supplier: string | null
  notes: string | null
  created_at: string
  // Relations
  job?: Job
}

export interface JobMaterialCreateRequest {
  jobId: string
  materialName: string
  quantity: number
  unit?: MaterialUnit
  unitCost?: number
  totalCost?: number
  supplier?: string
  notes?: string
}

export interface JobMaterialUpdateRequest {
  materialName?: string
  quantity?: number
  unit?: MaterialUnit
  unitCost?: number
  totalCost?: number
  supplier?: string
  notes?: string
}

export interface JobMaterialListResponse {
  materials: JobMaterial[]
}

export interface JobMaterialDetailResponse {
  material: JobMaterial
}

export interface JobMaterialCreateResponse {
  success: true
  material: JobMaterial
}

