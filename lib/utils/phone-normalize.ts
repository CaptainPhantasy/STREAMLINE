/**
 * Phone Number Normalization Utility
 * 
 * Normalizes phone numbers to 10-digit format for consistent searching
 * Removes all formatting (parentheses, dashes, spaces, dots)
 * Handles various input formats:
 * - (555) 123-4567
 * - 555-123-4567
 * - 555.123.4567
 * - 5551234567
 * - +1 555 123 4567
 * - 1-555-123-4567
 */

export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Handle US numbers with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1) // Remove leading 1
  }
  
  // Return 10-digit number or null if invalid
  if (digits.length === 10) {
    return digits
  }
  
  // If it's not 10 or 11 digits, return original (might be international)
  // But still normalize by removing formatting
  return digits.length > 0 ? digits : null
}

/**
 * Format phone number for display
 * Formats 10-digit number as (XXX) XXX-XXXX
 */
export function formatPhoneNumber(phone: string | null | undefined): string | null {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized || normalized.length !== 10) {
    return phone // Return original if can't normalize
  }
  
  return `(${normalized.substring(0, 3)}) ${normalized.substring(3, 6)}-${normalized.substring(6)}`
}

/**
 * Check if two phone numbers match (normalized comparison)
 */
export function phoneNumbersMatch(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const norm1 = normalizePhoneNumber(phone1)
  const norm2 = normalizePhoneNumber(phone2)
  
  if (!norm1 || !norm2) return false
  return norm1 === norm2
}

