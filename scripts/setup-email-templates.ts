/**
 * Setup Email Templates Script
 *
 * This script:
 * 1. Creates default email templates in the database
 * 2. Tests email sending functionality
 * 3. Verifies Resend configuration
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Check your environment variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✓' : '✗'}`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupEmailTemplates() {
  console.log('🔧 Setting up email templates...')

  try {
    // Import ResendService only when needed
    const { resendService } = await import('../lib/email/resend-service.js')

    // Create default templates
    await resendService.createDefaultTemplates()
    console.log('✅ Default email templates created successfully')

    // Verify templates were created
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('name, template_type')
      .is('account_id', null)

    if (error) {
      console.error('❌ Error verifying templates:', error)
      return
    }

    console.log('\n📋 Created templates:')
    templates?.forEach(t => {
      console.log(`  - ${t.name} (${t.template_type})`)
    })

  } catch (error) {
    console.error('❌ Error setting up templates:', error)
  }
}

async function testEmailConfiguration() {
  console.log('\n🧪 Testing email configuration...')

  // Check Resend API key
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured')
    return
  }

  // Check domain configuration
  const domain = process.env.RESEND_VERIFIED_DOMAIN
  if (!domain) {
    console.warn('⚠️  RESEND_VERIFIED_DOMAIN not configured, using default')
  } else {
    console.log(`✅ Domain configured: ${domain}`)
  }

  // Test database connection
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error)
    } else {
      console.log('✅ Database connection successful')
    }
  } catch (error) {
    console.error('❌ Database error:', error)
  }
}

async function sendTestEmail() {
  console.log('\n📧 Sending test email...')

  const testEmail = process.env.TEST_EMAIL
  if (!testEmail) {
    console.log('⚠️  TEST_EMAIL not configured, skipping test email')
    console.log('   To test email sending, add TEST_EMAIL=your-email@example.com to .env.local')
    return
  }

  try {
    // Import the email service only when needed
    const { sendEmail } = await import('../lib/email/service.js')

    // Use the unified email service
    const result = await sendEmail({
      to: testEmail,
      subject: 'CRM-AI PRO Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Email Test Successful!</h2>
          <p>This is a test email from CRM-AI PRO to verify your email configuration is working correctly.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details</h3>
            <ul>
              <li>Provider: Resend</li>
              <li>Domain: ${process.env.RESEND_VERIFIED_DOMAIN || 'default'}</li>
              <li>Sent at: ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          <p style="color: #6b7280;">This is an automated test email. No action is required.</p>
        </div>
      `,
      text: `
Email Test Successful!

This is a test email from CRM-AI PRO to verify your email configuration is working correctly.

Configuration Details:
- Provider: Resend
- Domain: ${process.env.RESEND_VERIFIED_DOMAIN || 'default'}
- Sent at: ${new Date().toLocaleString()}

This is an automated test email. No action is required.
      `
    })

    if (result.success) {
      console.log(`✅ Test email sent successfully to ${testEmail}`)
      console.log(`   Message ID: ${result.messageId}`)
    } else {
      console.error('❌ Failed to send test email:', result.error)
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error)
  }
}

async function testTemplateEmail() {
  console.log('\n📋 Testing template email...')

  const testEmail = process.env.TEST_EMAIL
  if (!testEmail) {
    console.log('⚠️  TEST_EMAIL not configured, skipping template test')
    return
  }

  try {
    // Find the welcome template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Welcome Email')
      .single()

    if (error || !template) {
      console.error('❌ Welcome template not found')
      return
    }

    // Import ResendService only when needed
    const { resendService } = await import('../lib/email/resend-service.js')

    // Send email using template
    const result = await resendService.sendEmail({
      templateId: template.id,
      recipients: [{
        email: testEmail,
        name: 'Test User',
        variables: {
          firstName: 'Test',
          loginUrl: 'https://app.crm-ai-pro.com/login'
        }
      }]
    })

    if (result.success) {
      console.log(`✅ Template email sent successfully to ${testEmail}`)
      console.log(`   Template: ${template.name}`)
      console.log(`   Message ID: ${result.messageId}`)
    } else {
      console.error('❌ Failed to send template email:', result.error)
    }
  } catch (error) {
    console.error('❌ Error sending template email:', error)
  }
}

async function main() {
  console.log('🚀 CRM-AI PRO Email Setup')
  console.log('========================\n')

  await testEmailConfiguration()
  await setupEmailTemplates()
  await sendTestEmail()
  await testTemplateEmail()

  console.log('\n✨ Setup complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Verify you received the test emails')
  console.log('2. Set up your cron job to process the email queue:')
  console.log('   */5 * * * * curl -X POST https://your-domain.com/api/cron/email-queue')
  console.log('3. Configure your Resend webhook URL:')
  console.log('   https://your-domain.com/api/webhooks/resend')
}

// Run the setup
main().catch(console.error)