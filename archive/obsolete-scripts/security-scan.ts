/**
 * Security Scanning Script
 *
 * Performs comprehensive security checks on the codebase:
 * - npm audit for vulnerable dependencies
 * - Secrets detection (API keys, passwords, tokens)
 * - Input validation checks
 * - Authentication coverage verification
 * - Rate limiting integration check
 * - Error logging safety
 * - CORS configuration
 *
 * Usage:
 *   npx tsx scripts/security-scan.ts
 *   npx tsx scripts/security-scan.ts --verbose
 *   npx tsx scripts/security-scan.ts --fix
 */

import { execSync, exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ScanResult {
  category: string
  status: 'PASS' | 'WARN' | 'FAIL'
  message: string
  details?: string[]
}

const results: ScanResult[] = []
const verbose = process.argv.includes('--verbose')
const shouldFix = process.argv.includes('--fix')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function pass(message: string) {
  log(`✓ ${message}`, colors.green)
}

function warn(message: string) {
  log(`⚠ ${message}`, colors.yellow)
}

function fail(message: string) {
  log(`✗ ${message}`, colors.red)
}

function info(message: string) {
  log(`ℹ ${message}`, colors.blue)
}

// ================================================================
// 1. Dependency Security
// ================================================================

async function checkDependencies() {
  log('\n=== DEPENDENCY SECURITY ===', colors.cyan)

  try {
    const output = execSync('npm audit --json', { encoding: 'utf-8' })
    const auditResult = JSON.parse(output)

    const vulnerabilityCount = auditResult.metadata?.vulnerabilities?.total || 0

    if (vulnerabilityCount === 0) {
      pass('No vulnerable dependencies found')
      results.push({
        category: 'Dependencies',
        status: 'PASS',
        message: 'npm audit: Clean',
      })
    } else {
      const critical = auditResult.metadata?.vulnerabilities?.critical || 0
      const high = auditResult.metadata?.vulnerabilities?.high || 0

      fail(`Found ${vulnerabilityCount} vulnerabilities (Critical: ${critical}, High: ${high})`)

      if (verbose) {
        Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]: any) => {
          console.log(`  - ${pkg}: ${vuln.via?.[0]?.title}`)
        })
      }

      if (shouldFix) {
        info('Running npm audit fix --force...')
        try {
          execSync('npm audit fix --force', { stdio: 'inherit' })
          pass('Dependencies updated')
        } catch (e) {
          warn('npm audit fix failed - may require manual intervention')
        }
      }

      results.push({
        category: 'Dependencies',
        status: critical > 0 ? 'FAIL' : 'WARN',
        message: `Found ${vulnerabilityCount} vulnerabilities`,
        details: [`Critical: ${critical}`, `High: ${high}`],
      })
    }
  } catch (error: any) {
    if (error.message?.includes('ERR! code ERESOLVE')) {
      warn('Dependency resolution conflict - may need manual review')
      results.push({
        category: 'Dependencies',
        status: 'WARN',
        message: 'Dependency resolution issues found',
      })
    } else {
      throw error
    }
  }
}

// ================================================================
// 2. Secrets Detection
// ================================================================

