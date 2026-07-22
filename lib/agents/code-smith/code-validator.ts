/**
 * Code Validator
 * 
 * Validates generated code with ESLint and TypeScript
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  eslintPassed: boolean
  typescriptPassed: boolean
}

/**
 * Code Validator class
 */
export class CodeValidator {
  /**
   * Validate code file
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return {
        valid: false,
        errors: [`File not found: ${filePath}`],
        warnings: [],
        eslintPassed: false,
        typescriptPassed: false
      }
    }

    // Run ESLint
    const eslintResult = await this.runESLint(filePath)
    if (!eslintResult.passed) {
      errors.push(...eslintResult.errors)
      warnings.push(...eslintResult.warnings)
    }

    // Run TypeScript check
    const tsResult = await this.runTypeScriptCheck(filePath)
    if (!tsResult.passed) {
      errors.push(...tsResult.errors)
      warnings.push(...tsResult.warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      eslintPassed: eslintResult.passed,
      typescriptPassed: tsResult.passed
    }
  }

  /**
   * Validate code string
   */
  async validateCode(code: string, filePath: string): Promise<ValidationResult> {
    // Write to temp file
    const tempFile = path.join(process.cwd(), '.temp-validation.ts')
    await fs.writeFile(tempFile, code, 'utf-8')

    try {
      const result = await this.validateFile(tempFile)
      return result
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Run ESLint
   */
  private async runESLint(filePath: string): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
    try {
      const { stdout, stderr } = await execAsync(`npx eslint ${filePath} --format json`, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB
      })

      // Parse ESLint output
      const results = JSON.parse(stdout || '[]')
      const errors: string[] = []
      const warnings: string[] = []

      for (const result of results) {
        for (const message of result.messages || []) {
          if (message.severity === 2) {
            errors.push(`${result.filePath}:${message.line}:${message.column} - ${message.message}`)
          } else if (message.severity === 1) {
            warnings.push(`${result.filePath}:${message.line}:${message.column} - ${message.message}`)
          }
        }
      }

      return {
        passed: errors.length === 0,
        errors,
        warnings
      }
    } catch (error: any) {
      // ESLint might fail if file has errors, but we want to capture them
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout)
          const errors: string[] = []
          const warnings: string[] = []

          for (const result of results) {
            for (const message of result.messages || []) {
              if (message.severity === 2) {
                errors.push(`${result.filePath}:${message.line}:${message.column} - ${message.message}`)
              } else if (message.severity === 1) {
                warnings.push(`${result.filePath}:${message.line}:${message.column} - ${message.message}`)
              }
            }
          }

          return {
            passed: errors.length === 0,
            errors,
            warnings
          }
        } catch {
          // If parsing fails, return error
          return {
            passed: false,
            errors: [error.message || 'ESLint validation failed'],
            warnings: []
          }
        }
      }

      return {
        passed: false,
        errors: [error.message || 'ESLint validation failed'],
        warnings: []
      }
    }
  }

  /**
   * Run TypeScript check
   */
  private async runTypeScriptCheck(filePath: string): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
    try {
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit ${filePath}`, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB
      })

      return {
        passed: true,
        errors: [],
        warnings: []
      }
    } catch (error: any) {
      // TypeScript errors are in stderr
      const errorOutput = error.stderr || error.stdout || error.message
      const errors = errorOutput.split('\n').filter((line: string) => line.trim().length > 0)

      return {
        passed: false,
        errors,
        warnings: []
      }
    }
  }

  /**
   * Check if code follows project patterns
   */
  async checkPatterns(code: string, type: 'component' | 'api' | 'hook' | 'util'): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = []

    // Check for required imports
    if (type === 'component') {
      if (!code.includes("'use client'")) {
        issues.push('Component missing "use client" directive')
      }
      if (!code.includes('import { cn }')) {
        issues.push('Component missing cn utility import')
      }
    }

    // Check for TypeScript types
    if (!code.includes('export interface') && !code.includes('export type')) {
      issues.push('Missing TypeScript type definitions')
    }

    // Check for JSDoc comments
    if (!code.includes('/**')) {
      issues.push('Missing JSDoc documentation')
    }

    return {
      passed: issues.length === 0,
      issues
    }
  }
}

