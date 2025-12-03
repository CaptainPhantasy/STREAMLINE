# CRM AI Pro - Business Workflows

**Version:** 1.0
**Last Updated:** November 28, 2025
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Job Lifecycle Workflow](#job-lifecycle-workflow)
3. [7-Gate Tech Job Completion Workflow](#7-gate-tech-job-completion-workflow)
4. [Estimate Workflow](#estimate-workflow)
5. [Invoice Generation Workflow](#invoice-generation-workflow)
6. [Campaign Workflow](#campaign-workflow)
7. [Onboarding Workflow](#onboarding-workflow)
8. [Automation & Notification Triggers](#automation--notification-triggers)
9. [Role-Based Workflows](#role-based-workflows)
10. [Workflow State Transitions](#workflow-state-transitions)

---

## Overview

This document defines all business workflows in CRM AI Pro. Each workflow represents a standardized process that guides users and systems through critical business operations.

### Workflow Design Principles

- **Progressive Gating:** Critical steps must be completed before advancing
- **Offline Support:** All mobile workflows support offline operation with automatic sync
- **GPS Tracking:** Location is captured at key workflow checkpoints
- **AI-Powered:** Automation rules trigger actions based on workflow events
- **Role-Specific:** Each user role has optimized workflows for their responsibilities

---

## Job Lifecycle Workflow

### Status Progression

Jobs move through a defined lifecycle from initial lead to final payment:

```
lead → scheduled → en_route → in_progress → completed → invoiced → paid
```

### Status Definitions

| Status | Description | Trigger | Next Valid States |
|--------|-------------|---------|-------------------|
| **lead** | Initial inquiry or potential work | Contact inquiry, campaign response | scheduled, closed |
| **scheduled** | Job scheduled with date/time | Calendar assignment | en_route, in_progress, closed |
| **en_route** | Tech traveling to job site | Tech "I've Arrived" button, GPS arrival | in_progress, scheduled |
| **in_progress** | Tech actively working on job | Tech started work | completed, en_route |
| **completed** | Work finished, ready for invoicing | Final signature captured | invoiced, closed |
| **invoiced** | Invoice generated and sent | Generate invoice action | paid, completed |
| **paid** | Payment received | Payment processed | (terminal state) |

### State Transition Rules

**From Lead:**
- Can schedule when tech and time slot assigned
- Can close if customer declines

**From Scheduled:**
- Automatically advances to `en_route` when tech logs GPS arrival
- Can revert to `lead` if customer reschedules

**From En Route:**
- Advances to `in_progress` when tech confirms work start
- Can revert to `scheduled` if tech returns to office

**From In Progress:**
- Advances to `completed` when all 7 gates completed (see next section)
- Can revert to `en_route` if tech leaves site temporarily

**From Completed:**
- Advances to `invoiced` when invoice generated
- Can revert to `in_progress` if additional work needed

**From Invoiced:**
- Advances to `paid` when payment received
- Can revert to `completed` if invoice canceled

**From Paid:**
- Terminal state (no further transitions)

### Job Creation Triggers

1. **Manual Creation** - Office staff or dispatcher creates job
2. **Email Parsing** - AI extracts job details from customer email
3. **Voice Command** - Voice agent creates job from phone call
4. **Campaign Response** - Customer responds to marketing campaign
5. **Estimate Acceptance** - Approved estimate converts to job
6. **Repeat Customer** - Recurring service auto-generated

---

## 7-Gate Tech Job Completion Workflow

Mobile technicians must complete 7 sequential gates to finish a job. This workflow is implemented in `/app/m/tech/job/[id]/page.tsx`.

### Gate 1: Arrival Confirmation

**Purpose:** Log GPS arrival at job site

**Actions:**
- Tech taps "I'VE ARRIVED" button
- System captures GPS coordinates
- System logs arrival timestamp
- Job status → `en_route`

**Validation:**
- GPS permissions must be granted
- Location must be within reasonable distance of job address (optional check)

**Offline Support:** ✅ Saves to IndexedDB, syncs when online

---

### Gate 2: Before Photos

**Purpose:** Document work area before starting

**Actions:**
- Tech takes 1+ photos using device camera
- Photos uploaded to storage
- Photo URLs saved to job record

**Validation:**
- At least 1 photo required to proceed

**Offline Support:** ✅ Photos stored locally as base64, uploaded on reconnect

---

### Gate 3: Work Complete Confirmation

**Purpose:** Tech confirms work is finished

**Actions:**
- Tech taps "WORK IS COMPLETE"
- Timestamp recorded

**Validation:**
- Before photos must be completed

---

### Gate 4: After Photos

**Purpose:** Document completed work

**Actions:**
- Tech takes 1+ photos of finished work
- Photos uploaded to storage
- Photo URLs saved to job record

**Validation:**
- At least 1 photo required to proceed

**Offline Support:** ✅ Photos stored locally, uploaded on reconnect

---

### Gate 5: Customer Satisfaction Rating

**Purpose:** Capture immediate customer feedback

**Actions:**
- Tech asks customer to rate satisfaction (1-5 stars)
- Rating recorded

**Escalation Rules:**
- **Rating 1-3:** Manager automatically notified, tech skips to Gate 7
- **Rating 4-5:** Proceed to Gate 6 (review request)

**Validation:**
- Rating must be selected (1-5)

---

### Gate 6: Review Request (Optional)

**Purpose:** Request Google/Yelp review in exchange for discount

**Actions:**
- Tech offers 5% discount for review
- Customer accepts or declines
- Discount applied to invoice if accepted

**Business Logic:**
- Only shown if satisfaction rating ≥ 4
- Discount amount configurable in settings
- Review link sent via SMS/email after job complete

---

### Gate 7: Customer Signature

**Purpose:** Final approval and authorization

**Actions:**
- Customer signs on touch screen
- Signature captured as image
- Signature uploaded to storage
- GPS departure logged
- Job status → `completed`

**Validation:**
- Signature canvas must not be empty

**Offline Support:** ✅ Signature stored as data URL, uploaded on reconnect

**Completion Actions:**
- Job marked complete in database
- Office/dispatcher notified
- Invoice generation workflow can begin
- Tech dashboard updated

---

## Estimate Workflow

Estimates represent potential work that requires customer approval before becoming a job.

### Estimate Status Lifecycle

```
draft → sent → viewed → accepted/rejected/expired
```

### Status Definitions

| Status | Description | Trigger |
|--------|-------------|---------|
| **draft** | Estimate being created | New estimate started |
| **sent** | Delivered to customer | Send action triggered |
| **viewed** | Customer opened estimate | Email tracking pixel |
| **accepted** | Customer approved estimate | Customer clicked "Accept" |
| **rejected** | Customer declined estimate | Customer clicked "Decline" |
| **expired** | Past valid_until date | Automated daily job |

### Estimate Creation Process

1. **Select Customer**
   - Search existing contacts
   - Or create new contact

2. **Add Line Items**
   - Item types: Labor, Material, Equipment, Other
   - Each item has: quantity, unit, unit price
   - Subtotal calculated automatically

3. **Configure Pricing**
   - Set tax rate (percentage)
   - Tax amount calculated from subtotal
   - Total = Subtotal + Tax

4. **Set Validity Period**
   - Optional expiration date
   - Estimate auto-expires if not accepted by date

5. **Add Notes**
   - Customer-facing notes (scope, terms)
   - Internal notes (cost breakdown, margins)

### Estimate Actions

**Send to Customer:**
- Generates PDF document
- Sends email with estimate attached
- Includes "Accept" and "Decline" buttons
- Status → `sent`

**Convert to Job:**
- Only available for `accepted` estimates
- Creates new job with estimate details
- Line items copied to job
- Estimate linked to job record

**Duplicate:**
- Creates copy of estimate
- Useful for similar recurring work

**Download PDF:**
- Generate PDF for printing/sharing
- Includes company branding

**Edit:**
- Only available for `draft` status
- Sent estimates cannot be edited (create new version instead)

**Delete:**
- Only available for `draft` or `expired` estimates

---

## Invoice Generation Workflow

Invoices are created from completed jobs to collect payment.

### Invoice Status Lifecycle

```
draft → sent → paid/overdue/cancelled
```

### Status Definitions

| Status | Description | Trigger |
|--------|-------------|---------|
| **draft** | Invoice being created | Generate invoice started |
| **sent** | Delivered to customer | Send action triggered |
| **paid** | Payment received | Payment recorded |
| **overdue** | Past due date unpaid | Automated daily job |
| **cancelled** | Invoice voided | Manual cancellation |

### Invoice Generation Process

**Trigger:** Job status = `completed`

1. **Open Generate Invoice Dialog**
   - Pre-fills amount from job.total_amount
   - Pre-fills description from job.description
   - Set due date (default: 30 days)

2. **Create Invoice Record**
   - Links to job_id and contact_id
   - Amount stored in cents
   - Status = `draft`

3. **Send Invoice**
   - Generates PDF with line items
   - Sends email to customer
   - Includes Stripe payment link (if configured)
   - Status → `sent`
   - Job status → `invoiced`

4. **Payment Processing**
   - Customer pays via Stripe link
   - Webhook updates invoice status → `paid`
   - Job status → `paid`
   - Office notified of payment

### Invoice Components

- **Header:** Company info, invoice number, date
- **Customer Info:** Contact name, address, email
- **Line Items:** Description, quantity, rate, total
- **Pricing:** Subtotal, tax, discount (if review requested), total
- **Payment Info:** Payment methods accepted, due date
- **Footer:** Company terms, thank you message

---

## Campaign Workflow

Marketing campaigns enable bulk outreach to contacts with tracking and automation.

### Campaign Status Lifecycle

```
draft → scheduled → sending → sent → completed
```

### Campaign Creation Process

1. **Campaign Setup**
   - Name and description
   - Select email template
   - Define target audience (filters/segments)

2. **Audience Selection**
   - **All Contacts:** Send to entire database
   - **Filtered:** Apply contact filters (tags, location, last contact date)
   - **Manual Selection:** Choose specific contacts

3. **Schedule or Send**
   - **Send Now:** Immediate delivery
   - **Schedule:** Set future send date/time

4. **Delivery**
   - System queues emails
   - Sends in batches (rate limiting)
   - Tracks open rates, click rates
   - Status → `sending` → `sent`

5. **Results & Analytics**
   - Emails sent count
   - Open rate percentage
   - Click-through rate
   - Unsubscribe count
   - Responses generated

### Campaign Actions & Triggers

**Auto-Response Handling:**
- Customer replies to campaign email
- AI analyzes sentiment and intent
- Creates conversation in inbox
- Can trigger automation rules (e.g., auto-schedule consultation)

**Campaign Performance Triggers:**
- Low open rate → Notify marketer to adjust subject lines
- High unsubscribe rate → Pause campaign
- Customer clicks link → Tag as "interested"

---

## Onboarding Workflow

Role-specific onboarding guides new users through system setup.

### Role-Specific Flows

| Role | Steps | Duration | Focus |
|------|-------|----------|-------|
| **Owner** | 7 steps | 15 min | Complete system setup |
| **Tech** | 5 steps | 10 min | Mobile-optimized field work |
| **Sales** | 5 steps | 10 min | Lead management & AI tools |
| **Dispatcher** | 4 steps | 8 min | Map & job assignment |
| **Admin** | 3 steps | 5 min | User & system management |

### Owner Onboarding (7 Steps)

1. **Welcome & Company Setup**
   - Enter company name, address, logo
   - Configure business hours
   - Set tax rate and invoice terms

2. **Invite Team Members**
   - Add users (techs, dispatchers, sales)
   - Assign roles and permissions

3. **Import Contacts**
   - Upload CSV or sync from Gmail/Outlook
   - Map fields to CRM structure

4. **Configure Integrations**
   - Connect Gmail/Outlook for email sync
   - Connect Google Calendar/Microsoft 365
   - Optional: Stripe for payments

5. **Create First Job**
   - Practice creating a test job
   - Assign to technician
   - View on dispatch map

6. **Marketing Setup**
   - Create first email template
   - Set up automated follow-ups
   - Configure review request settings

7. **Review Analytics Dashboard**
   - Tour of reports and metrics
   - Set performance goals

### Tech Onboarding (5 Steps)

1. **Mobile App Introduction**
   - Download PWA to home screen
   - Enable GPS and camera permissions
   - Enable notifications

2. **View Your Schedule**
   - See today's assigned jobs
   - Understand job statuses

3. **Complete Practice Job**
   - Walk through 7-gate workflow
   - Take practice photos
   - Complete signature

4. **GPS & Tracking**
   - Understand automatic location logging
   - How GPS improves dispatch

5. **Communication Tools**
   - Voice navigation commands
   - Contact customer from app
   - Message office/dispatcher

### Sales Onboarding (5 Steps)

1. **Mobile CRM Setup**
   - Access mobile sales dashboard
   - Enable notifications

2. **Lead Management**
   - View leads pipeline
   - Create new contact
   - Schedule follow-up

3. **AI Briefing Tool**
   - Generate pre-call briefing
   - View contact history
   - Get conversation starters

4. **Estimate Creation**
   - Create estimate from mobile
   - Send to customer
   - Track opens and responses

5. **Voice Commands**
   - Use voice to create contacts
   - Voice-activate navigation
   - Hands-free operation

### Dispatcher Onboarding (4 Steps)

1. **Dispatch Map Overview**
   - View technicians in real-time
   - See job locations
   - Filter by status

2. **Job Assignment**
   - Drag jobs to techs
   - Auto-assign based on location
   - Bulk assignment

3. **Schedule Management**
   - View tech calendars
   - Reschedule jobs
   - Handle conflicts

4. **Monitoring & Alerts**
   - Tech goes offline notification
   - Job running late alert
   - Emergency job prioritization

### Admin Onboarding (3 Steps)

1. **User Management**
   - Create/edit users
   - Assign roles
   - Manage permissions

2. **Automation Rules**
   - Review pre-built rules
   - Create custom automation
   - Test and activate

3. **System Settings**
   - Configure company settings
   - Manage integrations
   - Review security settings

### Onboarding Completion Triggers

- **All Steps Complete:** Confetti celebration, completion certificate
- **Dismissed:** User can skip, resume later from dashboard checklist
- **Partial Complete:** Progress saved, resume on next login
- **Restart:** Available from settings for re-training

---

## Automation & Notification Triggers

Automation rules automatically perform actions when specific events occur.

### Trigger Types

| Trigger | Description | Use Cases |
|---------|-------------|-----------|
| **unreplied_time** | Message not replied to within X hours | Auto-escalate to manager |
| **status_change** | Job/estimate status changes | Notify team members |
| **keyword** | Message contains specific keyword | Auto-tag as "urgent" |
| **sentiment** | AI detects negative sentiment | Escalate to customer success |
| **conversation_created** | New conversation starts | Auto-assign to sales rep |
| **message_received** | Any incoming message | Log to CRM |
| **job_status_changed** | Job moves through lifecycle | Update customer, notify tech |
| **job_created** | New job created | Assign to dispatcher |

### Action Types

| Action | Description | Configuration |
|--------|-------------|---------------|
| **send_email** | Send automated email | Template, recipient |
| **send_sms** | Send text message | Message body, phone |
| **assign_job** | Assign to specific user | User ID or role |
| **create_notification** | In-app notification | Recipient, message |
| **update_status** | Change job/conversation status | Target status |
| **create_draft** | Draft AI response | Template |
| **create_job** | Auto-create job from trigger | Job details |

### Pre-Built Automation Rules

1. **Job Completion Follow-Up**
   - Trigger: job_status_changed (to `completed`)
   - Action: send_email (thank you + review request)

2. **Overdue Invoice Reminder**
   - Trigger: invoice_overdue (daily check)
   - Action: send_email (payment reminder)

3. **Tech Offline Alert**
   - Trigger: tech_offline (>30 minutes)
   - Action: create_notification (notify dispatcher)

4. **Emergency Job Assignment**
   - Trigger: keyword ("emergency", "urgent")
   - Action: assign_job (on-call tech)

5. **Low Satisfaction Escalation**
   - Trigger: satisfaction_rating (≤3)
   - Action: create_notification (notify manager) + send_email (customer follow-up)

6. **Estimate Expiring Soon**
   - Trigger: estimate_expires_in (3 days)
   - Action: send_email (reminder to customer)

7. **New Lead Assignment**
   - Trigger: job_created (status=`lead`)
   - Action: assign_job (available sales rep)

8. **Campaign Response Handling**
   - Trigger: message_received (from campaign)
   - Action: create_notification (notify sales) + update_status (lead="hot")

### Notification Preferences

Users can configure which events trigger notifications:

**Email Notifications:**
- Job assigned
- Job completed
- Invoice overdue
- New message
- Tech offline
- Estimate accepted/rejected
- Meeting reminder

**SMS Notifications:**
- Emergency jobs
- Tech late to job
- Payment received

**Push Notifications:**
- All of the above (mobile app)

**Quiet Hours:**
- Suppress notifications during configured hours
- Default: 10 PM - 8 AM

---

## Role-Based Workflows

Each role has optimized workflows for their primary responsibilities.

### Owner Workflows

1. **Review Daily Dashboard**
   - Revenue today
   - Jobs completed
   - Outstanding invoices
   - Tech performance

2. **Approve High-Value Estimates**
   - Review estimates >$5,000
   - Approve or request revisions
   - Send to customer

3. **Manage Team**
   - Review user activity
   - Adjust permissions
   - Onboard new hires

4. **Financial Management**
   - Export invoices for accounting
   - Review profit margins
   - Set pricing guidelines

### Dispatcher Workflows

1. **Morning Dispatch Planning**
   - Review scheduled jobs for day
   - Check tech availability
   - Assign unassigned jobs
   - Optimize routes

2. **Real-Time Monitoring**
   - Watch dispatch map
   - Track tech locations
   - Handle job delays
   - Reassign if needed

3. **Customer Communication**
   - Send appointment reminders
   - Update customers on tech ETA
   - Handle rescheduling requests

4. **Emergency Handling**
   - Prioritize urgent jobs
   - Find available tech
   - Update customer ASAP

### Tech Workflows

1. **Morning Schedule Review**
   - View today's jobs
   - Get directions to first job
   - Review customer notes

2. **Job Execution (7-Gate)**
   - Log arrival
   - Take before photos
   - Complete work
   - Take after photos
   - Get satisfaction rating
   - Request review
   - Capture signature

3. **Parts & Inventory**
   - Log parts used
   - Request parts from office
   - Update inventory

4. **End of Day**
   - Review completed jobs
   - Ensure all signatures captured
   - Plan next day's route

### Sales Workflows

1. **Lead Follow-Up**
   - Review leads pipeline
   - Call hot leads
   - Send follow-up emails

2. **Pre-Call Briefing**
   - Generate AI briefing
   - Review customer history
   - Prepare talking points

3. **Create Estimate**
   - Build estimate on-site
   - Send to customer
   - Track opens

4. **Close Deal**
   - Get verbal approval
   - Convert estimate to job
   - Schedule with dispatcher

### Admin Workflows

1. **User Management**
   - Create new users
   - Reset passwords
   - Manage permissions

2. **Automation Management**
   - Monitor rule performance
   - Create new rules
   - Disable underperforming rules

3. **System Maintenance**
   - Review error logs
   - Update integrations
   - Configure settings

---

## Workflow State Transitions

### Job State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    JOB LIFECYCLE STATE MACHINE               │
└─────────────────────────────────────────────────────────────┘

    ┌──────┐
    │ LEAD │ ◄─── (Initial State: Contact inquiry)
    └──┬───┘
       │ schedule()
       ▼
┌──────────────┐
│  SCHEDULED   │ ◄─── (Tech & time assigned)
└──┬───────────┘
   │ logArrival()
   ▼
┌──────────────┐
│  EN_ROUTE    │ ◄─── (GPS: Traveling to site)
└──┬───────────┘
   │ startWork()
   ▼
┌──────────────┐
│ IN_PROGRESS  │ ◄─── (Work in progress)
└──┬───────────┘
   │ complete7Gates()
   ▼
┌──────────────┐
│  COMPLETED   │ ◄─── (Signature captured)
└──┬───────────┘
   │ generateInvoice()
   ▼
┌──────────────┐
│  INVOICED    │ ◄─── (Invoice sent)
└──┬───────────┘
   │ recordPayment()
   ▼
┌──────────────┐
│     PAID     │ ◄─── (Terminal: Payment received)
└──────────────┘
```

### Estimate State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                ESTIMATE LIFECYCLE STATE MACHINE              │
└─────────────────────────────────────────────────────────────┘

    ┌───────┐
    │ DRAFT │ ◄─── (Initial State: Being created)
    └───┬───┘
        │ send()
        ▼
    ┌──────┐
    │ SENT │ ◄─── (Email delivered)
    └───┬──┘
        │ customerOpens()
        ▼
    ┌────────┐
    │ VIEWED │ ◄─── (Customer opened email)
    └───┬────┘
        │
        ├─ accept() ──► ┌──────────┐
        │               │ ACCEPTED │ ──► convertToJob()
        │               └──────────┘
        │
        ├─ reject() ──► ┌──────────┐
        │               │ REJECTED │ (Terminal)
        │               └──────────┘
        │
        └─ expire() ──► ┌─────────┐
                        │ EXPIRED │ (Terminal)
                        └─────────┘
```

### Invoice State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                INVOICE LIFECYCLE STATE MACHINE               │
└─────────────────────────────────────────────────────────────┘

    ┌───────┐
    │ DRAFT │ ◄─── (Initial State: Being created)
    └───┬───┘
        │ send()
        ▼
    ┌──────┐
    │ SENT │ ◄─── (Email delivered)
    └───┬──┘
        │
        ├─ pay() ────────► ┌──────┐
        │                  │ PAID │ (Terminal)
        │                  └──────┘
        │
        ├─ pastDue() ────► ┌─────────┐
        │                  │ OVERDUE │ ──► pay() ──► PAID
        │                  └─────────┘
        │
        └─ cancel() ──────► ┌───────────┐
                            │ CANCELLED │ (Terminal)
                            └───────────┘
```

---

## Implementation Files Reference

### Job Lifecycle
- **State Management:** `/types/index.ts` (Job status type)
- **Status Update API:** `/app/api/jobs/[id]/status/route.ts`
- **State Transitions:** `/supabase/functions/update-job-status/index.ts`

### 7-Gate Tech Workflow
- **Mobile Page:** `/app/m/tech/job/[id]/page.tsx`
- **Gate API:** `/app/api/tech/gates/route.ts`
- **Offline Storage:** `/lib/offline/db.ts` (IndexedDB)
- **GPS Tracker:** `/lib/gps/tracker.ts`

### Estimate Workflow
- **Builder Dialog:** `/components/estimates/EstimateBuilderDialog.tsx`
- **List View:** `/components/estimates/EstimateListView.tsx`
- **Detail Panel:** `/components/estimates/EstimateDetailPanel.tsx`
- **API Routes:** `/app/api/estimates/**`
- **Types:** `/lib/types/estimates.ts`

### Invoice Workflow
- **Generation Dialog:** `/components/jobs/generate-invoice-dialog.tsx`
- **API Routes:** `/app/api/invoices/**`
- **Types:** `/types/invoices.ts`

### Campaign Workflow
- **Campaign Editor:** `/components/marketing/campaign-editor-dialog.tsx`
- **API Routes:** `/app/api/campaigns/**`

### Onboarding Workflow
- **Wizard Component:** `/components/onboarding/OnboardingWizard.tsx`
- **Flow Configs:** `/lib/config/onboarding-flows.tsx`
- **API Routes:** `/app/api/onboarding/**`
- **Types:** `/lib/types/onboarding.ts`

### Automation & Notifications
- **Automation Types:** `/types/automation.ts`
- **Settings Types:** `/lib/types/settings.ts`
- **Notification Context:** `/lib/contexts/NotificationContext.tsx`
- **API Routes:** `/app/api/automation-rules/**` and `/app/api/notifications/**`

---

## Best Practices

### Workflow Design

1. **Always provide feedback** - Users should know workflow is progressing
2. **Allow going back** - Users should be able to return to previous steps
3. **Save progress** - Long workflows should save intermediate state
4. **Validate early** - Check requirements before allowing next step
5. **Handle failures gracefully** - Network errors shouldn't lose data

### Mobile Workflows

1. **Large touch targets** - Minimum 60px for outdoor use
2. **High contrast** - Readable in direct sunlight
3. **Minimal text entry** - Use voice, camera, buttons instead
4. **Offline first** - Always assume connectivity issues
5. **GPS integration** - Leverage location for automation

### Automation Rules

1. **Test before activating** - Always test rules on sample data
2. **Monitor performance** - Track trigger frequency and action success
3. **Use rate limiting** - Prevent notification spam
4. **Provide escape hatches** - Allow users to override automation
5. **Log everything** - Audit trail for troubleshooting

---

**Document Maintainer:** CRM AI Pro Development Team
**Next Review:** January 2026
**Feedback:** Submit workflow improvements via GitHub issues