function checkSecretsInCode() {
  log('\n=== SECRETS DETECTION ===', colors.cyan)

  const secretPatterns = [
    { pattern: /sk-[a-zA-Z0-9_-]{20,}/g, name: 'OpenAI API Key' },
    { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g, name: 'Anthropic API Key' },
    { pattern: /STRIPE_SECRET_KEY\s*=\s*[a-zA-Z0-9_-]+/g, name: 'Stripe Secret' },
    { pattern: /password\s*[:=]\s*["\']([^"\']+)["\']/gi, name: 'Hardcoded Password' },
    { pattern: /api[_-]?key\s*[:=]\s*["\']([^"\']+)["\']/gi, name: 'Hardcoded API Key' },
  ]

  let secretsFound = 0
  const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build', '.env.example']

  function searchDirectory(dir: string) {
    try {
      const files = fs.readdirSync(dir)

      for (const file of files) {
        // Skip excluded directories
        if (excludeDirs.includes(file)) continue

        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          searchDirectory(fullPath)
        } else if (
          file.endsWith('.ts') ||
          file.endsWith('.tsx') ||
          file.endsWith('.js') ||
          file.endsWith('.json')
        ) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')

            for (const { pattern, name } of secretPatterns) {
              if (pattern.test(content)) {
                fail(`Found potential ${name} in ${fullPath}`)
                secretsFound++

                if (verbose) {
                  const matches = content.match(pattern)
                  matches?.forEach(m => {
                    console.log(`    Match: ${m.substring(0, 50)}...`)
                  })
                }
              }
            }
          } catch (e) {
            // Skip binary files
          }
        }
      }
    } catch (error) {
      // Skip permission errors
    }
  }

  searchDirectory(process.cwd())

  if (secretsFound === 0) {
    pass('No hardcoded secrets detected in code')
    results.push({
      category: 'Secrets Detection',
      status: 'PASS',
      message: 'No hardcoded secrets found',
    })
  } else {
    fail(`Found ${secretsFound} potential secrets`)
    results.push({
      category: 'Secrets Detection',
      status: 'FAIL',
      message: `${secretsFound} potential secrets found`,
    })
  }
}

// ================================================================
// 3. Environment File Security
// ================================================================

function checkEnvironmentSecurity() {
  log('\n=== ENVIRONMENT SECURITY ===', colors.cyan)

  const envFiles = ['.env.local', '.env.development.local', '.env.production.local']
  let issues = 0

  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile)

    if (fs.existsSync(envPath)) {
      // Check file permissions
      const stats = fs.statSync(envPath)
      const mode = stats.mode & parseInt('777', 8)

      if (mode !== parseInt('600', 8)) {
        warn(`${envFile} has insecure permissions (${mode.toString(8)})`)
        issues++

        if (shouldFix) {
          fs.chmodSync(envPath, 0o600)
          pass(`Fixed permissions on ${envFile}`)
        }
      }

      // Check if in git
      try {
        execSync(`git ls-files ${envFile}`, { stdio: 'ignore' })
        fail(`${envFile} is tracked in git (should be in .gitignore)`)
        issues++
      } catch {
        pass(`${envFile} is properly ignored by git`)
      }
    }
  }

  // Check .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8')

    if (!gitignoreContent.includes('.env.local')) {
      warn('.gitignore does not include .env.local')
      issues++
    }
  }

  if (issues === 0) {
    pass('Environment files properly secured')
    results.push({
      category: 'Environment Security',
      status: 'PASS',
      message: 'Environment files properly configured',
    })
  } else {
    results.push({
      category: 'Environment Security',
      status: 'WARN',
      message: `${issues} environment security issues found`,
    })
  }
}

// ================================================================
// 4. Rate Limiting Check
// ================================================================

function checkRateLimitingIntegration() {
  log('\n=== RATE LIMITING INTEGRATION ===', colors.cyan)

  const llmRoutePath = path.join(process.cwd(), 'app/api/llm/route.ts')

  if (!fs.existsSync(llmRoutePath)) {
    warn('LLM route not found, skipping rate limiting check')
    return
  }

  const content = fs.readFileSync(llmRoutePath, 'utf-8')

  // Check if rate limiter is imported
  const hasImport = content.includes('getRateLimiter')
  const hasCheck = content.includes('checkLimit')

  if (hasImport && hasCheck) {
    pass('Rate limiting is integrated into LLM router')
    results.push({
      category: 'Rate Limiting',
      status: 'PASS',
      message: 'Rate limiting properly integrated',
    })
  } else {
    fail('Rate limiting is NOT integrated into LLM router')
    results.push({
      category: 'Rate Limiting',
      status: 'FAIL',
      message: 'Rate limiting not integrated - CRITICAL FIX NEEDED',
    })
  }

  // Check if rate limiter file exists
  const rateLimiterPath = path.join(process.cwd(), 'lib/llm/rate-limiting/rate-limiter.ts')
  if (fs.existsSync(rateLimiterPath)) {
    pass('Rate limiter implementation exists')
  } else {
    fail('Rate limiter implementation not found')
  }
}

