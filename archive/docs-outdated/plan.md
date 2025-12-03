# # CRM-AI Pro: Implementation Blueprint (Email-First Pilot)
**Role:** You are the Lead System Architect and Build Manager. **Project:** CRM-AI Pro (CRMAI.pro) - A multi-tenant, AI-native business operating system. **Pilot Tenant:** "317 Plumber" (Home Services). **Strategic Pivot:** We are executing an **Email-First strategy**. We are bypassing SMS/Voice 10DLC compliance for the pilot. The system will use email (via Resend) as the primary transport for instant messaging, quotes, and scheduling, treated functionally like a chat interface.

## 1. System Architecture & Stack
We are building a **Supabase-backed Next.js Monolith** to minimize infrastructure complexity for the pilot.
**Core Stack**
* **•	Frontend/App:** Next.js 15 (App Router), TypeScript, TailwindCSS, Shadcn/UI.
* **•	Database/Auth:** Supabase (PostgreSQL, GoTrue Auth, Realtime, Storage).
* **•	Transport Layer:** Resend.com (Transactional Email + Inbound Webhooks).
* **•	AI Layer:** OpenAI (GPT-4o) via Vercel AI SDK or LangChain.
* **•	Payment:** Stripe Connect (Standard).

⠀**Data Flow Architecture**
1. **1	Inbound:** Customer emails help@317plumber.com -> Resend Webhook -> Supabase Edge Function -> Parses & Normalizes -> Inserts into messages table.
2. **2	Realtime:** messages table insert triggers Supabase Realtime -> Updates Unified Inbox UI on Frontend instantly.
3. **3	Outbound:** User/AI types message in UI -> API Route -> Resend API -> Customer receives email.
4. **4	AI Loop:** Background job (or Cron) watches for unreplied inbound messages -> Triggers AI Agent -> Agent drafts reply using Tools -> Saves draft to DB (or sends if fully autonomous).

⠀
## 2. Database Schema (PostgreSQL)
The schema is multi-tenant by default (account_id on every table).
## code
SQL

-- EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. TENANCY & IAM
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null, -- e.g. "317 Plumber"
  slug text unique not null, -- e.g. "317plumber"
  inbound_email_domain text, -- e.g. "reply.317plumber.com"
  settings jsonb default '{}'::jsonb, -- Brand colors, logo, business hours
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users,
  account_id uuid references accounts(id) not null,
  full_name text,
  role text check (role in ('owner', 'admin', 'dispatcher', 'tech')),
  avatar_url text
);

-- 2. CRM CORE
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  email text, -- Primary key for email-first matching
  phone text,
  first_name text,
  last_name text,
  address text,
  created_at timestamptz default now()
);

-- 3. COMMS ENGINE (The "Podium" Killer)
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  contact_id uuid references contacts(id),
  status text default 'open' check (status in ('open', 'closed', 'snoozed')),
  subject text, -- Email subject line
  channel text default 'email',
  last_message_at timestamptz default now(),
  assigned_to uuid references users(id),
  ai_summary text -- Long-term memory summary of thread
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  conversation_id uuid references conversations(id) not null,
  direction text check (direction in ('inbound', 'outbound')),
  sender_type text check (sender_type in ('contact', 'user', 'ai_agent')),
  sender_id uuid, -- Null if contact, User ID if user
  
  -- Email Specifics
  subject text,
  body_text text,
  body_html text,
  attachments jsonb default '[]'::jsonb,
  message_id text, -- Provider ID (Message-ID header)
  in_reply_to text, -- For threading
  
  is_internal_note boolean default false,
  created_at timestamptz default now()
);

-- 4. WORKFLOW & JOBS
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id), -- Link chat to job
  
  status text check (status in ('lead', 'scheduled', 'en_route', 'in_progress', 'completed', 'invoiced', 'paid')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  tech_assigned_id uuid references users(id),
  
  description text,
  total_amount integer, -- In cents
  stripe_payment_link text,
  
  created_at timestamptz default now()
);

-- 5. KNOWLEDGE BASE (For AI)
create table knowledge_docs (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references accounts(id) not null,
  title text,
  content text, -- The raw text the AI reads
  embedding vector(1536) -- For RAG (future proofing)
);

