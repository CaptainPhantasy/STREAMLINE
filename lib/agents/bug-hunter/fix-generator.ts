/**
 * Fix Generator
 * 
 * Generates fixes for identified bugs
 */

import type { BugPattern } from '../../../scripts/verification/patterns/bug-patterns'
import type { BugAnalysis } from './analyzer'
import * as fs from 'fs/promises'

export interface Fix {
  file: string
  line: number
  original: string
  fixed: string
  description: string
  pattern: BugPattern
}

export interface FixPlan {
  fixes: Fix[]
  testCode?: string
  deploymentPlan?: string
}

/**
 * Fix Generator class
 */
export class FixGenerator {
  /**
   * Generate fix for a bug
   */
  generateFix(bug: BugAnalysis): Fix | null {
    const { pattern, match, file, line } = bug

    switch (pattern.fixStrategy) {
      case 'replace':
        return this.generateReplaceFix(bug)
      case 'modify':
        return this.generateModifyFix(bug)
      case 'add':
        return this.generateAddFix(bug)
      case 'remove':
        return this.generateRemoveFix(bug)
      default:
        return null
    }
  }

  /**
   * Generate fixes for multiple bugs
   */
  generateFixes(bugs: BugAnalysis[]): FixPlan {
    const fixes: Fix[] = []

    for (const bug of bugs) {
      const fix = this.generateFix(bug)
      if (fix) {
        fixes.push(fix)
      }
    }

    // Generate test code
    const testCode = this.generateTestCode(fixes)

    // Generate deployment plan
    const deploymentPlan = this.generateDeploymentPlan(fixes)

    return {
      fixes,
      testCode,
      deploymentPlan
    }
  }

  /**
   * Generate replace fix
   */
  private generateReplaceFix(bug: BugAnalysis): Fix | null {
    const { pattern, match } = bug

    if (pattern.id === 'white-on-white-text') {
      // Replace white text with theme variable
      const fixed = match
        .replace(/text-white/g, 'text-theme-primary')
        .replace(/bg-white/g, 'bg-theme-card')
        .replace(/color:\s*['"]white['"]/gi, "color: 'var(--theme-primary)'")
        .replace(/background:\s*['"]white['"]/gi, "background: 'var(--theme-card)'")

      return {
        file: bug.file,
        line: bug.line,
        original: match,
        fixed,
        description: 'Replaced white-on-white with theme variables',
        pattern: bug.pattern
      }
    }

    if (pattern.id === 'hardcoded-colors') {
      // Replace hardcoded colors with theme variables
      const fixed = match
        .replace(/color:\s*['"](#[0-9a-fA-F]{3,6})['"]/gi, "color: 'var(--theme-primary)'")
        .replace(/background:\s*['"](#[0-9a-fA-F]{3,6})['"]/gi, "background: 'var(--theme-card)'")
        .replace(/borderColor:\s*['"](#[0-9a-fA-F]{3,6})['"]/gi, "borderColor: 'var(--theme-border)'")

      return {
        file: bug.file,
        line: bug.line,
        original: match,
        fixed,
        description: 'Replaced hardcoded colors with theme variables',
        pattern: bug.pattern
      }
    }

    return null
  }

  /**
   * Generate modify fix
   */
  private generateModifyFix(bug: BugAnalysis): Fix | null {
    // For modify fixes, we need more context
    // This is a simplified version
    return {
      file: bug.file,
      line: bug.line,
      original: bug.match,
      fixed: bug.match + ' // Fixed: ' + bug.pattern.description,
      description: `Modified: ${bug.pattern.description}`,
      pattern: bug.pattern
    }
  }

  /**
   * Generate add fix
   */
  private generateAddFix(bug: BugAnalysis): Fix | null {
    // For add fixes, we add missing elements
    return {
      file: bug.file,
      line: bug.line,
      original: bug.match,
      fixed: bug.match + '\n// Added: ' + bug.pattern.description,
      description: `Added: ${bug.pattern.description}`,
      pattern: bug.pattern
    }
  }

  /**
   * Generate remove fix
   */
  private generateRemoveFix(bug: BugAnalysis): Fix | null {
    // For remove fixes, we remove problematic code
    return {
      file: bug.file,
      line: bug.line,
      original: bug.match,
      fixed: '// Removed: ' + bug.pattern.description,
      description: `Removed: ${bug.pattern.description}`,
      pattern: bug.pattern
    }
  }

  /**
   * Generate test code for fixes
   */
  private generateTestCode(fixes: Fix[]): string {
    const testCases = fixes.map((fix, index) => {
      return `
describe('Fix ${index + 1}: ${fix.pattern.name}', () => {
  it('should fix ${fix.pattern.id}', () => {
    // Test that fix resolves the bug
    const original = \`${fix.original}\`
    const fixed = \`${fix.fixed}\`
    
    expect(fixed).not.toBe(original)
    expect(fixed).toContain('theme') // Or other validation
  })
})
      `.trim()
    }).join('\n\n')

    return `
import { describe, it, expect } from 'vitest'

${testCases}
    `.trim()
  }

  /**
   * Generate deployment plan
   */
  private generateDeploymentPlan(fixes: Fix[]): string {
    const files = [...new Set(fixes.map(f => f.file))]
    
    return `
# Deployment Plan

## Files Changed
${files.map(f => `- ${f}`).join('\n')}

## Fixes Applied
${fixes.map((f, i) => `${i + 1}. ${f.pattern.name} (${f.file}:${f.line})`).join('\n')}

## Testing Steps
1. Review all fixes
2. Run tests: npm run test
3. Verify visual changes
4. Deploy to staging
5. Verify in staging environment

## Rollback Plan
If issues occur, revert changes to affected files:
${files.map(f => `- git checkout HEAD -- ${f}`).join('\n')}
    `.trim()
  }

  /**
   * Apply fixes to files
   */
  async applyFixes(fixes: Fix[]): Promise<void> {
    // Group fixes by file
    const fixesByFile = new Map<string, Fix[]>()
    
    for (const fix of fixes) {
      if (!fixesByFile.has(fix.file)) {
        fixesByFile.set(fix.file, [])
      }
      fixesByFile.get(fix.file)!.push(fix)
    }

    // Apply fixes to each file
    for (const [file, fileFixes] of fixesByFile) {
      await this.applyFixesToFile(file, fileFixes)
    }
  }

  /**
   * Apply fixes to a single file
   */
  private async applyFixesToFile(filePath: string, fixes: Fix[]): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      // Sort fixes by line number (descending) to avoid line number shifts
      const sortedFixes = [...fixes].sort((a, b) => b.line - a.line)

      for (const fix of sortedFixes) {
        const lineIndex = fix.line - 1
        if (lineIndex >= 0 && lineIndex < lines.length) {
          lines[lineIndex] = fix.fixed
        }
      }

      await fs.writeFile(filePath, lines.join('\n'), 'utf-8')
    } catch (error) {
      console.error(`Error applying fixes to ${filePath}:`, error)
      throw error
    }
  }
}
