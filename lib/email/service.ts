/**
 * Unified Email Service
 * Supports multiple email providers (Resend, Gmail, etc.)
 */

import { Resend } from 'resend'
import { sendGmailEmail } from '@/lib/gmail/service'
import { sendMicrosoftEmail } from '@/lib/microsoft/service'
import { createClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/gmail/encryption'
import { refreshAccessToken } from '@/lib/gmail/auth'
import { refreshAccessToken as refreshMicrosoftToken } from '@/lib/microsoft/auth'

export interface EmailSendOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  inReplyTo?: string
  references?: string
  from?: string
  accountId?: string
  userId?: string
}

export interface EmailSendResult {
  success: boolean
  messageId: string
  provider: 'resend' | 'gmail'
  error?: string
}

/**
 * Send email using the configured provider for the account
 */
export async function sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Get account's email provider preference
  let provider = 'resend' // Default to Resend

  if (options.accountId) {
    // Check for Gmail provider
    let query = supabase
      .from('email_providers')
      .select('*')
      .eq('account_id', options.accountId)
      .eq('is_active', true)

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    } else {
      query = query.is('user_id', null) // Account-level provider
    }

    // Prefer default provider, otherwise get first active
    query = query.order('is_default', { ascending: false })

    const { data: providers } = await query

    if (providers && providers.length > 0) {
      const selectedProvider = providers.find(p => p.is_default) || providers[0]
      provider = selectedProvider.provider
      
      // If Gmail, use Gmail service
      if (provider === 'gmail') {
        try {
          // Decrypt tokens
          let accessToken = decrypt(selectedProvider.access_token_encrypted)
          const refreshToken = decrypt(selectedProvider.refresh_token_encrypted)

          // Check if token expired
          const expiresAt = selectedProvider.token_expires_at ? new Date(selectedProvider.token_expires_at) : null
          const now = new Date()

          if (expiresAt && expiresAt <= now) {
            // Refresh token
            const refreshed = await refreshAccessToken(refreshToken)
            accessToken = refreshed.accessToken

            // Update stored token
            const encryptedAccess = encrypt(refreshed.accessToken)
            await supabase
              .from('email_providers')
              .update({
                access_token_encrypted: encryptedAccess,
                token_expires_at: refreshed.expiryDate?.toISOString() || null,
              })
              .eq('id', selectedProvider.id)
          }

          // Send via Gmail
          const result = await sendGmailEmail(accessToken, refreshToken, {
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
            inReplyTo: options.inReplyTo,
            references: options.references,
            from: options.from || selectedProvider.provider_email,
          })

          return {
            success: true,
            messageId: result.messageId,
            provider: 'gmail',
          }
        } catch (error) {
          console.error('Gmail send error:', error)
          // Fallback to Resend if Gmail fails
          return sendViaResend(options)
        }
      }

      // If Microsoft, use Microsoft service
      if (provider === 'microsoft') {
        try {
          // Decrypt tokens
          let accessToken = decrypt(selectedProvider.access_token_encrypted)
          const refreshToken = decrypt(selectedProvider.refresh_token_encrypted)

          // Check if token expired
          const expiresAt = selectedProvider.token_expires_at ? new Date(selectedProvider.token_expires_at) : null
          const now = new Date()

          if (expiresAt && expiresAt <= now) {
            // Refresh token
            const refreshed = await refreshMicrosoftToken(refreshToken)
            accessToken = refreshed.accessToken

            // Update stored token
            const encryptedAccess = encrypt(refreshed.accessToken)
            await supabase
              .from('email_providers')
              .update({
                access_token_encrypted: encryptedAccess,
                token_expires_at: refreshed.expiryDate?.toISOString() || null,
              })
              .eq('id', selectedProvider.id)
          }

          // Send via Microsoft
          const result = await sendMicrosoftEmail(accessToken, refreshToken, {
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
            inReplyTo: options.inReplyTo,
            references: options.references,
            from: options.from || selectedProvider.provider_email,
          })

          return {
            success: true,
            messageId: result.messageId,
            provider: 'microsoft',
          }
        } catch (error) {
          console.error('Microsoft send error:', error)
          // Fallback to Resend if Microsoft fails
          return sendViaResend(options)
        }
      }
    }
  }

  // Default to Resend
  return sendViaResend(options)
}

