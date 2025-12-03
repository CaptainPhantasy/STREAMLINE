#!/usr/bin/env ts-node

/**
 * Import Pricebook for 317plumber into new pricebook tables
 *
 * This script imports the pricebook from the Excel file and populates the new pricebook tables
 * with the pricing data for the 317plumber group.
 *
 * Usage: npx ts-node scripts/import-317plumber-pricebook-v2.ts
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

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Import categories from Categories sheet
 */
async function importCategories(): Promise<Map<string, string>> {
  console.log('\n📂 Importing categories...')

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const categoriesSheet = workbook.Sheets['Categories']

  if (!categoriesSheet) {
    console.log('⚠️  No Categories sheet found')
    return new Map()
  }

  const categoriesData = XLSX.utils.sheet_to_json(categoriesSheet)
  const categoryMap = new Map() // Map external ID to our UUID

  for (const row of categoriesData as any[]) {
    if (!row['Id'] || !row['Category1']) continue

    const categoryName = `${row['Category1']}${row['Category2'] ? ' > ' + row['Category2'] : ''}${row['Category3'] ? ' > ' + row['Category3'] : ''}`

    const { data, error } = await supabase
      .from('pricebook_categories')
      .upsert({
        account_id: ACCOUNT_ID,
        name: categoryName,
        description: categoryName,
        image_url: row['CatPicUrl'] || null,
        active: row['Active'] === 1 || row['Active'] === '1',
        external_id: row['Id'].toString(),
        external_source: 'pricebook_import'
      })
      .select('id')
      .single()

    if (error) {
      console.error(`   ❌ Error importing category "${categoryName}":`, error.message)
    } else {
      categoryMap.set(row['Id'].toString(), data.id)
      console.log(`   ✅ Imported category: ${categoryName}`)
    }
  }

  console.log(`   📊 Imported ${categoryMap.size} categories`)
  return categoryMap
}

/**
 * Import materials from Materials sheet
 */
