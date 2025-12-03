/**
 * Visibility Fixer - Fixes visibility-related issues
 */

import { CodeFile } from '../core/code-reader'

export interface Fix {
  file: string
  line: number
  original: string
  fixed: string
  description: string
}

export class VisibilityFixer {
  /**
   * Fix hidden interactive elements
   */
  fixHiddenInteractive(file: CodeFile, lineNumber: number, line: string, context?: string): Fix | null {
    // Check if line has hidden class/style on interactive element
    const isInteractive = /button|onClick|href|input|select|textarea/i.test(context || line)
    const isHidden = /hidden|display:\s*none|visibility:\s*hidden|opacity:\s*0/i.test(line)
    
    if (isInteractive && isHidden) {
      // Remove hidden class/style
      const fixed = line
        .replace(/\s+hidden/g, '')
        .replace(/display:\s*none/gi, 'display: block')
        .replace(/visibility:\s*hidden/gi, 'visibility: visible')
        .replace(/opacity:\s*0/gi, 'opacity: 1')
      
      if (fixed !== line) {
        return {
          file: file.path,
          line: lineNumber,
          original: line,
          fixed,
          description: 'Removed hidden styling from interactive element'
        }
      }
    }
    
    return null
  }

  /**
   * Fix conditional rendering that might never render
   */
  fixConditionalRender(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check for patterns like {false && <Component />} or {undefined && <Component />}
    if (/\{false\s*&&\s*<|undefined\s*&&\s*<|null\s*&&\s*</i.test(line)) {
      // This is a code smell - but we can't auto-fix without understanding the logic
      // Just flag it for now
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed: line, // Can't auto-fix without context
        description: 'Conditional render might never render - needs manual review'
      }
    }
    
    return null
  }

  /**
   * Apply all visibility fixes to a file
   */
  fixFile(file: CodeFile): Fix[] {
    const fixes: Fix[] = []
    const fileContent = file.content
    
    file.lines.forEach((line, index) => {
      // Get context (previous and next lines)
      const prevLine = index > 0 ? file.lines[index - 1] : ''
      const nextLine = index < file.lines.length - 1 ? file.lines[index + 1] : ''
      const context = `${prevLine} ${line} ${nextLine}`
      
      const hiddenFix = this.fixHiddenInteractive(file, index + 1, line, context)
      if (hiddenFix) fixes.push(hiddenFix)
      
      const conditionalFix = this.fixConditionalRender(file, index + 1, line)
      if (conditionalFix) fixes.push(conditionalFix)
    })
    
    return fixes
  }
}

