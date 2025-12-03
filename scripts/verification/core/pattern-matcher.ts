/**
 * Pattern Matcher - Enhanced pattern matching with AST support
 */

import { CodeFile } from './code-reader'
import { BugPattern, PatternRule } from '../patterns/bug-patterns'

export interface Match {
  file: string
  line: number
  column?: number
  pattern: string
  match: string
  context?: string
}

export class PatternMatcher {
  /**
   * Match patterns in a file
   */
  matchPatterns(file: CodeFile, pattern: BugPattern): Match[] {
    const matches: Match[] = []
    
    for (const rule of pattern.patterns) {
      if (!rule.fileTypes.includes(file.type)) {
        continue
      }
      
      switch (rule.type) {
        case 'regex':
          matches.push(...this.matchRegex(file, rule))
          break
        case 'ast':
          matches.push(...this.matchAST(file, rule))
          break
        case 'component':
          matches.push(...this.matchComponent(file, rule))
          break
        case 'css':
          matches.push(...this.matchCSS(file, rule))
          break
      }
    }
    
    return matches
  }

  /**
   * Match regex patterns (optimized for memory)
   */
  private matchRegex(file: CodeFile, rule: PatternRule): Match[] {
    const matches: Match[] = []
    const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'gi') : rule.pattern
    
    // Process line by line to avoid memory issues with large files
    file.lines.forEach((line, index) => {
      const lineMatch = regex.exec(line)
      if (lineMatch) {
        matches.push({
          file: file.path,
          line: index + 1,
          column: lineMatch.index,
          pattern: rule.pattern.toString(),
          match: lineMatch[0],
          context: line
        })
        // Reset regex lastIndex for next line
        regex.lastIndex = 0
      }
    })
    
    return matches
  }

  /**
   * Match AST patterns (for complex TypeScript/TSX)
   * Uses regex-based pattern matching for JSX/TSX since TypeScript compiler isn't available
   */
  private matchAST(file: CodeFile, rule: PatternRule): Match[] {
    const matches: Match[] = []
    
    if (file.type !== 'tsx' && file.type !== 'ts') {
      return matches
    }
    
    // Enhanced regex-based matching for JSX patterns
    // Example: Find <div onClick= without role="button"
    if (rule.pattern === 'conditional-render-check') {
      // Match conditional rendering patterns
      const conditionalPattern = /\{(false|undefined|null|0)\s*&&\s*<[^>]+>/gi
      let match: RegExpExecArray | null
      
      while ((match = conditionalPattern.exec(file.content)) !== null) {
        const lineNumber = file.content.substring(0, match.index).split('\n').length
        matches.push({
          file: file.path,
          line: lineNumber,
          pattern: rule.pattern.toString(),
          match: match[0],
          context: file.lines[lineNumber - 1]
        })
      }
    }
    
    // Fall back to regex for other AST patterns
    return this.matchRegex(file, rule)
  }

  /**
   * Match component patterns
   */
  private matchComponent(file: CodeFile, rule: PatternRule): Match[] {
    const matches: Match[] = []
    
    if (file.type !== 'tsx' && file.type !== 'jsx') {
      return matches
    }
    
    // Component patterns are usually JSX-specific
    const pattern = typeof rule.pattern === 'string' ? rule.pattern : rule.pattern.toString()
    
    file.lines.forEach((line, index) => {
      if (line.includes(pattern)) {
        // Check context if specified
        if (rule.context) {
          const contextLines = file.lines.slice(Math.max(0, index - 3), Math.min(file.lines.length, index + 3))
          const context = contextLines.join('\n')
          
          if (!new RegExp(rule.context, 'i').test(context)) {
            return
          }
        }
        
        matches.push({
          file: file.path,
          line: index + 1,
          pattern,
          match: line,
          context: line
        })
      }
    })
    
    return matches
  }

  /**
   * Match CSS patterns
   */
  private matchCSS(file: CodeFile, rule: PatternRule): Match[] {
    const matches: Match[] = []
    
    if (file.type !== 'css' && !file.path.endsWith('.css')) {
      return matches
    }
    
    // CSS-specific pattern matching
    const pattern = typeof rule.pattern === 'string' ? rule.pattern : rule.pattern.toString()
    
    if (pattern === 'contrast-ratio-check') {
      // Check for color combinations that might have low contrast
      const colorRegex = /(?:color|background|background-color):\s*([^;]+)/gi
      let match: RegExpExecArray | null
      
      while ((match = colorRegex.exec(file.content)) !== null) {
        const lineNumber = file.content.substring(0, match.index).split('\n').length
        matches.push({
          file: file.path,
          line: lineNumber,
          pattern: 'contrast-ratio-check',
          match: match[0],
          context: file.lines[lineNumber - 1]
        })
      }
    }
    
    return matches
  }
}