## 3. Phased Build Plan
**Phase 1: The Foundation (Weeks 1-2)
Goal:** A working Unified Inbox where I can email a customer and they can email me back.
1. **1	Setup:** Initialize Next.js, Supabase, Resend account.
2. **2	Database:** Apply schema, setup RLS (Row Level Security) policies.
3. **3	Inbound Pipeline:** Deploy Supabase Edge Function to receive Resend Webhooks and insert into messages.
4. **4	Frontend:** Build the "Inbox" layout (Sidebar list of conversations, Main chat view).
5. **5	Outbound:** API route to send emails via Resend (HTML formatted).

⠀**Phase 2: The "Carl" AI Employee (Weeks 3-4)
Goal:** AI reads emails and drafts responses for 317 Plumber.
1. **1	Knowledge Base:** UI to upload "Pricing Sheet" and "Service Area" text.
2. **2	Agent Integration:** Vercel AI SDK implementation.
   * **◦	Trigger:** New inbound message.
   * **◦	Context:** Previous 5 messages + Knowledge Base snippets.
   * **◦	Output:** A "Draft" message inserted into the DB (internal note style) for human review.
3. **3	Tools:** Give AI the ability to call create_job_draft function.

⠀**Phase 3: Job Workflow & Payments (Weeks 5-6)
Goal:** Convert a chat into money.
1. **1	Job UI:** A "Job Card" in the right sidebar of the inbox.
2. **2	Stripe:** Generate Payment Link button.
3. **3	Rich Emails:** Create React Email templates for "Quote," "Invoice," and "Review Request" that the AI/User can send.

⠀
## 4. Agent-Friendly Ticket Breakdown
Use these prompts to assign tasks to coding agents.
**Ticket 1: Infrastructure & Inbound Email Parser
Role:** Backend Engineer (Supabase/TypeScript) **Context:** We need to ingest emails from Resend into our Supabase DB. **Task:**
1. 1	Create the conversations and messages tables (SQL provided above).
2. 2	Create a Supabase Edge Function handle-inbound-email.
3. 3	Logic:
   * ◦	Receive JSON from Resend.
   * ◦	Parse To address to find the correct account (e.g., help@317plumber.com maps to Account ID X).
   * ◦	Parse From address to find/create contact.
   * ◦	Check In-Reply-To headers to thread into existing conversation. If none, create new.
   * ◦	Insert record into messages. **Definition of Done:** Sending an email to the webhook URL results in a new row in Supabase messages table.

⠀**Ticket 2: Unified Inbox UI (The "Podium" View)
Role:** Frontend Engineer (React/Tailwind) **Context:** Main dashboard for the user. **Task:**
1. 1	Create layout: app/(dashboard)/inbox/page.tsx.
2. **2	Left Sidebar:** List of conversations (fetched via React Query). Show unread badge, last message snippet, timestamp. Realtime subscription to refetch on new message.
3. **3	Middle Pane:** Message Thread. Scrollable list of messages for selected conversation. Distinguish between Inbound (Left) and Outbound (Right).
4. **4	Right Pane:** Contact Details & Notes. **Definition of Done:** UI looks like a modern chat app. Data loads from Supabase. Realtime updates work (send an email, it pops up).

⠀**Ticket 3: Outbound Email System
Role:** Full Stack Developer **Task:**
1. 1	Create a Next.js API Route /api/send-message.
2. 2	Logic:
   * ◦	Validate user session.
   * ◦	Insert message into messages table (as outbound).
   * ◦	Call Resend API to send the actual email.
   * ◦	Important: Set In-Reply-To headers correctly so the customer's reply threads back.
3. 3	Integrate this API into the "Reply" input box in the Inbox UI. **Definition of Done:** Typing "Hello" in the UI and hitting enter sends an actual email to my Gmail, and the UI updates to show the sent message.

⠀**Ticket 4: AI Agent "Draft Mode"
Role:** AI Engineer **Task:**
1. 1	Create a function generateDraftReply(conversationId).
2. 2	Fetch conversation history.
3. 3	System Prompt: "You are Carl, an assistant for 317 Plumber. Be brief, helpful, and ask for the address if missing."
4. 4	Call OpenAI (GPT-4o-mini).
5. 5	Insert the result into messages table with is_internal_note = true and a flag is_ai_draft = true.
6. 6	UI Update: Show this draft in the input box (ghost text) for the human to approve/edit.

