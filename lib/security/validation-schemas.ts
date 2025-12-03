/**
 * Zod Validation Schemas for API Input Validation
 * Centralized validation rules for all API endpoints
 */

import { z } from 'zod'

// Common validation patterns
const idSchema = z.string().uuid().min(1, 'ID is required')
const emailSchema = z.string().email('Invalid email format')
const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
const urlSchema = z.string().url('Invalid URL format')
const timestampSchema = z.string().datetime('Invalid datetime format')

// Pagination and sorting
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional()
})

const sortingSchema = z.object({
  sortBy: z.string().min(1).max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// User and authentication schemas
export const authSchemas = {
  signIn: z.object({
    email: emailSchema,
    password: z.string().min(6).max(100)
  }),

  signUp: z.object({
    email: emailSchema,
    password: z.string().min(8).max(100).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    fullName: z.string().min(2).max(100),
    phone: phoneSchema.optional()
  }),

  session: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1).optional()
  })
}

// Contact management schemas
export const contactSchemas = {
  create: z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    zip_code: z.string().max(20).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).optional()
  }),

  update: z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    zip_code: z.string().max(20).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).optional()
  }),

  query: paginationSchema.extend({
    search: z.string().max(200).optional(),
    tag: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional()
  }).merge(sortingSchema)
}

// Job management schemas
export const jobSchemas = {
  create: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    contact_id: idSchema,
    status: z.enum([
      'lead', 'estimated', 'scheduled', 'in_progress',
      'completed', 'invoiced', 'paid', 'cancelled'
    ]).default('lead'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    estimated_amount: z.number().min(0).max(999999.99).optional(),
    actual_amount: z.number().min(0).max(999999.99).optional(),
    scheduled_date: timestampSchema.optional(),
    address: z.string().max(500).optional(),
    assigned_tech_id: idSchema.optional()
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum([
      'lead', 'estimated', 'scheduled', 'in_progress',
      'completed', 'invoiced', 'paid', 'cancelled'
    ]).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    estimated_amount: z.number().min(0).max(999999.99).optional(),
    actual_amount: z.number().min(0).max(999999.99).optional(),
    scheduled_date: timestampSchema.optional(),
    address: z.string().max(500).optional(),
    assigned_tech_id: idSchema.optional()
  }),

  query: paginationSchema.extend({
    status: z.enum([
      'lead', 'estimated', 'scheduled', 'in_progress',
      'completed', 'invoiced', 'paid', 'cancelled'
    ]).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigned_tech_id: idSchema.optional(),
    contact_id: idSchema.optional(),
    start_date: timestampSchema.optional(),
    end_date: timestampSchema.optional()
  }).merge(sortingSchema)
}

// Voice command schemas
export const voiceSchemas = {
  command: z.object({
    accountId: idSchema,
    transcription: z.string().min(1).max(1000),
    context: z.object({
      currentPage: z.string().max(100).optional(),
      entityId: idSchema.optional(),
      entityType: z.enum(['job', 'contact', 'invoice', 'estimate']).optional()
    }).optional()
  })
}

// GPS location schemas
export const gpsSchemas = {
  log: z.object({
    jobId: idSchema.optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(1000).optional(),
    eventType: z.enum(['auto', 'manual', 'arrival', 'departure']).default('auto'),
    metadata: z.record(z.any()).optional()
  }),

  query: z.object({
    jobId: idSchema.optional(),
    userId: idSchema.optional(),
    startDate: timestampSchema.optional(),
    endDate: timestampSchema.optional()
  })
}

// File upload schemas
export const fileSchemas = {
  upload: z.object({
    jobId: idSchema,
    type: z.enum(['photo', 'document', 'invoice', 'estimate', 'signature']),
    caption: z.string().max(500).optional()
  }),

  validateFile: z.object({
    size: z.number().max(50 * 1024 * 1024), // 50MB max
    type: z.enum([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]),
    name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename')
  })
}

// AI and LLM schemas
export const aiSchemas = {
  suggestions: z.object({
    context: z.object({
      entityType: z.enum(['contact', 'job', 'invoice', 'estimate']).optional(),
      entityId: idSchema.optional(),
      currentPage: z.string().max(100).optional()
    })
  }),

  draft: z.object({
    type: z.enum(['email', 'sms', 'estimate', 'invoice']),
    context: z.object({
      contactId: idSchema.optional(),
      jobId: idSchema.optional(),
      template: z.string().max(100).optional(),
      customInstructions: z.string().max(1000).optional()
    })
  }),

  pricing: z.object({
    jobType: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    location: z.string().max(200).optional(),
    materials: z.array(z.object({
      name: z.string().min(1).max(100),
      quantity: z.number().min(0),
      unit: z.string().max(20)
    })).optional()
  })
}

// Invoice and payment schemas
export const invoiceSchemas = {
  create: z.object({
    jobId: idSchema,
    contact_id: idSchema,
    items: z.array(z.object({
      description: z.string().min(1).max(200),
      quantity: z.number().min(0),
      unit_price: z.number().min(0),
      line_total: z.number().min(0)
    })).min(1),
    subtotal: z.number().min(0),
    tax_amount: z.number().min(0),
    total_amount: z.number().min(0),
    due_date: timestampSchema,
    notes: z.string().max(1000).optional()
  }),

  payment: z.object({
    invoiceId: idSchema,
    amount: z.number().min(0).max(999999.99),
    payment_method: z.enum(['cash', 'check', 'card', 'bank_transfer', 'stripe']),
    reference: z.string().max(100).optional(),
    notes: z.string().max(500).optional()
  })
}

// Campaign schemas
export const campaignSchemas = {
  create: z.object({
    name: z.string().min(1).max(200),
    type: z.enum(['email', 'sms']),
    subject: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    recipient_ids: z.array(idSchema).min(1).max(1000),
    scheduled_date: timestampSchema.optional()
  })
}

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  error: string
  details: z.ZodError
} {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return {
        success: false,
        error: errorMessage,
        details: error
      }
    }
    return {
      success: false,
      error: 'Validation failed',
      details: error as z.ZodError
    }
  }
}

export function createValidationError(error: z.ZodError | string) {
  if (typeof error === 'string') {
    return {
      error: 'Validation Error',
      message: error,
      code: 'VALIDATION_ERROR'
    }
  }

  const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  return {
    error: 'Validation Error',
    message,
    code: 'VALIDATION_ERROR',
    details: error.errors
  }
}