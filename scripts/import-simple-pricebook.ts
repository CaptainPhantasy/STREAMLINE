#!/usr/bin/env ts-node

/**
 * Import Pricebook for 317plumber into existing parts table
 * This is a simplified version that uses the existing parts table structure
 *
 * Usage: npx ts-node scripts/import-simple-pricebook.ts
 */

import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'
import * as fs from 'fs'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Configuration
const EXCEL_FILE_PATH = '/Users/douglastalley/Downloads/Pricebook_2025-11-28T20_06_38.xlsx'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// 317plumber Account ID
const ACCOUNT_ID = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Map Excel categories to our PartCategory type
 */
function mapCategory(category: string): string {
  if (!category) return 'other'

  const categoryLower = category.toLowerCase()

  if (categoryLower.includes('pump') || categoryLower.includes('glentronic') || categoryLower.includes('zoeller')) {
    return 'plumbing'
  } else if (categoryLower.includes('pvc') || categoryLower.includes('cpvc') || categoryLower.includes('copper')) {
    return 'plumbing'
  } else if (categoryLower.includes('fitting') || categoryLower.includes('valve')) {
    return 'plumbing'
  } else if (categoryLower.includes('water heater') || categoryLower.includes('tank')) {
    return 'plumbing'
  } else if (categoryLower.includes('tool') || categoryLower.includes('equipment')) {
    return 'tools'
  } else if (categoryLower.includes('electrical')) {
    return 'electrical'
  } else {
    return 'materials'
  }
}

/**
 * Map Excel units to our PartUnit type
 */
function mapUnit(unit: string): string {
  if (!unit) return 'each'

  const unitMap: Record<string, string> = {
    'EA': 'each',
    'EACH': 'each',
    'FT': 'ft',
    'METER': 'meter',
    'LB': 'lb',
    'KG': 'kg',
    'GALLON': 'gallon',
    'LITER': 'liter',
    'L': 'liter',
    'PAIR': 'pair',
    'BOX': 'box',
    'CASE': 'case',
    'HR': 'hour',
    'HOUR': 'hour'
  }

  return unitMap[unit?.toUpperCase()] || 'each'
}

/**
 * Convert price to number (in cents)
 */
function parsePriceToCents(priceValue: any): number {
  if (!priceValue && priceValue !== 0) return 0

  const price = parseFloat(priceValue.toString())
  if (isNaN(price)) return 0

  // Return price in cents
  return Math.round(price * 100)
}

/**
 * Import materials from Materials sheet
 */
