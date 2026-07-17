/**
 * Bug Analyzer
 * 
 * Analyzes code for bugs using pattern matching
 */

import { BUG_PATTERNS, BugPattern } from '../../../scripts/verification/patterns/bug-patterns'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export interface BugAnalysis {
  file: string
  line: number
  pattern: BugPattern
  match: string
  context: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface BugAnalysisResult {
  bugs: BugAnalysis[]
  totalBugs: number
  criticalBugs: number
  highBugs: number
  mediumBugs: number
  lowBugs: number
}

/**
 * Bug Analyzer class
 */
export class BugAnalyzer {
  /**
   * Analyze a file for bugs
   */
  async analyzeFile(filePath: string): Promise<BugAnalysis[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const fileExt = path.extname(filePath).slice(1)
      const bugs: BugAnalysis[] = []

      // Check each bug pattern
      for (const pattern of BUG_PATTERNS) {
        // Check if pattern applies to this file type
        const applicableRules = pattern.patterns.filter(
          rule => rule.fileTypes.includes(fileExt)
        )

        if (applicableRules.length === 0) continue

        // Check each rule
        for (const rule of applicableRules) {
          const matches = this.matchPattern(content, rule, filePath)
          for (const match of matches) {
            bugs.push({
              file: filePath,
              line: match.line,
              pattern,
              match: match.text,
              context: match.context,
              severity: pattern.severity
            })
          }
        }
      }

      return bugs
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error)
      return []
    }
  }

  /**
   * Analyze multiple files
   */
  async analyzeFiles(filePaths: string[]): Promise<BugAnalysisResult> {
    const allBugs: BugAnalysis[] = []

    for (const filePath of filePaths) {
      const bugs = await this.analyzeFile(filePath)
      allBugs.push(...bugs)
    }

    return this.summarizeResults(allBugs)
  }

  /**
   * Analyze a directory recursively
   */
  async analyzeDirectory(dirPath: string, excludePatterns: string[] = ['node_modules', '.git', '.next']): Promise<BugAnalysisResult> {
    const filePaths: string[] = []
    
    await this.collectFiles(dirPath, filePaths, excludePatterns)
    
    return this.analyzeFiles(filePaths)
  }

  /**
   * Match a pattern rule against content
   */
  private matchPattern(content: string, rule: BugPattern['patterns'][0], filePath: string): Array<{ line: number; text: string; context: string }> {
    const matches: Array<{ line: number; text: string; context: string }> = []
    const lines = content.split('\n')

    if (rule.type === 'regex') {
      const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'gi') : rule.pattern
      
      lines.forEach((line, index) => {
        const match = regex.exec(line)
        if (match) {
          matches.push({
            line: index + 1,
            text: line.trim(),
            context: this.getContext(lines, index, 3)
          })
          regex.lastIndex = 0 // Reset for next iteration
        }
      })
    } else if (rule.type === 'component') {
      lines.forEach((line, index) => {
        if (line.includes(rule.pattern as string)) {
          matches.push({
            line: index + 1,
            text: line.trim(),
            context: this.getContext(lines, index, 3)
          })
        }
      })
    }

    return matches
  }

  /**
   * Get context around a line
   */
  private getContext(lines: string[], lineIndex: number, contextLines: number): string {
    const start = Math.max(0, lineIndex - contextLines)
    const end = Math.min(lines.length, lineIndex + contextLines + 1)
    return lines.slice(start, end).join('\n')
  }

  /**
   * Collect files recursively
   */
  private async collectFiles(dirPath: string, filePaths: string[], excludePatterns: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        // Skip excluded patterns
        if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
          continue
        }

        if (entry.isDirectory()) {
          await this.collectFiles(fullPath, filePaths, excludePatterns)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).slice(1)
          if (['ts', 'tsx', 'js', 'jsx', 'css'].includes(ext)) {
            filePaths.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error)
    }
  }

  /**
   * Summarize analysis results
   */
  private summarizeResults(bugs: BugAnalysis[]): BugAnalysisResult {
    return {
      bugs,
      totalBugs: bugs.length,
      criticalBugs: bugs.filter(b => b.severity === 'critical').length,
      highBugs: bugs.filter(b => b.severity === 'high').length,
      mediumBugs: bugs.filter(b => b.severity === 'medium').length,
      lowBugs: bugs.filter(b => b.severity === 'low').length
    }
  }
}