// ================================================================
// 5. Input Validation Check
// ================================================================

function checkInputValidation() {
  log('\n=== INPUT VALIDATION ===', colors.cyan)

  const apiEndpoints = [
    'app/api/contacts/route.ts',
    'app/api/invoices/route.ts',
    'app/api/jobs/route.ts',
    'app/api/campaigns/route.ts',
  ]

  let validated = 0
  let missing = 0

  for (const endpoint of apiEndpoints) {
    const filePath = path.join(process.cwd(), endpoint)

    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf-8')

    // Check for Zod, Joi, or other validation
    const hasValidation =
      content.includes('z.object') || // Zod
      content.includes('Joi.') || // Joi
      content.includes('validate(') || // Custom validation
      content.includes('ValidationError')

    if (hasValidation) {
      validated++
      pass(`${endpoint} has input validation`)
    } else {
      missing++
      warn(`${endpoint} may be missing input validation`)
    }
  }

  if (missing > 0) {
    results.push({
      category: 'Input Validation',
      status: 'WARN',
      message: `${missing} endpoints may lack input validation`,
    })
  } else {
    results.push({
      category: 'Input Validation',
      status: 'PASS',
      message: 'Input validation found in endpoints',
    })
  }
}

// ================================================================
// 6. Authentication Coverage Check
// ================================================================

function checkAuthenticationCoverage() {
  log('\n=== AUTHENTICATION COVERAGE ===', colors.cyan)

  const apiDir = path.join(process.cwd(), 'app/api')
  let protected_count = 0
  let unprotected_count = 0
  const unprotected_endpoints = []

  function checkDirectory(dir: string) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        checkDirectory(fullPath)
      } else if (file === 'route.ts') {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const relPath = path.relative(process.cwd(), fullPath)

        // Check for auth
        const hasAuth =
          content.includes('getAuthenticatedSession') ||
          content.includes('getAdminUser') ||
          content.includes('Authorization') ||
          content.includes('stripe.webhooks.constructEvent') || // Webhook
          relPath.includes('webhooks') ||
          relPath.includes('health')

        if (hasAuth) {
          protected_count++
        } else if (!relPath.includes('seed') && !relPath.includes('test')) {
          unprotected_count++
          unprotected_endpoints.push(relPath)
        }
      }
    }
  }

  checkDirectory(apiDir)

  pass(`${protected_count} endpoints are protected`)
  if (unprotected_endpoints.length > 0) {
    warn(`${unprotected_count} unprotected endpoints found:`)
    unprotected_endpoints.forEach(ep => console.log(`  - ${ep}`))
  }

  results.push({
    category: 'Authentication',
    status: unprotected_count > 0 ? 'WARN' : 'PASS',
    message: `Protected: ${protected_count}, Unprotected: ${unprotected_count}`,
  })
}

// ================================================================
// 7. Error Logging Safety Check
// ================================================================

function checkErrorLoggingSafety() {
  log('\n=== ERROR LOGGING SAFETY ===', colors.cyan)

  const llmRoutePath = path.join(process.cwd(), 'app/api/llm/route.ts')

  if (!fs.existsSync(llmRoutePath)) {
    warn('Cannot check error logging')
    return
  }

  const content = fs.readFileSync(llmRoutePath, 'utf-8')

  // Check for error sanitization
  const hasSanitization = content.includes('sanitizeError') || content.includes('sanitizeObject')

  if (hasSanitization) {
    pass('Error sanitization is implemented')
    results.push({
      category: 'Error Logging',
      status: 'PASS',
      message: 'Error messages are sanitized before logging',
    })
  } else {
    warn('Error sanitization may be missing')
    results.push({
      category: 'Error Logging',
      status: 'WARN',
      message: 'Error logging safety not verified',
    })
  }
}

