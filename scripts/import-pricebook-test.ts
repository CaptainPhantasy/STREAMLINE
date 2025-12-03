#!/usr/bin/env ts-node

/**
 * Test import of first 50 items from pricebook
 */

import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'
import * as fs from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const EXCEL_FILE_PATH = '/Users/douglastalley/Downloads/Pricebook_2025-11-28T20_06_38.xlsx'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ACCOUNT_ID = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testImport() {
  console.log('🧪 Testing pricebook import (first 50 items)...')

  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error(`❌ Excel file not found`)
    process.exit(1)
  }

  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const materialsSheet = workbook.Sheets['Materials']

  if (!materialsSheet) {
    console.error('❌ No Materials sheet found')
    process.exit(1)
  }

  const materialsData = XLSX.utils.sheet_to_json(materialsSheet)
  console.log(`📊 Found ${materialsData.length} materials, importing first 50...`)

  // Process only first 50 active items with price
  let processed = 0
  for (let i = 0; i < materialsData.length && processed < 50; i++) {
    const row = materialsData[i] as any

    // Skip inactive or zero-price items
    if (!row['Name'] || row['Active'] === 0 || !row['Price'] || parseFloat(row['Price']) <= 0) {
      continue
    }

    const partData = {
      account_id: ACCOUNT_ID,
      sku: row['Code'] || '',
      name: row['Name'],
      description: row['Description'] || '',
      category: 'plumbing',
      unit: 'each',
      unit_price: Math.round(parseFloat(row['Price']) * 100),
      quantity_in_stock: 0,
      supplier_name: 'Ferguson Plumbing Supply',
      notes: `Test import | ${row['Category.Name'] || 'N/A'}`
    }

    const { error } = await supabase
      .from('parts')
      .insert(partData)

    if (error) {
      console.error(`   ❌ Error inserting "${row['Name']}": ${error.message}`)
    } else {
      console.log(`   ✅ Inserted: ${row['Name']} - $${row['Price']}`)
      processed++
    }
  }

  console.log(`\n✨ Test import complete! Processed ${processed} items`)

  // Check total
  const { count } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', ACCOUNT_ID)

  console.log(`   Total parts in database: ${count}`)
}

testImport().catch(console.error)