/**
 * Check if domain is verified for Resend
 */
async function isDomainVerified(accountId: string, supabase: any): Promise<boolean> {
  try {
    const { data: account } = await supabase
      .from('accounts')
      .select('settings')
      .eq('id', accountId)
      .single()

    if (!account?.settings) return false

    const settings = account.settings as any
    return settings.email_domain_verified === true
  } catch (error) {
    console.error('Error checking domain verification:', error)
    return false
  }
}

/**
 * Send email via Gmail SMTP (fallback)
 */
async function sendViaGmailSMTP(options: EmailSendOptions): Promise<EmailSendResult> {
  // This would use Gmail SMTP with app password
  // For now, return error indicating SMTP not fully implemented
  return {
    success: false,
    messageId: '',
    provider: 'gmail',
    error: 'Gmail SMTP fallback not yet implemented. Please verify your domain or use Gmail OAuth.',
  }
}

/**
 * Send email via Outlook SMTP (fallback)
 */
async function sendViaOutlookSMTP(options: EmailSendOptions): Promise<EmailSendResult> {
  // This would use Outlook SMTP with app password
  // For now, return error indicating SMTP not fully implemented
  return {
    success: false,
    messageId: '',
    provider: 'outlook',
    error: 'Outlook SMTP fallback not yet implemented. Please verify your domain or use Outlook OAuth.',
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(options: EmailSendOptions, checkDomainVerification = true): Promise<EmailSendResult> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    // If Resend not configured, try Gmail SMTP fallback
    if (process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASSWORD) {
      return sendViaGmailSMTP(options)
    }
    // Try Outlook SMTP fallback
    if (process.env.OUTLOOK_SMTP_USER && process.env.OUTLOOK_SMTP_PASSWORD) {
      return sendViaOutlookSMTP(options)
    }
    return {
      success: false,
      messageId: '',
      provider: 'resend',
      error: 'Resend API key not configured and no SMTP fallback available',
    }
  }

    const resend = new Resend(resendKey)

    try {
      const to = Array.isArray(options.to) ? options.to : [options.to]
      const from = options.from || getCrmSenderEmail()

    // Check domain verification if accountId provided
    if (checkDomainVerification && options.accountId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      
      const domainVerified = await isDomainVerified(options.accountId, supabase)
      
      if (!domainVerified) {
        // Domain not verified - try SMTP fallback
        console.warn('Domain not verified, attempting SMTP fallback')
        
        // Try Gmail SMTP first
        if (process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASSWORD) {
          const smtpResult = await sendViaGmailSMTP(options)
          if (smtpResult.success) {
            return smtpResult
          }
        }
        
        // Try Outlook SMTP
        if (process.env.OUTLOOK_SMTP_USER && process.env.OUTLOOK_SMTP_PASSWORD) {
          const smtpResult = await sendViaOutlookSMTP(options)
          if (smtpResult.success) {
            return smtpResult
          }
        }
        
        // If SMTP fallback fails, still try Resend but with warning
        // Resend may work with unverified domain but with limitations
        console.warn('SMTP fallback failed, attempting Resend with unverified domain')
      }
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      headers: {
        ...(options.inReplyTo && { 'In-Reply-To': options.inReplyTo }),
        ...(options.references && { 'References': options.references }),
      },
    })

    if (error) {
      return {
        success: false,
        messageId: '',
        provider: 'resend',
        error: error.message || 'Failed to send email',
      }
    }

    // Track the sent event for analytics
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Add to analytics tracking
    await supabase
      .from('email_analytics')
      .insert({
        message_id: data?.id || '',
        recipient_email: Array.isArray(options.to) ? options.to[0] : options.to,
        event: 'sent',
        timestamp: new Date().toISOString(),
        data: {
          provider: 'resend',
          subject: options.subject,
          accountId: options.accountId
        }
      })

    return {
      success: true,
      messageId: data?.id || '',
      provider: 'resend',
    }
  } catch (error) {
    return {
      success: false,
      messageId: '',
      provider: 'resend',
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

