import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const apiDir = path.join(__dirname, '..', 'app', 'api')

function findRouteFiles(dir: string): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath))
    } else if (entry.name === 'route.ts') {
      files.push(fullPath)
    }
  }
  
  return files
}

function needsDynamicExport(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')
  return (
    content.includes('request.headers') ||
    content.includes('request.url') ||
    content.includes('cookies()') ||
    content.includes('getAuthenticatedSession')
  )
}

function addDynamicExport(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Skip if already has dynamic export
  if (content.includes('export const dynamic')) {
    return
  }
  
  // Find the first export statement
  const lines = content.split('\n')
  let insertIndex = 0
  
  // Find where to insert (after imports, before first export function)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('export async function') || lines[i].trim().startsWith('export function')) {
      insertIndex = i
      break
    }
  }
  
  // Insert dynamic exports
  const dynamicExports = "export const dynamic = 'force-dynamic'\nexport const revalidate = 0\n"
  lines.splice(insertIndex, 0, dynamicExports)
  
  fs.writeFileSync(filePath, lines.join('\n'))
  console.log(`✅ Added dynamic exports to ${path.relative(process.cwd(), filePath)}`)
}

// Main execution
const routeFiles = findRouteFiles(apiDir)
let updated = 0

for (const file of routeFiles) {
  if (needsDynamicExport(file)) {
    addDynamicExport(file)
    updated++
  }
}

console.log(`\n✨ Updated ${updated} route files with dynamic exports`)

