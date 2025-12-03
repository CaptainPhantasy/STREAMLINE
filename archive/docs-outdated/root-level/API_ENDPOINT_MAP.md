# API Endpoint Map & Test Results

**Generated:** 2025-11-27
**Total Endpoints:** 158

## Endpoint Categories

### 🔐 Authentication & Authorization
- `POST /api/auth/signout` - Sign out user

### 👤 User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/me` - Get current user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### 🏢 Account & Settings
- `GET /api/account/settings` - Get account settings
- `PUT /api/account/settings` - Update account settings
- `GET /api/settings/company` - Get company settings
- `PUT /api/settings/company` - Update company settings
- `POST /api/settings/company/logo` - Upload company logo
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update user profile
- `POST /api/settings/profile/avatar` - Upload avatar
- `GET /api/settings/notifications` - Get notification settings
- `PUT /api/settings/notifications` - Update notification settings
- `GET /api/settings/ai/providers` - Get AI provider settings
- `PUT /api/settings/ai/providers` - Update AI provider settings

### 👥 Contacts
- `GET /api/contacts` - List contacts (with filters)
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact
- `POST /api/contacts/bulk` - Bulk import contacts
- `POST /api/contacts/bulk-tag` - Bulk tag contacts
- `GET /api/contacts/[id]/notes` - Get contact notes
- `POST /api/contacts/[id]/notes` - Create contact note
- `GET /api/contacts/[id]/tags` - Get contact tags
- `POST /api/contacts/[id]/tags` - Add tag to contact
- `DELETE /api/contacts/[id]/tags/[tagId]` - Remove tag from contact

### 🏷️ Contact Tags
- `GET /api/contact-tags` - List tags
- `POST /api/contact-tags` - Create tag
- `GET /api/contact-tags/[id]` - Get tag
- `PUT /api/contact-tags/[id]` - Update tag
- `DELETE /api/contact-tags/[id]` - Delete tag

### 🛠️ Jobs
- `GET /api/jobs` - List jobs (with filters)
- `POST /api/jobs` - Create job
- `GET /api/jobs/[id]` - Get job
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job
- `POST /api/jobs/bulk` - Bulk operations
- `PATCH /api/jobs/[id]/status` - Update job status
- `POST /api/jobs/[id]/assign` - Assign technician
- `POST /api/jobs/[id]/upload-photo` - Upload job photo
- `PUT /api/jobs/[id]/location` - Update job location
- `GET /api/jobs/[id]/documents` - Get job documents
- `POST /api/jobs/[id]/documents` - Upload job document

### 📸 Job Photos
- `GET /api/job-photos` - List job photos
- `POST /api/job-photos` - Upload photo
- `GET /api/job-photos/[id]` - Get photo
- `DELETE /api/job-photos/[id]` - Delete photo

### 🔧 Job Materials
- `GET /api/job-materials` - List materials
- `POST /api/job-materials` - Add material
- `GET /api/job-materials/[id]` - Get material
- `PUT /api/job-materials/[id]` - Update material
- `DELETE /api/job-materials/[id]` - Delete material

### 💰 Estimates
- `GET /api/estimates` - List estimates
- `POST /api/estimates` - Create estimate
- `POST /api/estimates/quick-create` - Quick create estimate
- `GET /api/estimates/[id]` - Get estimate
- `PUT /api/estimates/[id]` - Update estimate
- `DELETE /api/estimates/[id]` - Delete estimate
- `POST /api/estimates/[id]/send` - Send estimate to customer
- `POST /api/estimates/[id]/convert` - Convert estimate to job
- `POST /api/estimates/[id]/duplicate` - Duplicate estimate
- `GET /api/estimates/[id]/pdf` - Generate estimate PDF

### 🧰 Parts Inventory
- `GET /api/parts` - List parts
- `POST /api/parts` - Create part
- `GET /api/parts/[id]` - Get part
- `PUT /api/parts/[id]` - Update part
- `DELETE /api/parts/[id]` - Delete part
- `GET /api/parts/low-stock` - Get low stock alerts

### 🧾 Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `POST /api/invoices/[id]/send` - Send invoice
- `POST /api/invoices/[id]/mark-paid` - Mark as paid

### 💳 Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/[id]` - Get payment
- `PUT /api/payments/[id]` - Update payment
- `DELETE /api/payments/[id]` - Delete payment