⠀
## 5. 317 Plumber Pilot Configuration
**To configure the system for the pilot:**
1. **1	Email Setup:**
   * ◦	Domain: mail.317plumber.com (verified in Resend).
   * ◦	Forwarding: Set up help@317plumber.com (Gmail) to auto-forward to our Resend Inbound Address, OR update MX records to point directly to Resend if they are brave.
2. **2	Knowledge Base (System Prompt):**
   * ◦	"You are Carl. You schedule appointments for 317 Plumber."
   * ◦	"Service Area: Indianapolis, Carmel, Fishers."
   * ◦	"Pricing: $89 Diagnostic Fee (waived if work is done)."
   * ◦	"Urgency: If water is actively leaking, tell them to shut off the main valve immediately."
3. **3	Templates (React Email):**
   * **◦	The "En Route" Email:** A card showing the Tech's photo and "I'm 15 mins away."
   * **◦	The "Review" Email:** "Thanks for choosing us! Click here to leave a Google Review." (Link pre-filled).

⠀
## 6. Implementation Directives for Coding Agent
* **•	Don't hallucinate auth:** Use @supabase/auth-helpers-nextjs.
* **•	Styling:** Use shadcn/ui components for everything. Do not write custom CSS unless necessary.
* **•	Type Safety:** Generate TypeScript types from the Supabase schema (supabase gen types).
* **•	Error Handling:** In the Edge Function, return 200 OK to Resend even if our logic fails (log the error) so Resend doesn't retry infinitely.

⠀**Start with Ticket 1 & 2.** Go.
**Phase 2: The AI Employee ("Carl")
Focus:** RAG (Retrieval-Augmented Generation), Knowledge Base, and AI Drafting.
**Ticket 2.1: Knowledge Base & Vector Embeddings
Role:** Backend Engineer / AI Engineer **Context:** "Carl" needs to know 317 Plumber's pricing and service area. We will use Supabase pgvector. **Task:**
1. 1	Enable vector extension in Supabase.
2. 2	Create table knowledge_docs (id, content, embedding vector(1536), account_id).
3. 3	Create a Supabase Edge Function embed-document:
   * ◦	Input: Text string.
   * ◦	Action: Call OpenAI text-embedding-3-small.
   * ◦	Output: Store text + vector in DB.
4. 4	Create a Postgres RPC function match_documents to find similar text based on query vector similarity. **Definition of Done:** I can insert a text string like "Water heater flush costs $199" and successfully query for "price of flush" using SQL/RPC to get that record back.

⠀**Ticket 2.2: The "Carl" Orchestrator (Vercel AI SDK)
Role:** AI Engineer **Context:** We need an API route that takes a conversation history and generates a response. **Task:**
1. 1	Install ai and @ai-sdk/openai.
2. 2	Create API route /api/ai/generate-reply.
3. **3	Logic:**
   * ◦	Fetch last 10 messages of the conversation.
   * ◦	Extract the customer's latest question.
   * **◦	RAG Step:** Embed the question, query match_documents for context (e.g., pricing).
   * **◦	System Prompt:** "You are Carl, an AI scheduling assistant. Use the provided context to answer. Keep it short. Do NOT invent prices."
   * **◦	Output:** Stream the text response back to the client.
4. **4	Frontend Integration:** Add a "✨ Auto-Draft" button in the Inbox input area. Clicking it fills the text area with Carl's suggestion (user must click send). **Definition of Done:** Clicking "Auto-Draft" on a thread asking "How much for a toilet fix?" fills the input box with the correct price from the database.

⠀
**Phase 3: Job Workflow & Field "App" (PWA)
Focus:** Moving from "Chat" to "Work Order". Instead of a separate React Native app, we will build a **Mobile-First Web View** inside the Next.js app for the Pilot.
**Ticket 3.1: Job Management Backend
Role:** Backend Engineer **Context:** We need to track work orders linked to conversations. **Task:**
1. 1	Update jobs table: Ensure fields exist for scheduled_start, scheduled_end, status (scheduled, en_route, working, done), technician_notes.
2. 2	Create API endpoints (Server Actions) for:
   * ◦	createJob(conversationId, contactId)
   * ◦	updateJobStatus(jobId, status)
   * ◦	assignTech(jobId, userId)
3. **3	Frontend:** Create a "Job Sidebar" component in the Inbox.
   * ◦	If no job exists for this thread, show "Create Job" button.
   * ◦	If job exists, show Status dropdown and Date Picker. **Definition of Done:** A dispatcher can turn an email thread into a "Scheduled" job assigned to a user.

