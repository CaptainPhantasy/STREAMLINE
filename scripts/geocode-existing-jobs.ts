#!/usr/bin/env tsx

/**
 * Batch Geocoding Script for Existing Jobs
 *
 * This script geocodes all jobs in the database that don't have
 * lat/lng coordinates yet. It's designed to be run once during
 * initial setup or periodically to catch any missed jobs.
 *
 * Features:
 * - Automatic detection of jobs needing geocoding
 * - Batch processing with progress reporting
 * - Rate limiting to respect Google API limits
 * - Detailed error reporting
 * - Resume capability (skips already geocoded jobs)
 * - Dry-run mode for testing
 *
 * Usage:
 *   npm run geocode-jobs              # Geocode all jobs needing it
 *   npm run geocode-jobs --limit 50   # Geocode first 50 jobs
 *   npm run geocode-jobs --dry-run    # Test without updating database
 *   npm run geocode-jobs --account abc123  # Geocode jobs for specific account
 *
 * @author Agent 11: Geocoding Integration Specialist
 * @date 2025-11-27
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const RATE_LIMIT_DELAY_MS = 200 // 5 requests per second
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// ============================================================
// Types
// ============================================================

interface Job {
  id: string
  account_id: string
  contact: {
    address: string
  } | null
  latitude: number | null
  longitude: number | null
  status: string
}

interface GeocodeResult {
  lat: number
  lng: number
  accuracy: string
  formattedAddress?: string
}

interface ScriptOptions {
  limit?: number
  dryRun: boolean
  accountId?: string
  verbose: boolean
}

// ============================================================
// Command Line Arguments
// ============================================================

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)
  const options: ScriptOptions = {
    dryRun: false,
    verbose: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10)
      i++
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--account' && args[i + 1]) {
      options.accountId = args[i + 1]
      i++
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return options
}

function printHelp() {
  console.log(`
Batch Geocoding Script for Existing Jobs

Usage:
  npm run geocode-jobs [options]

Options:
  --limit <n>        Process only first N jobs (default: all)
  --dry-run          Test without updating database
  --account <id>     Process jobs for specific account only
  --verbose, -v      Show detailed logging
  --help, -h         Show this help message

Examples:
  npm run geocode-jobs
  npm run geocode-jobs --limit 50
  npm run geocode-jobs --dry-run
  npm run geocode-jobs --account abc123 --verbose
  `)
}

// ============================================================
// Helper Functions
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_MS * Math.pow(2, attempt)
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

// ============================================================
// Geocoding Functions
// ============================================================

async function getCachedGeocode(
  supabase: ReturnType<typeof createClient>,
  address: string
): Promise<GeocodeResult | null> {
  const normalizedAddress = normalizeAddress(address)

  const { data, error } = await supabase
    .from('geocode_cache')
    .select('latitude, longitude, accuracy, formatted_address')
    .eq('address', normalizedAddress)
    .single()

  if (error || !data) {
    return null
  }

  return {
    lat: parseFloat(data.latitude),
    lng: parseFloat(data.longitude),
    accuracy: data.accuracy || 'unknown',
    formattedAddress: data.formatted_address || undefined
  }
}

async function saveToCache(
  supabase: ReturnType<typeof createClient>,
  address: string,
  result: GeocodeResult
): Promise<void> {
  const normalizedAddress = normalizeAddress(address)

  await supabase.from('geocode_cache').upsert(
    {
      address: normalizedAddress,
      latitude: result.lat,
      longitude: result.lng,
      accuracy: result.accuracy,
      formatted_address: result.formattedAddress || null,
      provider: 'google_maps',
      geocoded_at: new Date().toISOString()
    },
    { onConflict: 'address' }
  )
}

async function callGoogleGeocodeAPI(
  address: string,
  attempt: number = 0
): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured')
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', address)
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OVER_QUERY_LIMIT') {
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt)
        console.warn(`⚠️  Rate limited. Retrying in ${delay}ms...`)
        await sleep(delay)
        return callGoogleGeocodeAPI(address, attempt + 1)
      }
      throw new Error('Rate limit exceeded')
    }

    if (data.status === 'ZERO_RESULTS') {
      return null
    }

    if (data.status !== 'OK') {
      throw new Error(`API error: ${data.status}`)
    }

    const result = data.results[0]
    if (!result) return null

    const { lat, lng } = result.geometry.location
    const locationType = result.geometry.location_type

    const accuracyMap: Record<string, string> = {
      ROOFTOP: 'exact',
      RANGE_INTERPOLATED: 'interpolated',
      GEOMETRIC_CENTER: 'approximate',
      APPROXIMATE: 'approximate'
    }

    return {
      lat,
      lng,
      accuracy: accuracyMap[locationType] || 'unknown',
      formattedAddress: result.formatted_address
    }
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = getRetryDelay(attempt)
      await sleep(delay)
      return callGoogleGeocodeAPI(address, attempt + 1)
    }
    throw err
  }
}

async function geocodeAddress(
  supabase: ReturnType<typeof createClient>,
  address: string
): Promise<GeocodeResult | null> {
  // Check cache first
  const cached = await getCachedGeocode(supabase, address)
  if (cached) {
    return cached
  }

  // Call Google API
  const result = await callGoogleGeocodeAPI(address)
  if (!result) {
    return null
  }

  // Save to cache
  await saveToCache(supabase, address, result)

  return result
}

// ============================================================
// Main Script Logic
// ============================================================

async function main() {
  console.log('🗺️  Batch Geocoding Script for Existing Jobs')
  console.log('=' .repeat(60))

  // Parse command line arguments
  const options = parseArgs()

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local')
    process.exit(1)
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  console.log(`\n📋 Configuration:`)
  console.log(`   Limit: ${options.limit || 'none'}`)
  console.log(`   Dry Run: ${options.dryRun ? 'YES' : 'NO'}`)
  console.log(`   Account Filter: ${options.accountId || 'none'}`)
  console.log(`   Verbose: ${options.verbose ? 'YES' : 'NO'}`)

  // Fetch jobs needing geocoding
  console.log(`\n📍 Fetching jobs needing geocoding...`)

  let query = supabase
    .from('jobs')
    .select('id, account_id, status, latitude, longitude, contact:contacts(address)')
    .is('latitude', null)
    .in('status', ['lead', 'scheduled', 'en_route', 'in_progress'])
    .order('created_at', { ascending: false })

  if (options.accountId) {
    query = query.eq('account_id', options.accountId)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data: jobs, error: fetchError } = await query

  if (fetchError) {
    console.error('❌ Error fetching jobs:', fetchError)
    process.exit(1)
  }

  if (!jobs || jobs.length === 0) {
    console.log('✅ No jobs need geocoding. All done!')
    process.exit(0)
  }

  console.log(`✅ Found ${jobs.length} job(s) to process\n`)

  // Statistics
  let processed = 0
  let success = 0
  let failed = 0
  let skipped = 0

  // Process each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i] as Job
    processed++

    const address = job.contact?.address
    const progress = `[${processed}/${jobs.length}]`

    if (!address || address.trim() === '') {
      console.log(`${progress} ⏭️  Skipping job ${job.id.slice(0, 8)} (no address)`)
      skipped++
      continue
    }

    if (options.verbose) {
      console.log(`${progress} 🗺️  Processing: ${address}`)
    } else {
      console.log(`${progress} 🗺️  Geocoding job ${job.id.slice(0, 8)}...`)
    }

    try {
      // Geocode address
      const result = await geocodeAddress(supabase, address)

      if (!result) {
        console.log(`${progress} ❌ No results for: ${address}`)
        failed++
        continue
      }

      if (options.verbose) {
        console.log(`${progress} ✅ Found: (${result.lat}, ${result.lng}) [${result.accuracy}]`)
      }

      // Update job (unless dry run)
      if (!options.dryRun) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            latitude: result.lat,
            longitude: result.lng,
            geocoded_at: new Date().toISOString()
          })
          .eq('id', job.id)

        if (updateError) {
          console.log(`${progress} ❌ Failed to update job: ${updateError.message}`)
          failed++
          continue
        }
      }

      console.log(`${progress} ✅ Success${options.dryRun ? ' (dry run)' : ''}`)
      success++

      // Rate limiting
      if (i < jobs.length - 1) {
        await sleep(RATE_LIMIT_DELAY_MS)
      }
    } catch (err) {
      console.log(`${progress} ❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      failed++
    }
  }

  // Final report
  console.log('\n' + '='.repeat(60))
  console.log('📊 Batch Geocoding Complete')
  console.log('='.repeat(60))
  console.log(`Total Processed: ${processed}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)

  if (options.dryRun) {
    console.log(`\n⚠️  DRY RUN MODE - No database changes were made`)
  }

  console.log('\n✅ Script complete!')
}

// ============================================================
// Entry Point
// ============================================================

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
