# Database Schema Knowledge Base

**Last Updated**: 13:29:46 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Complete understanding of database schema, constraints, and RLS policies for bug finder configuration

---

## 1. Database Schema Overview

### 1.1 Schema Statistics

- **Total Tables**: 80+ tables in `public` schema
- **RLS Enabled**: All tables have Row Level Security enabled
- **Multi-Tenant**: All tables use `account_id` for tenant isolation
- **Primary Keys**: All tables use UUID primary keys (`id` column)

### 1.2 Core Tables

#### Accounts & Users
- `accounts` - Multi-tenant account records
- `users` - User accounts linked to auth.users
- `account_settings` - Per-account configuration

#### Contacts & Relationships
- `contacts` - Customer/contact records
- `contact_tags` - Contact tag definitions
- `contact_tag_assignments` - Contact-to-tag relationships
- `contact_notes` - Notes linked to contacts

#### Jobs & Work Orders
- `jobs` - Work order/job records
- `job_gates` - Job workflow gates/stages
- `job_photos` - Job documentation photos
- `job_parts` - Parts used on jobs
- `job_materials` - Materials used on jobs
- `job_notes` - Notes linked to jobs
- `job_checklist_items` - Job checklist items
- `job_checklist_templates` - Reusable checklist templates

#### Financial
- `invoices` - Invoice records
- `payments` - Payment records
- `estimates` - Estimate/quote records
- `signatures` - E-signatures for estimates/jobs

#### Messaging & Communication
- `conversations` - Conversation threads
- `messages` - Individual messages
- `direct_messages` - Direct user-to-user messages
- `call_logs` - Phone call logs
- `notifications` - User notifications

#### Inventory & Parts
- `parts` - Parts/inventory items
- `part_bundles` - Part bundles/kits
- `part_bundle_items` - Parts in bundles
- `part_usage_history` - Part usage tracking
- `suppliers` - Supplier/vendor records
- `inventory_locations` - Storage locations

#### Scheduling & Dispatch
- `calendar_providers` - External calendar integrations
- `calendar_events` - Calendar events
- `gps_logs` - GPS tracking logs
- `geofences` - Geofence definitions
- `route_waypoints` - Non-billable route stops
- `resources` - Schedulable resources (techs, vehicles, equipment)
- `resource_assignments` - Resource-to-job assignments
- `working_hours` - Resource working hours

#### Marketing
- `campaigns` - Marketing campaigns
- `campaign_recipients` - Campaign recipient tracking
- `email_templates` - Email templates
- `email_queue` - Email queue for sending
- `email_analytics` - Email analytics
- `email_providers` - Email provider configurations
- `marketing_automations` - Automated follow-up sequences

#### AI & LLM
- `llm_providers` - LLM provider configurations
- `llm_usage_logs` - LLM usage tracking
- `knowledge_docs` - RAG knowledge documents
- `agent_memory` - Voice agent conversation memory

#### Meetings & Sales
- `meetings` - Meeting records
- `sales_interactions` - Sales interaction tracking
- `sales_coaching_sessions` - AI sales coaching

#### Time Tracking
- `time_entries` - Time clock entries

#### Tags & Notes
- `tags` - General tags
- `notes` - General notes
- `job_notes` - Job-to-note relationships
- `contact_notes` - Contact-to-note relationships

#### Voice & Navigation
- `voice_navigation_commands` - Voice navigation commands

#### Audit & Compliance
- `crmai_audit` - Audit log
- `automation_rules` - Business automation rules
- `compliance_rules` - Compliance rule definitions
- `compliance_checks` - Compliance check results

