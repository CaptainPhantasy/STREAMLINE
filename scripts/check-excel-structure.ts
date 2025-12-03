#!/usr/bin/env ts-node

/**
 * Check Excel file structure
 * This script will read the Excel file and show the first few rows and column names
 */

import XLSX from 'xlsx'
import * as fs from 'fs'

const EXCEL_FILE_PATH = '/Users/douglastalley/Downloads/Pricebook_2025-11-28T20_06_38.xlsx'

if (!fs.existsSync(EXCEL_FILE_PATH)) {
  console.error(`❌ Error: Excel file not found at ${EXCEL_FILE_PATH}`)
  process.exit(1)
}

console.log('📖 Reading Excel file structure...')
const workbook = XLSX.readFile(EXCEL_FILE_PATH)

console.log('\n📋 Sheet names:', workbook.SheetNames)

// Look for Materials or Services sheet first
const sheetName = workbook.SheetNames.find(name => name === 'Materials') ||
                 workbook.SheetNames.find(name => name === 'Services') ||
                 workbook.SheetNames[0]

console.log(`\n📄 Using sheet: "${sheetName}"`)

const worksheet = workbook.Sheets[sheetName]
if (!worksheet || !worksheet['!ref']) {
  console.error('❌ Error: Worksheet is empty or invalid')
  process.exit(1)
}
const range = XLSX.utils.decode_range(worksheet['!ref']!)

console.log('\n🔤 Column Headers:')
const headers = []
for (let C = range.s.c; C <= range.e.c; ++C) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
  const cell = worksheet[cellAddress]
  if (cell && cell.v) {
    headers.push(`${cell.v} (Column ${String.fromCharCode(65 + C)})`)
  }
}
headers.forEach((h, i) => console.log(`   ${i}: ${h}`))

console.log('\n📊 First 5 rows of data:')
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
data.slice(0, 5).forEach((row: any, index) => {
  console.log(`\nRow ${index + 1}:`)
  Object.entries(row).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`)
  })
})