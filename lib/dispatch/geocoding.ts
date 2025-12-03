/**
 * Geocoding Utility for Dispatch Map Dashboard
 *
 * This utility converts job addresses to lat/lng coordinates using:
 * 1. Cache-first strategy (check geocode_cache table)
 * 2. Google Maps Geocoding API as fallback
 * 3. Automatic caching of results
 * 4. Error handling and retry logic
 * 5. Rate limiting to respect API limits
 *
 * @module lib/dispatch/geocoding
 * @author Agent 11: Geocoding Integration Specialist
 * @date 2025-11-27
 */

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ============================================================
// Types
// ============================================================

export interface GeocodeResult {
  lat: number
  lng: number
  accuracy: string
  formattedAddress?: string
}

export interface GeocodeError {
  error: string
  address: string
  retryable: boolean
}

export interface BatchGeocodeResult {
  success: string[]
  failed: string[]
  skipped: string[]
  results: Map<string, GeocodeResult>
  errors: Map<string, GeocodeError>
}

interface GoogleGeocodeResponse {
  results: Array<{
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
      location_type: string
    }
  }>
  status: string
  error_message?: string
}

// ============================================================
// Configuration
// ============================================================

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const RATE_LIMIT_DELAY_MS = 200 // 5 requests per second max

// Accuracy mapping from Google's location_type
const ACCURACY_MAP: Record<string, string> = {
  ROOFTOP: 'exact',
  RANGE_INTERPOLATED: 'interpolated',
  GEOMETRIC_CENTER: 'approximate',
  APPROXIMATE: 'approximate'
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Normalize address for consistent cache lookups
 */
function normalizeAddress(address: string): string {
  return address
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_MS * Math.pow(2, attempt)
}

// ============================================================
// Cache Operations
// ============================================================

/**
 * Check if address is in geocode cache
 */
async function getCachedGeocode(address: string): Promise<GeocodeResult | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

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
  } catch (err) {
    console.error('Error reading from geocode cache:', err)
    return null
  }
}

/**
 * Save geocode result to cache
 */
async function saveToCa(address: string, result: GeocodeResult): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const normalizedAddress = normalizeAddress(address)

    const { error } = await supabase
      .from('geocode_cache')
      .upsert({
        address: normalizedAddress,
        latitude: result.lat,
        longitude: result.lng,
        accuracy: result.accuracy,
        formatted_address: result.formattedAddress || null,
        provider: 'google_maps',
        geocoded_at: new Date().toISOString()
      }, {
        onConflict: 'address'
      })

    if (error) {
      console.error('Error saving to geocode cache:', error)
    }
  } catch (err) {
    console.error('Error saving to geocode cache:', err)
  }
}

// ============================================================
// Google Maps Geocoding API
// ============================================================

/**
 * Call Google Maps Geocoding API with retry logic
 */
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
    const data: GoogleGeocodeResponse = await response.json()

    // Handle rate limiting
    if (data.status === 'OVER_QUERY_LIMIT') {
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt)
        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        return callGoogleGeocodeAPI(address, attempt + 1)
      }
      throw new Error('Rate limit exceeded after retries')
    }

    // Handle no results
    if (data.status === 'ZERO_RESULTS') {
      console.warn(`No geocoding results found for address: ${address}`)
      return null
    }

    // Handle other errors
    if (data.status !== 'OK') {
      throw new Error(`Google Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
    }

    // Extract result
    const result = data.results[0]
    if (!result) {
      return null
    }

    const { lat, lng } = result.geometry.location
    const locationType = result.geometry.location_type
    const accuracy = ACCURACY_MAP[locationType] || 'unknown'

    return {
      lat,
      lng,
      accuracy,
      formattedAddress: result.formatted_address
    }
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = getRetryDelay(attempt)
      console.warn(`Geocoding error. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, err)
      await sleep(delay)
      return callGoogleGeocodeAPI(address, attempt + 1)
    }
    console.error(`Failed to geocode address after ${MAX_RETRIES} attempts:`, err)
    return null
  }
}

// ============================================================
// Main Geocoding Function
// ============================================================

