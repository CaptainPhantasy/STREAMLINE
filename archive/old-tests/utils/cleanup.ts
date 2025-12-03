/**
 * Cleanup Utilities for Playwright Tests
 * 
 * Functions to clean up test data after tests run
 * 
 * Usage:
 *   import { cleanupTestData, cleanupJob, cleanupContact } from './utils/cleanup'
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Get Supabase admin client for cleanup operations
 */
function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Clean up a job and all related data
 */
export async function cleanupJob(jobId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Delete job photos first (foreign key constraint)
  await supabase.from('job_photos').delete().eq('job_id', jobId)

  // Delete job materials if table exists
  try {
    await supabase.from('job_materials').delete().eq('job_id', jobId)
  } catch (error) {
    // Table might not exist, ignore
  }

  // Delete job
  await supabase.from('jobs').delete().eq('id', jobId)
}

/**
 * Clean up a contact and all related data
 */
export async function cleanupContact(contactId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Delete conversations (which will cascade to messages)
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('contact_id', contactId)

  if (conversations) {
    for (const conv of conversations) {
      await cleanupConversation(conv.id)
    }
  }

  // Delete jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('contact_id', contactId)

  if (jobs) {
    for (const job of jobs) {
      await cleanupJob(job.id)
    }
  }

  // Delete contact
  await supabase.from('contacts').delete().eq('id', contactId)
}

/**
 * Clean up a conversation and all messages
 */
export async function cleanupConversation(conversationId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Delete messages
  await supabase.from('messages').delete().eq('conversation_id', conversationId)

  // Delete conversation
  await supabase.from('conversations').delete().eq('id', conversationId)
}

/**
 * Clean up multiple test items by their IDs
 */
export async function cleanupTestData(testIds: {
  jobs?: string[]
  contacts?: string[]
  conversations?: string[]
  photos?: string[]
  users?: string[]
}): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Clean up photos
  if (testIds.photos && testIds.photos.length > 0) {
    await supabase.from('job_photos').delete().in('id', testIds.photos)
  }

  // Clean up jobs (this will also clean up related photos)
  if (testIds.jobs && testIds.jobs.length > 0) {
    for (const jobId of testIds.jobs) {
      await cleanupJob(jobId)
    }
  }

  // Clean up conversations
  if (testIds.conversations && testIds.conversations.length > 0) {
    for (const convId of testIds.conversations) {
      await cleanupConversation(convId)
    }
  }

  // Clean up contacts (this will also clean up related jobs and conversations)
  if (testIds.contacts && testIds.contacts.length > 0) {
    for (const contactId of testIds.contacts) {
      await cleanupContact(contactId)
    }
  }

  // Note: We don't delete users as they might be shared across tests
  // Users should be cleaned up manually if needed
}

/**
 * Verify cleanup was successful (no test data remaining)
 */
export async function verifyCleanup(testIds: {
  jobs?: string[]
  contacts?: string[]
  conversations?: string[]
  photos?: string[]
}): Promise<{ success: boolean; remaining: string[] }> {
  const supabase = getSupabaseAdmin()
  const remaining: string[] = []

  // Check photos
  if (testIds.photos && testIds.photos.length > 0) {
    const { data } = await supabase
      .from('job_photos')
      .select('id')
      .in('id', testIds.photos)
    if (data && data.length > 0) {
      remaining.push(...data.map(p => `photo:${p.id}`))
    }
  }

  // Check jobs
  if (testIds.jobs && testIds.jobs.length > 0) {
    const { data } = await supabase
      .from('jobs')
      .select('id')
      .in('id', testIds.jobs)
    if (data && data.length > 0) {
      remaining.push(...data.map(j => `job:${j.id}`))
    }
  }

  // Check contacts
  if (testIds.contacts && testIds.contacts.length > 0) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .in('id', testIds.contacts)
    if (data && data.length > 0) {
      remaining.push(...data.map(c => `contact:${c.id}`))
    }
  }

  // Check conversations
  if (testIds.conversations && testIds.conversations.length > 0) {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .in('id', testIds.conversations)
    if (data && data.length > 0) {
      remaining.push(...data.map(c => `conversation:${c.id}`))
    }
  }

  return {
    success: remaining.length === 0,
    remaining,
  }
}

