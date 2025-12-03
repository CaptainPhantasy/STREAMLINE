/**
 * Main Visual/UX Verification Runner
 * 
 * Scans codebase for visual/UX issues and fixes them
 */

import { CodeReader } from './core/code-reader'
import { PatternMatcher } from './core/pattern-matcher'
import { FixApplier } from './core/fix-applier'
import { BUG_PATTERNS } from './patterns/bug-patterns'
import { ColorFixer } from './fixers/color-fixer'
import { VisibilityFixer } from './fixers/visibility-fixer'
import { AccessibilityFixer } from './fixers/accessibility-fixer'
import { FormFixer } from './fixers/form-fixer'
import * as path from 'path'

interface Issue {
  file: string
  line: number
  pattern: string
  severity: string
  description: string
  fixable: boolean
}

interface VerificationResult {
  totalFiles: number
  issuesFound: Issue[]
  issuesFixed: Issue[]
  issuesRemaining: Issue[]
}

class VisualVerifier {
  private reader: CodeReader
  private matcher: PatternMatcher
  private applier: FixApplier
  private colorFixer: ColorFixer
  private visibilityFixer: VisibilityFixer
  private accessibilityFixer: AccessibilityFixer
  private formFixer: FormFixer
  private results: VerificationResult

  constructor() {
    this.reader = new CodeReader()
    this.matcher = new PatternMatcher()
    this.applier = new FixApplier()
    this.colorFixer = new ColorFixer()
    this.visibilityFixer = new VisibilityFixer()
    this.accessibilityFixer = new AccessibilityFixer()
    this.formFixer = new FormFixer()
    this.results = {
      totalFiles: 0,
      issuesFound: [],
      issuesFixed: [],
      issuesRemaining: []
    }
  }

  async run(fix: boolean = false): Promise<VerificationResult> {
    console.log('🔍 Starting visual/UX verification...\n')

    // Find all files
    const componentFiles = await this.reader.findComponentFiles()
    const cssFiles = await this.reader.findCSSFiles()
    const allFiles = [...componentFiles, ...cssFiles]
    
    this.results.totalFiles = allFiles.length
    console.log(`📁 Found ${allFiles.length} files to check\n`)

    // Process files one at a time to avoid memory issues
    let processedCount = 0
    for (const filePath of allFiles) {
      processedCount++
      if (processedCount % 50 === 0) {
        console.log(`Processed ${processedCount}/${allFiles.length} files...`)
      }
      
      const file = this.reader.readFile(filePath)
      
      // Check against patterns (only check relevant patterns for file type)
      const relevantPatterns = BUG_PATTERNS.filter(p => 
        p.patterns.some(rule => rule.fileTypes.includes(file.type))
      )
      
      for (const pattern of relevantPatterns) {
        const matches = this.matcher.matchPatterns(file, pattern)
        const issues = matches.map(match => ({
          file: match.file,
          line: match.line,
          pattern: pattern.id,
          severity: pattern.severity,
          description: pattern.description,
          fixable: true
        }))
        this.results.issuesFound.push(...issues)
      }
      
      // Clear file from memory
      // (file object will be garbage collected)
    }

    // Fix issues if requested
    if (fix) {
      console.log('\n🔧 Fixing issues...\n')
      
      // Group issues by file
      const issuesByFile = new Map<string, Issue[]>()
      for (const issue of this.results.issuesFound) {
        if (!issuesByFile.has(issue.file)) {
          issuesByFile.set(issue.file, [])
        }
        issuesByFile.get(issue.file)!.push(issue)
      }
      
      // Process each file
      for (const [filePath, issues] of issuesByFile) {
        const file = this.reader.readFile(filePath)
        const fileFixes: any[] = []
        
        // Apply fixers only if file has relevant issues
        const hasColorIssues = issues.some(i => i.pattern.includes('color') || i.pattern.includes('white'))
        const hasVisibilityIssues = issues.some(i => i.pattern.includes('visibility') || i.pattern.includes('hidden'))
        const hasAccessibilityIssues = issues.some(i => i.pattern.includes('accessibility') || i.pattern.includes('aria'))
        const hasFormIssues = issues.some(i => i.pattern.includes('form') || i.pattern.includes('input'))
        
        if (hasColorIssues) {
          fileFixes.push(...this.colorFixer.fixFile(file))
        }
        if (hasVisibilityIssues) {
          fileFixes.push(...this.visibilityFixer.fixFile(file))
        }
        if (hasAccessibilityIssues) {
          fileFixes.push(...this.accessibilityFixer.fixFile(file))
        }
        if (hasFormIssues) {
          fileFixes.push(...this.formFixer.fixFile(file))
        }
        
        if (fileFixes.length > 0) {
          console.log(`  Fixing ${path.relative(process.cwd(), filePath)} (${fileFixes.length} fixes)`)
          const result = this.applier.applyFixes(file, fileFixes)
          console.log(`    Applied: ${result.applied}, Failed: ${result.failed}`)
          
          // Mark as fixed
          fileFixes.forEach(fix => {
            const issue = issues.find(i => i.line === fix.line)
            if (issue) {
              this.results.issuesFixed.push(issue)
            }
          })
        }
      }
      
      // Remaining issues
      this.results.issuesRemaining = this.results.issuesFound.filter(issue =>
        !this.results.issuesFixed.some(fixed => 
          fixed.file === issue.file && fixed.line === issue.line
        )
      )
    } else {
      this.results.issuesRemaining = this.results.issuesFound
    }

    // Print results
    this.printResults()

    return this.results
  }


  private printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('VERIFICATION RESULTS')
    console.log('='.repeat(60))
    console.log(`Total files checked: ${this.results.totalFiles}`)
    console.log(`Issues found: ${this.results.issuesFound.length}`)
    console.log(`Issues fixed: ${this.results.issuesFixed.length}`)
    console.log(`Issues remaining: ${this.results.issuesRemaining.length}`)
    console.log('='.repeat(60) + '\n')

    if (this.results.issuesRemaining.length > 0) {
      console.log('ISSUES FOUND:\n')
      for (const issue of this.results.issuesRemaining) {
        console.log(`[${issue.severity.toUpperCase()}] ${path.relative(process.cwd(), issue.file)}:${issue.line}`)
        console.log(`  ${issue.description}`)
        console.log()
      }
    }
  }
}

// CLI
const args = process.argv.slice(2)
const shouldFix = args.includes('--fix') || args.includes('-f')

const verifier = new VisualVerifier()
verifier.run(shouldFix).then(results => {
  process.exit(results.issuesRemaining.length > 0 ? 1 : 0)
}).catch(error => {
  console.error('Error:', error)
  process.exit(1)
})

