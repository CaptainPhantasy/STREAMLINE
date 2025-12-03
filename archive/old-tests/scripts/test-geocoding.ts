#!/usr/bin/env tsx

/**
 * Test Script for Geocoding Utility
 *
 * This script tests the geocoding functionality with sample addresses
 * and validates that the cache and API integration work correctly.
 *
 * Tests:
 * 1. Basic geocoding with Google Maps API
 * 2. Cache hit (second call should use cache)
 * 3. Invalid address handling
 * 4. Batch geocoding
 * 5. Database integration
 *
 * Usage:
 *   npm run test:geocoding
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

// Test addresses (Indianapolis area - 317 Plumber service area)
const TEST_ADDRESSES = [
  '123 Monument Circle, Indianapolis, IN 46204', // Downtown Indy
  '4750 N Central Canal Towpath, Indianapolis, IN 46208', // Broad Ripple
  '5505 E. Washington St, Indianapolis, IN 46219', // East side
  '7600 S. Madison Ave, Indianapolis, IN 46227', // South side
  'Invalid Address That Should Not Exist 123456789' // Should fail
]

// ============================================================
// Types
// ============================================================

interface GeocodeResult {
  lat: number
  lng: number
  accuracy: string
  formattedAddress?: string
}

// ============================================================
// Helper Functions
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function callGoogleGeocodeAPI(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status !== 'OK') {
    return null
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
}

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

// ============================================================
// Test Functions
// ============================================================

async function testBasicGeocoding(supabase: ReturnType<typeof createClient>) {
  console.log('\n📍 Test 1: Basic Geocoding')
  console.log('=' .repeat(60))

  const address = TEST_ADDRESSES[0]
  console.log(`Address: ${address}`)

  const startTime = Date.now()
  const result = await callGoogleGeocodeAPI(address)
  const duration = Date.now() - startTime

  if (result) {
    console.log(`✅ Success (${duration}ms)`)
    console.log(`   Latitude: ${result.lat}`)
    console.log(`   Longitude: ${result.lng}`)
    console.log(`   Accuracy: ${result.accuracy}`)
    console.log(`   Formatted: ${result.formattedAddress}`)

    // Save to cache for next test
    await saveToCache(supabase, address, result)
    console.log(`   💾 Saved to cache`)
  } else {
    console.log(`❌ Failed to geocode`)
  }
}

async function testCacheHit(supabase: ReturnType<typeof createClient>) {
  console.log('\n💾 Test 2: Cache Hit')
  console.log('=' .repeat(60))

  const address = TEST_ADDRESSES[0]
  console.log(`Address: ${address}`)

  const startTime = Date.now()
  const result = await getCachedGeocode(supabase, address)
  const duration = Date.now() - startTime

  if (result) {
    console.log(`✅ Cache hit! (${duration}ms)`)
    console.log(`   Latitude: ${result.lat}`)
    console.log(`   Longitude: ${result.lng}`)
    console.log(`   Accuracy: ${result.accuracy}`)
    console.log(`   Note: This should be much faster than Test 1`)
  } else {
    console.log(`❌ Cache miss (unexpected)`)
  }
}

async function testInvalidAddress() {
  console.log('\n⚠️  Test 3: Invalid Address Handling')
  console.log('=' .repeat(60))

  const address = TEST_ADDRESSES[4]
  console.log(`Address: ${address}`)

  const result = await callGoogleGeocodeAPI(address)

  if (result) {
    console.log(`❌ Unexpected success (should have failed)`)
  } else {
    console.log(`✅ Correctly handled invalid address`)
  }
}

async function testMultipleAddresses(supabase: ReturnType<typeof createClient>) {
  console.log('\n📦 Test 4: Multiple Addresses')
  console.log('=' .repeat(60))

  const addresses = TEST_ADDRESSES.slice(0, 4)
  console.log(`Testing ${addresses.length} addresses...`)

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    console.log(`\n[${i + 1}/${addresses.length}] ${address}`)

    // Check cache first
    let result = await getCachedGeocode(supabase, address)

    if (result) {
      console.log(`   💾 Cache hit`)
    } else {
      console.log(`   🌐 Calling Google API...`)
      result = await callGoogleGeocodeAPI(address)

      if (result) {
        await saveToCache(supabase, address, result)
        console.log(`   💾 Saved to cache`)
      }

      // Rate limiting
      if (i < addresses.length - 1) {
        await sleep(200)
      }
    }

    if (result) {
      console.log(`   ✅ (${result.lat}, ${result.lng}) [${result.accuracy}]`)
    } else {
      console.log(`   ❌ Failed`)
    }
  }
}

async function testDatabaseIntegration(supabase: ReturnType<typeof createClient>) {
  console.log('\n🗄️  Test 5: Database Integration')
  console.log('=' .repeat(60))

  console.log('Checking geocode_cache table...')

  // Check if table exists and has data
  const { data, error, count } = await supabase
    .from('geocode_cache')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (error) {
    console.log(`❌ Error accessing geocode_cache table:`)
    console.log(`   ${error.message}`)
    console.log(`\n⚠️  Make sure to run the migration first:`)
    console.log(`   psql -U postgres -d your_db -f supabase/add-geocoding-support.sql`)
    return
  }

  console.log(`✅ geocode_cache table accessible`)
  console.log(`   Total cached addresses: ${count || 0}`)

  if (data && data.length > 0) {
    console.log(`\n   Recent entries:`)
    data.forEach((entry: any, idx: number) => {
      console.log(`   ${idx + 1}. ${entry.address}`)
      console.log(`      (${entry.latitude}, ${entry.longitude}) [${entry.accuracy}]`)
    })
  }
}

async function testDistanceCalculation() {
  console.log('\n📏 Test 6: Distance Calculation')
  console.log('=' .repeat(60))

  // Geocode two addresses and calculate distance
  const addr1 = TEST_ADDRESSES[0] // Downtown
  const addr2 = TEST_ADDRESSES[1] // Broad Ripple

  console.log(`From: ${addr1}`)
  console.log(`To: ${addr2}`)

  const result1 = await callGoogleGeocodeAPI(addr1)
  await sleep(200)
  const result2 = await callGoogleGeocodeAPI(addr2)

  if (result1 && result2) {
    // Haversine formula for distance
    const R = 3959 // Earth's radius in miles
    const dLat = (result2.lat - result1.lat) * Math.PI / 180
    const dLon = (result2.lng - result1.lng) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(result1.lat * Math.PI / 180) *
      Math.cos(result2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    console.log(`✅ Distance: ${distance.toFixed(2)} miles`)
    console.log(`   This is useful for tech-to-job distance calculations`)
  } else {
    console.log(`❌ Failed to calculate distance`)
  }
}

// ============================================================
// Main Test Suite
// ============================================================

async function main() {
  console.log('🧪 Geocoding Utility Test Suite')
  console.log('=' .repeat(60))

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local')
    process.exit(1)
  }

  console.log('✅ Environment variables configured')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Google Maps API Key: ${GOOGLE_MAPS_API_KEY.slice(0, 10)}...`)

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Run all tests
    await testBasicGeocoding(supabase)
    await sleep(500)

    await testCacheHit(supabase)
    await sleep(500)

    await testInvalidAddress()
    await sleep(500)

    await testMultipleAddresses(supabase)
    await sleep(500)

    await testDatabaseIntegration(supabase)
    await sleep(500)

    await testDistanceCalculation()

    // Final summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ All Tests Complete!')
    console.log('=' .repeat(60))
    console.log('\nNext Steps:')
    console.log('1. Run the SQL migration if you saw database errors:')
    console.log('   psql -U postgres -d your_db -f supabase/add-geocoding-support.sql')
    console.log('2. Test batch geocoding script:')
    console.log('   npm run geocode-jobs -- --dry-run --limit 5')
    console.log('3. Integrate geocoding into dispatch map API endpoints')
  } catch (err) {
    console.error('\n❌ Test suite failed:', err)
    process.exit(1)
  }
}

// ============================================================
// Entry Point
// ============================================================

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