### 💬 Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]` - Get conversation
- `PUT /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation
- `GET /api/conversations/[id]/messages` - Get messages
- `POST /api/conversations/[id]/messages` - Send message
- `GET /api/conversations/[id]/notes` - Get notes
- `POST /api/conversations/[id]/notes` - Add note

### 📞 Call Logs
- `GET /api/call-logs` - List call logs
- `POST /api/call-logs` - Create call log
- `GET /api/call-logs/[id]` - Get call log
- `PUT /api/call-logs/[id]` - Update call log
- `DELETE /api/call-logs/[id]` - Delete call log

### 🔔 Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications/[id]` - Get notification
- `PUT /api/notifications/[id]` - Update notification
- `DELETE /api/notifications/[id]` - Delete notification
- `POST /api/notifications/read-all` - Mark all as read

### 📧 Email & Campaigns
- `GET /api/email-templates` - List email templates
- `POST /api/email-templates` - Create template
- `GET /api/email-templates/[id]` - Get template
- `PUT /api/email-templates/[id]` - Update template
- `DELETE /api/email-templates/[id]` - Delete template
- `GET /api/email-templates/[id]/preview` - Preview template
- `POST /api/email/create-job` - Create job from email
- `POST /api/email/extract-actions` - Extract actions from email
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign
- `POST /api/campaigns/[id]/send` - Send campaign
- `POST /api/campaigns/[id]/pause` - Pause campaign
- `POST /api/campaigns/[id]/resume` - Resume campaign
- `GET /api/campaigns/[id]/recipients` - List recipients
- `POST /api/campaigns/[id]/recipients` - Add recipients
- `DELETE /api/campaigns/[id]/recipients/[contactId]` - Remove recipient

### 🤖 Automation
- `GET /api/automation-rules` - List rules
- `POST /api/automation-rules` - Create rule
- `GET /api/automation-rules/[id]` - Get rule
- `PUT /api/automation-rules/[id]` - Update rule
- `DELETE /api/automation-rules/[id]` - Delete rule
- `GET /api/settings/automation/rules` - List automation rules
- `POST /api/settings/automation/rules` - Create automation rule
- `GET /api/settings/automation/rules/[id]` - Get automation rule
- `PUT /api/settings/automation/rules/[id]` - Update automation rule
- `DELETE /api/settings/automation/rules/[id]` - Delete automation rule
- `POST /api/settings/automation/rules/[id]/toggle` - Toggle rule on/off

### 🤖 AI Features
- `POST /api/ai/suggestions` - Get AI suggestions
- `POST /api/ai/draft` - Draft message with AI
- `POST /api/ai/pricing` - Get AI pricing suggestions
- `POST /api/ai/briefing` - Generate AI briefing
- `POST /api/ai/meeting-summary` - Summarize meeting

### 🧠 LLM & AI Providers
- `GET /api/llm-providers` - List LLM providers
- `POST /api/llm-providers` - Add LLM provider
- `GET /api/llm-providers/[id]` - Get provider
- `PUT /api/llm-providers/[id]` - Update provider
- `DELETE /api/llm-providers/[id]` - Delete provider
- `POST /api/llm` - LLM router endpoint
- `GET /api/llm/health` - LLM health check
- `GET /api/llm/metrics` - LLM metrics

### 🎯 Leads & Pipeline
- `GET /api/leads/pipeline` - Get sales pipeline
- `POST /api/leads/[id]/move` - Move lead in pipeline

### 📊 Analytics & Reports
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/jobs` - Job analytics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/contacts` - Contact analytics
- `GET /api/reports` - List reports
- `POST /api/reports` - Generate report
- `GET /api/reports/customer` - Customer reports
- `GET /api/reports/financial` - Financial reports
- `GET /api/reports/revenue` - Revenue reports
- `GET /api/reports/job-performance` - Job performance
- `GET /api/reports/tech-performance` - Tech performance
- `POST /api/reports/export` - Export report

### 💰 Finance
- `GET /api/finance/stats` - Financial statistics

### 📋 Audit Logs
- `GET /api/audit` - Get audit logs

### 🚚 Dispatch
- `GET /api/dispatch/jobs/active` - Active jobs
- `POST /api/dispatch/auto-assign` - Auto-assign jobs
- `POST /api/dispatch/jobs/[id]/assign` - Assign job
- `GET /api/dispatch/techs` - List techs
- `GET /api/dispatch/techs/[id]/stats` - Tech stats
- `GET /api/dispatch/techs/[id]/activity` - Tech activity
- `GET /api/dispatch/stats` - Dispatch statistics
- `GET /api/dispatch/historical-gps` - Historical GPS data

