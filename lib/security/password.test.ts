import { describe, expect, it } from 'vitest'
import { generateSecurePassword } from './password'

describe('generateSecurePassword', () => {
  it('uses every required character class and the requested length', () => {
    const password = generateSecurePassword(24)
    expect(password).toHaveLength(24)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[2-9]/)
    expect(password).toMatch(/[!@#$%^&*]/)
  })

  it('does not repeat a deterministic output', () => {
    const samples = new Set(Array.from({ length: 32 }, () => generateSecurePassword()))
    expect(samples.size).toBe(32)
  })

  it('rejects unsafe lengths', () => {
    expect(() => generateSecurePassword(11)).toThrow(RangeError)
    expect(() => generateSecurePassword(129)).toThrow(RangeError)
  })
})
