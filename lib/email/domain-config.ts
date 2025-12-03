/**
 * Email Domain Configuration
 *
 * Centralized configuration for email sender addresses.
 * Uses environment variable RESEND_VERIFIED_DOMAIN to support:
 * - Resend subdomain (immediate, no setup): noreply@[resend-id].resend.dev
 * - Custom verified domain (requires DNS setup): noreply@317plumber.com
 *
 * This prevents hardcoded email addresses across the codebase and allows
 * easy switching between domains without code changes.
 */

/**
 * Get the configured sender email address
 * Falls back to a generic resend.dev address if not configured
 */
export function getSenderEmail(customName?: string): string {
  const domain = process.env.RESEND_VERIFIED_DOMAIN || process.env.NEXT_PUBLIC_RESEND_VERIFIED_DOMAIN

  if (!domain) {
    console.warn('RESEND_VERIFIED_DOMAIN not configured, using default resend.dev domain')
    return 'CRM <noreply@resend.dev>'
  }

  // If domain is a full email address (includes @), use it directly
  if (domain.includes('@')) {
    const name = customName || 'CRM'
    return `${name} <${domain}>`
  }

  // Otherwise, construct email with noreply@ prefix
  const name = customName || 'CRM'
  return `${name} <noreply@${domain}>`
}

/**
 * Get sender email for CRM notifications
 */
export function getCrmSenderEmail(): string {
  return getSenderEmail('CRM')
}

/**
 * Get sender email for job status updates
 */
export function getJobStatusSenderEmail(): string {
  return getSenderEmail('CRM-AI PRO')
}

/**
 * Get sender email for 317 Plumber specific communications
 */
export function get317PlumberSenderEmail(): string {
  const domain = process.env.RESEND_VERIFIED_DOMAIN || process.env.NEXT_PUBLIC_RESEND_VERIFIED_DOMAIN

  // If 317plumber.com is verified, use help@317plumber.com
  if (domain && domain.includes('317plumber.com')) {
    return '317 Plumber <help@317plumber.com>'
  }

  // Otherwise fall back to generic CRM address
  return getCrmSenderEmail()
}

/**
 * Check if email domain is properly configured
 */
export function isEmailDomainConfigured(): boolean {
  const domain = process.env.RESEND_VERIFIED_DOMAIN || process.env.NEXT_PUBLIC_RESEND_VERIFIED_DOMAIN
  return !!domain
}

/**
 * Get the configured domain (for display/logging purposes)
 */
export function getConfiguredDomain(): string {
  const domain = process.env.RESEND_VERIFIED_DOMAIN || process.env.NEXT_PUBLIC_RESEND_VERIFIED_DOMAIN
  return domain || 'resend.dev (default)'
}
