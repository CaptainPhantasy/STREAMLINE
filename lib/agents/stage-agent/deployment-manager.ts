/**
 * Deployment Manager
 * 
 * Manages staged environments and deployments
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface StagedEnvironment {
  id: string
  path: string
  createdAt: Date
  files: string[]
  manifest: DeploymentManifest
}

export interface DeploymentManifest {
  version: string
  timestamp: string
  files: Array<{
    path: string
    type: string
    hash?: string
  }>
  changes: Array<{
    file: string
    type: 'created' | 'modified' | 'deleted'
  }>
}

/**
 * Deployment Manager class
 */
export class DeploymentManager {
  private stagedDir: string

  constructor(stagedDir: string = './staged') {
    this.stagedDir = stagedDir
  }

  /**
   * Create staged environment
   */
  async createStagedEnvironment(files: string[], description?: string): Promise<StagedEnvironment> {
    const timestamp = new Date()
    const id = this.generateEnvironmentId(timestamp)
    const envPath = path.join(process.cwd(), this.stagedDir, id)

    // Create directory
    await fs.mkdir(envPath, { recursive: true })

    // Copy files
    const copiedFiles: string[] = []
    for (const file of files) {
      const destPath = path.join(envPath, file)
      const destDir = path.dirname(destPath)
      
      await fs.mkdir(destDir, { recursive: true })
      await fs.copyFile(file, destPath)
      copiedFiles.push(file)
    }

    // Generate manifest
    const manifest: DeploymentManifest = {
      version: id,
      timestamp: timestamp.toISOString(),
      files: copiedFiles.map(f => ({
        path: f,
        type: this.getFileType(f)
      })),
      changes: copiedFiles.map(f => ({
        file: f,
        type: 'modified' as const
      }))
    }

    // Write manifest
    const manifestPath = path.join(envPath, 'manifest.json')
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    return {
      id,
      path: envPath,
      createdAt: timestamp,
      files: copiedFiles,
      manifest
    }
  }

  /**
   * Get staged environment
   */
  async getStagedEnvironment(id: string): Promise<StagedEnvironment | null> {
    const envPath = path.join(process.cwd(), this.stagedDir, id)
    
    try {
      const manifestPath = path.join(envPath, 'manifest.json')
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent) as DeploymentManifest

      const files = await this.listFiles(envPath)

      return {
        id,
        path: envPath,
        createdAt: new Date(manifest.timestamp),
        files,
        manifest
      }
    } catch {
      return null
    }
  }

  /**
   * List all staged environments
   */
  async listStagedEnvironments(): Promise<StagedEnvironment[]> {
    const stagedPath = path.join(process.cwd(), this.stagedDir)
    
    try {
      const entries = await fs.readdir(stagedPath, { withFileTypes: true })
      const environments: StagedEnvironment[] = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const env = await this.getStagedEnvironment(entry.name)
          if (env) {
            environments.push(env)
          }
        }
      }

      return environments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch {
      return []
    }
  }

  /**
   * Deploy to Docker
   */
  async deployToDocker(envId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const env = await this.getStagedEnvironment(envId)
      if (!env) {
        return { success: false, error: 'Staged environment not found' }
      }

      // Copy files to Docker context
      // This is a simplified version - full implementation would handle Docker build
      const { stdout, stderr } = await execAsync(`docker build -t crm-ai-pro:${envId} .`, {
        cwd: env.path
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Deploy via Git
   */
  async deployViaGit(envId: string, branch: string = 'staging'): Promise<{ success: boolean; error?: string }> {
    try {
      const env = await this.getStagedEnvironment(envId)
      if (!env) {
        return { success: false, error: 'Staged environment not found' }
      }

      // Copy files back to working directory
      for (const file of env.files) {
        const srcPath = path.join(env.path, file)
        const destPath = path.join(process.cwd(), file)
        const destDir = path.dirname(destPath)
        
        await fs.mkdir(destDir, { recursive: true })
        await fs.copyFile(srcPath, destPath)
      }

      // Commit and push (simplified)
      await execAsync(`git add ${env.files.join(' ')}`, { cwd: process.cwd() })
      await execAsync(`git commit -m "Deploy ${envId}"`, { cwd: process.cwd() })
      await execAsync(`git push origin ${branch}`, { cwd: process.cwd() })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate environment ID
   */
  private generateEnvironmentId(timestamp: Date): string {
    const year = timestamp.getFullYear()
    const month = String(timestamp.getMonth() + 1).padStart(2, '0')
    const day = String(timestamp.getDate()).padStart(2, '0')
    const hour = String(timestamp.getHours()).padStart(2, '0')
    const minute = String(timestamp.getMinutes()).padStart(2, '0')
    const second = String(timestamp.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day}_${hour}-${minute}-${second}`
  }

  /**
   * Get file type
   */
  private getFileType(filePath: string): string {
    const ext = path.extname(filePath).slice(1)
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return 'code'
    if (ext === 'sql') return 'migration'
    if (ext === 'md') return 'documentation'
    if (ext === 'json') return 'config'
    return 'other'
  }

  /**
   * List files in directory
   */
  private async listFiles(dirPath: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true })

      for (const entry of entries) {
        if (entry.isFile() && entry.name !== 'manifest.json') {
          const fullPath = path.join(entry.path || dirPath, entry.name)
          const relativePath = path.relative(dirPath, fullPath)
          files.push(relativePath)
        }
      }
    } catch {
      // Ignore errors
    }

    return files
  }
}

