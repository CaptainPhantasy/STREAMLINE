import { Json } from './index'
import { Invoice, Job } from './invoices'

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'stripe' | 'cash' | 'check' | 'ach' | 'manual' | string

export interface Payment {
  id: string
  account_id: string
  invoice_id: string | null
  job_id: string | null
  amount: number // In cents
  payment_method: PaymentMethod
  stripe_payment_intent_id: string | null
  status: PaymentStatus
  processed_at: string | null
  metadata: Json
  created_at: string
  // Relations
  invoice?: {
    invoice_number: string
    contact_id: string
  }
  job?: {
    id: string
    description: string | null
    contact?: {
      first_name: string | null
      last_name: string | null
    }
  }
}

export interface PaymentCreateRequest {
  invoiceId?: string
  jobId?: string
  amount: number
  paymentMethod?: PaymentMethod
  notes?: string
  metadata?: Json
}

export interface PaymentUpdateRequest {
  status?: PaymentStatus
  paymentMethod?: PaymentMethod
  notes?: string
  metadata?: Json
}

export interface PaymentListResponse {
  payments: Payment[]
}

export interface PaymentDetailResponse {
  payment: Payment
}

export interface PaymentCreateResponse {
  success: true
  payment: Payment
}