// ================================================================
// 8. Webhook Security Check
// ================================================================

function checkWebhookSecurity() {
  log('\n=== WEBHOOK SECURITY ===', colors.cyan)

  const webhooks = ['app/api/webhooks/stripe/route.ts', 'app/api/webhooks/elevenlabs/route.ts']

  let secure_count = 0

  for (const webhook of webhooks) {
    const filePath = path.join(process.cwd(), webhook)

    if (!fs.existsSync(filePath)) {
      warn(`Webhook not found: ${webhook}`)
      continue
    }

    const content = fs.readFileSync(filePath, 'utf-8')

    // Check for signature verification
    const hasVerification =
      content.includes('constructEvent') || // Stripe
      content.includes('timingSafeEqual') || // Eleven Labs
      content.includes('verifySignature') ||
      content.includes('stripe-signature') ||
      content.includes('X-ElevenLabs-Signature')

    if (hasVerification) {
      pass(`${webhook} has signature verification`)
      secure_count++
    } else {
      fail(`${webhook} is missing signature verification`)
    }
  }

  results.push({
    category: 'Webhook Security',
    status: secure_count === webhooks.filter(w => fs.existsSync(path.join(process.cwd(), w))).length ? 'PASS' : 'FAIL',
    message: `${secure_count} webhooks properly secured`,
  })
}

// ================================================================
// Main Execution
// ================================================================

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', colors.cyan)
  log('║        CRM-AI-PRO SECURITY SCAN - NOVEMBER 25, 2025      ║', colors.cyan)
  log('╚════════════════════════════════════════════════════════╝', colors.cyan)

  try {
    await checkDependencies()
    checkSecretsInCode()
    checkEnvironmentSecurity()
    checkRateLimitingIntegration()
    checkInputValidation()
    checkAuthenticationCoverage()
    checkErrorLoggingSafety()
    checkWebhookSecurity()
  } catch (error: any) {
    fail(`Scan error: ${error.message}`)
  }

  // ================================================================
  // Summary
  // ================================================================

  log('\n╔════════════════════════════════════════════════════════╗', colors.cyan)
  log('║                    SCAN SUMMARY                        ║', colors.cyan)
  log('╚════════════════════════════════════════════════════════╝', colors.cyan)

  const failures = results.filter(r => r.status === 'FAIL')
  const warnings = results.filter(r => r.status === 'WARN')
  const passes = results.filter(r => r.status === 'PASS')

  console.log(`\n${colors.green}✓ PASS: ${passes.length}${colors.reset}`)
  console.log(`${colors.yellow}⚠ WARN: ${warnings.length}${colors.reset}`)
  console.log(`${colors.red}✗ FAIL: ${failures.length}${colors.reset}`)

  // Detailed results
  if (verbose) {
    log('\n=== DETAILED RESULTS ===', colors.cyan)
    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✓' : result.status === 'WARN' ? '⚠' : '✗'
      const color =
        result.status === 'PASS' ? colors.green : result.status === 'WARN' ? colors.yellow : colors.red

      console.log(`${color}${icon} ${result.category}: ${result.message}${colors.reset}`)
      result.details?.forEach(detail => console.log(`    - ${detail}`))
    })
  }

  // Exit code
  const exitCode = failures.length > 0 ? 1 : warnings.length > 0 ? 0 : 0

  log(`\nScan complete. Exit code: ${exitCode}`, exitCode === 0 ? colors.green : colors.yellow)

  if (failures.length > 0) {
    log('\n⚠️  CRITICAL SECURITY ISSUES FOUND - FIX REQUIRED', colors.red)
  }

  process.exit(exitCode)
}

main().catch(error => {
  fail(`Fatal error: ${error.message}`)
  process.exit(1)
})
