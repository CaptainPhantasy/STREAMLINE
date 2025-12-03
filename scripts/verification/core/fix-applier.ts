/**
 * Fix Applier - Applies fixes to code files
 */

import * as fs from 'fs'
import { Fix } from '../fixers/color-fixer'
import { CodeFile } from './code-reader'

export class FixApplier {
  /**
   * Apply a single fix to a file
   */
  applyFix(file: CodeFile, fix: Fix): boolean {
    try {
      // Read file
      const content = fs.readFileSync(file.path, 'utf-8')
      const lines = content.split('\n')
      
      // Apply fix
      if (lines[fix.line - 1] === fix.original) {
        lines[fix.line - 1] = fix.fixed
        const newContent = lines.join('\n')
        
        // Write back
        fs.writeFileSync(file.path, newContent, 'utf-8')
        return true
      }
      
      return false
    } catch (error) {
      console.error(`Error applying fix to ${file.path}:${fix.line}:`, error)
      return false
    }
  }

  /**
   * Apply multiple fixes to a file
   */
  applyFixes(file: CodeFile, fixes: Fix[]): { applied: number; failed: number } {
    let applied = 0
    let failed = 0
    
    // Sort fixes by line number (descending) to avoid line number shifts
    const sortedFixes = [...fixes].sort((a, b) => b.line - a.line)
    
    // Read file once
    let content = fs.readFileSync(file.path, 'utf-8')
    const lines = content.split('\n')
    
    // Apply fixes
    for (const fix of sortedFixes) {
      if (lines[fix.line - 1] === fix.original) {
        lines[fix.line - 1] = fix.fixed
        applied++
      } else {
        console.warn(`Fix mismatch at ${file.path}:${fix.line}`)
        console.warn(`  Expected: ${fix.original}`)
        console.warn(`  Found: ${lines[fix.line - 1]}`)
        failed++
      }
    }
    
    // Write back once
    if (applied > 0) {
      const newContent = lines.join('\n')
      fs.writeFileSync(file.path, newContent, 'utf-8')
    }
    
    return { applied, failed }
  }

  /**
   * Create backup before applying fixes
   */
  createBackup(file: CodeFile): string {
    const backupPath = `${file.path}.backup`
    const content = fs.readFileSync(file.path, 'utf-8')
    fs.writeFileSync(backupPath, content, 'utf-8')
    return backupPath
  }

  /**
   * Restore from backup
   */
  restoreBackup(file: CodeFile, backupPath: string): boolean {
    try {
      const backupContent = fs.readFileSync(backupPath, 'utf-8')
      fs.writeFileSync(file.path, backupContent, 'utf-8')
      fs.unlinkSync(backupPath)
      return true
    } catch (error) {
      console.error(`Error restoring backup:`, error)
      return false
    }
  }
}