async function importMaterials() {
  console.log('\n🔩 Importing materials...')

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const materialsSheet = workbook.Sheets['Materials']

  if (!materialsSheet) {
    console.log('⚠️  No Materials sheet found')
    return
  }

  const materialsData = XLSX.utils.sheet_to_json(materialsSheet)
  console.log(`📊 Found ${materialsData.length} materials in Excel`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const row of materialsData as any[]) {
    // Skip rows without required fields
    if (!row['Name'] && !row['Code']) {
      skippedCount++
      continue
    }

    // Skip inactive items
    if (row['Active'] === 0 || row['Active'] === '0') {
      skippedCount++
      continue
    }

    // Skip items with zero price
    const price = parsePriceToCents(row['Price'] || row['Cost'])
    if (price <= 0) {
      skippedCount++
      continue
    }

    const partData = {
      account_id: ACCOUNT_ID,
      sku: row['Code'] || '',
      name: row['Name'] || '',
      description: row['Description'] || '',
      category: mapCategory(row['Category.Name'] || ''),
      unit: mapUnit(row['UnitOfMeasure'] || ''),
      unit_price: price,
      quantity_in_stock: 0, // Not provided
      reorder_threshold: 5,
      supplier_name: 'Ferguson Plumbing Supply',
      supplier_sku: row['Ferguson Plumbing Supply[Vendor] Part #'] || '',
      supplier_contact: '',
      notes: `Category: ${row['Category.Name'] || 'N/A'} | External ID: ${row['Id'] || 'N/A'} | Source: Pricebook Import`
    }

    // Check if part with same SKU already exists
    const { data: existingPart } = await supabase
      .from('parts')
      .select('id')
      .eq('account_id', ACCOUNT_ID)
      .eq('sku', partData.sku)
      .single()

    let error
    if (existingPart) {
      // Update existing part
      const result = await supabase
        .from('parts')
        .update(partData)
        .eq('id', existingPart.id)
      error = result.error
      if (!error) successCount++
    } else {
      // Insert new part
      const result = await supabase
        .from('parts')
        .insert(partData)
      error = result.error
      if (!error) successCount++
    }

    if (error) {
      console.error(`   ❌ Error with "${partData.name}": ${error.message}`)
      errorCount++
    }
  }

  console.log(`\n   📊 Import Summary:`)
  console.log(`   ✅ Successfully imported: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
}

/**
 * Import services from Services sheet
 */
async function importServices() {
  console.log('\n🛠️  Importing services...')

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const servicesSheet = workbook.Sheets['Services']

  if (!servicesSheet) {
    console.log('⚠️  No Services sheet found')
    return
  }

  const servicesData = XLSX.utils.sheet_to_json(servicesSheet)
  console.log(`📊 Found ${servicesData.length} services in Excel`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const row of servicesData as any[]) {
    // Skip rows without required fields
    if (!row['Name'] && !row['Code']) {
      skippedCount++
      continue
    }

    // Skip inactive items
    if (row['Active'] === 0 || row['Active'] === '0') {
      skippedCount++
      continue
    }

    // Skip items with zero price
    const price = parsePriceToCents(row['Price'] || row['Cost'])
    if (price <= 0) {
      skippedCount++
      continue
    }

    const serviceData = {
      account_id: ACCOUNT_ID,
      sku: row['Code'] || '',
      name: row['Name'] || '',
      description: row['Description'] || '',
      category: 'service', // All services get this category
      unit: mapUnit(row['UnitOfMeasure'] || 'hr'), // Services usually by hour
      unit_price: price,
      quantity_in_stock: 9999, // Services don't run out
      reorder_threshold: 0,
      supplier_name: '317plumber',
      supplier_sku: '',
      supplier_contact: '',
      notes: `SERVICE | Category: ${row['Category.Name'] || 'N/A'} | Hours: ${row['Hours'] || 0} | External ID: ${row['Id'] || 'N/A'}`
    }

    // Check if service with same SKU already exists
    const { data: existingService } = await supabase
      .from('parts')
      .select('id')
      .eq('account_id', ACCOUNT_ID)
      .eq('sku', serviceData.sku)
      .single()

    let error
    if (existingService) {
      // Update existing service
      const result = await supabase
        .from('parts')
        .update(serviceData)
        .eq('id', existingService.id)
      error = result.error
      if (!error) successCount++
    } else {
      // Insert new service
      const result = await supabase
        .from('parts')
        .insert(serviceData)
      error = result.error
      if (!error) successCount++
    }

    if (error) {
      console.error(`   ❌ Error with "${serviceData.name}": ${error.message}`)
      errorCount++
    }
  }

  console.log(`\n   📊 Import Summary:`)
  console.log(`   ✅ Successfully imported: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
}

/**
 * Main import function
 */
async function importPricebook() {
  console.log('📋 Starting pricebook import for 317plumber...')
  console.log('   Using service role key (bypasses RLS)')

  try {
    // Check if Excel file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      console.error(`❌ Error: Excel file not found at ${EXCEL_FILE_PATH}`)
      process.exit(1)
    }

    // Import materials and services
    await importMaterials()
    await importServices()

    // Get final statistics
    const { count: totalItems } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', ACCOUNT_ID)

    // Count by category
    const { data: categories } = await supabase
      .from('parts')
      .select('category')
      .eq('account_id', ACCOUNT_ID)

    const categoryCounts = categories?.reduce((acc: any, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    console.log('\n🎉 Pricebook Import Complete!')
    console.log(`   Total items in pricebook: ${totalItems || 0}`)

    if (categoryCounts) {
      console.log('\n   By category:')
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count}`)
      })
    }

    // Calculate total pricebook value
    const { data: items } = await supabase
      .from('parts')
      .select('unit_price, quantity_in_stock')
      .eq('account_id', ACCOUNT_ID)

    const totalValue = items?.reduce((sum, item) => {
      return sum + (item.unit_price * (item.quantity_in_stock || 0))
    }, 0) || 0

    console.log(`\n   Total inventory value: $${(totalValue / 100).toFixed(2)}`)

  } catch (error: any) {
    console.error('\n❌ Fatal error during import:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the import
importPricebook()
  .then(() => {
    console.log('\n✨ Import process completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error)
    process.exit(1)
  })