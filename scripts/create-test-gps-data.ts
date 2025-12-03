/**
 * Create Test GPS Data for Dispatch Map
 *
 * Generates GPS logs for existing tech users around Indianapolis
 * to test the dispatch map dashboard
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Indianapolis center point
const BASE_LAT = 39.768403
const BASE_LNG = -86.158068

// Generate random location within ~10 mile radius
function randomNearby(baseLat: number, baseLng: number) {
  // ~0.01 degrees = ~1 mile
  const radiusInDegrees = 0.15 // ~15 miles radius
  const randomLat = baseLat + (Math.random() - 0.5) * radiusInDegrees
  const randomLng = baseLng + (Math.random() - 0.5) * radiusInDegrees

  return {
    latitude: parseFloat(randomLat.toFixed(6)),
    longitude: parseFloat(randomLng.toFixed(6))
  }
}

async function createTestData() {
  console.log('🔍 Finding tech users...')

  // Get all tech and sales users
  const { data: techs, error: techsError } = await supabase
    .from('users')
    .select('id, full_name, role, account_id')
    .in('role', ['tech', 'sales'])
    .limit(10)

  if (techsError) {
    console.error('❌ Error fetching techs:', techsError)
    return
  }

  if (!techs || techs.length === 0) {
    console.log('⚠️  No tech or sales users found. Create some users first.')
    return
  }

  console.log(`✅ Found ${techs.length} tech/sales users`)

  // Create GPS logs for each tech
  for (const tech of techs) {
    const location = randomNearby(BASE_LAT, BASE_LNG)

    const { error: gpsError } = await supabase
      .from('gps_logs')
      .insert({
        account_id: tech.account_id,
        user_id: tech.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: Math.random() * 20 + 5, // 5-25 meters
        event_type: 'auto',
        metadata: {
          source: 'test_script',
          created_for_demo: true
        }
      })

    if (gpsError) {
      console.error(`❌ Error creating GPS log for ${tech.full_name}:`, gpsError)
    } else {
      console.log(`📍 Created GPS log for ${tech.full_name} (${tech.role}) at ${location.latitude}, ${location.longitude}`)
    }
  }

  console.log('\n✅ Test GPS data created successfully!')
  console.log('🗺️  Open http://localhost:3002/dispatch/map to see the markers')
}

// Run the script
createTestData()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
