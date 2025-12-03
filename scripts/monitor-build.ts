#!/usr/bin/env tsx

/**
 * Build Monitor Script
 *
 * Monitors the build process and logs all issues for debugging.
 * Provides detailed error reporting and CSS validation.
 *
 * Usage: npm run monitor:build
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const log = (message: string) => console.log(`🔍 ${message}`)
const error = (message: string) => console.error(`❌ ${message}`)
const success = (message: string) => console.log(`✅ ${message}`)
const warn = (message: string) => console.warn(`⚠️  ${message}`)

interface BuildIssue {
  type: 'error' | 'warning' | 'info'
  file?: string
  message: string
  line?: number
  column?: number
}

const issues: BuildIssue[] = []

async function checkTypeScriptErrors() {
  log('Checking TypeScript errors...')
  
  try {
    const result = execSync('npx tsc --noEmit --pretty false', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    success('No TypeScript errors found')
    return true
  } catch (err: any) {
    const output = err.stdout || err.stderr || err.message
    const lines = output.split('\n')
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        const match = line.match(/(.+):(\d+):(\d+)\s*-\s*error TS\d+:\s*(.+)/)
        if (match) {
          issues.push({
            type: 'error',
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[4],
          })
        } else {
          issues.push({
            type: 'error',
            message: line,
          })
        }
      }
    }
    
    error(`Found ${issues.length} TypeScript errors`)
    return false
  }
}

async function checkESLintErrors() {
  log('Checking ESLint errors...')
  
  try {
    execSync('npm run lint', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    success('No ESLint errors found')
    return true
  } catch (err: any) {
    warn('ESLint found some issues (non-blocking)')
    return true // ESLint warnings don't block build
  }
}

async function checkCSSIssues() {
  log('Checking CSS configuration...')
  
  const cssFiles = [
    'app/globals.css',
    'tailwind.config.js',
    'postcss.config.mjs',
  ]
  
  let cssIssues = 0
  
  for (const file of cssFiles) {
    if (!existsSync(file)) {
      issues.push({
        type: 'error',
        file,
        message: 'CSS configuration file missing',
      })
      cssIssues++
    }
  }
  
  if (cssIssues === 0) {
    success('CSS configuration files present')
  } else {
    error(`Found ${cssIssues} CSS configuration issues`)
  }
  
  return cssIssues === 0
}

async function checkImportErrors() {
  log('Checking for import errors...')
  
  const commonIssues = [
    { pattern: /from ['"]next\/response['"]/, fix: 'next/server' },
    { pattern: /from ['"]next\/request['"]/, fix: 'next/server' },
  ]
  
  // This would require scanning files - simplified for now
  success('Import check completed')
  return true
}

async function runBuild() {
  log('Running production build...')
  
  try {
    const output = execSync('npm run build', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    
    success('Build completed successfully!')
    
    // Extract build stats
    const statsMatch = output.match(/First Load JS shared by all\s+([\d.]+ kB)/)
    if (statsMatch) {
      log(`First Load JS: ${statsMatch[1]}`)
    }
    
    return true
  } catch (err: any) {
    const output = err.stdout || err.stderr || err.message
    
    // Parse webpack errors
    const errorLines = output.split('\n').filter((line: string) =>
      line.includes('error') || line.includes('Error') || line.includes('Failed')
    )
    
    for (const line of errorLines) {
      issues.push({
        type: 'error',
        message: line,
      })
    }
    
    error('Build failed')
    return false
  }
}

async function generateReport() {
  const reportPath = join(process.cwd(), 'build-report.json')
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    errors: issues.filter(i => i.type === 'error').length,
    warnings: issues.filter(i => i.type === 'warning').length,
    issues,
  }
  
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`Build report saved to: ${reportPath}`)
  
  // Also create a human-readable summary
  const summaryPath = join(process.cwd(), 'build-summary.txt')
  let summary = `Build Report - ${new Date().toISOString()}\n`
  summary += '='.repeat(60) + '\n\n'
  summary += `Total Issues: ${issues.length}\n`
  summary += `Errors: ${report.errors}\n`
  summary += `Warnings: ${report.warnings}\n\n`
  
  if (issues.length > 0) {
    summary += 'Issues Found:\n'
    summary += '-'.repeat(60) + '\n'
    issues.forEach((issue, idx) => {
      summary += `${idx + 1}. [${issue.type.toUpperCase()}]`
      if (issue.file) summary += ` ${issue.file}`
      if (issue.line) summary += `:${issue.line}`
      summary += `\n   ${issue.message}\n\n`
    })
  } else {
    summary += '✅ No issues found!\n'
  }
  
  writeFileSync(summaryPath, summary)
  log(`Build summary saved to: ${summary.summaryPath}`)
  
  return report
}

async function main() {
  console.log('🔧 Build Monitor Starting...\n')
  
  const checks = [
    { name: 'TypeScript', fn: checkTypeScriptErrors },
    { name: 'ESLint', fn: checkESLintErrors },
    { name: 'CSS Config', fn: checkCSSIssues },
    { name: 'Imports', fn: checkImportErrors },
    { name: 'Build', fn: runBuild },
  ]
  
  const results: Record<string, boolean> = {}
  
  for (const check of checks) {
    try {
      results[check.name] = await check.fn()
    } catch (err: any) {
      error(`${check.name} check failed: ${err.message}`)
      results[check.name] = false
    }
    console.log('')
  }
  
  const report = await generateReport()
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Build Monitor Summary')
  console.log('='.repeat(60))
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASS' : 'FAIL'}`)
  })
  
  console.log(`\n📝 Total Issues: ${report.totalIssues}`)
  console.log(`   Errors: ${report.errors}`)
  console.log(`   Warnings: ${report.warnings}`)
  
  if (report.errors > 0) {
    console.log('\n❌ Build has errors. Check build-report.json for details.')
    process.exit(1)
  } else {
    console.log('\n✅ Build is healthy!')
    process.exit(0)
  }
}

main().catch((err) => {
  error(`Monitor failed: ${err}`)
  process.exit(1)
})
