/**
 * Encryption utilities for storing OAuth tokens securely
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set')
  }
  return key
}

/**
 * Encrypt text using AES-256-GCM
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt text using AES-256-GCM
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey()
  const parts = encrypted.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format')
  }
  
  const [ivHex, authTagHex, encryptedText] = parts
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