#### Advanced Features (AI Predictions)
- `ai_job_estimates` - AI job cost estimates
- `sentiment_analyses` - Sentiment analysis results
- `equipment_registry` - Equipment registry
- `equipment_maintenance` - Equipment maintenance records
- `equipment_predictions` - Equipment failure predictions
- `dynamic_pricing_rules` - Dynamic pricing rules
- `risk_assessments` - Job risk assessments
- `churn_predictions` - Customer churn predictions
- `route_plans` - Optimized route plans
- `route_plan_jobs` - Jobs in route plans
- `photo_analyses` - AI photo analysis
- `signature_verifications` - Signature verification results
- `document_scans` - Document scan results
- `video_support_sessions` - Video support sessions
- `iot_devices` - IoT device registry
- `iot_device_monitoring` - IoT device monitoring
- `blockchain_transactions` - Blockchain payment transactions
- `ar_models` - AR model definitions
- `ar_previews` - AR preview records
- `candidate_profiles` - Job candidate profiles
- `candidate_evaluations` - AI candidate evaluations
- `voice_clones` - Voice clone records

#### User Management
- `user_profile_photos` - User profile photos (up to 6 per user)

---

## 2. Table Structure Details

### 2.1 Core Tables Schema

#### accounts
- `id` (uuid, PK) - Account UUID
- `name` (text) - Account name
- `slug` (text, unique) - Account slug
- `inbound_email_domain` (text, nullable) - Email domain
- `settings` (jsonb, default '{}') - Account settings
- `created_at` (timestamptz, default now()) - Creation timestamp
- `persona_config` (jsonb, default '{}') - Persona configuration
- `google_review_link` (text, nullable) - Google review link

**RLS**: Enabled  
**Policies**: Users can read own account

#### users
- `id` (uuid, PK, FK to auth.users.id) - User UUID
- `account_id` (uuid, FK to accounts.id) - Account membership
- `full_name` (text, nullable) - User full name
- `role` (text, check constraint) - User role: 'super_admin' | 'admin' | 'owner' | 'manager' | 'assistant_manager' | 'dispatcher' | 'tech' | 'sales' | 'csr'
- `avatar_url` (text, nullable) - Avatar URL
- `timezone` (text, default 'America/New_York') - User timezone
- `language` (text, default 'en') - UI language
- `notification_preferences` (jsonb, default '{}') - Notification preferences
- `bio` (text, nullable) - User biography
- `do_not_delete` (boolean, default false) - Protection flag
- `phone` (text, nullable) - Phone number
- `department` (text, nullable) - Department
- `created_at` (timestamptz, default now()) - Creation timestamp
- `updated_at` (timestamptz, default now()) - Update timestamp
- `is_active` (boolean, default true) - Active status
- `banned_until` (timestamptz, nullable) - Ban expiration
- `ban_reason` (text, nullable) - Ban reason

**RLS**: Enabled  
**Policies**:
- Users can view own profile
- Users can update own profile
- Users can insert own profile
- Admins can view all users
- Admins can update all users

#### contacts
- `id` (uuid, PK) - Contact UUID
- `account_id` (uuid, FK to accounts.id) - Account membership
- `email` (text, nullable) - Email address
- `phone` (text, nullable) - Phone number
- `first_name` (text, nullable) - First name
- `last_name` (text, nullable) - Last name
- `address` (text, nullable) - Address
- `created_at` (timestamptz, default now()) - Creation timestamp
- `lead_source` (text, nullable) - Lead source
- `lead_source_detail` (text, nullable) - Lead source detail
- `utm_campaign` (text, nullable) - UTM campaign
- `utm_source` (text, nullable) - UTM source
- `utm_medium` (text, nullable) - UTM medium
- `profile` (jsonb, default '{}') - Personal details JSON

**RLS**: Enabled  
**Policies**: Users can manage contacts in own account

