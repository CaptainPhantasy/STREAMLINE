# CRM AI Pro - API Reference

**Version:** 2.0
**Last Updated:** November 28, 2025
**Status:** Production Ready (165 endpoints)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [API Endpoints by Category](#api-endpoints-by-category)
   - [Authentication & Authorization](#authentication--authorization)
   - [User Management](#user-management)
   - [Account & Settings](#account--settings)
   - [Contacts](#contacts)
   - [Jobs](#jobs)
   - [Estimates](#estimates)
   - [Invoices](#invoices)
   - [Payments](#payments)
   - [Parts Inventory](#parts-inventory)
   - [Conversations](#conversations)
   - [Call Logs](#call-logs)
   - [Notifications](#notifications)
   - [Email & Campaigns](#email--campaigns)
   - [Automation](#automation)
   - [AI Features](#ai-features)
   - [LLM & AI Providers](#llm--ai-providers)
   - [Analytics & Reports](#analytics--reports)
   - [Dispatch](#dispatch)
   - [Technician Portal](#technician-portal)
   - [Office Manager](#office-manager)
   - [Owner Dashboard](#owner-dashboard)
   - [Sales](#sales)
   - [Calendar & Scheduling](#calendar--scheduling)
   - [Time Tracking](#time-tracking)
   - [Documents & Photos](#documents--photos)
   - [Templates](#templates)
   - [Search & Export](#search--export)
   - [Integrations](#integrations)
   - [Webhooks](#webhooks)
   - [Voice & AI Agents](#voice--ai-agents)
   - [Onboarding](#onboarding)
   - [GPS & Location](#gps--location)
   - [MCP (Model Context Protocol)](#mcp-model-context-protocol)
   - [Meetings](#meetings)
   - [Reviews](#reviews)
   - [Signatures](#signatures)
   - [Development](#development)

---

## Overview

The CRM AI Pro API is a comprehensive RESTful API built on Next.js 14+ with the App Router. It provides 165 endpoints across 35+ feature categories for managing a complete CRM system for service businesses.

### Architecture

- **Framework:** Next.js 14 App Router (Route Handlers)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT tokens, cookies, Bearer tokens)
- **Security:** Row Level Security (RLS), role-based access control
- **AI Integration:** OpenAI, Anthropic Claude (via LLM router)
- **Real-time:** Supabase Realtime subscriptions

### Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3002/api
```

---

## Authentication

All API endpoints require authentication via Supabase session tokens.

### Authentication Methods

1. **Cookie-based (Browser):**
   - Automatic via Next.js middleware
   - Session cookies set by Supabase Auth

2. **Bearer Token (API/Mobile):**
   ```
   Authorization: Bearer {access_token}
   ```

3. **Service Role (Internal):**
   ```
   Authorization: Bearer {service_role_key}
   ```
   - Used for edge functions and internal services
   - Bypasses RLS policies

### Authentication Helper

All routes use `getAuthenticatedSession(request)` which:
- Validates session tokens
- Supports both cookie and Bearer auth
- Returns user object or null
- HTTP 401 on auth failure

### Role-Based Access Control

Roles: `owner`, `admin`, `dispatcher`, `sales`, `tech`, `office`

```typescript
// Example permission check
if (user.role !== 'admin' && user.role !== 'owner') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## Common Patterns

### Request Format

```typescript
// GET with query parameters
GET /api/jobs?status=in_progress&techId={uuid}&limit=50&offset=0

// POST/PUT/PATCH with JSON body
POST /api/jobs
Content-Type: application/json

{
  "contactId": "uuid",
  "description": "Fix HVAC",
  "scheduledStart": "2025-11-28T10:00:00Z"
}
```

### Response Format

```typescript
// Success response
{
  "success": true,
  "job": { ... },
  "message": "Job created successfully" // optional
}

// List response with pagination
{
  "jobs": [...],
  "total": 150,
  "limit": 50,
  "offset": 0
}

// Error response
{
  "error": "Job not found",
  "details": "No job exists with ID: xyz", // optional
  "code": "NOT_FOUND" // optional
}
```

### Account Isolation

All routes enforce account-level data isolation:

```typescript
// 1. Get user's account_id
const { data: user } = await supabase
  .from('users')
  .select('account_id')
  .eq('id', auth.user.id)
  .single()

// 2. Filter queries by account_id
.eq('account_id', user.account_id)
```

Row Level Security (RLS) policies also enforce this at database level.

---

## Error Handling

### HTTP Status Codes

- `200` - Success (GET, PATCH)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Error Response Structure

```typescript
{
  "error": string,           // Human-readable error message
  "details"?: string,        // Additional context
  "code"?: string,           // Error code (e.g., "UNAUTHORIZED")
  "field"?: string,          // Field that caused error (validation)
  "retryAfterMs"?: number    // Rate limiting retry delay
}
```

### Security

All error messages sanitize sensitive data:
- API keys masked as `sk-***`
- Internal paths removed
- Stack traces only in development

---

## Pagination

### Query Parameters

```
?limit=50&offset=0
```

- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

### Response

```typescript
{
  "items": [...],
  "total": 150,      // Total count across all pages
  "limit": 50,       // Items per page
  "offset": 0        // Current offset
}
```

### Supabase Implementation

```typescript
.range(offset, offset + limit - 1)
.select('*', { count: 'exact' })
```

---

## API Endpoints by Category

### Authentication & Authorization

#### POST /api/auth/signout
Sign out current user session.

**Auth:** Required
**Returns:** `{ success: true }`

#### GET /api/auth/session
Get current session details.

**Auth:** Required
**Returns:** `{ user, session }`

---

### User Management

#### GET /api/users
List all users in the account.

**Auth:** Required
**Query Params:**
- `role` - Filter by role
- `search` - Search by name or email

**Returns:**
```typescript
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "tech",
      "account_id": "uuid",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/users
Create new user (admin only).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "email": "newuser@example.com",
  "password": "secure123",
  "fullName": "Jane Doe",
  "role": "tech",
  "phone"?: string
}
```

**Returns:** `{ success: true, user }`

#### GET /api/users/me
Get current user profile.

**Auth:** Required
**Returns:** `{ user: { id, email, full_name, role, account_id } }`

#### GET /api/users/[id]
Get user by ID.

**Auth:** Required
**Returns:** `{ user }`

#### PUT /api/users/[id]
Update user (admin only).

**Auth:** Admin/Owner
**Body:** `{ full_name?, role?, phone? }`
**Returns:** `{ success: true, user }`

#### DELETE /api/users/[id]
Delete user (admin only).

**Auth:** Admin/Owner
**Returns:** `{ success: true }`

---

### Account & Settings

#### GET /api/account/settings
Get account-wide settings.

**Auth:** Required
**Returns:**
```typescript
{
  "settings": {
    "company_name": "ACME Service Co",
    "timezone": "America/New_York",
    "currency": "USD",
    "business_hours": {...},
    "notification_preferences": {...}
  }
}
```

#### PUT /api/account/settings
Update account settings (admin only).

**Auth:** Admin/Owner
**Body:** `{ company_name?, timezone?, ... }`
**Returns:** `{ success: true, settings }`

#### GET /api/settings/company
Get company profile settings.

**Auth:** Required

#### PUT /api/settings/company
Update company profile (admin only).

**Auth:** Admin/Owner
**Body:** `{ name, address, phone, website? }`

#### POST /api/settings/company/logo
Upload company logo.

**Auth:** Admin/Owner
**Content-Type:** `multipart/form-data`
**Body:** `logo` (file)
**Returns:** `{ success: true, logoUrl }`

#### GET /api/settings/profile
Get current user's profile settings.

**Auth:** Required

#### PUT /api/settings/profile
Update current user's profile.

**Auth:** Required
**Body:** `{ full_name?, phone?, avatar_url? }`

#### POST /api/settings/profile/avatar
Upload user avatar.

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Body:** `avatar` (file)

#### GET /api/settings/notifications
Get notification preferences.

**Auth:** Required

#### PUT /api/settings/notifications
Update notification preferences.

**Auth:** Required
**Body:**
```typescript
{
  "email_enabled": boolean,
  "sms_enabled": boolean,
  "push_enabled": boolean,
  "types": {
    "job_assigned": boolean,
    "job_completed": boolean,
    "invoice_paid": boolean,
    ...
  }
}
```

#### GET /api/settings/ai/providers
Get AI provider settings.

**Auth:** Required

#### PUT /api/settings/ai/providers
Update AI provider settings (admin only).

**Auth:** Admin/Owner

---

### Contacts

#### GET /api/contacts
List contacts with filtering and pagination.

**Auth:** Required
**Query Params:**
- `search` - Search name, email, phone
- `tags` - Comma-separated tag IDs
- `status` - Comma-separated statuses
- `dateStart` - Filter by created_at >= date
- `dateEnd` - Filter by created_at <= date
- `limit` - Items per page (default: 50)
- `offset` - Pagination offset

**Returns:**
```typescript
{
  "contacts": [
    {
      "id": "uuid",
      "email": "customer@example.com",
      "phone": "+1234567890",
      "first_name": "John",
      "last_name": "Smith",
      "address": "123 Main St",
      "city": "Indianapolis",
      "state": "IN",
      "zip": "46220",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/contacts
Create new contact.

**Auth:** Required
**Body:**
```typescript
{
  "email": "customer@example.com",
  "firstName": "John",
  "lastName"?: "Smith",
  "phone"?: "+1234567890",
  "address"?: "123 Main St",
  "city"?: "Indianapolis",
  "state"?: "IN",
  "zip"?: "46220"
}
```

**Returns:** `{ success: true, contact }` (201)

#### GET /api/contacts/[id]
Get contact details.

**Auth:** Required
**Returns:** `{ contact }`

#### PUT /api/contacts/[id]
Update contact.

**Auth:** Required
**Body:** `{ email?, phone?, first_name?, ... }`
**Returns:** `{ success: true, contact }`

#### DELETE /api/contacts/[id]
Delete contact.

**Auth:** Required
**Returns:** `{ success: true }`

#### POST /api/contacts/bulk
Bulk operations on contacts.

**Auth:** Required
**Body:**
```typescript
{
  "action": "delete" | "export",
  "contactIds": ["uuid1", "uuid2"]
}
```

**Returns:**
- Delete: `{ success: true, deleted: 5 }`
- Export: CSV file download

#### POST /api/contacts/bulk-tag
Bulk assign tags to contacts.

**Auth:** Required
**Body:**
```typescript
{
  "contactIds": ["uuid1", "uuid2"],
  "tagIds": ["tag-uuid1", "tag-uuid2"],
  "action": "add" | "remove"
}
```

**Returns:** `{ success: true, updated: 5 }`

#### GET /api/contacts/[id]/notes
Get notes for a contact.

**Auth:** Required
**Returns:** `{ notes: [...] }`

#### POST /api/contacts/[id]/notes
Add note to contact.

**Auth:** Required
**Body:** `{ content: string }`
**Returns:** `{ success: true, note }`

#### GET /api/contacts/[id]/tags
Get tags assigned to contact.

**Auth:** Required
**Returns:** `{ tags: [...] }`

#### POST /api/contacts/[id]/tags
Assign tag to contact.

**Auth:** Required
**Body:** `{ tagId: "uuid" }`
**Returns:** `{ success: true }`

#### DELETE /api/contacts/[id]/tags/[tagId]
Remove tag from contact.

**Auth:** Required
**Returns:** `{ success: true }`

---

### Contact Tags

#### GET /api/contact-tags
List all tags.

**Auth:** Required
**Returns:**
```typescript
{
  "tags": [
    {
      "id": "uuid",
      "name": "VIP Customer",
      "color": "#ff6b6b",
      "account_id": "uuid"
    }
  ]
}
```

#### POST /api/contact-tags
Create tag (admin only).

**Auth:** Admin/Owner
**Body:** `{ name: string, color: string }`
**Returns:** `{ success: true, tag }` (201)

#### GET /api/contact-tags/[id]
Get tag details.

**Auth:** Required
**Returns:** `{ tag }`

#### PUT /api/contact-tags/[id]
Update tag (admin only).

**Auth:** Admin/Owner
**Body:** `{ name?, color? }`
**Returns:** `{ success: true, tag }`

#### DELETE /api/contact-tags/[id]
Delete tag (admin only).

**Auth:** Admin/Owner
**Returns:** `{ success: true }`

---

### Jobs

#### GET /api/jobs
List jobs with filtering.

**Auth:** Required
**Query Params:**
- `status` - Filter by status (lead, scheduled, en_route, in_progress, completed, invoiced, paid)
- `techId` - Filter by assigned technician
- `contactId` - Filter by customer
- `limit` - Items per page (default: 50)
- `offset` - Pagination offset

**Returns:**
```typescript
{
  "jobs": [
    {
      "id": "uuid",
      "description": "Fix HVAC system",
      "status": "in_progress",
      "contact_id": "uuid",
      "tech_assigned_id": "uuid",
      "scheduled_start": "2025-11-28T10:00:00Z",
      "scheduled_end": "2025-11-28T12:00:00Z",
      "contact": {
        "first_name": "John",
        "last_name": "Smith",
        "phone": "+1234567890"
      },
      "tech": {
        "full_name": "Mike Johnson"
      }
    }
  ],
  "total": 75,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/jobs
Create new job.

**Auth:** Required
**Body:**
```typescript
{
  "contactId": "uuid",
  "description": "Fix HVAC system",
  "scheduledStart"?: "2025-11-28T10:00:00Z",
  "scheduledEnd"?: "2025-11-28T12:00:00Z",
  "techAssignedId"?: "uuid",
  "conversationId"?: "uuid"  // Link to email conversation
}
```

**Note:** Calls Edge Function `create-job` for business logic.

**Returns:** `{ success: true, job }` (201)

#### GET /api/jobs/[id]
Get job details.

**Auth:** Required
**Returns:** `{ job: { ..., contact: {...}, tech: {...} } }`

#### PUT /api/jobs/[id]
Update job.

**Auth:** Required
**Body:** `{ description?, status?, scheduled_start?, tech_assigned_id?, ... }`
**Returns:** `{ success: true, job }`

#### DELETE /api/jobs/[id]
Delete job (admin only).

**Auth:** Admin/Owner
**Returns:** `{ success: true }`

#### POST /api/jobs/bulk
Bulk operations on jobs.

**Auth:** Required
**Body:**
```typescript
{
  "action": "assign" | "status",
  "jobIds": ["uuid1", "uuid2"],
  "techId"?: "uuid",      // for assign action
  "status"?: "scheduled"  // for status action
}
```

**Returns:** `{ success: true, updated: 5 }`

#### PATCH /api/jobs/[id]/status
Update job status.

**Auth:** Required (tech can only update own jobs)
**Body:** `{ status: "en_route" | "in_progress" | "completed" }`
**Returns:** `{ success: true, job }`

#### POST /api/jobs/[id]/assign
Assign technician to job.

**Auth:** Dispatcher/Admin/Owner
**Body:** `{ techId: "uuid" }`
**Returns:** `{ success: true, job }`

#### POST /api/jobs/[id]/upload-photo
Upload job photo (deprecated - use /api/job-photos).

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Body:** `photo` (file)

#### PUT /api/jobs/[id]/location
Save job location (GPS coordinates).

**Auth:** Required
**Body:** `{ latitude: number, longitude: number }`
**Returns:** `{ success: true }`

#### GET /api/jobs/[id]/documents
Get documents attached to job.

**Auth:** Required
**Returns:** `{ documents: [...] }`

#### POST /api/jobs/[id]/documents
Upload document to job.

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Body:** `document` (file)

---

### Job Photos

#### GET /api/job-photos
List photos for a job.

**Auth:** Required
**Query Params:**
- `jobId` - Filter by job ID (required)

**Returns:**
```typescript
{
  "photos": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "url": "https://storage.supabase.co/...",
      "thumbnail_url": "https://...",
      "caption": "Before repair",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/job-photos
Upload job photo.

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Body:**
- `photo` (file)
- `jobId` (string)
- `caption`? (string)

**Returns:** `{ success: true, photo }` (201)

#### GET /api/job-photos/[id]
Get photo details.

**Auth:** Required
**Returns:** `{ photo }`

#### DELETE /api/job-photos/[id]
Delete photo (removes from storage).

**Auth:** Required
**Returns:** `{ success: true }`

---

### Job Materials

#### GET /api/job-materials
List materials used in jobs.

**Auth:** Required
**Query Params:**
- `jobId` - Filter by job

**Returns:** `{ materials: [...] }`

#### POST /api/job-materials
Add material to job.

**Auth:** Required
**Body:**
```typescript
{
  "jobId": "uuid",
  "partId"?: "uuid",  // Reference to parts inventory
  "name": "PVC Pipe",
  "quantity": 10,
  "unit": "ft",
  "cost": 25.50
}
```

**Returns:** `{ success: true, material }` (201)

#### GET /api/job-materials/[id]
Get material details.

**Auth:** Required

#### PUT /api/job-materials/[id]
Update material.

**Auth:** Required
**Body:** `{ quantity?, cost? }`

#### DELETE /api/job-materials/[id]
Remove material from job.

**Auth:** Required
**Returns:** `{ success: true }`

---

### Estimates

#### GET /api/estimates
List estimates.

**Auth:** Required
**Query Params:**
- `status` - Filter by status
- `contactId` - Filter by customer
- `limit`, `offset` - Pagination

**Returns:** `{ estimates: [...], total, limit, offset }`

#### POST /api/estimates
Create estimate.

**Auth:** Required
**Body:**
```typescript
{
  "contactId": "uuid",
  "description": "HVAC replacement",
  "lineItems": [
    {
      "description": "Labor",
      "quantity": 8,
      "unit": "hours",
      "rate": 85.00,
      "amount": 680.00
    },
    {
      "description": "Parts",
      "quantity": 1,
      "unit": "unit",
      "rate": 1200.00,
      "amount": 1200.00
    }
  ],
  "subtotal": 1880.00,
  "tax": 150.40,
  "total": 2030.40,
  "notes"?: "Valid for 30 days"
}
```

**Returns:** `{ success: true, estimate }` (201)

#### POST /api/estimates/quick-create
Quick create estimate from job.

**Auth:** Required
**Body:** `{ jobId: "uuid" }`
**Returns:** `{ success: true, estimate }`

#### GET /api/estimates/[id]
Get estimate details.

**Auth:** Required

#### PUT /api/estimates/[id]
Update estimate.

**Auth:** Required
**Body:** `{ description?, line_items?, subtotal?, tax?, total?, notes? }`

#### DELETE /api/estimates/[id]
Delete estimate.

**Auth:** Admin/Owner
**Returns:** `{ success: true }`

#### POST /api/estimates/[id]/send
Send estimate to customer via email.

**Auth:** Required
**Body:** `{ email?: "override@example.com" }`
**Returns:** `{ success: true, sent: true }`

#### POST /api/estimates/[id]/convert
Convert estimate to job.

**Auth:** Required
**Returns:** `{ success: true, job }`

#### POST /api/estimates/[id]/duplicate
Duplicate estimate.

**Auth:** Required
**Returns:** `{ success: true, estimate }`

#### GET /api/estimates/[id]/pdf
Generate estimate PDF.

**Auth:** Required
**Returns:** PDF file download

---

### Invoices

#### GET /api/invoices
List invoices.

**Auth:** Required
**Query Params:**
- `status` - Filter by status (draft, sent, paid, overdue)
- `contactId` - Filter by customer
- `jobId` - Filter by job
- `limit`, `offset` - Pagination

**Returns:** `{ invoices: [...], total, limit, offset }`

#### POST /api/invoices
Create invoice.

**Auth:** Required
**Body:**
```typescript
{
  "jobId": "uuid",
  "contactId": "uuid",
  "lineItems": [...],
  "subtotal": 500.00,
  "tax": 40.00,
  "total": 540.00,
  "dueDate": "2025-12-15",
  "notes"?: "Payment terms: Net 30"
}
```

**Returns:** `{ success: true, invoice }` (201)

#### GET /api/invoices/[id]
Get invoice details.

**Auth:** Required

#### PUT /api/invoices/[id]
Update invoice.

**Auth:** Required
**Body:** `{ line_items?, subtotal?, tax?, total?, due_date?, notes? }`

#### DELETE /api/invoices/[id]
Delete invoice.

**Auth:** Admin/Owner

#### POST /api/invoices/[id]/send
Send invoice to customer via email.

**Auth:** Required
**Body:** `{ email?: "override@example.com" }`
**Returns:** `{ success: true, sent: true }`

#### POST /api/invoices/[id]/mark-paid
Mark invoice as paid.

**Auth:** Required
**Body:**
```typescript
{
  "paymentMethod": "cash" | "check" | "card" | "transfer",
  "paymentDate"?: "2025-11-28",
  "transactionId"?: "ch_12345"
}
```

**Returns:** `{ success: true, invoice, payment }`

---

### Payments

#### GET /api/payments
List payments.

**Auth:** Required
**Query Params:**
- `invoiceId` - Filter by invoice
- `jobId` - Filter by job
- `limit`, `offset` - Pagination

**Returns:** `{ payments: [...], total, limit, offset }`

#### POST /api/payments
Create payment record.

**Auth:** Required
**Body:**
```typescript
{
  "invoiceId": "uuid",
  "jobId"?: "uuid",
  "amount": 540.00,
  "paymentMethod": "cash" | "check" | "card" | "transfer",
  "paymentDate": "2025-11-28",
  "transactionId"?: "ch_12345",
  "notes"?: "Paid in full"
}
```

**Returns:** `{ success: true, payment }` (201)

#### GET /api/payments/[id]
Get payment details.

**Auth:** Required

#### PUT /api/payments/[id]
Update payment.

**Auth:** Required
**Body:** `{ notes?, metadata? }`

#### DELETE /api/payments/[id]
Delete payment (admin only).

**Auth:** Admin/Owner

---

### Parts Inventory

#### GET /api/parts
List parts inventory.

**Auth:** Required
**Query Params:**
- `search` - Search by name or SKU
- `category` - Filter by category
- `lowStock` - Show only low stock items
- `limit`, `offset` - Pagination

**Returns:**
```typescript
{
  "parts": [
    {
      "id": "uuid",
      "name": "PVC Pipe 3/4 inch",
      "sku": "PVC-075",
      "category": "Plumbing",
      "quantity": 250,
      "unit": "ft",
      "cost": 1.50,
      "price": 2.25,
      "reorder_level": 100,
      "reorder_quantity": 500
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/parts
Add part to inventory.

**Auth:** Required
**Body:**
```typescript
{
  "name": "PVC Pipe 3/4 inch",
  "sku"?: "PVC-075",
  "category"?: "Plumbing",
  "quantity": 250,
  "unit": "ft",
  "cost": 1.50,
  "price": 2.25,
  "reorderLevel"?: 100,
  "reorderQuantity"?: 500
}
```

**Returns:** `{ success: true, part }` (201)

#### GET /api/parts/[id]
Get part details.

**Auth:** Required

#### PUT /api/parts/[id]
Update part.

**Auth:** Required
**Body:** `{ name?, quantity?, cost?, price?, reorder_level? }`

#### DELETE /api/parts/[id]
Delete part.

**Auth:** Admin/Owner

#### GET /api/parts/low-stock
Get low stock alerts.

**Auth:** Required
**Returns:**
```typescript
{
  "alerts": [
    {
      "part": { id, name, quantity, reorder_level },
      "deficit": 50  // How many below reorder level
    }
  ]
}
```

---

### Conversations

#### GET /api/conversations
List email/message conversations.

**Auth:** Required
**Query Params:**
- `contactId` - Filter by contact
- `status` - Filter by status (active, archived)
- `limit`, `offset` - Pagination

**Returns:**
```typescript
{
  "conversations": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "subject": "HVAC repair inquiry",
      "status": "active",
      "unread_count": 2,
      "last_message_at": "2025-11-28T10:00:00Z",
      "contact": {
        "first_name": "John",
        "last_name": "Smith",
        "email": "john@example.com"
      }
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/conversations
Create new conversation.

**Auth:** Required
**Body:**
```typescript
{
  "contactId": "uuid",
  "subject": "Service inquiry",
  "initialMessage"?: "How can I help?"
}
```

**Returns:** `{ success: true, conversation }` (201)

#### GET /api/conversations/[id]
Get conversation details.

**Auth:** Required
**Returns:** `{ conversation }`

#### PUT /api/conversations/[id]
Update conversation.

**Auth:** Required
**Body:** `{ status?: "active" | "archived", subject? }`

#### DELETE /api/conversations/[id]
Delete conversation.

**Auth:** Required

#### GET /api/conversations/[id]/messages
Get messages in conversation.

**Auth:** Required
**Returns:**
```typescript
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "direction": "inbound" | "outbound",
      "sender_type": "contact" | "user",
      "body_text": "Can you fix my heater?",
      "body_html": "<p>Can you fix my heater?</p>",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/conversations/[id]/messages
Send message in conversation.

**Auth:** Required
**Body:**
```typescript
{
  "bodyText": "Yes, we can help with that.",
  "bodyHtml"?: "<p>Yes, we can help with that.</p>"
}
```

**Returns:** `{ success: true, message }` (201)

#### GET /api/conversations/[id]/notes
Get internal notes for conversation.

**Auth:** Required

#### POST /api/conversations/[id]/notes
Add internal note.

**Auth:** Required
**Body:** `{ content: "Customer prefers morning appointments" }`

---

### Call Logs

#### GET /api/call-logs
List call logs.

**Auth:** Required
**Query Params:**
- `contactId` - Filter by contact
- `jobId` - Filter by job
- `dateFrom`, `dateTo` - Date range filter
- `limit`, `offset` - Pagination

**Returns:**
```typescript
{
  "callLogs": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "job_id": "uuid",
      "direction": "inbound" | "outbound",
      "phone_number": "+1234567890",
      "duration": 180,  // seconds
      "recording_url": "https://...",
      "transcription": "Customer called about...",
      "notes": "Scheduled follow-up",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/call-logs
Create call log entry.

**Auth:** Required
**Body:**
```typescript
{
  "contactId": "uuid",
  "jobId"?: "uuid",
  "direction": "inbound" | "outbound",
  "phoneNumber": "+1234567890",
  "duration"?: 180,
  "recordingUrl"?: "https://...",
  "transcription"?: "...",
  "notes"?: "Customer inquiry"
}
```

**Returns:** `{ success: true, callLog }` (201)

#### GET /api/call-logs/[id]
Get call log details.

**Auth:** Required

#### PATCH /api/call-logs/[id]
Update call log.

**Auth:** Required
**Body:** `{ notes?, transcription? }`

---

### Notifications

#### GET /api/notifications
List user notifications.

**Auth:** Required
**Query Params:**
- `isRead` - Filter by read status (true/false)
- `type` - Filter by notification type
- `limit`, `offset` - Pagination

**Returns:**
```typescript
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "job_assigned" | "job_completed" | "invoice_paid",
      "title": "New job assigned",
      "message": "You have been assigned to job #123",
      "is_read": false,
      "created_at": "2025-11-28T10:00:00Z",
      "metadata": {
        "job_id": "uuid"
      }
    }
  ],
  "unreadCount": 5,
  "total": 20,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/notifications
Create notification (admin only).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "userId": "uuid",
  "type": "job_assigned",
  "title": "New assignment",
  "message": "You have a new job",
  "metadata"?: { job_id: "uuid" }
}
```

**Returns:** `{ success: true, notification }` (201)

#### GET /api/notifications/[id]
Get notification details.

**Auth:** Required (own notifications only)

#### PATCH /api/notifications/[id]
Mark notification as read/unread.

**Auth:** Required (own notifications only)
**Body:** `{ isRead: true }`

#### DELETE /api/notifications/[id]
Delete notification.

**Auth:** Required (own notifications only)

#### PATCH /api/notifications/read-all
Mark all notifications as read.

**Auth:** Required
**Returns:** `{ success: true, updated: 5 }`

---

### Email & Campaigns

#### GET /api/email-templates
List email templates.

**Auth:** Required
**Query Params:**
- `type` - Filter by template type
- `active` - Filter by active status

**Returns:**
```typescript
{
  "templates": [
    {
      "id": "uuid",
      "name": "Review Request",
      "type": "review_request",
      "subject": "How did we do?",
      "body_html": "<p>Hi {{contact_name}},</p>...",
      "body_text": "Hi {{contact_name}},...",
      "is_active": true,
      "created_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/email-templates
Create email template (admin only).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "name": "Review Request",
  "type": "review_request" | "invoice" | "estimate" | "job_confirmation",
  "subject": "How did we do?",
  "bodyHtml": "<p>Hi {{contact_name}},</p>...",
  "bodyText": "Hi {{contact_name}},...",
  "isActive": true
}
```

**Available Variables:**
- `{{contact_name}}` - Contact name
- `{{job_id}}` - Job ID
- `{{job_description}}` - Job description
- `{{company_name}}` - Company name
- `{{review_link}}` - Review link

**Returns:** `{ success: true, template }` (201)

#### GET /api/email-templates/[id]
Get template details.

**Auth:** Required

#### PATCH /api/email-templates/[id]
Update template (admin only).

**Auth:** Admin/Owner
**Body:** `{ name?, subject?, body_html?, is_active? }`

#### DELETE /api/email-templates/[id]
Delete template (admin only).

**Auth:** Admin/Owner

#### POST /api/email-templates/[id]/preview
Preview template with variable substitution.

**Auth:** Required
**Body:**
```typescript
{
  "variables": {
    "contact_name": "John Smith",
    "job_id": "12345",
    "company_name": "ACME Service"
  }
}
```

**Returns:**
```typescript
{
  "subject": "How did we do?",
  "bodyHtml": "<p>Hi John Smith,</p>...",
  "bodyText": "Hi John Smith,..."
}
```

#### POST /api/email/create-job
Create job from email (AI-powered).

**Auth:** Required
**Body:**
```typescript
{
  "emailBody": "Customer email text...",
  "fromEmail": "customer@example.com",
  "subject": "Need HVAC repair"
}
```

**Uses AI to extract:**
- Contact info (if new)
- Job description
- Urgency/priority
- Preferred dates

**Returns:** `{ success: true, job, contact }`

#### POST /api/email/extract-actions
Extract actionable items from email (AI-powered).

**Auth:** Required
**Body:** `{ emailBody: string }`

**Returns:**
```typescript
{
  "actions": [
    {
      "type": "create_job" | "schedule_appointment" | "send_estimate",
      "priority": "high" | "medium" | "low",
      "description": "Customer needs HVAC repair",
      "data": { ... }
    }
  ]
}
```

---

### Campaigns

#### GET /api/campaigns
List marketing campaigns.

**Auth:** Required
**Query Params:**
- `status` - Filter by status (draft, scheduled, active, paused, completed)
- `type` - Filter by type (email, sms)

**Returns:**
```typescript
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Spring HVAC Checkup",
      "campaign_type": "email",
      "status": "active",
      "target_segment": { tags: ["VIP"] },
      "email_template_id": "uuid",
      "scheduled_start": "2025-11-28T10:00:00Z",
      "scheduled_end": "2025-12-28T10:00:00Z",
      "stats": {
        "sent": 150,
        "opened": 75,
        "clicked": 30
      }
    }
  ]
}
```

#### POST /api/campaigns
Create campaign (admin only).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "name": "Spring HVAC Checkup",
  "campaignType": "email" | "sms",
  "status"?: "draft",
  "targetSegment"?: {
    "tags": ["VIP"],
    "contactIds": ["uuid1", "uuid2"]
  },
  "emailTemplateId"?: "uuid",
  "scheduledStart"?: "2025-11-28T10:00:00Z",
  "scheduledEnd"?: "2025-12-28T10:00:00Z"
}
```

**Returns:** `{ success: true, campaign }` (201)

#### GET /api/campaigns/[id]
Get campaign with stats.

**Auth:** Required
**Returns:**
```typescript
{
  "campaign": { ... },
  "stats": {
    "sent": 150,
    "opened": 75,
    "clicked": 30,
    "bounced": 2,
    "unsubscribed": 1,
    "openRate": 50.0,
    "clickRate": 20.0
  }
}
```

#### PATCH /api/campaigns/[id]
Update campaign (admin only).

**Auth:** Admin/Owner
**Body:** `{ name?, status?, target_segment?, ... }`

#### DELETE /api/campaigns/[id]
Delete campaign (admin only).

**Auth:** Admin/Owner

#### POST /api/campaigns/[id]/send
Send campaign to recipients.

**Auth:** Admin/Owner
**Returns:** `{ success: true, sent: 150 }`

#### POST /api/campaigns/[id]/pause
Pause active campaign.

**Auth:** Admin/Owner
**Returns:** `{ success: true, campaign }`

#### POST /api/campaigns/[id]/resume
Resume paused campaign.

**Auth:** Admin/Owner
**Returns:** `{ success: true, campaign }`

#### GET /api/campaigns/[id]/recipients
List campaign recipients.

**Auth:** Required
**Returns:**
```typescript
{
  "recipients": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "status": "sent" | "opened" | "clicked" | "bounced" | "unsubscribed",
      "sent_at": "2025-11-28T10:00:00Z",
      "opened_at": "2025-11-28T10:05:00Z",
      "clicked_at": "2025-11-28T10:10:00Z",
      "contact": {
        "first_name": "John",
        "last_name": "Smith",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### POST /api/campaigns/[id]/recipients
Add recipients to campaign (bulk).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "contactIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Returns:** `{ success: true, added: 3 }`

#### PATCH /api/campaigns/[id]/recipients/[contactId]
Update recipient status.

**Auth:** System (webhook/internal)
**Body:** `{ status: "opened" | "clicked" }`

---

### Automation

#### GET /api/automation-rules
List automation rules.

**Auth:** Required
**Returns:**
```typescript
{
  "rules": [
    {
      "id": "uuid",
      "name": "Send review request after job completion",
      "trigger": "job_completed",
      "conditions": {
        "status": "completed",
        "invoice_status": "paid"
      },
      "actions": [
        {
          "type": "send_email",
          "template_id": "uuid",
          "delay_hours": 24
        }
      ],
      "is_active": true
    }
  ]
}
```

#### POST /api/automation-rules
Create automation rule (admin only).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "name": "Send review request",
  "trigger": "job_completed" | "invoice_paid" | "job_assigned",
  "conditions": {
    "status": "completed",
    "invoice_status": "paid"
  },
  "actions": [
    {
      "type": "send_email" | "create_task" | "send_notification",
      "template_id"?: "uuid",
      "delay_hours"?: 24
    }
  ],
  "isActive": true
}
```

**Returns:** `{ success: true, rule }` (201)

#### GET /api/automation-rules/[id]
Get rule details.

**Auth:** Required

#### PUT /api/automation-rules/[id]
Update rule (admin only).

**Auth:** Admin/Owner
**Body:** `{ name?, conditions?, actions?, is_active? }`

#### DELETE /api/automation-rules/[id]
Delete rule (admin only).

**Auth:** Admin/Owner

#### GET /api/settings/automation/rules
Alternative endpoint for automation rules.

**Auth:** Required
(Same as `/api/automation-rules`)

#### POST /api/settings/automation/rules
Create automation rule.

**Auth:** Admin/Owner
(Same as `/api/automation-rules`)

#### GET /api/settings/automation/rules/[id]
Get rule details.

**Auth:** Required

#### PUT /api/settings/automation/rules/[id]
Update rule.

**Auth:** Admin/Owner

#### DELETE /api/settings/automation/rules/[id]
Delete rule.

**Auth:** Admin/Owner

#### POST /api/settings/automation/rules/[id]/toggle
Toggle rule on/off.

**Auth:** Admin/Owner
**Returns:** `{ success: true, rule }`

---

### AI Features

#### POST /api/ai/suggestions
Get AI suggestions for contact/job.

**Auth:** Required
**Body:**
```typescript
{
  "context": "job_description" | "email_reply" | "pricing",
  "data": {
    "jobDescription"?: "Fix HVAC",
    "contactHistory"?: [...],
    "emailBody"?: "..."
  }
}
```

**Returns:**
```typescript
{
  "suggestions": [
    "Check air filter",
    "Inspect thermostat wiring",
    "Test capacitor"
  ]
}
```

#### POST /api/ai/draft
Draft email/message with AI (with streaming).

**Auth:** Required
**Body:**
```typescript
{
  "conversationId": "uuid"
}
```

**Features:**
- Fetches conversation history (last 20 messages)
- RAG context from knowledge base
- Persona config from account settings
- Function calling (create_job, search_contacts)
- Streams response for better UX

**Returns:** Text stream (EventSource)

#### POST /api/ai/pricing
Get AI pricing suggestions.

**Auth:** Required
**Body:**
```typescript
{
  "jobDescription": "HVAC replacement",
  "laborHours"?: 8,
  "parts"?: [
    { name: "HVAC unit", quantity: 1 }
  ]
}
```

**Returns:**
```typescript
{
  "suggestedPrice": 2500.00,
  "breakdown": {
    "labor": 680.00,
    "parts": 1200.00,
    "markup": 620.00
  },
  "confidence": "high" | "medium" | "low"
}
```

#### POST /api/ai/briefing
Generate AI briefing for contact.

**Auth:** Required
**Body:** `{ contactId: "uuid" }`

**Returns:**
```typescript
{
  "briefing": {
    "summary": "VIP customer, 5 jobs in past year...",
    "keyPoints": [
      "Prefers morning appointments",
      "Has older HVAC system",
      "Always pays on time"
    ],
    "recommendations": [
      "Offer maintenance plan",
      "Suggest system upgrade"
    ]
  }
}
```

#### POST /api/ai/meeting-summary
Summarize meeting/call transcript.

**Auth:** Required
**Body:**
```typescript
{
  "transcript": "Customer discussed...",
  "duration"?: 1800  // seconds
}
```

**Returns:**
```typescript
{
  "summary": "Customer needs HVAC repair...",
  "actionItems": [
    "Schedule appointment",
    "Send estimate"
  ],
  "keyTopics": ["HVAC", "pricing", "scheduling"]
}
```

---

### LLM & AI Providers

#### GET /api/llm-providers
List configured LLM providers.

**Auth:** Required
**Returns:**
```typescript
{
  "providers": [
    {
      "id": "uuid",
      "name": "openai-gpt4o-mini",
      "provider": "openai" | "anthropic",
      "model": "gpt-4o-mini",
      "is_default": true,
      "use_case": ["draft", "summary", "general"],
      "max_tokens": 1000,
      "is_active": true
    }
  ]
}
```

#### POST /api/llm-providers
Add LLM provider (admin only).

**Auth:** Admin/Owner
**Body:**
```typescript
{
  "name": "anthropic-haiku",
  "provider": "anthropic",
  "model": "claude-haiku-4-5",
  "apiKey": "sk-ant-...",
  "isDefault": false,
  "useCase": ["draft", "summary"],
  "maxTokens": 1000
}
```

**Returns:** `{ success: true, provider }` (201)

#### GET /api/llm-providers/[id]
Get provider details.

**Auth:** Required

#### PUT /api/llm-providers/[id]
Update provider (admin only).

**Auth:** Admin/Owner
**Body:** `{ name?, model?, api_key?, is_default?, use_case?, max_tokens? }`

#### DELETE /api/llm-providers/[id]
Delete provider (admin only).

**Auth:** Admin/Owner

#### POST /api/llm
LLM router endpoint - intelligent model selection.

**Auth:** Required (or service role)
**Body:**
```typescript
{
  "accountId"?: "uuid",  // Required if service role
  "useCase"?: "draft" | "summary" | "complex" | "vision" | "general" | "voice",
  "prompt": "Write a professional email...",
  "systemPrompt"?: "You are a helpful assistant...",
  "maxTokens"?: 1000,
  "temperature"?: 0.7,
  "modelOverride"?: "gpt-4o",  // Force specific model
  "stream"?: false,
  "tools"?: {
    "create_job": {
      "description": "Create a new job",
      "parameters": { ... }
    }
  },
  "toolChoice"?: "auto" | "none",
  "maxSteps"?: 1  // Multi-step tool calling
}
```

**Use Case Routing:**
- `draft` - Fast models (Haiku, GPT-4o-mini)
- `summary` - Fast models
- `complex` - Advanced models (Sonnet, GPT-4o)
- `vision` - Vision-capable models
- `voice` - Low-latency models (GPT-4o-mini)
- `general` - Default routing

**Features:**
- Automatic model selection based on use case
- Account-specific provider preferences
- Rate limiting (per account)
- Budget tracking (per account)
- Retry with exponential backoff
- Circuit breaker pattern
- Metrics collection
- Audit logging

**Returns (non-streaming):**
```typescript
{
  "success": true,
  "text": "Here is your draft email...",
  "provider": "openai-gpt4o-mini",
  "model": "gpt-4o-mini",
  "toolCalls": [
    {
      "toolCallId": "call_123",
      "toolName": "create_job",
      "args": { contactId: "uuid", description: "..." }
    }
  ],
  "usage": {
    "totalTokens": 250,
    "promptTokens": 100,
    "completionTokens": 150
  }
}
```

**Returns (streaming):** Server-Sent Events (text/event-stream)

#### GET /api/llm/health
LLM health check.

**Auth:** Required
**Returns:**
```typescript
{
  "status": "healthy" | "degraded" | "down",
  "providers": [
    {
      "name": "openai-gpt4o-mini",
      "status": "healthy",
      "latency": 250  // ms
    }
  ]
}
```

#### GET /api/llm/metrics
LLM usage metrics.

**Auth:** Required
**Returns:**
```typescript
{
  "metrics": {
    "totalRequests": 1000,
    "successRate": 98.5,
    "averageLatency": 300,  // ms
    "totalTokens": 50000,
    "totalCost": 2.50,
    "byProvider": {
      "openai": { requests: 600, tokens: 30000, cost: 1.50 },
      "anthropic": { requests: 400, tokens: 20000, cost: 1.00 }
    }
  }
}
```

---

### Analytics & Reports

#### GET /api/analytics/dashboard
Dashboard overview metrics.

**Auth:** Required
**Returns:**
```typescript
{
  "stats": {
    "jobs": {
      "total": 150,
      "today": 5,
      "completed": 120,
      "in_progress": 10
    },
    "revenue": {
      "total": 75000.00,
      "today": 2500.00,
      "week": 12000.00,
      "month": 45000.00
    },
    "contacts": {
      "total": 500,
      "new_this_month": 25
    },
    "invoices": {
      "outstanding": 15,
      "outstanding_amount": 8500.00
    }
  }
}
```

#### GET /api/analytics/jobs
Job analytics.

**Auth:** Required
**Query Params:**
- `dateFrom`, `dateTo` - Date range
- `status` - Filter by status

**Returns:**
```typescript
{
  "analytics": {
    "totalJobs": 150,
    "totalRevenue": 75000.00,
    "averageValue": 500.00,
    "completedJobs": 120,
    "paidJobs": 100,
    "statusBreakdown": {
      "lead": 10,
      "scheduled": 15,
      "in_progress": 10,
      "completed": 115
    },
    "dateBreakdown": [
      { date: "2025-11-01", jobs: 5, revenue: 2500.00 },
      { date: "2025-11-02", jobs: 7, revenue: 3500.00 }
    ]
  }
}
```

#### GET /api/analytics/revenue
Revenue analytics.

**Auth:** Required
**Query Params:**
- `dateFrom`, `dateTo` - Date range
- `groupBy` - Group by (date, tech, status)

**Returns:**
```typescript
{
  "analytics": {
    "totalRevenue": 75000.00,
    "breakdown": [
      { label: "2025-11-01", revenue: 2500.00 },
      { label: "Mike Johnson", revenue: 25000.00 }
    ]
  }
}
```

#### GET /api/analytics/contacts
Contact analytics.

**Auth:** Required
**Query Params:**
- `dateFrom`, `dateTo` - Date range

**Returns:**
```typescript
{
  "analytics": {
    "newContacts": 25,
    "contactsWithJobs": 75,
    "revenueFromContacts": 50000.00,
    "dateBreakdown": [
      { date: "2025-11-01", contacts: 2 }
    ]
  }
}
```

#### GET /api/reports
Generate reports.

**Auth:** Required
**Query Params:**
- `type` - Report type (jobs, financial, tech-performance)
- `format` - Output format (csv, json)
- `dateFrom`, `dateTo` - Date range
- `techId` - For tech performance report

**Returns:**
- JSON: Report data
- CSV: File download

#### POST /api/reports
Generate complex report.

**Auth:** Required
**Body:**
```typescript
{
  "type": "custom",
  "metrics": ["revenue", "jobs", "contacts"],
  "dateFrom": "2025-11-01",
  "dateTo": "2025-11-30",
  "filters": {
    "status": ["completed"],
    "techId": "uuid"
  }
}
```

#### GET /api/reports/customer
Customer-specific reports.

**Auth:** Required
**Query Params:** `contactId`

#### GET /api/reports/financial
Financial reports.

**Auth:** Admin/Owner
**Query Params:** `dateFrom`, `dateTo`

#### GET /api/reports/revenue
Revenue reports.

**Auth:** Admin/Owner

#### GET /api/reports/job-performance
Job performance reports.

**Auth:** Required

#### GET /api/reports/tech-performance
Technician performance reports.

**Auth:** Required
**Query Params:** `techId`, `dateFrom`, `dateTo`

#### POST /api/reports/export
Export report to file.

**Auth:** Required
**Body:** `{ reportType, format: "csv" | "pdf", filters }`

#### GET /api/finance/stats
Financial statistics.

**Auth:** Admin/Owner
**Returns:**
```typescript
{
  "stats": {
    "revenue": {
      "total": 75000.00,
      "month": 15000.00,
      "quarter": 45000.00
    },
    "outstanding": {
      "invoices": 15,
      "amount": 8500.00
    },
    "collected": {
      "month": 12000.00,
      "rate": 95.5
    }
  }
}
```

#### GET /api/audit
Get audit logs.

**Auth:** Admin/Owner
**Query Params:**
- `entity_type` - Filter by entity (job, contact, user)
- `entity_id` - Filter by entity ID
- `action` - Filter by action
- `user_id` - Filter by user
- `dateFrom`, `dateTo` - Date range
- `limit`, `offset` - Pagination

**Returns:**
```typescript
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "job_created" | "job_updated" | "invoice_sent",
      "entity_type": "job",
      "entity_id": "uuid",
      "old_values": { ... },
      "new_values": { ... },
      "metadata": { ... },
      "created_at": "2025-11-28T10:00:00Z"
    }
  ],
  "total": 500,
  "limit": 50,
  "offset": 0
}
```

---

### Dispatch

#### GET /api/dispatch/jobs/active
Get active jobs for dispatch board.

**Auth:** Dispatcher/Admin/Owner
**Returns:**
```typescript
{
  "jobs": [
    {
      "id": "uuid",
      "description": "HVAC repair",
      "status": "en_route" | "in_progress",
      "tech": {
        "id": "uuid",
        "full_name": "Mike Johnson",
        "current_location": {
          "latitude": 39.7684,
          "longitude": -86.1581,
          "updated_at": "2025-11-28T10:00:00Z"
        }
      },
      "contact": {
        "first_name": "John",
        "last_name": "Smith",
        "address": "123 Main St"
      },
      "scheduled_start": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/dispatch/auto-assign
Auto-assign best technician to job.

**Auth:** Dispatcher/Admin/Owner
**Body:**
```typescript
{
  "jobId": "uuid",
  "factors"?: {
    "prioritizeDistance"?: boolean,  // default: true
    "prioritizePerformance"?: boolean,  // default: false
    "requireSkills"?: string[]
  },
  "dryRun"?: boolean  // Return suggestion without assigning
}
```

**Algorithm:**
- Scores techs based on distance, workload, performance
- Requires GPS location within 30 minutes
- Excludes techs on active jobs
- Estimates ETA and travel time

**Returns:**
```typescript
{
  "success": true,
  "assignment": {
    "techId": "uuid",
    "techName": "Mike Johnson",
    "distance": 2.5,  // miles
    "eta": 8,  // minutes
    "score": 185,
    "reason": "Best match: closest available tech, high performance today"
  },
  "alternatives": [
    {
      "techId": "uuid",
      "techName": "Sarah Lee",
      "distance": 3.8,
      "eta": 12,
      "score": 160
    }
  ]
}
```

#### POST /api/dispatch/jobs/[id]/assign
Manually assign tech to job.

**Auth:** Dispatcher/Admin/Owner
**Body:** `{ techId: "uuid" }`
**Returns:** `{ success: true, job }`

#### GET /api/dispatch/techs
List technicians with current status.

**Auth:** Dispatcher/Admin/Owner
**Returns:**
```typescript
{
  "techs": [
    {
      "id": "uuid",
      "full_name": "Mike Johnson",
      "role": "tech",
      "status": "available" | "on_job" | "offline",
      "current_location": {
        "latitude": 39.7684,
        "longitude": -86.1581,
        "updated_at": "2025-11-28T10:00:00Z"
      },
      "active_jobs": 1,
      "jobs_today": 5
    }
  ]
}
```

#### GET /api/dispatch/techs/[id]/stats
Get technician performance stats.

**Auth:** Dispatcher/Admin/Owner
**Returns:**
```typescript
{
  "stats": {
    "jobs_today": 5,
    "jobs_this_week": 25,
    "jobs_this_month": 100,
    "completion_rate": 98.5,
    "average_job_time": 90,  // minutes
    "customer_rating": 4.8
  }
}
```

#### GET /api/dispatch/techs/[id]/activity
Get technician activity log.

**Auth:** Dispatcher/Admin/Owner
**Returns:**
```typescript
{
  "activity": [
    {
      "timestamp": "2025-11-28T10:00:00Z",
      "type": "job_started" | "job_completed" | "clocked_in",
      "job_id": "uuid",
      "location": {
        "latitude": 39.7684,
        "longitude": -86.1581
      }
    }
  ]
}
```

#### GET /api/dispatch/stats
Dispatch dashboard statistics.

**Auth:** Dispatcher/Admin/Owner
**Returns:**
```typescript
{
  "stats": {
    "active_techs": 5,
    "available_techs": 2,
    "active_jobs": 10,
    "jobs_today": 25,
    "average_response_time": 15  // minutes
  }
}
```

#### GET /api/dispatch/historical-gps
Historical GPS data for playback.

**Auth:** Dispatcher/Admin/Owner
**Query Params:**
- `techId` - Technician ID
- `date` - Date (YYYY-MM-DD)
- `startTime`, `endTime` - Time range

**Returns:**
```typescript
{
  "points": [
    {
      "latitude": 39.7684,
      "longitude": -86.1581,
      "timestamp": "2025-11-28T10:00:00Z",
      "speed": 35,  // mph
      "heading": 180  // degrees
    }
  ],
  "downsampled": 60  // seconds between points
}
```

---

### Technician Portal

#### GET /api/tech/jobs
Get technician's assigned jobs.

**Auth:** Tech
**Returns:**
```typescript
{
  "jobs": [
    {
      "id": "uuid",
      "description": "HVAC repair",
      "status": "scheduled" | "en_route" | "in_progress",
      "scheduled_start": "2025-11-28T10:00:00Z",
      "contact": {
        "first_name": "John",
        "last_name": "Smith",
        "phone": "+1234567890",
        "address": "123 Main St"
      }
    }
  ]
}
```

#### GET /api/tech/jobs/[id]
Get tech job details (own jobs only).

**Auth:** Tech
**Returns:** `{ job }`

#### PUT /api/tech/jobs/[id]
Update tech job (own jobs only).

**Auth:** Tech
**Body:** `{ notes?, arrival_time?, completion_time? }`

#### POST /api/tech/jobs/[id]/status
Update job status (own jobs only).

**Auth:** Tech
**Body:** `{ status: "en_route" | "in_progress" | "completed" }`

#### GET /api/tech/gates
Get gate codes and access info for jobs.

**Auth:** Tech
**Returns:**
```typescript
{
  "gateInfo": [
    {
      "job_id": "uuid",
      "contact": "John Smith",
      "address": "123 Main St",
      "gate_code": "1234",
      "access_notes": "Side gate unlocked"
    }
  ]
}
```

#### POST /api/tech/materials/quick-add
Quick add material to current job.

**Auth:** Tech
**Body:**
```typescript
{
  "jobId": "uuid",
  "name": "PVC Pipe",
  "quantity": 10,
  "unit": "ft"
}
```

**Returns:** `{ success: true, material }`

#### POST /api/tech/time-clock
Clock in/out.

**Auth:** Tech
**Body:**
```typescript
{
  "action": "clock_in" | "clock_out",
  "location"?: {
    "latitude": 39.7684,
    "longitude": -86.1581
  }
}
```

**Returns:** `{ success: true, entry }`

#### GET /api/tech/profile
Get tech profile settings.

**Auth:** Tech
**Returns:** `{ profile }`

#### PUT /api/tech/profile
Update tech profile.

**Auth:** Tech
**Body:** `{ phone?, avatar_url?, notification_preferences? }`

---

### Office Manager

#### GET /api/office/clearances
List clearances/approvals.

**Auth:** Office/Admin/Owner
**Returns:**
```typescript
{
  "clearances": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "type": "insurance" | "permit" | "authorization",
      "status": "pending" | "approved" | "denied",
      "notes": "Pending insurance approval",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/office/clearances
Create clearance request.

**Auth:** Office/Admin/Owner
**Body:**
```typescript
{
  "jobId": "uuid",
  "type": "insurance" | "permit" | "authorization",
  "notes"?: "Insurance claim #12345"
}
```

**Returns:** `{ success: true, clearance }` (201)

#### GET /api/office/clearances/[id]
Get clearance details.

**Auth:** Office/Admin/Owner

#### PUT /api/office/clearances/[id]
Update clearance.

**Auth:** Office/Admin/Owner
**Body:** `{ status?: "approved" | "denied", notes? }`

#### DELETE /api/office/clearances/[id]
Delete clearance.

**Auth:** Office/Admin/Owner

#### GET /api/office/stats
Office manager dashboard stats.

**Auth:** Office/Admin/Owner
**Returns:**
```typescript
{
  "stats": {
    "pending_clearances": 5,
    "pending_invoices": 10,
    "unscheduled_jobs": 8
  }
}
```

---

### Owner Dashboard

#### GET /api/owner/stats
Owner dashboard statistics.

**Auth:** Owner
**Returns:**
```typescript
{
  "stats": {
    "revenue": {
      "today": 2500.00,
      "week": 12000.00,
      "month": 45000.00,
      "year": 500000.00
    },
    "jobs": {
      "active": 10,
      "completed_this_month": 150
    },
    "techs": {
      "active": 5,
      "on_job": 3
    },
    "customers": {
      "total": 500,
      "new_this_month": 25
    }
  }
}
```

---

### Sales

#### GET /api/sales/briefing/[contactId]
Get AI-powered sales briefing for contact.

**Auth:** Sales/Admin/Owner
**Returns:**
```typescript
{
  "briefing": {
    "contact": {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "summary": "VIP customer, 5 jobs in past year, $15,000 total revenue",
    "jobHistory": [
      {
        "date": "2025-10-15",
        "description": "HVAC repair",
        "revenue": 850.00
      }
    ],
    "keyInsights": [
      "Prefers morning appointments",
      "Always pays on time",
      "Has older HVAC system (2010)"
    ],
    "recommendations": [
      "Offer annual maintenance plan",
      "Suggest HVAC upgrade before winter"
    ],
    "nextSteps": [
      "Call to schedule follow-up",
      "Send maintenance plan proposal"
    ]
  }
}
```

#### GET /api/sales/leads
List sales leads.

**Auth:** Sales/Admin/Owner
**Returns:** `{ leads: [...] }`

#### POST /api/sales/profile
Update sales profile.

**Auth:** Sales
**Body:** `{ quota?, territory?, commission_rate? }`

#### GET /api/sales/profile
Get sales profile.

**Auth:** Sales

---

### Calendar & Scheduling

#### GET /api/calendar/events
List calendar events.

**Auth:** Required
**Query Params:**
- `start` - Start date
- `end` - End date
- `userId` - Filter by user

**Returns:**
```typescript
{
  "events": [
    {
      "id": "uuid",
      "title": "HVAC repair at John Smith",
      "start": "2025-11-28T10:00:00Z",
      "end": "2025-11-28T12:00:00Z",
      "type": "job" | "meeting" | "appointment",
      "job_id": "uuid",
      "attendees": ["uuid1", "uuid2"]
    }
  ]
}
```

#### POST /api/calendar/events
Create calendar event.

**Auth:** Required
**Body:**
```typescript
{
  "title": "Team meeting",
  "start": "2025-11-28T10:00:00Z",
  "end": "2025-11-28T11:00:00Z",
  "type": "meeting",
  "attendees"?: ["uuid1"],
  "description"?: "Discuss Q4 targets"
}
```

**Returns:** `{ success: true, event }` (201)

#### POST /api/calendar/sync
Sync calendar with external provider.

**Auth:** Required
**Body:** `{ provider: "google" | "microsoft" }`
**Returns:** `{ success: true, synced: 25 }`

#### POST /api/schedule/optimize
Optimize job schedule for a day.

**Auth:** Dispatcher/Admin/Owner
**Body:**
```typescript
{
  "jobIds": ["uuid1", "uuid2", "uuid3"],
  "date": "2025-11-28"
}
```

**Returns:**
```typescript
{
  "optimizedSchedule": [
    {
      "job_id": "uuid1",
      "scheduled_start": "2025-11-28T08:00:00Z",
      "estimated_duration": 90,  // minutes
      "estimated_travel_time": 15  // minutes to next job
    },
    {
      "job_id": "uuid2",
      "scheduled_start": "2025-11-28T09:45:00Z",
      "estimated_duration": 60,
      "estimated_travel_time": 20
    }
  ],
  "total_time": 185,  // minutes
  "total_travel_time": 35  // minutes
}
```

---

### Time Tracking

#### GET /api/time-entries
List time entries.

**Auth:** Required
**Query Params:**
- `userId` - Filter by user
- `jobId` - Filter by job
- `dateFrom`, `dateTo` - Date range

**Returns:**
```typescript
{
  "entries": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "job_id": "uuid",
      "clock_in": "2025-11-28T08:00:00Z",
      "clock_out": "2025-11-28T12:00:00Z",
      "duration": 240,  // minutes
      "location_in": {
        "latitude": 39.7684,
        "longitude": -86.1581
      },
      "location_out": {
        "latitude": 39.7690,
        "longitude": -86.1575
      }
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/time-entries
Create time entry.

**Auth:** Required
**Body:**
```typescript
{
  "jobId"?: "uuid",
  "clockIn": "2025-11-28T08:00:00Z",
  "clockOut"?: "2025-11-28T12:00:00Z",
  "locationIn"?: {
    "latitude": 39.7684,
    "longitude": -86.1581
  }
}
```

**Returns:** `{ success: true, entry }` (201)

---

### Documents & Photos

#### GET /api/documents/[id]
Get document.

**Auth:** Required
**Returns:** Document file download

#### POST /api/documents/upload
Upload document.

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Body:**
- `document` (file)
- `jobId`? (string)
- `contactId`? (string)
- `type`? (string)

**Returns:** `{ success: true, document }` (201)

#### DELETE /api/documents/[id]
Delete document.

**Auth:** Required

#### GET /api/photos
List photos.

**Auth:** Required
**Query Params:**
- `jobId` - Filter by job
- `limit`, `offset` - Pagination

#### POST /api/photos
Upload photo.

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Body:** `photo` (file), `jobId`? (string)

---

### Templates

#### GET /api/templates/jobs
List job templates.

**Auth:** Required
**Returns:**
```typescript
{
  "templates": [
    {
      "id": "uuid",
      "name": "Standard HVAC Service",
      "description": "Routine HVAC maintenance",
      "estimated_duration": 90,  // minutes
      "default_materials": [
        { name: "Air filter", quantity: 1 }
      ]
    }
  ]
}
```

#### GET /api/templates/contacts
List contact templates.

**Auth:** Required

---

### Search & Export

#### POST /api/search
Global search across entities.

**Auth:** Required
**Body:**
```typescript
{
  "query": "john smith",
  "types"?: ["contacts", "jobs", "invoices"],
  "limit"?: 20
}
```

**Returns:**
```typescript
{
  "results": {
    "contacts": [
      {
        "id": "uuid",
        "type": "contact",
        "name": "John Smith",
        "email": "john@example.com",
        "score": 0.95  // relevance score
      }
    ],
    "jobs": [
      {
        "id": "uuid",
        "type": "job",
        "description": "HVAC repair for John Smith",
        "score": 0.80
      }
    ]
  },
  "total": 5
}
```

#### GET /api/export/contacts
Export contacts to CSV.

**Auth:** Required
**Query Params:**
- `tags` - Filter by tags
- `dateFrom`, `dateTo` - Date range

**Returns:** CSV file download

#### GET /api/export/jobs
Export jobs to CSV.

**Auth:** Required
**Query Params:**
- `status` - Filter by status
- `dateFrom`, `dateTo` - Date range

**Returns:** CSV file download

#### GET /api/export/invoices
Export invoices to CSV.

**Auth:** Required
**Query Params:**
- `status` - Filter by status
- `dateFrom`, `dateTo` - Date range

**Returns:** CSV file download

---

### Integrations

#### Gmail Integration

##### GET /api/integrations/gmail/authorize
Start Gmail OAuth flow.

**Auth:** Required
**Returns:**
```typescript
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

##### GET /api/integrations/gmail/callback
Gmail OAuth callback (redirected from Google).

**Auth:** Required
**Query Params:**
- `code` - OAuth authorization code
- `state` - State parameter (base64 encoded user/account info)

**Returns:** Redirect to app with success/error

##### GET /api/integrations/gmail/status
Check Gmail connection status.

**Auth:** Required
**Returns:**
```typescript
{
  "connected": true,
  "email": "user@gmail.com",
  "expiresAt": "2025-11-29T10:00:00Z"
}
```

##### POST /api/integrations/gmail/sync
Sync Gmail emails.

**Auth:** Required
**Body:**
```typescript
{
  "since"?: "2025-11-01T00:00:00Z",
  "limit"?: 50
}
```

**Returns:**
```typescript
{
  "success": true,
  "synced": 25,
  "conversations": 10
}
```

##### POST /api/integrations/gmail/send
Send email via Gmail.

**Auth:** Required
**Body:**
```typescript
{
  "to": "customer@example.com",
  "subject": "Re: HVAC Service",
  "body": "Thank you for your inquiry...",
  "conversationId"?: "uuid"
}
```

**Returns:** `{ success: true, messageId: "gmail-msg-123" }`

#### Microsoft/Outlook Integration

##### GET /api/integrations/microsoft/authorize
Start Microsoft OAuth flow.

**Auth:** Required
**Returns:** `{ authUrl: "..." }`

##### GET /api/integrations/microsoft/callback
Microsoft OAuth callback.

**Auth:** Required
**Query Params:** `code`, `state`

##### GET /api/integrations/microsoft/status
Check Microsoft connection status.

**Auth:** Required

##### POST /api/integrations/microsoft/sync
Sync Microsoft emails.

**Auth:** Required

#### Google Calendar Integration

##### GET /api/integrations/calendar/google/authorize
Start Google Calendar OAuth flow.

**Auth:** Required
**Returns:** `{ authUrl: "..." }`

##### GET /api/integrations/calendar/google/callback
Google Calendar OAuth callback.

**Auth:** Required
**Query Params:** `code`, `state`

---

### Webhooks

#### POST /api/webhooks/elevenlabs
ElevenLabs webhook for voice agent events.

**Auth:** None (verified by signature)
**Body:**
```typescript
{
  "event": "call.ended" | "call.started" | "transcript.ready",
  "callId": "call-123",
  "transcript"?: "Customer called about...",
  "duration"?: 180
}
```

**Returns:** `{ received: true }`

#### POST /api/webhooks/stripe
Stripe webhook for payment events.

**Auth:** None (verified by signature)
**Body:** Stripe webhook event

**Returns:** `{ received: true }`

---

### Voice & AI Agents

#### POST /api/voice-command
Process voice command.

**Auth:** Required
**Body:**
```typescript
{
  "command": "create job for john smith",
  "audioUrl"?: "https://...",
  "context"?: {
    "currentPage": "jobs",
    "selectedItems": ["uuid1"]
  }
}
```

**Returns:**
```typescript
{
  "success": true,
  "action": "create_job",
  "result": {
    "jobId": "uuid",
    "contactId": "uuid"
  },
  "response": "I've created a job for John Smith."
}
```

#### POST /api/send-message
Send message (email/SMS).

**Auth:** Required
**Body:**
```typescript
{
  "to": "customer@example.com" | "+1234567890",
  "type": "email" | "sms",
  "subject"?: "Service reminder",
  "body": "Your appointment is scheduled for...",
  "conversationId"?: "uuid"
}
```

**Returns:** `{ success: true, messageId: "msg-123" }`

---

### Onboarding

#### GET /api/onboarding/status
Get onboarding progress.

**Auth:** Required
**Returns:**
```typescript
{
  "status": "in_progress" | "completed" | "skipped",
  "steps": {
    "company_info": true,
    "add_contacts": false,
    "add_technicians": false,
    "setup_integrations": false
  },
  "progress": 25  // percentage
}
```

#### POST /api/onboarding/complete
Mark onboarding as complete.

**Auth:** Required
**Returns:** `{ success: true }`

#### POST /api/onboarding/dismiss
Dismiss onboarding.

**Auth:** Required
**Returns:** `{ success: true }`

#### POST /api/onboarding/restart
Restart onboarding.

**Auth:** Required
**Returns:** `{ success: true }`

#### GET /api/onboarding/analytics
Get onboarding analytics (admin only).

**Auth:** Admin/Owner
**Returns:**
```typescript
{
  "analytics": {
    "total_users": 100,
    "completed": 75,
    "in_progress": 15,
    "skipped": 10,
    "completion_rate": 75.0,
    "average_time_to_complete": 3600  // seconds
  }
}
```

---

### GPS & Location

#### POST /api/gps
Update GPS location.

**Auth:** Required (typically tech users)
**Body:**
```typescript
{
  "latitude": 39.7684,
  "longitude": -86.1581,
  "accuracy"?: 10,  // meters
  "speed"?: 35,  // mph
  "heading"?: 180  // degrees
}
```

**Returns:** `{ success: true }`

**Note:** Creates entry in `gps_logs` table for tracking tech locations.

---

### MCP (Model Context Protocol)

#### POST /api/mcp
MCP endpoint for AI agent tool calls.

**Auth:** Required (or service role)
**Body:**
```typescript
{
  "method": "tools/call",
  "params": {
    "name": "create_job" | "search_contacts" | "assign_tech" | ...,
    "arguments": {
      "contactId"?: "uuid",
      "contactName"?: "John Smith",
      "description"?: "Fix HVAC"
    }
  }
}
```

**Available Tools:**
1. `create_job` - Create new job
2. `search_contacts` - Find contacts
3. `create_contact` - Add new contact
4. `assign_tech` - Assign technician to job
5. `search_users` - Find technicians
6. `update_job_status` - Change job status
7. `update_job` - Modify job details
8. `navigate` - Change app view
9. `send_email` - Send email
10. `get_job` - Get job details
11. `get_user_email` - Get account owner email
12. `get_current_page` - Get current app view
13. `read_agent_memory` - Read 72-hour conversation context
14. `update_agent_memory` - Save conversation checkpoint

**Returns:**
```typescript
{
  "result": {
    "success": true,
    "data": { ... }
  }
}
```

**See:** `/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO/SingleSources/VOICE_AGENT_README.md` for detailed MCP tool documentation.

---

### Meetings

#### GET /api/meetings
List meetings.

**Auth:** Required
**Query Params:**
- `userId` - Filter by user
- `dateFrom`, `dateTo` - Date range

**Returns:**
```typescript
{
  "meetings": [
    {
      "id": "uuid",
      "title": "Sales call with John Smith",
      "scheduled_at": "2025-11-28T10:00:00Z",
      "duration": 30,  // minutes
      "attendees": ["uuid1", "uuid2"],
      "transcript": "Meeting notes...",
      "summary": "Discussed HVAC upgrade...",
      "action_items": [
        "Send estimate",
        "Follow up next week"
      ]
    }
  ]
}
```

#### POST /api/meetings
Create meeting.

**Auth:** Required
**Body:**
```typescript
{
  "title": "Client meeting",
  "scheduledAt": "2025-11-28T10:00:00Z",
  "duration": 30,
  "attendees"?: ["uuid1"],
  "notes"?: "Discuss project scope"
}
```

**Returns:** `{ success: true, meeting }` (201)

#### GET /api/meetings/[id]
Get meeting details.

**Auth:** Required

#### POST /api/meetings/analyze
Analyze meeting transcript (AI-powered).

**Auth:** Required
**Body:**
```typescript
{
  "transcript": "Meeting transcript text...",
  "duration"?: 1800
}
```

**Returns:**
```typescript
{
  "summary": "Team discussed Q4 targets...",
  "actionItems": [
    "John to send proposal by Friday",
    "Schedule follow-up next week"
  ],
  "keyTopics": ["Q4 targets", "pricing", "timeline"],
  "sentiment": "positive"
}
```

#### POST /api/meetings/notes
Add meeting notes.

**Auth:** Required
**Body:**
```typescript
{
  "meetingId": "uuid",
  "notes": "Important points from meeting..."
}
```

**Returns:** `{ success: true }`

---

### Reviews

#### GET /api/review-requests
List review requests.

**Auth:** Required

#### POST /api/review-requests
Send review request to customer.

**Auth:** Required
**Body:**
```typescript
{
  "jobId": "uuid",
  "contactId": "uuid"
}
```

**Process:**
1. Gets contact email
2. Finds review request template
3. Replaces variables (contact_name, company_name, review_link)
4. Sends email via Resend

**Returns:** `{ success: true, sent: true }`

---

### Signatures

#### GET /api/signatures
List signatures.

**Auth:** Required
**Query Params:**
- `jobId` - Filter by job

**Returns:**
```typescript
{
  "signatures": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "signer_name": "John Smith",
      "signature_data": "data:image/png;base64,...",
      "signed_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/signatures
Save signature.

**Auth:** Required
**Body:**
```typescript
{
  "jobId": "uuid",
  "signerName": "John Smith",
  "signatureData": "data:image/png;base64,..."
}
```

**Returns:** `{ success: true, signature }` (201)

---

### Development

#### GET /api/test
Test endpoint for development.

**Auth:** None (dev only)
**Returns:** `{ message: "API is working", timestamp: "..." }`

#### POST /api/seed
Seed database with test data.

**Auth:** None (dev only)
**Body:**
```typescript
{
  "type": "contacts" | "jobs" | "all",
  "count"?: 10
}
```

**Returns:** `{ success: true, created: { contacts: 10, jobs: 5 } }`

---

## Common Request/Response Examples

### Creating a Job Flow

```typescript
// 1. Search for contact
GET /api/contacts?search=john+smith

// 2. If not found, create contact
POST /api/contacts
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
// Returns: { contact: { id: "contact-uuid" } }

// 3. Create job
POST /api/jobs
{
  "contactId": "contact-uuid",
  "description": "HVAC repair",
  "scheduledStart": "2025-11-28T10:00:00Z"
}
// Returns: { job: { id: "job-uuid" } }

// 4. Assign technician
POST /api/dispatch/auto-assign
{
  "jobId": "job-uuid"
}
// Returns: { assignment: { techId: "tech-uuid" } }
```

### Sending Email with AI Draft

```typescript
// 1. Get AI draft
POST /api/ai/draft
{
  "conversationId": "conv-uuid"
}
// Returns: Text stream with draft

// 2. Send email
POST /api/send-message
{
  "to": "customer@example.com",
  "type": "email",
  "subject": "Re: Service inquiry",
  "body": "Thank you for reaching out...",
  "conversationId": "conv-uuid"
}
```

### Complete Job Flow

```typescript
// 1. Tech updates status to en_route
POST /api/tech/jobs/job-uuid/status
{ "status": "en_route" }

// 2. Tech arrives and starts work
POST /api/tech/jobs/job-uuid/status
{ "status": "in_progress" }

// 3. Tech adds materials
POST /api/job-materials
{
  "jobId": "job-uuid",
  "name": "Air filter",
  "quantity": 1,
  "cost": 25.00
}

// 4. Tech uploads photos
POST /api/job-photos
FormData: { photo: file, jobId: "job-uuid" }

// 5. Customer signs
POST /api/signatures
{
  "jobId": "job-uuid",
  "signerName": "John Smith",
  "signatureData": "data:image/png;base64,..."
}

// 6. Tech completes job
POST /api/tech/jobs/job-uuid/status
{ "status": "completed" }

// 7. Generate invoice
POST /api/invoices
{
  "jobId": "job-uuid",
  "contactId": "contact-uuid",
  "lineItems": [...],
  "subtotal": 500.00,
  "tax": 40.00,
  "total": 540.00
}

// 8. Send invoice
POST /api/invoices/invoice-uuid/send

// 9. Mark as paid
POST /api/invoices/invoice-uuid/mark-paid
{
  "paymentMethod": "cash"
}
```

---

## Rate Limiting

Rate limits are enforced per account:
- **Default:** 100 requests per minute
- **LLM endpoints:** 20 requests per minute
- **Exceeded:** HTTP 429 with `Retry-After` header

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store access tokens securely** (never in localStorage)
3. **Validate user input** on client and server
4. **Check permissions** before sensitive operations
5. **Use RLS policies** for multi-tenant isolation
6. **Sanitize error messages** to prevent data leakage
7. **Rotate API keys** regularly
8. **Use environment variables** for secrets
9. **Enable audit logging** for compliance
10. **Implement rate limiting** to prevent abuse

---

## Changelog

### Version 2.0 (November 28, 2025)
- Added 165 endpoint documentation
- Comprehensive request/response examples
- AI features documentation (LLM router, drafts, briefings)
- Dispatch auto-assign algorithm details
- MCP tool integration reference
- Security and authentication patterns
- Rate limiting and error handling

---

## Support

For API support:
- Documentation: This file
- MCP Tools: `/SingleSources/VOICE_AGENT_README.md`
- Environment Setup: `/SingleSources/README.md`
- UI/UX Flows: `/SingleSources/UI_UX_MASTER_ROADMAP.md`

**Last Updated:** November 28, 2025
