#!/usr/bin/env ts-node

/**
 * Import Pricebook for 317plumber
 *
 * This script imports the pricebook from the Excel file and populates the parts table
 * with the pricing data for the 317plumber group.
 *
 * Usage: npx ts-node scripts/import-317plumber-pricebook.ts
 */

import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
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

// 317plumber Account ID - you'll need to get this from your database
const ACCOUNT_ID = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00' // Default account, update if needed

// Service account for operations
const SERVICE_ACCOUNT_EMAIL = 'ryan@317plumber.com'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Map Excel categories to our PartCategory type
 */
function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'PLUMBING': 'plumbing',
    'HVAC': 'hvac',
    'ELECTRICAL': 'electrical',
    'HARDWARE': 'hardware',
    'MATERIALS': 'materials',
    'TOOLS': 'tools',
    'CONSUMABLES': 'consumables',
    'OTHER': 'other'
  }

  return categoryMap[category?.toUpperCase()] || 'other'
}

/**
 * Map Excel units to our PartUnit type
 */
function mapUnit(unit: string): string {
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
    'CASE': 'case'
  }

  return unitMap[unit?.toUpperCase()] || 'each'
}

/**
 * Convert price string to number (in cents)
 */
function parsePrice(priceStr: any): number {
  if (!priceStr && priceStr !== 0) return 0

  // Convert to string if it's a number
  const priceString = priceStr.toString()

  // Remove currency symbols and convert to number
  const cleanPrice = priceString
    .replace(/[$,]/g, '')

  const price = parseFloat(cleanPrice)

  // Return price in cents (multiply by 100)
  return Math.round(price * 100)
}

/**
 * Import parts from Excel
 */
async function importPartsFromExcel() {
  console.log('📋 Starting pricebook import for 317plumber...')

  try {
    // Read Excel file
    console.log(`📖 Reading Excel file: ${EXCEL_FILE_PATH}`)
    const workbook = XLSX.readFile(EXCEL_FILE_PATH)

    // Find Materials sheet
    const sheetName = workbook.SheetNames.find(name => name === 'Materials')
    if (!sheetName) {
      throw new Error('Materials sheet not found in Excel file')
    }

    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`📊 Found ${data.length} items in pricebook`)

    // Process each row
    const importedParts = []
    const skippedItems = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any

      // Skip rows without required fields
      if (!row['Name'] && !row['Code']) {
        skippedItems.push({ row: i + 1, reason: 'Missing name or code' })
        continue
      }

      // Skip inactive items
      if (row['Active'] === 0 || row['Active'] === '0') {
        skippedItems.push({
          row: i + 1,
          reason: 'Inactive item',
          item: row['Name'] || row['Code']
        })
        continue
      }

      const part = {
        account_id: ACCOUNT_ID,
        sku: row['Code'] || '',
        name: row['Name'] || '',
        description: row['Description'] || '',
        category: mapCategory(row['Category.Name'] || ''),
        unit: mapUnit(row['UnitOfMeasure'] || ''),
        unit_price: parsePrice(row['Price'] || row['Cost'] || '0'),
        quantity_in_stock: 0, // Not provided in Excel
        reorder_threshold: 5, // Default reorder threshold
        supplier_name: 'Ferguson Plumbing Supply', // Primary vendor
        supplier_sku: row['Ferguson Plumbing Supply[Vendor] Part #'] || '',
        supplier_contact: '',
        notes: `External ID: ${row['ExternalId'] || ''} | Source: ${row['Source'] || ''}`,
        created_by: SERVICE_ACCOUNT_EMAIL
      }

      // Skip items with zero or negative price unless they're valid
      if (part.unit_price <= 0) {
        skippedItems.push({
          row: i + 1,
          reason: `Invalid price: ${part.unit_price}`,
          item: part.name
        })
        continue
      }

      importedParts.push(part)
    }

    console.log(`\n📦 Import Summary:`)
    console.log(`   Total rows in Excel: ${data.length}`)
    console.log(`   Valid items to import: ${importedParts.length}`)
    console.log(`   Skipped items: ${skippedItems.length}`)

    if (skippedItems.length > 0) {
      console.log(`\n⚠️  Skipped Items:`)
      skippedItems.forEach(item => {
        console.log(`   Row ${item.row}: ${item.reason} ${item.item ? `- ${item.item}` : ''}`)
      })
    }

    // Get service user for auth - check auth.users directly
    console.log(`\n🔐 Getting service user for ${SERVICE_ACCOUNT_EMAIL}...`)

    // Since we can't query auth.users directly with service key, we'll proceed without it
    // The parts table has RLS but should be accessible with service role key
    console.log(`⚠️  Note: Proceeding with service role authentication`)

    // Import parts to database
    console.log(`\n💾 Importing ${importedParts.length} parts to database...`)

    let successCount = 0
    let errorCount = 0

    for (const part of importedParts) {
      try {
        // Check if part with same SKU already exists
        const { data: existingPart } = await supabase
          .from('parts')
          .select('id')
          .eq('account_id', ACCOUNT_ID)
          .eq('sku', part.sku)
          .single()

        if (existingPart) {
          // Update existing part
          const { error: updateError } = await supabase
            .from('parts')
            .update({
              name: part.name,
              description: part.description,
              category: part.category,
              unit: part.unit,
              unit_price: part.unit_price,
              quantity_in_stock: part.quantity_in_stock,
              reorder_threshold: part.reorder_threshold,
              supplier_name: part.supplier_name,
              supplier_sku: part.supplier_sku,
              supplier_contact: part.supplier_contact,
              notes: part.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPart.id)

          if (updateError) {
            console.error(`   ❌ Error updating part "${part.name}":`, updateError.message)
            errorCount++
          } else {
            console.log(`   ✅ Updated: ${part.name} (${part.sku})`)
            successCount++
          }
        } else {
          // Insert new part
          const { error: insertError } = await supabase
            .from('parts')
            .insert({
              ...part,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            console.error(`   ❌ Error inserting part "${part.name}":`, insertError.message)
            errorCount++
          } else {
            console.log(`   ✅ Added: ${part.name} (${part.sku})`)
            successCount++
          }
        }
      } catch (err: any) {
        console.error(`   ❌ Error processing part "${part.name}":`, err.message)
        errorCount++
      }
    }

    console.log(`\n🎉 Import Complete!`)
    console.log(`   Successfully imported: ${successCount} parts`)
    console.log(`   Errors: ${errorCount} parts`)

    // Get inventory statistics
    const { count: totalParts } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', ACCOUNT_ID)

    console.log(`\n📊 Current Inventory Stats for 317plumber:`)
    console.log(`   Total parts in database: ${totalParts || 0}`)

    // Calculate total inventory value
    const { data: parts } = await supabase
      .from('parts')
      .select('unit_price, quantity_in_stock')
      .eq('account_id', ACCOUNT_ID)

    const totalValue = parts?.reduce((sum, part) => {
      return sum + (part.unit_price * (part.quantity_in_stock || 0))
    }, 0) || 0

    console.log(`   Total inventory value: $${(totalValue / 100).toFixed(2)}`)

  } catch (error: any) {
    console.error('❌ Fatal error during import:', error.message)
    process.exit(1)
  }
}

// Check if Excel file exists
if (!fs.existsSync(EXCEL_FILE_PATH)) {
  console.error(`❌ Error: Excel file not found at ${EXCEL_FILE_PATH}`)
  console.error('Please ensure the file exists and try again.')
  process.exit(1)
}

// Run the import
importPartsFromExcel()
  .then(() => {
    console.log('\n✨ Import process completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error)
    process.exit(1)
  })