### 🛠️ Technician Portal
- `GET /api/tech/jobs` - Tech's assigned jobs
- `GET /api/tech/jobs/[id]` - Get tech job
- `PUT /api/tech/jobs/[id]` - Update tech job
- `POST /api/tech/jobs/[id]/status` - Update job status
- `GET /api/tech/gates` - Gate codes/access
- `POST /api/tech/materials/quick-add` - Quick add material
- `POST /api/tech/time-clock` - Clock in/out

### 🏢 Office Manager
- `GET /api/office/clearances` - List clearances
- `POST /api/office/clearances` - Create clearance
- `GET /api/office/clearances/[id]` - Get clearance
- `PUT /api/office/clearances/[id]` - Update clearance
- `DELETE /api/office/clearances/[id]` - Delete clearance
- `GET /api/office/stats` - Office statistics

### 👔 Owner Dashboard
- `GET /api/owner/stats` - Owner statistics

### 💼 Sales
- `GET /api/sales/briefing/[contactId]` - Sales briefing

### 📅 Calendar & Scheduling
- `GET /api/calendar/events` - List events
- `POST /api/calendar/events` - Create event
- `POST /api/calendar/sync` - Sync calendar
- `POST /api/schedule/optimize` - Optimize schedule

### ⏰ Time Tracking
- `GET /api/time-entries` - List time entries
- `POST /api/time-entries` - Create time entry

### 📄 Documents
- `GET /api/documents/[id]` - Get document
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/[id]` - Delete document

### 📷 Photos
- `GET /api/photos` - List photos
- `POST /api/photos` - Upload photo

### 📝 Templates
- `GET /api/templates/jobs` - Job templates
- `GET /api/templates/contacts` - Contact templates

### 🔍 Search
- `POST /api/search` - Global search

### 📤 Export
- `GET /api/export/contacts` - Export contacts
- `GET /api/export/jobs` - Export jobs
- `GET /api/export/invoices` - Export invoices

### 🔗 Integrations
#### Gmail
- `GET /api/integrations/gmail/authorize` - Start OAuth
- `GET /api/integrations/gmail/callback` - OAuth callback
- `GET /api/integrations/gmail/status` - Connection status
- `POST /api/integrations/gmail/sync` - Sync emails
- `POST /api/integrations/gmail/send` - Send email

#### Microsoft/Outlook
- `GET /api/integrations/microsoft/authorize` - Start OAuth
- `GET /api/integrations/microsoft/callback` - OAuth callback
- `GET /api/integrations/microsoft/status` - Connection status
- `POST /api/integrations/microsoft/sync` - Sync emails

#### Google Calendar
- `GET /api/integrations/calendar/google/authorize` - Start OAuth
- `GET /api/integrations/calendar/google/callback` - OAuth callback

### 🔌 Webhooks
- `POST /api/webhooks/elevenlabs` - ElevenLabs webhook
- `POST /api/webhooks/stripe` - Stripe webhook

### 🎙️ Voice & AI Agents
- `POST /api/voice-command` - Voice command
- `POST /api/send-message` - Send message

### 🧑‍🎓 Onboarding
- `GET /api/onboarding/status` - Onboarding status
- `POST /api/onboarding/complete` - Complete onboarding
- `POST /api/onboarding/dismiss` - Dismiss onboarding
- `POST /api/onboarding/restart` - Restart onboarding
- `GET /api/onboarding/analytics` - Onboarding analytics

### 📍 GPS & Location
- `POST /api/gps` - Update GPS location

### 🔧 MCP (Model Context Protocol)
- `POST /api/mcp` - MCP endpoint

### 📊 Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `POST /api/meetings/analyze` - Analyze meeting
- `POST /api/meetings/notes` - Meeting notes

### ⭐ Reviews
- `GET /api/review-requests` - List review requests
- `POST /api/review-requests` - Create review request

### ✍️ Signatures
- `GET /api/signatures` - List signatures
- `POST /api/signatures` - Create signature

### 🧪 Development
- `GET /api/test` - Test endpoint
- `POST /api/seed` - Seed database

---

## Test Results

**Status Legend:**
- ✅ PASS - Endpoint working as expected
- ❌ FAIL - Endpoint returning errors
- ⚠️ WARN - Endpoint works but has issues
- 🔄 SKIP - Skipped (requires special setup)
- ⏳ PENDING - Not yet tested

---

*Testing in progress...*