⠀**Ticket 3.2: The Field Tech View (Mobile PWA)
Role:** Frontend Engineer (Mobile UX Focus) **Context:** Techs need a simple view on their phone to see what to do. **Task:**
1. 1	Create route /tech/dashboard.
2. **2	Design:** Mobile-first. Big buttons.
3. **3	Features:**
   * ◦	"Today's Schedule": List of jobs assigned to current user.
   * ◦	"Job Detail": Address (link to Google Maps), Customer Name, Description.
   * ◦	"Status Update": Buttons for "En Route" -> "Start" -> "Complete".
   * ◦	"Photo Upload": Simple file input to upload to Supabase Storage bucket job-photos.
4. **4	Email Trigger:** When status changes to "En Route", trigger an email to the customer: "Your tech [Name] is on the way!" **Definition of Done:** Open /tech/dashboard on iPhone simulation. I can see a job, tap "En Route" (updates DB + sends email), and upload a photo.

⠀
**Phase 4: Reviews & Payments
Focus:** Monetization and Reputation.
**Ticket 4.1: Stripe Integration (Payment Links)
Role:** Backend Engineer **Context:** We need to get paid via email. **Task:**
1. 1	Setup Stripe (Test Mode).
2. 2	Create Server Action createPaymentRequest(jobId, amountCents, description).
3. **3	Logic:**
   * ◦	Call Stripe API to create a Payment Link.
   * ◦	Store stripe_payment_id and payment_url in the jobs table.
4. **4	Frontend:** Add "$" button in the Inbox.
   * ◦	Clicking it opens a modal: "Amount", "Description".
   * ◦	On submit: Generates link, and appends a message to the chat: "Hi! Here is the invoice for today: [Link]". **Definition of Done:** I can click the "$" button, generate a $100 link, and the customer receives an email with a click-to-pay button.

⠀**Ticket 4.2: Review Engine
Role:** Full Stack Developer **Context:** After the job is done, we need a Google Review. **Task:**
1. 1	Add google_review_link to accounts table (config).
2. 2	Create a React Email template ReviewRequestEmail.
   * ◦	Header: "How did we do?"
   * ◦	Body: "Click here to rate us on Google."
   * ◦	Logic: Only send if google_review_link exists.
3. **3	Automation:** Create a database trigger or Supabase Edge Function.
   * **◦	Trigger:** When jobs.status changes to completed.
   * **◦	Action:** Wait 1 hour (optional, maybe immediate for pilot), then send the Review Email via Resend. **Definition of Done:** Marking a job as "Complete" in the Tech View automatically sends a "Please review us" email to the customer.

⠀
**Phase 5: Automation & Observability
Focus:** Making the system robust.
**Ticket 5.1: The "Missed Opportunity" Watchdog
Role:** Backend Engineer **Context:** If a lead emails and nobody replies for 15 minutes, we want the AI to step in automatically (Escalation). **Task:**
1. 1	Create a Supabase Edge Function (scheduled via pg_cron or invoked periodically).
2. **2	Query:** Find conversations where:
   * ◦	last_message_direction = 'inbound'
   * ◦	status = 'open'
   * ◦	created_at < NOW() - 15 minutes
   * ◦	No draft exists.
3. **3	Action:** Call the AI Agent (from Phase 2) to generate a draft and mark the conversation as needs_review.
4. **4	Notification:** Send an internal email/SMS to the Admin: "Lead waiting: [Subject]". **Definition of Done:** Send an email to the system. Wait 16 minutes. Check DB -> A draft reply should exist and the Admin should be alerted.

⠀**Ticket 5.2: Analytics Dashboard
Role:** Frontend Engineer **Context:** 317 Plumber needs to know if this is working. **Task:**
1. 1	Create page /dashboard/analytics.
2. **2	Metrics Cards:**
   * ◦	"Revenue Pending" (Sum of unpaid jobs).
   * ◦	"Revenue Collected" (Sum of paid Stripe events).
   * ◦	"Jobs Completed" (Count).
   * ◦	"Average Response Time" (Time between Inbound msg and Outbound msg).
3. **3	Chart:** Bar chart of Jobs per Day. **Definition of Done:** A simple dashboard showing real numbers calculated from the jobs and messages tables.