#### jobs
- `id` (uuid, PK) - Job UUID
- `account_id` (uuid, FK to accounts.id) - Account membership
- `contact_id` (uuid, FK to contacts.id, nullable) - Associated contact
- `conversation_id` (uuid, FK to conversations.id, nullable) - Associated conversation
- `status` (text, check constraint) - Status: 'lead' | 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'invoiced' | 'paid'
- `scheduled_start` (timestamptz, nullable) - Scheduled start time
- `scheduled_end` (timestamptz, nullable) - Scheduled end time
- `tech_assigned_id` (uuid, FK to users.id, nullable) - Assigned technician
- `description` (text, nullable) - Job description
- `total_amount` (integer, nullable) - Total amount (cents)
- `stripe_payment_link` (text, nullable) - Stripe payment link
- `created_at` (timestamptz, default now()) - Creation timestamp
- `invoice_id` (uuid, FK to invoices.id, nullable) - Associated invoice
- `invoice_number` (text, nullable) - Invoice number
- `invoice_date` (timestamptz, nullable) - Invoice date
- `notes` (text, nullable) - Job notes
- `customer_signature_url` (text, nullable) - Signature URL
- `completion_notes` (text, nullable) - Completion notes
- `start_location_lat` (numeric, nullable) - Start latitude
- `start_location_lng` (numeric, nullable) - Start longitude
- `complete_location_lat` (numeric, nullable) - Complete latitude
- `complete_location_lng` (numeric, nullable) - Complete longitude
- `lead_source` (text, nullable) - Lead source
- `address` (text, nullable) - Job address
- `full_address` (jsonb, nullable) - Structured address
- `request_status` (text, check constraint, nullable) - Request status: 'pending' | 'approved' | 'rejected' | NULL

**RLS**: Enabled  
**Policies**: Users can manage jobs in own account

#### invoices
- `id` (uuid, PK) - Invoice UUID
- `account_id` (uuid, FK to accounts.id) - Account membership
- `job_id` (uuid, FK to jobs.id, nullable) - Associated job
- `contact_id` (uuid, FK to contacts.id) - Customer contact
- `invoice_number` (text, unique) - Invoice number
- `amount` (integer) - Amount (cents)
- `tax_amount` (integer, default 0) - Tax amount (cents)
- `total_amount` (integer) - Total amount (cents)
- `status` (text, check constraint, default 'draft') - Status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
- `due_date` (timestamptz, nullable) - Due date
- `paid_at` (timestamptz, nullable) - Payment timestamp
- `stripe_payment_link` (text, nullable) - Stripe payment link
- `stripe_payment_intent_id` (text, nullable) - Stripe payment intent
- `notes` (text, nullable) - Invoice notes
- `created_at` (timestamptz, default now()) - Creation timestamp
- `updated_at` (timestamptz, default now()) - Update timestamp

**RLS**: Enabled  
**Policies**: Users can manage invoices for their account

#### conversations
- `id` (uuid, PK) - Conversation UUID
- `account_id` (uuid, FK to accounts.id) - Account membership
- `contact_id` (uuid, FK to contacts.id, nullable) - Associated contact
- `status` (text, check constraint, default 'open') - Status: 'open' | 'closed' | 'snoozed'
- `subject` (text, nullable) - Subject line
- `channel` (text, default 'email') - Channel type
- `last_message_at` (timestamptz, default now()) - Last message timestamp
- `assigned_to` (uuid, FK to users.id, nullable) - Assigned user
- `ai_summary` (text, nullable) - AI-generated summary
- `sla_target_minutes` (integer, nullable) - SLA target (minutes)
- `sla_status` (text, check constraint, nullable) - SLA status: 'on_track' | 'at_risk' | 'breached'
- `ai_routed_to` (uuid, FK to auth.users.id, nullable) - AI routing target
- `routing_confidence` (numeric, nullable) - Routing confidence (0-100)
- `first_response_at` (timestamptz, nullable) - First response timestamp
- `sla_breached_at` (timestamptz, nullable) - SLA breach timestamp

**RLS**: Enabled  
**Policies**: Users can manage conversations in own account

