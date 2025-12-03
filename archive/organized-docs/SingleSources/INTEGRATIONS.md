# INTEGRATIONS

**Single Source of Truth** for all third-party service integrations in CRM-AI-PRO.

**Version:** 1.1
**Last Updated:** November 28, 2025 - 08:35 PM
**Status:** ✅ Production Ready

## Overview

CRM-AI-PRO integrates with multiple third-party services to provide comprehensive functionality:

- **Email**: Gmail, Microsoft 365, Resend
- **Calendar**: Google Calendar
- **Payments**: Stripe
- **Voice AI**: ElevenLabs
- **Maps/Geocoding**: Google Maps API
- **Communication**: Resend (transactional emails)

All integrations use OAuth 2.0 where applicable, with encrypted token storage in Supabase.

---

## Gmail Integration

### Overview
- **Location**: `/lib/gmail/`
- **Purpose**: Send emails, sync contacts
- **OAuth Flow**: Google OAuth 2.0
- **API**: Gmail API v1

### Features
1. **OAuth Authentication** (`lib/gmail/auth.ts`)
   - Secure token storage
   - Automatic refresh
   - Multi-account support
   - Token encryption

2. **Email Sending** (`lib/gmail/service.ts`)
   - Send via Gmail API
   - HTML/text support
   - Draft creation
   - Thread handling

3. **Contact Sync** (`lib/gmail/contacts.ts`)
   - Extract contacts
   - Update CRM contacts
   - Merge duplicates