async function importMaterials(categoryMap: Map<string, string>) {
  console.log('\n🔩 Importing materials...')

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const materialsSheet = workbook.Sheets['Materials']

  if (!materialsSheet) {
    console.log('⚠️  No Materials sheet found')
    return
  }

  const materialsData = XLSX.utils.sheet_to_json(materialsSheet)
  let successCount = 0
  let errorCount = 0

  for (const row of materialsData as any[]) {
    // Skip rows without required fields
    if (!row['Name'] && !row['Code']) continue

    // Skip inactive items
    if (row['Active'] === 0 || row['Active'] === '0') continue

    // Skip items with zero price
    const price = parseFloat(row['Price'] || row['Cost'] || '0')
    if (price <= 0) continue

    // Find category ID
    const categoryId = row['Category.Id'] ? categoryMap.get(row['Category.Id'].toString()) : null

    const { error } = await supabase
      .from('pricebook')
      .upsert({
        account_id: ACCOUNT_ID,
        category_id: categoryId,
        sku: row['Code'] || '',
        name: row['Name'] || '',
        description: row['Description'] || '',
        type: 'material',
        unit_of_measure: row['UnitOfMeasure'] || 'each',
        cost_price: Math.round(parseFloat(row['Cost'] || '0') * 100),
        unit_price: Math.round(price * 100),
        member_price: row['MemberPrice'] ? Math.round(parseFloat(row['MemberPrice']) * 100) : null,
        add_on_price: row['AddOnPrice'] ? Math.round(parseFloat(row['AddOnPrice']) * 100) : null,
        add_on_member_price: row['AddOnMemberPrice'] ? Math.round(parseFloat(row['AddOnMemberPrice']) * 100) : null,
        is_inventory_item: row['IsInventory'] === 1 || row['IsInventory'] === '1',
        taxable: row['Taxable'] === 1 || row['Taxable'] === '1',
        image_url: row['Image1'] || null,
        youtube_url: row['YoutubeUrl'] || null,
        active: row['Active'] === 1 || row['Active'] === '1',
        supplier_name: 'Ferguson Plumbing Supply',
        supplier_sku: row['Ferguson Plumbing Supply[Vendor] Part #'] || '',
        supplier_cost: row['Ferguson Plumbing Supply[Vendor] Price'] ?
          Math.round(parseFloat(row['Ferguson Plumbing Supply[Vendor] Price']) * 100) : null,
        external_id: row['Id']?.toString() || null,
        external_source: 'pricebook_import',
        notes: {
          category: row['Category.Name'] || '',
          supplier_catalog: row['SupplierCatalog'] || '',
          configurable: row['IsConfigurable'] === 1,
          replenishment: row['Replenishment'] === 1
        }
      })

    if (error) {
      console.error(`   ❌ Error importing material "${row['Name']}":`, error.message)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`   📊 Materials import summary:`)
  console.log(`   ✅ Successfully imported: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

/**
 * Import services from Services sheet
 */
async function importServices(categoryMap: Map<string, string>) {
  console.log('\n🛠️  Importing services...')

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const servicesSheet = workbook.Sheets['Services']

  if (!servicesSheet) {
    console.log('⚠️  No Services sheet found')
    return
  }

  const servicesData = XLSX.utils.sheet_to_json(servicesSheet)
  let successCount = 0
  let errorCount = 0

  for (const row of servicesData as any[]) {
    // Skip rows without required fields
    if (!row['Name'] && !row['Code']) continue

    // Skip inactive items
    if (row['Active'] === 0 || row['Active'] === '0') continue

    // Skip items with zero price
    const price = parseFloat(row['Price'] || row['Cost'] || '0')
    if (price <= 0) continue

    // Find category ID
    const categoryId = row['Category.Id'] ? categoryMap.get(row['Category.Id'].toString()) : null

    const { error } = await supabase
      .from('pricebook')
      .upsert({
        account_id: ACCOUNT_ID,
        category_id: categoryId,
        sku: row['Code'] || '',
        name: row['Name'] || '',
        description: row['Description'] || '',
        type: 'service',
        unit_of_measure: row['UnitOfMeasure'] || 'hr',
        cost_price: Math.round(parseFloat(row['Cost'] || '0') * 100),
        unit_price: Math.round(price * 100),
        member_price: row['MemberPrice'] ? Math.round(parseFloat(row['MemberPrice']) * 100) : null,
        add_on_price: row['AddOnPrice'] ? Math.round(parseFloat(row['AddOnPrice']) * 100) : null,
        add_on_member_price: row['AddOnMemberPrice'] ? Math.round(parseFloat(row['AddOnMemberPrice']) * 100) : null,
        labor_hours: parseFloat(row['Hours'] || '0'),
        taxable: row['Taxable'] === 1 || row['Taxable'] === '1',
        image_url: row['Image1'] || null,
        youtube_url: row['YoutubeUrl'] || null,
        active: row['Active'] === 1 || row['Active'] === '1',
        external_id: row['Id']?.toString() || null,
        external_source: 'pricebook_import',
        notes: {
          category: row['Category.Name'] || '',
          configurable: row['IsConfigurable'] === 1
        }
      })

    if (error) {
      console.error(`   ❌ Error importing service "${row['Name']}":`, error.message)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`   📊 Services import summary:`)
  console.log(`   ✅ Successfully imported: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

/**
 * Import equipment from Equipment sheet
 */
async function importEquipment(categoryMap: Map<string, string>) {
  console.log('\n🏗️  Importing equipment...')

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const equipmentSheet = workbook.Sheets['Equipment']

  if (!equipmentSheet) {
    console.log('⚠️  No Equipment sheet found')
    return
  }

  const equipmentData = XLSX.utils.sheet_to_json(equipmentSheet)
  let successCount = 0
  let errorCount = 0

  for (const row of equipmentData as any[]) {
    // Skip rows without required fields
    if (!row['Name'] && !row['Code']) continue

    // Skip inactive items
    if (row['Active'] === 0 || row['Active'] === '0') continue

    // Skip items with zero price
    const price = parseFloat(row['Price'] || row['Cost'] || '0')
    if (price <= 0) continue

    // Find category ID
    const categoryId = row['Category.Id'] ? categoryMap.get(row['Category.Id'].toString()) : null

    const { error } = await supabase
      .from('pricebook')
      .upsert({
        account_id: ACCOUNT_ID,
        category_id: categoryId,
        sku: row['Code'] || '',
        name: row['Name'] || '',
        description: row['Description'] || '',
        type: 'equipment',
        unit_of_measure: row['UnitOfMeasure'] || 'each',
        cost_price: Math.round(parseFloat(row['Cost'] || '0') * 100),
        unit_price: Math.round(price * 100),
        member_price: row['MemberPrice'] ? Math.round(parseFloat(row['MemberPrice']) * 100) : null,
        add_on_price: row['AddOnPrice'] ? Math.round(parseFloat(row['AddOnPrice']) * 100) : null,
        add_on_member_price: row['AddOnMemberPrice'] ? Math.round(parseFloat(row['AddOnMemberPrice']) * 100) : null,
        taxable: row['Taxable'] === 1 || row['Taxable'] === '1',
        image_url: row['Image1'] || null,
        youtube_url: row['YoutubeUrl'] || null,
        active: row['Active'] === 1 || row['Active'] === '1',
        external_id: row['Id']?.toString() || null,
        external_source: 'pricebook_import',
        notes: {
          category: row['Category.Name'] || '',
          configurable: row['IsConfigurable'] === 1
        }
      })

    if (error) {
      console.error(`   ❌ Error importing equipment "${row['Name']}":`, error.message)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`   📊 Equipment import summary:`)
  console.log(`   ✅ Successfully imported: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

/**
 * Main import function
 */
async function importPricebook() {
  console.log('📋 Starting pricebook import for 317plumber...')

  try {
    // Check if Excel file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      console.error(`❌ Error: Excel file not found at ${EXCEL_FILE_PATH}`)
      process.exit(1)
    }

    // Import categories first
    const categoryMap = await importCategories()

    // Import materials, services, and equipment
    await importMaterials(categoryMap)
    await importServices(categoryMap)
    await importEquipment(categoryMap)

    // Get final statistics
    const { count: totalItems } = await supabase
      .from('pricebook')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', ACCOUNT_ID)

    const { count: totalCategories } = await supabase
      .from('pricebook_categories')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', ACCOUNT_ID)

    console.log('\n🎉 Pricebook Import Complete!')
    console.log(`   Total categories: ${totalCategories || 0}`)
    console.log(`   Total items (materials, services, equipment): ${totalItems || 0}`)

    // Calculate total inventory value
    const { data: items } = await supabase
      .from('pricebook')
      .select('unit_price')
      .eq('account_id', ACCOUNT_ID)
      .eq('active', true)

    const totalValue = items?.reduce((sum, item) => sum + (item.unit_price || 0), 0) || 0

    console.log(`   Total pricebook value: $${(totalValue / 100).toFixed(2)}`)

  } catch (error: any) {
    console.error('\n❌ Fatal error during import:', error.message)
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