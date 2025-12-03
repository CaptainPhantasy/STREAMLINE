/**
 * Color Fixer - Fixes color-related visual issues
 */

import { CodeFile } from '../core/code-reader'
import { BugPattern } from '../patterns/bug-patterns'

export interface Fix {
  file: string
  line: number
  original: string
  fixed: string
  description: string
}

export class ColorFixer {
  /**
   * Fix white-on-white text issue
   */
  fixWhiteOnWhite(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check if line has white text and white background
    const hasWhiteText = /text-white|color:\s*['"]white['"]|color:\s*#fff|color:\s*#ffffff/i.test(line)
    const hasWhiteBg = /bg-white|background:\s*['"]white['"]|background:\s*#fff|background:\s*#ffffff/i.test(line)
    
    if (hasWhiteText && hasWhiteBg) {
      // Fix: Change text color to dark (use theme variable if possible)
      const fixed = line
        .replace(/text-white/g, 'text-gray-900')
        .replace(/color:\s*['"]white['"]/gi, "color: 'var(--foreground)'")
        .replace(/color:\s*#fff/gi, "color: 'var(--foreground)'")
        .replace(/color:\s*#ffffff/gi, "color: 'var(--foreground)'")
      
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed,
        description: 'Changed white text to dark text (white-on-white fix)'
      }
    }
    
    return null
  }

  /**
   * Fix hardcoded color values - replace with theme variables
   */
  fixHardcodedColors(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Match hardcoded colors in style props or CSS
    const colorPatterns = [
      { pattern: /color:\s*['"](#[0-9a-fA-F]{3,6})['"]/gi, replacement: "color: 'var(--foreground)'" },
      { pattern: /backgroundColor:\s*['"](#[0-9a-fA-F]{3,6})['"]/gi, replacement: "backgroundColor: 'var(--background)'" },
      { pattern: /background:\s*['"](#[0-9a-fA-F]{3,6})['"]/gi, replacement: "background: 'var(--background)'" },
    ]
    
    let fixed = line
    let changed = false
    
    for (const { pattern, replacement } of colorPatterns) {
      if (pattern.test(line)) {
        fixed = fixed.replace(pattern, replacement)
        changed = true
      }
    }
    
    if (changed) {
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed,
        description: 'Replaced hardcoded color with theme variable'
      }
    }
    
    return null
  }

  /**
   * Fix Tailwind white-on-white classes
   */
  fixTailwindWhiteOnWhite(file: CodeFile, lineNumber: number, line: string): Fix | null {
    // Check for className with both text-white and bg-white
    if (/className=.*text-white.*bg-white|className=.*bg-white.*text-white/i.test(line)) {
      const fixed = line
        .replace(/text-white/g, 'text-gray-900')
        .replace(/dark:text-white/g, 'dark:text-white') // Keep dark mode
      
      return {
        file: file.path,
        line: lineNumber,
        original: line,
        fixed,
        description: 'Fixed Tailwind white-on-white classes'
      }
    }
    
    return null
  }

  /**
   * Apply all color fixes to a file
   */
  fixFile(file: CodeFile): Fix[] {
    const fixes: Fix[] = []
    
    file.lines.forEach((line, index) => {
      // Try each fix
      const whiteOnWhiteFix = this.fixWhiteOnWhite(file, index + 1, line)
      if (whiteOnWhiteFix) fixes.push(whiteOnWhiteFix)
      
      const hardcodedFix = this.fixHardcodedColors(file, index + 1, line)
      if (hardcodedFix) fixes.push(hardcodedFix)
      
      const tailwindFix = this.fixTailwindWhiteOnWhite(file, index + 1, line)
      if (tailwindFix) fixes.push(tailwindFix)
    })
    
    return fixes
  }
}

