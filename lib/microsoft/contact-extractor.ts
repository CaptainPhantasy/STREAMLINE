/**
 * Contact Information Extractor from Microsoft Emails
 * Parses email content to extract contact details
 */

import type { ParsedMicrosoftEmail, ExtractedMicrosoftContactInfo } from '@/lib/types/microsoft'

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string | null {
  // Common phone patterns
  const patterns = [
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
    /(\+?[0-9]{1,3}[-.\s]?)?([0-9]{3,4})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4,6})/g, // International
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Clean up the phone number
      const phone = match[0].replace(/[-.\s()]/g, '')
      if (phone.length >= 10) {
        return phone
      }
    }
  }

  return null
}

/**
 * Extract address from text
 */
function extractAddress(text: string): string | null {
  // Look for address patterns (street number, street name, city, state, zip)
  const addressPattern = /\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl)[\s,]+[A-Za-z\s,]+(?:[A-Z]{2})?\s+\d{5}(?:-\d{4})?/i

  const match = text.match(addressPattern)
  if (match) {
    return match[0].trim()
  }

  return null
}

/**
 * Extract company name from text
 */
function extractCompany(text: string): string | null {
  // Look for company indicators
  const companyPatterns = [
    /(?:Company|Corp|Corporation|Inc|LLC|Ltd|Limited)[\s:]+([A-Za-z0-9\s&]+)/i,
    /([A-Za-z0-9\s&]+)\s+(?:Company|Corp|Corporation|Inc|LLC|Ltd|Limited)/i,
  ]

  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Parse email signature
 */
function parseSignature(bodyText: string): {
  name: string | null
  phone: string | null
  address: string | null
  company: string | null
  title: string | null
} {
  // Common signature patterns
  // Look for content after "--" or "---" or before common email closings
  const signatureMarkers = [
    /^--\s*\n(.+)$/m,
    /^---\s*\n(.+)$/m,
    /(?:Best regards|Sincerely|Thanks|Regards)[\s\S]+$/i,
  ]

  let signatureText = ''

  for (const marker of signatureMarkers) {
    const match = bodyText.match(marker)
    if (match) {
      signatureText = match[1] || match[0]
      break
    }
  }

  // If no signature marker found, try last few lines
  if (!signatureText) {
    const lines = bodyText.split('\n')
    if (lines.length > 3) {
      signatureText = lines.slice(-5).join('\n')
    }
  }

  return {
    name: extractNameFromSignature(signatureText),
    phone: extractPhone(signatureText),
    address: extractAddress(signatureText),
    company: extractCompany(signatureText),
    title: extractTitle(signatureText),
  }
}

/**
 * Extract name from signature
 */
function extractNameFromSignature(text: string): string | null {
  // Look for name patterns (First Last or Last, First)
  const namePatterns = [
    /^([A-Z][a-z]+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/m,
    /^([A-Z][a-z]+),\s+([A-Z][a-z]+)$/m,
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      return `${match[1]} ${match[2]}`.trim()
    }
  }

  return null
}

/**
 * Extract job title from signature
 */
function extractTitle(text: string): string | null {
  const titlePatterns = [
    /(?:Title|Position|Role)[\s:]+([A-Za-z\s]+)/i,
    /([A-Za-z\s]+)\s+(?:Manager|Director|VP|President|CEO|CTO|CFO|COO)/i,
  ]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Split full name into first and last name
 */
function splitName(fullName: string | null): {
  firstName: string | null
  lastName: string | null
} {
  if (!fullName) return { firstName: null, lastName: null }

  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null }
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] }
  } else {
    // Multiple parts - assume first is first name, last is last name
    return {
      firstName: parts[0],
      lastName: parts[parts.length - 1],
    }
  }
}

/**
 * Extract contact information from parsed Microsoft email
 */
export function extractContactInfo(parsedEmail: ParsedMicrosoftEmail): ExtractedMicrosoftContactInfo[] {
  const contacts: ExtractedMicrosoftContactInfo[] = []

  // Extract from "From" header
  if (parsedEmail.from.email) {
    const nameParts = splitName(parsedEmail.from.name)
    contacts.push({
      email: parsedEmail.from.email,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: null,
      address: null,
      company: null,
      jobTitle: null,
      confidence: 0.9, // High confidence for header info
      source: 'headers',
    })
  }

  // Extract from "To" recipients
  for (const recipient of parsedEmail.to) {
    if (recipient.email && recipient.email !== parsedEmail.from.email) {
      const nameParts = splitName(recipient.name)
      contacts.push({
        email: recipient.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        phone: null,
        address: null,
        company: null,
        jobTitle: null,
        confidence: 0.8,
        source: 'headers',
      })
    }
  }

  // Extract from email body/signature
  const bodyText = parsedEmail.bodyText || ''
  const signature = parseSignature(bodyText)

  // Enhance existing contacts with signature data
  for (const contact of contacts) {
    if (signature.name && !contact.firstName) {
      const nameParts = splitName(signature.name)
      contact.firstName = nameParts.firstName
      contact.lastName = nameParts.lastName
      contact.source = 'signature'
      contact.confidence = Math.max(contact.confidence, 0.7) // Increase confidence with signature data
    }

    if (signature.phone && !contact.phone) {
      contact.phone = signature.phone
      contact.confidence = Math.max(contact.confidence, 0.6)
    }

    if (signature.address && !contact.address) {
      contact.address = signature.address
      contact.confidence = Math.max(contact.confidence, 0.6)
    }

    if (signature.company && !contact.company) {
      contact.company = signature.company
      contact.confidence = Math.max(contact.confidence, 0.6)
    }

    if (signature.title && !contact.jobTitle) {
      contact.jobTitle = signature.title
      contact.confidence = Math.max(contact.confidence, 0.6)
    }
  }

  // Also extract phone/address from body if not in signature
  if (bodyText) {
    for (const contact of contacts) {
      if (!contact.phone) {
        contact.phone = extractPhone(bodyText)
        if (contact.phone) {
          contact.source = 'body'
          contact.confidence = Math.max(contact.confidence, 0.4)
        }
      }
      if (!contact.address) {
        contact.address = extractAddress(bodyText)
        if (contact.address) {
          contact.source = 'body'
          contact.confidence = Math.max(contact.confidence, 0.4)
        }
      }
    }
  }

  return contacts
}

