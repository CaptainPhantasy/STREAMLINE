/**
 * Accessibility Fixer - Fixes accessibility issues
 */

import { CodeFile } from '../core/code-reader'

export interface Fix {
  file: string
  line: number
  original: string
  fixed: string
  description: string
}

export class AccessibilityFixer {
  /**
   * Fix non-semantic interactive elements (div with onClick)
   */
  fixNonSemanticInteractive(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check for <div onClick= without role="button"
    if (/<div[^>]*onClick=/i.test(line) && !/role=['"]button['"]/i.test(line)) {
      // Add role="button" and tabIndex
      const fixed = line.replace(
        /(<div[^>]*onClick=[^>]*)/i,
        '$1 role="button" tabIndex={0}'
      )
      
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed,
        description: 'Added role="button" and tabIndex to non-semantic interactive element'
      }
    }
    
    return null
  }

  /**
   * Fix missing alt text on images
   */
  fixMissingAltText(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check for <img without alt attribute
    if (/<img[^>]*>/i.test(line) && !/alt=/i.test(line)) {
      // Add alt="" (empty alt is better than missing)
      const fixed = line.replace(
        /(<img[^>]*>)/i,
        (match) => {
          if (!/alt=/i.test(match)) {
            return match.replace(/>/, ' alt="" />')
          }
          return match
        }
      )
      
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed,
        description: 'Added alt attribute to image (empty alt - should be filled with meaningful text)'
      }
    }
    
    return null
  }

  /**
   * Fix missing ARIA labels on interactive elements
   */
  fixMissingAriaLabel(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check for button/input without aria-label or aria-labelledby
    const isInteractive = /<button|<input|<select|<textarea/i.test(line)
    const hasLabel = /aria-label=|aria-labelledby=|id=.*label/i.test(line)
    
    if (isInteractive && !hasLabel) {
      // Can't auto-fix without knowing what the label should be
      // Just flag it
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed: line,
        description: 'Missing ARIA label - needs manual review to add appropriate label'
      }
    }
    
    return null
  }

  /**
   * Apply all accessibility fixes to a file
   */
  fixFile(file: CodeFile): Fix[] {
    const fixes: Fix[] = []
    
    file.lines.forEach((line, index) => {
      const semanticFix = this.fixNonSemanticInteractive(file, index + 1, line)
      if (semanticFix) fixes.push(semanticFix)
      
      const altFix = this.fixMissingAltText(file, index + 1, line)
      if (altFix) fixes.push(altFix)
      
      const ariaFix = this.fixMissingAriaLabel(file, index + 1, line)
      if (ariaFix) fixes.push(ariaFix)
    })
    
    return fixes
  }
}