#### messages
- `id` (uuid, PK) - Message UUID
- `account_id` (uuid, FK to accounts.id) - Account membership
- `conversation_id` (uuid, FK to conversations.id) - Parent conversation
- `direction` (text, check constraint) - Direction: 'inbound' | 'outbound'
- `sender_type` (text, check constraint) - Sender type: 'contact' | 'user' | 'ai_agent'
- `sender_id` (uuid, nullable) - Sender ID
- `subject` (text, nullable) - Subject line
- `body_text` (text, nullable) - Plain text body
- `body_html` (text, nullable) - HTML body
- `attachments` (jsonb, default '[]') - Attachments array
- `message_id` (text, nullable) - Message ID
- `in_reply_to` (text, nullable) - Reply-to message ID
- `is_internal_note` (boolean, default false) - Internal note flag
- `created_at` (timestamptz, default now()) - Creation timestamp

**RLS**: Enabled  
**Policies**: Users can manage messages in own account

---

## 3. Row Level Security (RLS) Policies

### 3.1 RLS Helper Functions

#### get_user_account_id()
```sql
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid AS $$
  SELECT account_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```
- Returns the current user's account_id
- Used in RLS policies for account isolation
- Marked as STABLE for performance optimization

#### current_account_id()
```sql
-- Uses app.current_account_id session variable
-- Set by application layer before queries
```

#### current_user_id()
```sql
-- Uses app.current_user_id session variable
-- Set by application layer before queries
```

#### current_user_role()
```sql
-- Uses app.current_user_role session variable
-- Set by application layer before queries
```

#### is_current_user_admin()
```sql
-- Helper function to check if current user is admin/owner
-- Used in users table policies
```

### 3.2 RLS Policy Patterns

#### Pattern 1: Account Isolation (Most Common)
```sql
CREATE POLICY "Users can manage [table] for their account"
ON [table] FOR ALL
USING (account_id = get_user_account_id())
WITH CHECK (account_id = get_user_account_id());
```

**Used by**: contacts, conversations, messages, jobs, knowledge_docs, parts, etc.

#### Pattern 2: Account Isolation with current_account_id()
```sql
CREATE POLICY "Users can manage [table] for their account"
ON [table] FOR ALL
USING (account_id = current_account_id())
WITH CHECK (account_id = current_account_id());
```

**Used by**: campaigns, email_templates, invoices, etc.

#### Pattern 3: Role-Based Access (Admin/Owner Only)
```sql
CREATE POLICY "Admins can manage [table]"
ON [table] FOR ALL
USING (
  account_id = get_user_account_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  account_id = get_user_account_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);
```

**Used by**: llm_providers, email_providers, account_settings

