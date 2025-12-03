/**
 * LLM Audit Module
 *
 * Exports audit logging utilities for the LLM Router.
 * Provides asynchronous, non-blocking audit event logging.
 *
 * Usage:
 * ```typescript
 * import { getAuditQueue } from '@/lib/llm/audit'
 *
 * const queue = getAuditQueue(supabase)
 * queue.enqueue({
 *   type: 'llm_request',
 *   accountId: 'abc-123',
 *   provider: 'openai',
 *   model: 'gpt-4o-mini',
 *   timestamp: new Date(),
 *   metadata: { tokensUsed: 150 }
 * })
 * ```
 *
 * @module lib/llm/audit
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { AuditQueue } from './audit-queue'
import type { AuditEvent, AuditQueueConfig } from './audit-queue'

// Re-export types
export type { AuditEvent, AuditQueueConfig }
export { AuditQueue }

// Singleton instance
let auditQueue: AuditQueue | null = null

/**
 * Get the global audit queue instance (singleton)
 *
 * The queue is automatically started on first access.
 * It will gracefully shutdown when the process exits.
 *
 * @param supabase - Supabase client for database access
 * @param config - Optional configuration for the queue
 * @returns The global audit queue instance
 */
export function getAuditQueue(
  supabase: SupabaseClient,
  config?: AuditQueueConfig
): AuditQueue {
  if (!auditQueue) {
    auditQueue = new AuditQueue(supabase, config)
    auditQueue.start()
  }
  return auditQueue
}

/**
 * Reset the audit queue (useful for testing)
 *
 * This will stop the current queue and create a new one.
 */
export async function resetAuditQueue(): Promise<void> {
  if (auditQueue) {
    await auditQueue.stop()
    auditQueue = null
  }
}

/**
 * Manually flush the audit queue
 *
 * Forces an immediate write of all pending events to the database.
 * Useful before process shutdown or in testing.
 */
export async function flushAuditQueue(): Promise<void> {
  if (auditQueue) {
    await auditQueue.flush()
  }
}

/**
 * Get audit queue statistics
 *
 * Returns metrics about queue performance and health.
 */
export function getAuditQueueStats() {
  return auditQueue ? auditQueue.getStats() : null
}
