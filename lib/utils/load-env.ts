/**
 * Shared Environment Variable Loader
 * 
 * Loads environment variables from .env.local (local dev) or uses process.env (Railway/production)
 * 
 * Usage:
 *   import { loadEnv } from '@/lib/utils/load-env'
 *   loadEnv()
 *   
 *   // Now process.env has all variables
 *   const url = process.env.NEXT_PUBLIC_SUPABASE_URL
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

/**
 * Load environment variables with proper priority:
 * 1. process.env (Railway/production - already set)
 * 2. .env.local (local development)
 * 3. .env (fallback)
 * 
 * This ensures scripts work both locally AND on Railway
 */
export function loadEnv(): void {
  // Only load from file if variables aren't already set (Railway case)
  // This prevents overriding Railway env vars with local .env files
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  // If running on Railway/production, env vars are already in process.env
  if (hasSupabaseUrl && hasServiceKey) {
    // Railway/production - env vars already loaded
    return
  }

  // Local development - load from .env files
  const envLocalPath = resolve(process.cwd(), '.env.local')
  const envPath = resolve(process.cwd(), '.env')

  if (existsSync(envLocalPath)) {
    config({ path: envLocalPath })
  } else if (existsSync(envPath)) {
    config({ path: envPath })
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  loadEnv()
  const value = process.env[key]
  if (!value && !fallback) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || fallback || ''
}

/**
 * Validate that required environment variables are set
 */
export function validateRequiredEnv(keys: string[]): void {
  loadEnv()
  const missing: string[] = []
  
  for (const key of keys) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

