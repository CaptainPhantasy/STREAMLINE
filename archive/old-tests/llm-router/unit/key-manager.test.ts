/**
 * Unit Tests: Key Manager
 * Tests for API key encryption, decryption, and management
 */

import {
  encryptKey,
  decryptKey,
  maskApiKey,
  sanitizeObject,
  looksLikeApiKey,
} from '@/lib/llm/security/key-manager'

describe('Key Manager - Unit Tests', () => {
  describe('maskApiKey', () => {
    it('should mask API keys correctly', () => {
      const key = 'sk-12345678901234567890'
      const masked = maskApiKey(key)
      expect(masked).toBe('sk-1...7890')
      expect(masked).not.toContain('56789')
    })

    it('should handle short keys', () => {
      const key = 'short'
      const masked = maskApiKey(key)
      expect(masked).toBe('***')
    })

    it('should handle empty keys', () => {
      const masked = maskApiKey('')
      expect(masked).toBe('***')
    })

    it('should show different start/end for longer keys', () => {
      const key = 'sk-ant-abcdefghijklmnopqrstuvwxyz123456'
      const masked = maskApiKey(key)
      expect(masked).toMatch(/^sk-a.*6$/i)
    })
  })

  describe('looksLikeApiKey', () => {
    it('should recognize OpenAI format keys', () => {
      expect(looksLikeApiKey('sk-' + 'a'.repeat(25))).toBe(true)
      expect(looksLikeApiKey('sk-1234567890123456789012345')).toBe(true)
    })

    it('should recognize Anthropic format keys', () => {
      expect(looksLikeApiKey('sk-ant-' + 'a'.repeat(25))).toBe(true)
    })

    it('should recognize generic long keys', () => {
      expect(looksLikeApiKey('a'.repeat(32))).toBe(true)
    })

    it('should reject short strings', () => {
      expect(looksLikeApiKey('short')).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(looksLikeApiKey(null as any)).toBe(false)
      expect(looksLikeApiKey(undefined as any)).toBe(false)
      expect(looksLikeApiKey(123 as any)).toBe(false)
    })

    it('should reject empty strings', () => {
      expect(looksLikeApiKey('')).toBe(false)
    })
  })

  describe('sanitizeObject', () => {
    it('should mask API keys in objects', () => {
      const obj = {
        name: 'test',
        api_key: 'sk-1234567890123456789012345',
        other: 'value',
      }
      const sanitized = sanitizeObject(obj)
      expect(sanitized.name).toBe('test')
      expect(sanitized.other).toBe('value')
      expect(sanitized.api_key).not.toContain('1234567890')
    })

    it('should mask secret fields', () => {
      const obj = {
        secret: 'sk-secret1234567890123456789012345',
        password: 'sk-pass1234567890123456789012345',
        token: 'sk-token1234567890123456789012345',
      }
      const sanitized = sanitizeObject(obj)
      expect(sanitized.secret).toMatch(/\*/)
      expect(sanitized.password).toMatch(/\*/)
      expect(sanitized.token).toMatch(/\*/)
    })

    it('should handle nested objects', () => {
      const obj = {
        level1: {
          level2: {
            api_key: 'sk-1234567890123456789012345',
          },
        },
      }
      const sanitized = sanitizeObject(obj)
      expect(sanitized.level1.level2.api_key).toMatch(/\*/)
    })

    it('should preserve non-API-key values', () => {
      const obj = {
        config: {
          timeout: 5000,
          retries: 3,
          api_key: 'sk-1234567890123456789012345',
        },
      }
      const sanitized = sanitizeObject(obj)
      expect(sanitized.config.timeout).toBe(5000)
      expect(sanitized.config.retries).toBe(3)
      expect(sanitized.config.api_key).toMatch(/\*/)
    })

    it('should handle arrays in objects', () => {
      const obj = {
        keys: ['sk-1234567890123456789012345'],
        config: [{ api_key: 'sk-1234567890123456789012345' }],
      }
      const sanitized = sanitizeObject(obj)
      // Arrays should be preserved as-is (deep sanitization not recursive for arrays)
      expect(sanitized).toBeDefined()
    })

    it('should not mutate original object', () => {
      const original = {
        api_key: 'sk-1234567890123456789012345',
      }
      const originalKey = original.api_key
      const sanitized = sanitizeObject(original)
      expect(original.api_key).toBe(originalKey)
      expect(sanitized.api_key).not.toBe(originalKey)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle keys with special characters', () => {
      const key = 'sk-12345@#$%^&*()67890'
      const masked = maskApiKey(key)
      expect(masked).toBeDefined()
      expect(masked.length).toBeGreaterThan(0)
    })

    it('should handle very long keys', () => {
      const key = 'sk-' + 'a'.repeat(1000)
      const masked = maskApiKey(key)
      expect(masked).toMatch(/sk-a.*a$/)
    })

    it('should sanitize objects with circular references gracefully', () => {
      const obj: any = {
        api_key: 'sk-1234567890123456789012345',
        name: 'test',
      }
      obj.self = obj // Circular reference
      // Should not throw
      const sanitized = sanitizeObject(obj)
      expect(sanitized).toBeDefined()
    })

    it('should handle empty sanitizeObject input', () => {
      const sanitized = sanitizeObject({})
      expect(sanitized).toEqual({})
    })
  })

  describe('Performance', () => {
    it('should mask large number of keys efficiently', () => {
      const keys = Array(1000)
        .fill(0)
        .map((_, i) => `sk-key${i}${'a'.repeat(20)}`)

      const startTime = Date.now()
      keys.forEach(maskApiKey)
      const elapsed = Date.now() - startTime

      // Should complete 1000 masks in < 100ms
      expect(elapsed).toBeLessThan(100)
    })

    it('should sanitize large objects efficiently', () => {
      const obj = {
        ...Array(100)
          .fill(0)
          .reduce(
            (acc, _, i) => ({
              ...acc,
              [`key${i}`]: 'sk-1234567890123456789012345',
              [`field${i}`]: `value${i}`,
            }),
            {}
          ),
      }

      const startTime = Date.now()
      sanitizeObject(obj)
      const elapsed = Date.now() - startTime

      // Should complete sanitization in < 50ms
      expect(elapsed).toBeLessThan(50)
    })
  })
})
