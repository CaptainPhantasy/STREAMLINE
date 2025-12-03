/**
 * Code Reader - Reads and extracts code from files
 */

import * as fs from 'fs'
import * as path from 'path'

export interface CodeFile {
  path: string
  content: string
  type: 'tsx' | 'ts' | 'css' | 'jsx' | 'js'
  lines: string[]
}

export class CodeReader {
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Find all component files
   */
  async findComponentFiles(): Promise<string[]> {
    const files: string[] = []
    
    // Recursively find all .tsx and .jsx files
    const findFiles = (dir: string): void => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          // Skip node_modules and .next
          if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) {
            continue
          }
          
          if (entry.isDirectory()) {
            findFiles(fullPath)
          } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
            // Only include files in app/ or components/ directories
            const relativePath = path.relative(this.projectRoot, fullPath)
            if (relativePath.startsWith('app/') || relativePath.startsWith('components/')) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    findFiles(path.join(this.projectRoot, 'app'))
    findFiles(path.join(this.projectRoot, 'components'))
    
    return files
  }

  /**
   * Find all CSS files
   */
  async findCSSFiles(): Promise<string[]> {
    const files: string[] = []
    
    // Recursively find all .css files
    const findFiles = (dir: string): void => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          // Skip node_modules and .next
          if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) {
            continue
          }
          
          if (entry.isDirectory()) {
            findFiles(fullPath)
          } else if (entry.isFile() && entry.name.endsWith('.css')) {
            const relativePath = path.relative(this.projectRoot, fullPath)
            // Include CSS files in app/, components/, or root
            if (relativePath.startsWith('app/') || relativePath.startsWith('components/') || !relativePath.includes('/')) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    findFiles(this.projectRoot)
    
    return files
  }

  /**
   * Read a file and return CodeFile
   */
  readFile(filePath: string): CodeFile {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = path.extname(filePath).slice(1) as CodeFile['type']
    const lines = content.split('\n')
    
    return {
      path: filePath,
      content,
      type: ext,
      lines
    }
  }

  /**
   * Read multiple files
   */
  readFiles(filePaths: string[]): CodeFile[] {
    return filePaths.map(path => this.readFile(path))
  }

  /**
   * Get file type from extension
   */
  getFileType(filePath: string): CodeFile['type'] {
    const ext = path.extname(filePath).slice(1)
    return (ext || 'ts') as CodeFile['type']
  }
}