/**
 * Geocode an address to lat/lng coordinates
 *
 * Strategy:
 * 1. Check cache first
 * 2. If not cached, call Google Maps API
 * 3. Save result to cache
 * 4. Return coordinates or null
 *
 * @param address - The address to geocode
 * @returns GeocodeResult or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim() === '') {
    console.warn('Empty address provided to geocodeAddress')
    return null
  }

  console.log(`🗺️  Geocoding address: ${address}`)

  // Step 1: Check cache
  const cached = await getCachedGeocode(address)
  if (cached) {
    console.log(`✅ Cache hit for address: ${address}`)
    return cached
  }

  console.log(`❌ Cache miss. Calling Google Maps API...`)

  // Step 2: Call Google Maps API
  const result = await callGoogleGeocodeAPI(address)

  if (!result) {
    console.error(`Failed to geocode address: ${address}`)
    return null
  }

  console.log(`✅ Geocoded: ${address} -> (${result.lat}, ${result.lng})`)

  // Step 3: Save to cache
  await saveToCa(address, result)

  return result
}

// ============================================================
// Batch Geocoding
// ============================================================

/**
 * Geocode multiple job IDs in batch
 *
 * This function:
 * 1. Fetches job addresses from database
 * 2. Geocodes each address with rate limiting
 * 3. Updates jobs table with lat/lng
 * 4. Returns detailed results
 *
 * @param jobIds - Array of job IDs to geocode
 * @returns BatchGeocodeResult with success/failure details
 */
export async function batchGeocodeJobs(jobIds: string[]): Promise<BatchGeocodeResult> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const result: BatchGeocodeResult = {
    success: [],
    failed: [],
    skipped: [],
    results: new Map(),
    errors: new Map()
  }

  console.log(`📦 Starting batch geocoding for ${jobIds.length} jobs...`)

  // Fetch jobs with addresses
  const { data: jobs, error: fetchError } = await supabase
    .from('jobs')
    .select(`
      id,
      latitude,
      longitude,
      contact:contacts(address)
    `)
    .in('id', jobIds)

  if (fetchError || !jobs) {
    console.error('Error fetching jobs:', fetchError)
    throw new Error(`Failed to fetch jobs: ${fetchError?.message}`)
  }

  console.log(`📍 Found ${jobs.length} jobs to process`)

  // Process each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    const jobId = job.id
    const address = (job.contact as any)?.address

    // Skip if already geocoded
    if (job.latitude && job.longitude) {
      console.log(`⏭️  Skipping job ${jobId} (already geocoded)`)
      result.skipped.push(jobId)
      continue
    }

    // Skip if no address
    if (!address || address.trim() === '') {
      console.warn(`⚠️  Skipping job ${jobId} (no address)`)
      result.skipped.push(jobId)
      continue
    }

    // Rate limiting delay
    if (i > 0) {
      await sleep(RATE_LIMIT_DELAY_MS)
    }

    // Geocode address
    try {
      const geocodeResult = await geocodeAddress(address)

      if (!geocodeResult) {
        result.failed.push(jobId)
        result.errors.set(jobId, {
          error: 'Geocoding returned no results',
          address,
          retryable: true
        })
        continue
      }

      // Update job with coordinates
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          latitude: geocodeResult.lat,
          longitude: geocodeResult.lng,
          geocoded_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (updateError) {
        console.error(`Error updating job ${jobId}:`, updateError)
        result.failed.push(jobId)
        result.errors.set(jobId, {
          error: `Database update failed: ${updateError.message}`,
          address,
          retryable: false
        })
        continue
      }

      result.success.push(jobId)
      result.results.set(jobId, geocodeResult)
      console.log(`✅ Successfully geocoded job ${jobId}`)
    } catch (err) {
      console.error(`Error geocoding job ${jobId}:`, err)
      result.failed.push(jobId)
      result.errors.set(jobId, {
        error: err instanceof Error ? err.message : 'Unknown error',
        address,
        retryable: true
      })
    }
  }

  console.log(`\n📊 Batch geocoding complete:`)
  console.log(`   ✅ Success: ${result.success.length}`)
  console.log(`   ❌ Failed: ${result.failed.length}`)
  console.log(`   ⏭️  Skipped: ${result.skipped.length}`)

  return result
}

// ============================================================
// Update Single Job Location
// ============================================================

/**
 * Geocode and update a single job's location
 *
 * @param jobId - Job ID to update
 * @returns true if successful, false otherwise
 */
export async function updateJobLocation(jobId: string): Promise<boolean> {
  const result = await batchGeocodeJobs([jobId])
  return result.success.includes(jobId)
}

// ============================================================
// Utility: Get Jobs Needing Geocoding
// ============================================================

/**
 * Get list of job IDs that need geocoding
 *
 * @param limit - Maximum number of job IDs to return
 * @returns Array of job IDs
 */
export async function getJobsNeedingGeocode(limit: number = 100): Promise<string[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      latitude,
      contact:contacts(address)
    `)
    .is('latitude', null)
    .in('status', ['lead', 'scheduled', 'en_route', 'in_progress'])
    .limit(limit)

  if (error || !data) {
    console.error('Error fetching jobs needing geocoding:', error)
    return []
  }

  // Filter out jobs without addresses
  return data
    .filter(job => {
      const address = (job.contact as any)?.address
      return address && address.trim() !== ''
    })
    .map(job => job.id)
}