#### Pattern 4: User-Specific Access
```sql
CREATE POLICY "Users can manage their own [table]"
ON [table] FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Used by**: notifications, user_profile_photos

#### Pattern 5: Service Role Access
```sql
CREATE POLICY "Service role can insert [table]"
ON [table] FOR INSERT
WITH CHECK (true);
```

**Used by**: crmai_audit, email_analytics, voice_navigation_commands, notifications

#### Pattern 6: Related Table Access
```sql
CREATE POLICY "Users can manage [table] for [related_table] in their account"
ON [table] FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM [related_table]
    WHERE id = [table].[related_id]
    AND account_id = current_account_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM [related_table]
    WHERE id = [table].[related_id]
    AND account_id = current_account_id()
  )
);
```

**Used by**: contact_notes, job_notes, campaign_recipients

### 3.3 Complete RLS Policy Inventory

#### accounts
- **SELECT**: Users can read own account

#### users
- **SELECT**: Users can view own profile
- **SELECT**: Admins can view all users
- **UPDATE**: Users can update own profile
- **UPDATE**: Admins can update all users
- **INSERT**: Users can insert own profile

#### contacts
- **ALL**: Users can manage contacts in own account

#### conversations
- **ALL**: Users can manage conversations in own account

#### messages
- **ALL**: Users can manage messages in own account

#### jobs
- **ALL**: Users can manage jobs in own account

#### job_gates
- **SELECT**: Allow authenticated select gates
- **INSERT**: Allow authenticated insert gates
- **UPDATE**: Allow authenticated update gates

#### job_photos
- **SELECT**: Users can view photos from their account
- **INSERT**: Users can insert photos for their account
- **UPDATE**: Users can update photos for their account
- **DELETE**: Users can delete photos for their account

#### job_parts
- **ALL**: Users can manage job parts for their account

#### job_materials
- **ALL**: Users can manage job materials for their account

#### job_notes
- **SELECT**: Users can view job notes from their account
- **INSERT**: Users can create job notes for jobs in their account
- **DELETE**: Users can delete job notes from their account

#### job_checklist_items
- **ALL**: Users can manage checklist items for their account
- **SELECT**: Users can view checklist items for their account

#### job_checklist_templates
- **ALL**: Users can manage checklist templates for their account
- **SELECT**: Users can view checklist templates for their account

#### invoices
- **ALL**: Users can manage invoices for their account

#### payments
- **ALL**: Users can manage payments for their account

#### estimates
- **SELECT**: Users can view estimates for their account
- **INSERT**: Users can create estimates for their account
- **UPDATE**: Users can update estimates for their account
- **DELETE**: Users can delete estimates for their account

#### signatures
- **ALL**: Users can manage signatures for their account

#### parts
- **ALL**: Users can manage parts for their account

#### part_bundles
- **ALL**: Users can manage bundles for their account
- **SELECT**: Users can view bundles for their account

#### part_bundle_items
- **ALL**: Users can manage bundle items for their account
- **SELECT**: Users can view bundle items for their account

#### part_usage_history
- **SELECT**: Users can view usage history for their account
- **INSERT**: Users can create usage history for their account

#### suppliers
- **ALL**: Users can manage suppliers for their account
- **SELECT**: Users can view suppliers for their account

#### inventory_locations
- **ALL**: Users can manage locations for their account
- **SELECT**: Users can view locations for their account

#### campaigns
- **ALL**: Users can manage campaigns for their account

#### campaign_recipients
- **ALL**: Users can manage campaign recipients for their account

#### email_templates
- **ALL**: Users can manage email templates for their account

#### email_queue
- **SELECT**: Users can view their own account's email queue
- **INSERT**: Users can insert their own account's email queue
- **UPDATE**: Users can update their own account's email queue

#### email_analytics
- **INSERT**: Service role can insert email analytics

#### email_providers
- **ALL**: Admins can manage email providers for their account

#### marketing_automations
- **ALL**: Users can manage automations for their account
- **SELECT**: Users can view automations for their account

#### calendar_providers
- **ALL**: Users can manage calendar providers for their account

#### calendar_events
- **ALL**: Users can manage calendar events for their account

#### gps_logs
- **ALL**: Users can manage own gps_logs

#### geofences
- **ALL**: Users can manage geofences for their account
- **SELECT**: Users can view geofences for their account

#### route_waypoints
- **SELECT**: Technicians can view their own route waypoints
- **SELECT**: Dispatchers can view all route waypoints in account
- **ALL**: Admins can manage all route waypoints

#### resources
- **ALL**: Users can manage resources for their account
- **SELECT**: Users can view resources for their account

#### resource_assignments
- **ALL**: Users can manage resource assignments for their account
- **SELECT**: Users can view resource assignments for their account

#### working_hours
- **ALL**: Users can manage working hours for their account
- **SELECT**: Users can view working hours for their account

#### meetings
- **SELECT**: Users can view own account meetings
- **INSERT**: Users can create meetings
- **UPDATE**: Users can update own meetings

#### call_logs
- **ALL**: Users can manage call logs for their account

#### notifications
- **SELECT**: Users can view their own notifications
- **UPDATE**: Users can update their own notifications
- **INSERT**: System can create notifications for users

#### tags
- **SELECT**: Users can view tags from their account
- **INSERT**: Users can create tags for their account
- **UPDATE**: Users can update tags from their account
- **DELETE**: Users can delete tags from their account

#### contact_tags
- **ALL**: Users can manage contact tags for their account

#### contact_tag_assignments
- **ALL**: Users can manage contact tag assignments for their account

#### notes
- **SELECT**: Users can view notes from their account
- **INSERT**: Users can create notes for their account
- **UPDATE**: Users can update notes from their account
- **DELETE**: Users can delete notes from their account

#### contact_notes
- **SELECT**: Users can view contact notes from their account
- **INSERT**: Users can create contact notes for contacts in their account
- **DELETE**: Users can delete contact notes from their account

#### time_entries
- **ALL**: Users can manage time entries for their account

#### knowledge_docs
- **ALL**: Users can manage knowledge docs in own account

#### llm_providers
- **SELECT**: Users can read llm providers (account or null)
- **SELECT**: Users can read llm providers in own account (non-admin)
- **INSERT**: Admins can insert llm providers
- **UPDATE**: Admins can update llm providers
- **DELETE**: Admins can delete llm providers

#### llm_usage_logs
- **INSERT**: System can insert LLM usage logs
- **SELECT**: Users can view their own LLM usage
- **SELECT**: Admins can view all LLM usage in account

#### crmai_audit
- **SELECT**: Users can read audit logs in own account
- **INSERT**: Service role can insert audit logs

#### automation_rules
- **ALL**: Users can manage automation rules for their account

#### compliance_rules
- **SELECT**: Users can read compliance rules
- **ALL**: Admins can manage compliance rules

#### account_settings
- **SELECT**: Users can view account settings for their account
- **INSERT**: Owner and admin can insert account settings
- **UPDATE**: Owner and admin can update account settings
- **DELETE**: Only owner can delete account settings

#### user_profile_photos
- **ALL**: Users can manage their own profile photos
- **SELECT**: Users can view profile photos for their account

#### direct_messages
- **SELECT**: Users can view messages they sent or received
- **INSERT**: Users can send messages to users in their account
- **UPDATE**: Users can update messages they received (mark as read)

#### voice_navigation_commands
- **SELECT**: Users can view navigation commands from their account
- **INSERT**: Service role can insert navigation commands
- **UPDATE**: Users can update execution status for their account

#### agent_memory
- **ALL**: Allow full access to agent_memory

---

## 4. Constraints and Indexes

### 4.1 Primary Keys
All tables use UUID primary keys named `id` with default `gen_random_uuid()` or `uuid_generate_v4()`.

### 4.2 Foreign Keys
All tables with `account_id` have foreign key constraints to `accounts.id`.  
All tables with `user_id` have foreign key constraints to `users.id` or `auth.users.id`.

### 4.3 Unique Constraints
- `accounts.slug` - Unique account slug
- `invoices.invoice_number` - Unique invoice number
- `estimates.estimate_number` - Unique estimate number
- `users.id` - Links to auth.users.id (unique)

### 4.4 Check Constraints
- `users.role` - Must be one of: 'owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr'
- `jobs.status` - Must be one of: 'lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid'
- `invoices.status` - Must be one of: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
- `conversations.status` - Must be one of: 'open', 'closed', 'snoozed'
- `messages.direction` - Must be 'inbound' or 'outbound'
- `messages.sender_type` - Must be 'contact', 'user', or 'ai_agent'

### 4.5 Indexes
- All foreign key columns are indexed
- `account_id` columns are indexed for RLS performance
- Composite indexes on frequently queried columns

---

## 5. Account Isolation Strategy

### 5.1 Multi-Tenant Pattern
- All tables have `account_id` column (except auth tables)
- RLS policies filter by `account_id`
- Helper function `get_user_account_id()` retrieves user's account_id
- Application layer sets `app.current_account_id` session variable

### 5.2 Data Isolation
- Users can only access data in their own account
- Cross-account access is prevented by RLS
- Admin role does NOT bypass RLS (unlike UI permission checks)
- Service role can bypass RLS for system operations

### 5.3 Security Considerations
- RLS is the final security layer
- API routes should validate account access before queries
- UI permission checks are for UX, not security
- Database RLS enforces actual data access

---

**End of Database Schema Documentation**

12:21:04 Dec 03, 2025

