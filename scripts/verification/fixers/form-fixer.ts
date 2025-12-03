/**
 * Form Fixer - Fixes form usability issues
 */

import { CodeFile } from '../core/code-reader'

export interface Fix {
  file: string
  line: number
  original: string
  fixed: string
  description: string
}

export class FormFixer {
  /**
   * Fix input without label
   */
  fixInputWithoutLabel(file: CodeFile, lineNumber: number, line: string, context: string[]): Fix | null {
    // Check for <input without associated label
    if (/<input[^>]*>/i.test(line)) {
      const hasLabel = /<label|<Label|aria-label=|aria-labelledby=|id=.*label/i.test(context.join('\n'))
      
      if (!hasLabel) {
        // Can't auto-fix without knowing what the label should be
        // Just flag it
        return {
          file: file.path,
          line: lineNumber,
          original: line,
          fixed: line,
          description: 'Input missing label - needs manual review to add <label> or aria-label'
        }
      }
    }
    
    return null
  }

  /**
   * Fix missing placeholder on inputs
   */
  fixMissingPlaceholder(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check for <input without placeholder
    if (/<input[^>]*type=['"]text['"]|<input[^>]*type=['"]email['"]|<input[^>]*type=['"]password['"]|<input[^>]*type=['"]search['"]/i.test(line) && !/placeholder=/i.test(line)) {
      // Can't auto-fix without knowing what placeholder should be
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed: line,
        description: 'Input missing placeholder - needs manual review'
      }
    }
    
    return null
  }

  /**
   * Apply all form fixes to a file
   */
  fixFile(file: CodeFile): Fix[] {
    const fixes: Fix[] = []
    
    file.lines.forEach((line, index) => {
      // Get context (surrounding lines)
      const start = Math.max(0, index - 5)
      const end = Math.min(file.lines.length, index + 5)
      const context = file.lines.slice(start, end)
      
      const labelFix = this.fixInputWithoutLabel(file, index + 1, line, context)
      if (labelFix) fixes.push(labelFix)
      
      const placeholderFix = this.fixMissingPlaceholder(file, index + 1, line)
      if (placeholderFix) fixes.push(placeholderFix)
    })
    
    return fixes
  }
}