### Setup Instructions
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3002/api/integrations/gmail/callback`
6. Copy Client ID and Secret to `.env.local`

### Database Schema
```sql
-- Stored in email_providers table
CREATE TABLE email_providers (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  provider TEXT, -- 'gmail'
  provider_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN,
  is_default BOOLEAN,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Microsoft 365 Integration

### Overview
- **Location**: `/lib/microsoft/`
- **Purpose**: Send emails via Outlook, sync contacts
- **OAuth Flow**: Microsoft Identity Platform (Azure AD)
- **API**: Microsoft Graph API v1.0

### Features
1. **OAuth Authentication** (`lib/microsoft/auth.ts`)
   - MSAL (Microsoft Authentication Library)
   - Multi-tenant support
   - Token refresh
   - User profile retrieval

2. **Email Sending** (`lib/microsoft/service.ts`)
   - Graph API mail.send
   - HTML/text support
   - Reply threading
   - Draft management

3. **Contact Sync** (`lib/microsoft/contacts.ts`)
   - OneDrive/SharePoint access
   - Contact extraction
   - Profile sync

### Setup Instructions
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory
3. Register new application
4. Add platform: Web
5. Set redirect URI: `http://localhost:3002/api/integrations/microsoft/callback`
6. Create client secret in Certificates & Secrets
7. Add API permissions: Mail.Send, Mail.Read, User.Read
8. Copy Application (client) ID and secret to `.env.local`

### Database Schema
Uses same `email_providers` table with `provider = 'microsoft'`

---

## Google Calendar Integration

### Overview
- **Location**: `/app/api/integrations/calendar/google/`
- **Purpose**: Sync job schedules with Google Calendar
- **OAuth Flow**: Google OAuth 2.0
- **API**: Google Calendar API v3

### Features
- Create calendar events from jobs
- Sync job status changes
- Bidirectional sync (future)

### OAuth Scopes
```javascript
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]
```

### API Routes

#### Authorize
**Endpoint**: `GET /api/integrations/calendar/google/authorize`
**Query**: `?accountId=uuid`
**Purpose**: Generate OAuth URL for calendar access

#### Callback
**Endpoint**: `GET /api/integrations/calendar/google/callback`
**Purpose**: Store calendar credentials
**Storage**: `calendar_providers` table

### Environment Variables
```env
# Uses same credentials as Gmail
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

### Database Schema
```sql
CREATE TABLE calendar_providers (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  provider TEXT, -- 'google'
  provider_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Stripe Integration

### Overview
- **Location**: `/app/api/webhooks/stripe/`
- **Purpose**: Process invoice payments
- **Webhook**: Payment intent events
- **API**: Stripe API v2024-12-18

### Features
1. **Payment Processing**
   - Payment intent creation
   - Invoice payment links
   - Webhook event handling

2. **Webhook Events**
   - `payment_intent.succeeded` → Mark invoice as paid
   - `payment_intent.payment_failed` → Mark payment as failed

3. **Database Updates**
   - Update invoice status
   - Create payment records
   - Update job status to "paid"

### Webhook Route
**Endpoint**: `POST /api/webhooks/stripe`
**Headers**: `stripe-signature`
**Events**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### Webhook Flow
1. Verify signature using `STRIPE_WEBHOOK_SECRET`
2. Parse event type
3. Update database
4. Return 200 OK

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

---

## ElevenLabs Voice Integration

### Overview
- **Location**: MCP server, voice components
- **Purpose**: Voice navigation and AI interaction
- **API**: ElevenLabs API v2
- **Status**: ✅ Production Ready

### Features
1. **MCP Server Integration**
   - 12 CRM tools exposed via MCP protocol
   - Supabase integration
   - Email sending via Resend
   - Webhook handler

2. **Client-Side Integration**
   - ElevenLabs ConVA widget
   - Voice navigation bridge
   - Session management
   - Tool calling interface

3. **Voice Navigation**
   - Navigate to any page
   - Control system features
   - Get information from CRM
   - Create/update records

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ElevenLabs    │    │    MCP Server   │    │   Supabase      │
│   Voice Widget  │───▶│   (12 Tools)     │───▶│   Database      │
│                 │    │                 │    │                 │
│ • Speech-to-text│    │ • 12 CRM tools   │    │ • Auth          │
│ • Text-to-speech│    │ • Tool calling  │    │ • Database      │
│ • ConVA widget  │    │ • Email (Resend)│    │ • Queue         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Voice Navigation
**File**: `/hooks/use-voice-navigation.ts`
**Features**:
- Natural language commands
- Context-aware responses
- Error recovery
- State management

### Commands Supported
- "Take me to jobs" → Navigate to jobs page
- "Show me contacts" → Navigate to contacts
- "Create a job for John" → Create new job
- "What's my schedule?" → Show upcoming jobs
- "Send email to customer" → Trigger email flow

### Environment Variables
```env
ELEVENLABS_API_KEY=your-elevenlabs-key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id
```

---

## Google Maps Integration

### Overview
- **Location**: `/lib/maps/`, dispatch components
- **Purpose**: Geocoding, routing, dispatch optimization
- **API**: Google Maps API v3
- **Features**: Places API, Geocoding API, Directions API

### Features
1. **Geocoding Service**
   - Address to coordinates
   - Reverse geocoding
   - Batch processing

2. **Dispatch Optimization**
   - Distance calculation
   - Travel time estimation
   - Route planning

3. **GPS Tracking**
   - Real-time location updates
   - Distance from job site
   - ETA calculations

### Environment Variables
```env
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## Resend Email Integration

### Overview
- **Location**: `/lib/email/resend-service.ts`, MCP server, various API routes
- **Purpose**: Professional transactional emails with queue system and analytics
- **API**: Resend API v1 with enhanced features
- **Status**: ✅ PRODUCTION READY
- **Last Updated**: November 28, 2025 - 08:35 PM

### Features
1. **Enhanced Email Service** (`lib/email/resend-service.ts`)
   - Template-based email sending with variable substitution
   - Email queue with retry logic (3 attempts with exponential backoff)
   - Batch email sending capability (up to 50 per batch)
   - Scheduled email sending with ISO 8601 datetime support
   - Webhook handling for real-time analytics
   - Support for attachments and custom headers
   - Multi-provider support (Resend, Gmail, Microsoft)

2. **Email Queue System**
   - Automatic retry with exponential backoff (5, 10, 20 minutes)
   - Scheduled email support for future delivery
   - Priority queue support
   - Status tracking (pending, processing, sent, failed, cancelled)
   - Max retry limits (default: 3 attempts)

3. **Email Analytics**
   - Real-time tracking: delivery, opens, clicks, bounces, complaints
   - Daily/weekly/monthly reporting
   - Template performance metrics
   - Delivery rate monitoring (target: >95%)
   - Webhook event processing from Resend

4. **Default Email Templates**
   - **Welcome Email** - New customer onboarding with login link
   - **Job Status Update** - Automated job progress notifications
   - **Invoice Notification** - Professional invoice delivery with amount and due date
   - **Appointment Reminder** - Reduce no-shows with automated reminders

5. **Voice Agent Integration (9 New MCP Tools)**
   - `send_email_template` - Send using predefined templates
   - `send_custom_email` - Send fully customized HTML emails
   - `send_job_status_email` - Automated job status notifications
   - `send_invoice_email` - Invoice delivery with PDF attachment
   - `send_appointment_reminder` - Schedule reminders for appointments
   - `get_email_templates` - List all available templates
   - `get_email_analytics` - Get email performance metrics
   - `list_email_queue` - Monitor email delivery status
   - `create_email_template` - Create custom reusable templates

### API Endpoints
- `POST /api/email` - Send emails (immediate or scheduled)
- `GET /api/email/analytics` - Get email statistics
- `POST /api/webhooks/resend` - Handle Resend webhooks
- `POST /api/cron/email-queue` - Process email queue (for cron job)
- `GET /api/email-templates` - List email templates
- `POST /api/email-templates` - Create new templates

### Database Schema
```sql
-- Email Queue Table
CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  template_id UUID REFERENCES email_templates(id),
  template_variables JSONB DEFAULT '{}',
  from_email TEXT,
  reply_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  provider TEXT NOT NULL DEFAULT 'resend',
  batch_id TEXT
);

-- Email Analytics Table
CREATE TABLE email_analytics (
  id UUID PRIMARY KEY,
  message_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  event TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced, complained
  timestamp TIMESTAMPTZ DEFAULT now(),
  data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  queue_item_id UUID REFERENCES email_queue(id),
  UNIQUE (message_id, recipient_email, event, timestamp)
);
```

### Environment Variables
```env
# Required
RESEND_API_KEY=re_your-resend-api-key
RESEND_VERIFIED_DOMAIN=your-domain.com

# Optional but recommended
RESEND_WEBHOOK_SECRET=your-webhook-secret
CRON_SECRET=your-cron-secret
TEST_EMAIL=your-email@example.com
```

### Setup Instructions

1. **Resend Account Setup**
   - Sign up at [Resend](https://resend.com)
   - Get API key from [API Keys page](https://resend.com/api-keys)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxx`

2. **Domain Configuration**
   - Add and verify your domain in [Resend Domains](https://resend.com/domains)
   - Configure DNS records automatically provided by Resend:
     - TXT record for SPF (prevent spam)
     - CNAME record for DKIM (authenticate emails)
     - MX record for email delivery (optional for replies)

3. **Database Migration**
   ```bash
   supabase db push
   ```

4. **Initialize Email Templates**
   ```bash
   npm run setup:email
   ```

5. **Set Up Cron Job** (for queue processing)
   ```bash
   # Add to crontab (runs every 5 minutes)
   */5 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/email-queue
   ```

6. **Configure Webhook** (optional but recommended)
   - In Resend dashboard, set webhook URL to:
   - `https://your-domain.com/api/webhooks/resend`
   - Generate webhook secret and add to `RESEND_WEBHOOK_SECRET`

### Voice Agent Usage Examples

**Send Job Status Update:**
```javascript
send_job_status_email({
  jobId: "uuid-123",
  status: "completed",
  notes: "All work completed successfully",
  eta: "2:30 PM"
})
```

**Send Welcome Email:**
```javascript
send_email_template({
  templateName: "Welcome Email",
  to: "customer@example.com",
  variables: {
    firstName: "John",
    loginUrl: "https://app.crm-ai-pro.com/login"
  }
})
```

**Schedule Appointment Reminder:**
```javascript
send_appointment_reminder({
  appointmentId: "apt-456",
  customerEmail: "customer@example.com",
  scheduledAt: "2025-02-01T09:00:00Z",
  rescheduleUrl: "https://app.crm-ai-pro.com/reschedule/apt-456"
})
```

### Email Variables
Templates support these variable formats:
- Simple: `{{name}}`
- Formatted dates: `{{date:MM/DD/YYYY}}`
- Conditional blocks: `{{#if condition}}...{{/if}}`

### Analytics Tracking
Monitor email performance through:
- **Delivery Rate**: Should be >95%
- **Open Rate**: Track customer engagement
- **Click Rate**: Measure link effectiveness
- **Bounce Rate**: Identify invalid emails

### Security Considerations
- API keys stored securely in environment variables
- Webhook signature verification enabled
- Row-level security for email data
- Encrypted token storage for other providers
- Rate limiting inherent in Resend API

### Domain Configuration Behavior
The system automatically configures sender emails based on `RESEND_VERIFIED_DOMAIN`:

- If `RESEND_VERIFIED_DOMAIN=317plumber.com`:
  - Default sender: `CRM <noreply@317plumber.com>`
  - 317 Plumber sender: `317 Plumber <help@317plumber.com>`

- If `RESEND_VERIFIED_DOMAIN=noreply@resend.dev`:
  - Uses Resend's subdomain
  - No DNS setup needed
  - Immediate use possible

---

## Environment Variables Reference

### Complete `.env.local` Template
```env
# =============================================================================
# CRM-AI Pro - Third-Party Integrations
# =============================================================================

# -----------------------------------------------------------------------------
# Supabase (Required for all integrations)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# -----------------------------------------------------------------------------
# Gmail Integration (Optional)
# -----------------------------------------------------------------------------
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3002/api/integrations/gmail/callback

# -----------------------------------------------------------------------------
# Microsoft 365 Integration (Optional)
# -----------------------------------------------------------------------------
MICROSOFT_CLIENT_ID=your-azure-application-id
MICROSOFT_CLIENT_SECRET=your-azure-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3002/api/integrations/microsoft/callback

# -----------------------------------------------------------------------------
# Google Maps API (Required for dispatch/geocoding)
# -----------------------------------------------------------------------------
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# -----------------------------------------------------------------------------
# Stripe Payment Processing (Optional)
# -----------------------------------------------------------------------------
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# -----------------------------------------------------------------------------
# ElevenLabs Voice AI (Optional)
# -----------------------------------------------------------------------------
ELEVENLABS_API_KEY=your-elevenlabs-api-key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id

# -----------------------------------------------------------------------------
# Resend Email Integration (Required for emails)
# -----------------------------------------------------------------------------
RESEND_API_KEY=re_your-resend-api-key
RESEND_VERIFIED_DOMAIN=yourdomain.com
RESEND_WEBHOOK_SECRET=your-webhook-secret
CRON_SECRET=your-cron-secret
```

---

## Database Schema

### Core Integration Tables

#### Email Providers
Stores OAuth credentials for email services:
```sql
CREATE TABLE email_providers (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  provider TEXT NOT NULL, -- 'gmail', 'microsoft', 'resend'
  provider_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_email_providers_account_user ON email_providers(account_id, user_id);
CREATE INDEX idx_email_providers_provider ON email_providers(provider);
CREATE INDEX idx_email_providers_active ON email_providers(is_active, is_default);
```

#### Calendar Providers
Stores OAuth credentials for calendar services:
```sql
CREATE TABLE calendar_providers (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  provider TEXT NOT NULL, -- 'google', 'outlook'
  provider_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Security & Encryption

### Token Storage
All OAuth tokens are encrypted using PostgreSQL's `pgcrypto` extension:

```sql
-- Encryption key
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt function
CREATE OR REPLACE FUNCTION encrypt_token(data TEXT)
RETURNS TEXT AS $$
  SELECT encode(encrypt(data::bytea, current_setting('app.encryption_key')::bytea, 'aes'), 'base64');
$$ LANGUAGE sql SECURITY DEFINER;

-- Decrypt function
CREATE OR REPLACE FUNCTION decrypt_token(data TEXT)
RETURNS TEXT AS $$
  SELECT convert_from(decrypt(decode(data, 'base64'), current_setting('app.encryption_key')::bytea, 'aes'), 'UTF8');
$$ LANGUAGE sql SECURITY DEFINER;
```

### OAuth Security Best Practices
1. **State Parameter**: Use random state to prevent CSRF
2. **PKCE**: Code Challenge for public clients (mobile)
3. **Token Refresh**: Automatic refresh before expiry
4. **Scope Limitation**: Request only necessary permissions
5. **HTTPS**: Always use HTTPS for OAuth callbacks

---

## Troubleshooting

### Common Issues and Solutions

#### Gmail Integration
**Problem**: "invalid_client"
**Solution**: Check Client ID and Redirect URI match Google Console

**Problem**: "redirect_uri_mismatch"
**Solution**: Add exact callback URL to Authorized Redirect URIs

**Problem**: "access_denied"
**Solution**: User denied authorization, ask to try again

#### Microsoft Integration
**Problem**: "AADSTS700016: Application not found"
**Solution**: Check Tenant ID (use 'common' for multi-tenant)

**Problem**: "AADSTS65004: User consent required"
**Solution**: Grant admin consent for permissions

#### Stripe Integration
**Problem**: "No such webhook endpoint"
**Solution**: Check webhook ID is valid

**Problem**: "Invalid signature"
**Solution**: Verify webhook secret matches Stripe dashboard

#### Resend Integration
**Problem**: "RESEND_API_KEY is missing"
**Solution**: Create API key at resend.com and add to `.env.local`

**Problem**: "Domain not verified"
**Solution**:
1. Add domain in Resend dashboard
2. Add DNS records
3. Wait for verification
4. Or use default `resend.dev` domain

#### General
**Problem**: "Database connection failed"
**Solution**: Check Supabase credentials and network access

**Problem**: "CORS errors"
**Solution**: Add domain to CORS allowlist

---

### Debugging Tips

1. **Check Environment Variables**
   ```bash
   npm run env:check
   ```

2. **Verify OAuth Flow**
   - Check redirect URIs match exactly
   - Ensure HTTPS in production
   - Verify state parameter matches

3. **Monitor Database**
   ```sql
   SELECT * FROM email_providers WHERE is_active = true;
   SELECT * FROM calendar_providers WHERE is_active = true;
   ```

4. **Test API Keys**
   - Use Postman or curl to test endpoints
   - Check API key permissions
   - Verify rate limits

5. **Check Logs**
   ```bash
   # Supabase logs
   supabase logs functions
   ```

---

## API Documentation

### OAuth Endpoints

#### Gmail
```
GET /api/integrations/gmail/authorize
GET /api/integrations/gmail/callback
GET /api/integrations/gmail/status
POST /api/integrations/gmail/sync
```

#### Microsoft
```
GET /api/integrations/microsoft/authorize
GET /api/integrations/microsoft/callback
GET /api/integrations/microsoft/status
POST /api/integrations/microsoft/sync
```

#### Google Calendar
```
GET /api/integrations/calendar/google/authorize
GET /api/integrations/calendar/google/callback
POST /api/integrations/calendar/google/sync/:accountId
```

### Webhook Endpoints

#### Stripe
```
POST /api/webhooks/stripe
Headers: stripe-signature
Events: payment_intent.succeeded, payment_intent.payment_failed
```

#### Resend
```
POST /api/webhooks/resend
Headers: resend-signature
Events: All email events (delivered, opened, clicked, bounced)
```

---

## Performance Considerations

### API Rate Limits
- **Gmail**: 100 requests/100 seconds per user
- **Microsoft**: 10,000 requests/10 seconds per app
- **Google Maps**: $7 per 1000 requests
- **Resend**: 100 requests/second
- **Stripe**: 25 requests/second

### Optimization Strategies
1. **Batch Operations**: Process multiple items in single API call
2. **Caching**: Cache frequently accessed data
3. **Queue Processing**: Use background jobs for heavy operations
4. **Retry Logic**: Implement exponential backoff
5. **Connection Pooling**: Reuse HTTP connections

---

## Getting Help

1. Check this documentation first
2. Review environment variable configuration
3. Test individual integrations separately
4. Check API provider documentation:
   - [Gmail API](https://developers.google.com/gmail/api)
   - [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/api)
   - [Stripe API](https://stripe.com/docs/api)
   - [ElevenLabs API](https://elevenlabs.io/docs)
   - [Google Maps API](https://developers.google.com/maps)
   - [Resend API](https://resend.com/docs)

---

**Maintained by:** CRM-AI PRO Development Team
**Total Integrations:** 7
**Status:** ✅ All integrations production ready