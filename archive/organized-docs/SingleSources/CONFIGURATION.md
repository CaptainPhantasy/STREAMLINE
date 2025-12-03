# Configuration & Deployment - Single Source of Truth

**Version:** 3.0
**Last Updated:** November 28, 2025 - 1:45 PM
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [NPM Scripts Reference](#npm-scripts-reference)
4. [Docker Configuration](#docker-configuration)
5. [Development Setup](#development-setup)
6. [Database Setup & Migrations](#database-setup--migrations)
7. [Production Deployment](#production-deployment)
8. [Railway Deployment](#railway-deployment)
9. [Vercel Deployment](#vercel-deployment)
10. [Webpack Error Prevention](#webpack-error-prevention)
11. [Common Issues & Solutions](#common-issues--solutions)

---

## Overview

CRM-AI PRO is a Next.js 14 application with TypeScript, deployed on Railway/Vercel with Supabase as the backend. This document consolidates all configuration, deployment, and troubleshooting information.

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18.0+ |
| **Framework** | Next.js | 14.2.20 |
| **Language** | TypeScript | 5.9.3 |
| **Database** | PostgreSQL (Supabase) | Latest |
| **Package Manager** | npm | 8.0+ |
| **Deployment** | Railway / Vercel | Latest |
| **Container** | Docker (optional) | Latest |

### Key Features

- **AI-First Architecture**: Multi-LLM routing (OpenAI, Anthropic, Google Gemini)
- **Mobile PWA**: Offline-capable progressive web app
- **Real-Time**: WebSocket-powered updates via Supabase
- **Multi-Role**: Owner, Admin, Dispatcher, Technician, Sales
- **Voice AI**: ElevenLabs integration for conversational AI

---

## Environment Variables

### Required Variables

#### Supabase (Database & Auth)

```bash
# Get from: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Purpose:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (client-side safe)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key (client-side safe)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for server-side operations (NEVER expose to client)

#### LLM Providers (AI/ML)

```bash
# OpenAI - Get from: https://platform.openai.com/api-keys
# Format: sk-proj-... or sk-...
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Anthropic - Get from: https://console.anthropic.com/settings/keys
# Format: sk-ant-api03-...
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-key-here

# Google Gemini - Get from: https://makersuite.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=your-gemini-key-here
```

**Purpose:**
- OpenAI: GPT-4o, GPT-4o-mini (default provider for most operations)
- Anthropic: Claude Sonnet 3.5 (complex tasks), Claude Haiku 4.5 (fast drafts)
- Google Gemini: Future support for additional LLM capabilities

**Requirements:**
- At least ONE of OPENAI_API_KEY or ANTHROPIC_API_KEY is required
- LLM Router automatically selects best provider based on task complexity
- Invalid keys prevent app startup (validated in `lib/llm/startup/validator.ts`)

#### Database Encryption

```bash
# Generate with: openssl rand -base64 32
# CRITICAL: Back this up securely - needed to decrypt API keys from database
POSTGRES_ENCRYPTION_KEY=your-secure-32-character-password-here
```

**Purpose:**
- Encrypts API keys stored in database via pgcrypto
- Used by `lib/llm/security/key-manager.ts`
- Losing this key makes stored API keys unrecoverable

**Security:**
- Store in password manager
- Rotate every 90 days
- Use different keys for dev/staging/production

#### Application Base URL

```bash
# Development
NEXT_PUBLIC_BASE_URL=http://localhost:3002

# Production (Railway)
NEXT_PUBLIC_BASE_URL=https://crm-ai-pro-production.up.railway.app

# Production (Vercel)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Production (Custom Domain)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**Purpose:**
- API route resolution
- OAuth redirects
- Email links and webhooks
- PWA manifest URLs

---

### Optional Variables

#### Voice Integration (ElevenLabs)

```bash
# Get from: https://elevenlabs.io/api
ELEVENLABS_API_KEY=sk_your-elevenlabs-key-here
ELEVENLABS_KEY_ID=your-key-id-here
ELEVENLABS_AGENT_ID=agent_your-agent-id-here
```

**Purpose:**
- Voice AI agents for customer interactions
- Text-to-speech for notifications
- Conversational AI capabilities

**Setup:**
```bash
npm run elevenlabs:configure
```

#### Email Integration (Resend)

```bash
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_your-resend-key-here
RESEND_VERIFIED_DOMAIN=resend.dev  # or your custom domain
```

**Purpose:**
- Transactional emails (password resets, notifications)
- Invoice delivery
- Customer communications

#### Payment Processing (Stripe)

```bash
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your-stripe-key-here  # Development
STRIPE_SECRET_KEY=sk_live_your-stripe-key-here  # Production
```

**Purpose:**
- Payment processing
- Invoice payments
- Subscription management (future)

#### Google Maps (Geocoding & Mapping)

```bash
# Get from: https://console.cloud.google.com/apis/credentials
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Optional: Default map center and zoom
NEXT_PUBLIC_MAP_CENTER_LAT=39.768403
NEXT_PUBLIC_MAP_CENTER_LNG=-86.158068
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
```

**Purpose:**
- Dispatch map visualization
- Job location geocoding
- Technician routing
- Distance calculations

#### Feature Flags

```bash
# Enable/disable LLM Router
USE_LLM_ROUTER=true  # Set to false to disable intelligent routing

# Enable individual LLM providers
LLM_ENABLED=true
LLM_OPENAI_ENABLED=true
LLM_ANTHROPIC_ENABLED=true
```

**Purpose:**
- Feature toggles for gradual rollouts
- Provider-specific disabling for debugging
- Cost control during testing

#### Development Settings

```bash
# Disable Next.js telemetry (optional)
NEXT_TELEMETRY_DISABLED=1

# Enable debug logging (optional)
DEBUG=true

# Node environment (auto-set by deployment platforms)
NODE_ENV=development  # or production
```

---

### Environment File Setup

#### Step 1: Copy Template

```bash
cp .env.example .env.local
```

#### Step 2: Fill in Values

Edit `.env.local` with your actual credentials:

```bash
# Open in your editor
code .env.local  # VS Code
nano .env.local  # Terminal
```

#### Step 3: Validate Environment

```bash
npm run test:validate
```

This validates:
- All required variables are set
- API keys are in correct format
- Database connectivity
- LLM provider authentication

#### Step 4: Set Supabase Secrets (for Edge Functions)

```bash
./scripts/setup-supabase-secrets.sh
```

This copies environment variables to Supabase Edge Functions.

---

### Security Best Practices

1. **NEVER commit `.env.local` to version control** (already in `.gitignore`)
2. **Use separate keys for each environment:**
   - Development: `.env.local` (local machine only)
   - Staging: Set in deployment platform dashboard
   - Production: Set in deployment platform dashboard
3. **Rotate API keys every 90 days**
4. **Monitor API key usage** for anomalies
5. **Store `POSTGRES_ENCRYPTION_KEY` in password manager**
6. **Use environment-specific Supabase projects:**
   - Development: `your-project-dev`
   - Production: `your-project-prod`

---

## NPM Scripts Reference

### Development Scripts

```bash
# Start development server (localhost:3000)
npm run dev

# Start development server on custom port
PORT=3002 npm run dev

# Start with Docker Compose (app only)
npm run dev:docker

# Start with Docker Compose (app + MCP server)
npm run dev:full

# Start with local Supabase database
npm run dev:local-db

# Start with Redis caching enabled
npm run dev:with-cache

# Start development server with enhanced logging
./scripts/dev-with-logging.sh
```

**Default Port:** 3000 (override with `PORT` env var)

---

### Build Scripts

```bash
# Build for production (outputs to .next/)
npm run build

# Build production Docker image
npm run build:docker

# Monitor build process with detailed logging
npm run monitor:build
```

**Production Build:**
- Optimizes code and assets
- Creates standalone output (`.next/standalone/`)
- Generates static exports where possible
- Validates TypeScript types
- Bundles and minifies CSS/JS

---

### Start Scripts

```bash
# Start production server (after npm run build)
npm start

# Start Docker Compose services in background
npm run start:docker

# Stop Docker Compose services
npm run stop

# Stop Docker Compose services and remove volumes
npm run stop:full
```

---

### Testing Scripts

```bash
# Run all tests (validation + API + UI)
npm test

# Validate environment variables
npm run test:validate

# Run API tests only (Vitest)
npm run test:api

# Run UI tests only (Playwright)
npm run test:ui

# Run end-to-end tests (Playwright)
npm run test:e2e

# Run unit tests (Vitest)
npm run test:unit

# Test map performance
npm run test:map-performance
```

**Test Coverage:**
- Environment validation
- API endpoint integration
- UI component rendering
- End-to-end user flows
- Performance benchmarks

---

### Setup Scripts

```bash
# Complete development setup (env + db + mcp)
npm run setup:dev

# Copy .env.example to .env.local
npm run setup:env

# Initialize development database
npm run setup:db

# Setup MCP server dependencies
npm run setup:mcp
```

**Initial Setup Workflow:**
```bash
# 1. Clone repository
git clone https://github.com/CaptainPhantasy/crm-ai-pro.git
cd crm-ai-pro

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Setup environment
npm run setup:dev

# 4. Configure .env.local with your credentials
code .env.local

# 5. Validate setup
npm run test:validate

# 6. Start development server
npm run dev
```

---

### Database Scripts

```bash
# Seed database with test data
npm run seed

# Same as seed (alias)
npm run test:setup

# Deploy Supabase Edge Functions
npm run deploy:edge-functions

# Geocode existing job addresses
npm run geocode-jobs
```

**Seed Data:**
- Creates test users for all roles (owner, admin, tech, sales)
- Generates sample contacts and jobs
- Populates realistic data for testing
- Uses environment variables for secure defaults

---

### Configuration Scripts

```bash
# Configure ElevenLabs voice agent
npm run elevenlabs:configure

# Run health check
npm run health-check

# Health check (shell script version)
./scripts/health-check.sh
```

---

### Utility Scripts

```bash
# Start ngrok tunnel (for testing webhooks)
npm run tunnel

# Lint code (ESLint)
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# View Docker logs (all services)
npm run logs

# View logs for CRM app only
npm run logs:crm

# View logs for MCP server only
npm run logs:mcp
```

---

### Deployment Scripts (Shell)

```bash
# Deploy to production (Vercel)
./scripts/deploy-production.sh

# Deploy to staging
./scripts/deploy-staging.sh

# Deploy Supabase Edge Functions
./scripts/deploy-functions.sh

# Verify deployment health
./scripts/verify-deployment.sh

# Rollback deployment
./scripts/rollback.sh

# Run database migrations
./scripts/run-migrations.sh

# Setup Supabase secrets from .env.local
./scripts/setup-supabase-secrets.sh
```

**Deployment Options:**
```bash
# Skip tests during deployment
./scripts/deploy-production.sh --skip-tests

# Skip database migrations
./scripts/deploy-production.sh --skip-migrations

# Dry run (no actual deployment)
./scripts/deploy-production.sh --dry-run

# Combined
./scripts/deploy-production.sh --skip-tests --dry-run
```

---

## Docker Configuration

### Docker Compose Services

The `docker-compose.yml` defines 5 services:

#### 1. CRM App (Main Application)

```yaml
crm-app:
  build: .
  ports: ["3000:3000"]
  volumes:
    - .:/app
    - /app/node_modules
    - /app/.next
  environment:
    - NODE_ENV=development
    - NEXT_PUBLIC_BASE_URL=http://localhost:3000
  command: npm run dev
```

**Purpose:** Next.js application with hot reload

#### 2. MCP Server (Voice Agent Backend)

```yaml
mcp-server:
  build: ./mcp-server
  ports: ["3001:3001"]
  environment:
    - SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
    - DEFAULT_ACCOUNT_ID=fde73a6a-ea84-46a7-803b-a3ae7cc09d00
  depends_on: [crm-app]
  command: npm run dev
```

**Purpose:** MCP server for ElevenLabs voice agent tools

#### 3. Supabase Local (Optional)

```yaml
supabase-local:
  image: supabase/supabase-local:latest
  ports:
    - "54321:54321"  # Studio UI
    - "54322:54322"  # PostgreSQL
    - "54323:54323"  # Inbucket (email testing)
    - "54324:54324"  # GoTrue Auth
  profiles: [local-db]
```

**Purpose:** Local Supabase instance for offline development

**Usage:**
```bash
npm run dev:local-db
```

#### 4. Nginx (Production Profile)

```yaml
nginx:
  image: nginx:alpine
  ports: ["80:80", "443:443"]
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/ssl/certs
  profiles: [production]
```

**Purpose:** Reverse proxy for production-like setup

#### 5. Redis (Cache Profile)

```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
  profiles: [with-cache]
```

**Purpose:** LLM Router response caching

---

### Docker Commands

#### Start Services

```bash
# Start main app only
docker-compose up crm-app

# Start app + MCP server
docker-compose up crm-app mcp-server

# Start with local database
docker-compose --profile local-db up

# Start with Redis caching
docker-compose --profile with-cache up

# Start in production mode
docker-compose --profile production up
```

#### Build and Start

```bash
# Build images and start
docker-compose up --build

# Background mode
docker-compose up -d --build
```

#### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (full cleanup)
docker-compose down -v
```

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f crm-app
docker-compose logs -f mcp-server
```

#### Execute Commands in Container

```bash
# Shell access
docker-compose exec crm-app sh

# Run npm command
docker-compose exec crm-app npm run lint

# Database migration
docker-compose exec crm-app npm run setup:db
```

---

### Docker Networking

Services communicate via `crm-network` bridge network:

```
crm-app (3000) <--> mcp-server (3001)
                <--> redis (6379)
                <--> supabase-local (54322)
```

---

## Development Setup

### Prerequisites

1. **Node.js 18.0+**
   ```bash
   node --version  # Should be 18.0 or higher
   ```

2. **npm 8.0+**
   ```bash
   npm --version  # Should be 8.0 or higher
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Save credentials

5. **API Keys** (at least one LLM provider)
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys

---

### Step-by-Step Setup

#### 1. Clone Repository

```bash
git clone https://github.com/CaptainPhantasy/crm-ai-pro.git
cd crm-ai-pro
```

#### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**
- Resolves peer dependency conflicts
- Required for compatibility with Next.js 14 and React 18
- Configured in `.npmrc` (if file exists)

#### 3. Environment Configuration

```bash
# Copy template
cp .env.example .env.local

# Edit with your credentials
code .env.local  # or nano .env.local
```

**Minimum Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
POSTGRES_ENCRYPTION_KEY=$(openssl rand -base64 32)
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

#### 4. Database Setup

```bash
# Option A: Automated setup
npm run setup:db

# Option B: Manual setup via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/_/editor
# 2. Run SQL files from supabase/migrations/ in order
```

**Migrations (run in order):**
1. `20251127_add_user_impersonation.sql`
2. `20251127_create_user_onboarding.sql`
3. `20251127_add_parts_and_calendar.sql`
4. `20251127_add_job_locations_and_geocoding.sql`
5. `20251127_add_job_documents.sql`
6. `20251127_add_notifications_system.sql`
7. `20250127_add_estimates_system.sql`
8. `20251128_add_tags_and_notes.sql`
9. `20251128_create_agent_memory.sql`

#### 5. Seed Test Data

```bash
npm run seed
```

**Creates:**
- 5 test users (owner, admin, dispatcher, tech, sales)
- 20+ sample contacts
- 15+ sample jobs
- Realistic data for each role

**Default Credentials:**
```
Owner:      owner@example.com / password123
Admin:      admin@example.com / password123
Dispatcher: dispatcher@example.com / password123
Tech:       tech@example.com / password123
Sales:      sales@example.com / password123
```

#### 6. Configure Supabase Edge Functions

```bash
./scripts/setup-supabase-secrets.sh
```

This sets secrets for Edge Functions from your `.env.local`.

#### 7. Validate Setup

```bash
npm run test:validate
```

**Validates:**
- Environment variables are set
- API keys are valid format
- Database connectivity
- Required tables exist
- LLM providers are reachable

#### 8. Start Development Server

```bash
npm run dev

# Or on custom port
PORT=3002 npm run dev
```

**Access:**
- Application: http://localhost:3000 (or your custom port)
- Desktop Routes: `/owner`, `/admin`, `/dispatch`
- Mobile Routes: `/m/tech`, `/m/sales`, `/m/owner`

#### 9. Verify Installation

Open browser and check:
1. Application loads without errors
2. Login page appears
3. Can login with test credentials
4. Dashboard loads for your role
5. No console errors

---

### Common Development Tasks

#### Switch Git Branches

```bash
# Before switching branches
rm -rf .next  # Clear cache

# Switch branch
git checkout feature-branch

# After switching
npm install --legacy-peer-deps  # Update dependencies if needed
npm run dev  # Restart server
```

#### Update Dependencies

```bash
# Update all packages
npm update --legacy-peer-deps

# Update specific package
npm install package-name@latest --legacy-peer-deps

# Clear cache after updates
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Add New Environment Variable

1. Add to `.env.local`:
   ```bash
   NEW_VARIABLE=value
   ```

2. Add to `.env.example` (template):
   ```bash
   NEW_VARIABLE=your-value-here
   ```

3. Update `lib/llm/startup/validator.ts` if required

4. Clear cache and restart:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## Database Setup & Migrations

### Supabase Project Setup

#### Create Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name:** CRM-AI PRO Dev
   - **Database Password:** (save this securely)
   - **Region:** (choose closest to you)
   - **Plan:** Free (for development)

4. Wait for project provisioning (2-3 minutes)

#### Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key:** `SUPABASE_SERVICE_ROLE_KEY`

3. Add to `.env.local`

---

### Running Migrations

#### Method 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Method 2: SQL Editor (Manual)

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/` folder
3. Copy contents of migration files (in order)
4. Paste into SQL Editor
5. Click "Run"

#### Method 3: Migration Script

```bash
./scripts/run-migrations.sh
```

---

### Migration Files

Located in `supabase/migrations/`:

| File | Purpose | Tables Created |
|------|---------|----------------|
| `20251127_add_user_impersonation.sql` | Admin impersonation | `user_impersonation_sessions` |
| `20251127_create_user_onboarding.sql` | User onboarding flow | `user_onboarding_steps` |
| `20251127_add_parts_and_calendar.sql` | Parts & calendar | `parts`, `calendar_events` |
| `20251127_add_job_locations_and_geocoding.sql` | Job geocoding | Adds lat/lng columns |
| `20251127_add_job_documents.sql` | Job documents | `job_documents` |
| `20251127_add_notifications_system.sql` | Notifications | `notifications` |
| `20250127_add_estimates_system.sql` | Estimates | `estimates` |
| `20251128_add_tags_and_notes.sql` | Tags & notes | `tags`, `notes`, `contact_tags`, `contact_notes`, `job_notes` |
| `20251128_create_agent_memory.sql` | AI agent memory | `agent_memory` |

---

### Database Schema Overview

**Core Tables:**
- `users` - User accounts and authentication
- `accounts` - Business accounts (multi-tenancy)
- `contacts` - Customer contacts
- `jobs` - Service jobs/tickets
- `conversations` - Customer communications
- `messages` - Individual messages in conversations

**Feature Tables:**
- `tags`, `notes` - Tagging and note-taking
- `estimates` - Price quotes
- `parts` - Inventory management
- `calendar_events` - Scheduling
- `notifications` - User notifications
- `job_documents` - File attachments

**AI Tables:**
- `agent_memory` - AI agent conversation history
- `llm_provider_keys` - Encrypted API keys

---

### Rollback Procedures

#### Rollback Single Migration

```bash
# Create rollback SQL
cat > rollback.sql << 'EOF'
-- Reverse changes from migration
DROP TABLE IF EXISTS new_table;
ALTER TABLE old_table DROP COLUMN IF EXISTS new_column;
EOF

# Run rollback
supabase db push rollback.sql
```

#### Rollback Tags & Notes Migration

```bash
cat > rollback_tags_notes.sql << 'EOF'
DROP TABLE IF EXISTS job_notes;
DROP TABLE IF EXISTS contact_notes;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS contact_tag_assignments;
DROP TABLE IF EXISTS tags;
EOF

supabase db push rollback_tags_notes.sql
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables configured in deployment platform
- [ ] Database migrations tested in staging
- [ ] API keys rotated (if needed)
- [ ] Backup database created
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

---

### Deployment Script

The automated deployment script handles:
1. Environment validation
2. Dependency installation
3. Test execution
4. Production build
5. Database backup
6. Database migrations
7. Deployment to platform
8. Edge function deployment
9. Health checks
10. Verification

#### Run Deployment

```bash
# Standard deployment
./scripts/deploy-production.sh

# Skip tests (faster, use with caution)
./scripts/deploy-production.sh --skip-tests

# Skip migrations (if already run)
./scripts/deploy-production.sh --skip-migrations

# Dry run (test without deploying)
./scripts/deploy-production.sh --dry-run
```

#### Deployment Logs

Logs are saved to:
```
deployment-YYYYMMDD-HHMMSS.log
```

View during deployment:
```bash
tail -f deployment-*.log
```

---

### Manual Deployment Steps

#### 1. Prepare Environment

```bash
# Ensure on main branch
git checkout main
git pull origin main

# Clean working directory
git status  # Should be clean

# Clear cache
rm -rf .next node_modules
```

#### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

#### 3. Run Tests

```bash
npm run lint
npm test
```

#### 4. Build Application

```bash
npm run build
```

Verify build output:
```bash
ls -la .next/
ls -la .next/standalone/  # Should exist
```

#### 5. Deploy to Platform

See platform-specific sections below for Railway/Vercel.

#### 6. Run Database Migrations

```bash
# Link to production Supabase project
supabase link --project-ref your-production-ref

# Run migrations
supabase db push
```

#### 7. Deploy Edge Functions

```bash
supabase functions deploy
```

#### 8. Verify Deployment

```bash
./scripts/verify-deployment.sh
```

Or manually:
1. Visit production URL
2. Test login
3. Navigate key pages
4. Check browser console for errors
5. Test API endpoints

---

### Post-Deployment Tasks

- [ ] Monitor error tracking dashboard
- [ ] Check application logs
- [ ] Verify database connections
- [ ] Test critical user flows
- [ ] Monitor performance metrics
- [ ] Update status page (if applicable)
- [ ] Notify team of completion
- [ ] Document any issues

---

## Railway Deployment

### Overview

Railway provides:
- Automatic deployments from GitHub
- Environment variable management
- Built-in PostgreSQL (optional, we use Supabase)
- Logs and monitoring
- Custom domains
- SSL certificates

**Production URL:** https://crm-ai-pro-production.up.railway.app

---

### Initial Setup

#### 1. Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Connect GitHub repository

#### 2. Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `crm-ai-pro` repository
4. Select branch: `main`

#### 3. Configure Build

Railway auto-detects Next.js using Nixpacks.

**Build Configuration:**
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Install Command:** `npm install --legacy-peer-deps`

#### 4. Set Environment Variables

Go to Project → Variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
POSTGRES_ENCRYPTION_KEY=your-encryption-key
NEXT_PUBLIC_BASE_URL=${{ RAILWAY_PUBLIC_DOMAIN }}

# Optional
ELEVENLABS_API_KEY=sk_...
RESEND_API_KEY=re_...
GOOGLE_GEMINI_API_KEY=...
```

**Note:** `${{ RAILWAY_PUBLIC_DOMAIN }}` is auto-populated by Railway.

#### 5. Deploy

Railway auto-deploys on every push to `main` branch.

**Manual Deploy:**
1. Go to Project → Deployments
2. Click "Deploy"

---

### Railway Commands

#### View Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Follow logs
railway logs --follow
```

#### Environment Variables

```bash
# List variables
railway variables

# Set variable
railway variables set KEY=value

# Delete variable
railway variables delete KEY
```

#### Database

```bash
# Connect to database (if using Railway PostgreSQL)
railway connect postgres

# Run migrations
railway run npm run setup:db
```

---

### Railway Deployment Workflow

#### Automatic Deployment (Recommended)

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin main

# Railway automatically:
# 1. Detects push via webhook
# 2. Pulls latest code
# 3. Runs npm install --legacy-peer-deps
# 4. Runs npm run build
# 5. Deploys to production
# 6. Updates public URL
```

**Deployment Time:** 2-5 minutes

#### Manual Deployment

```bash
# From Railway Dashboard
# 1. Go to project
# 2. Click "Deploy"
# 3. Select branch
# 4. Click "Deploy"

# Or via CLI
railway up
```

---

### Custom Domain

#### Add Domain

1. Go to Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `crm.yourdomain.com`
4. Add DNS records:

```
Type: CNAME
Name: crm
Value: your-app.up.railway.app
```

5. Wait for SSL certificate (auto-generated)

#### Update Environment

```bash
# Update base URL
NEXT_PUBLIC_BASE_URL=https://crm.yourdomain.com
```

---

### Railway Monitoring

#### View Metrics

- CPU usage
- Memory usage
- Network traffic
- Request count
- Response times

#### Logs

```bash
# Real-time logs
railway logs --follow

# Filter by level
railway logs --level error

# Last 100 lines
railway logs --tail 100
```

#### Alerts

Configure alerts in Railway Dashboard:
- High memory usage
- High CPU usage
- Deployment failures
- Custom metrics

---

## Vercel Deployment

### Overview

Vercel provides:
- Automatic Next.js optimizations
- Edge network (global CDN)
- Preview deployments for branches
- Automatic SSL certificates
- Analytics and monitoring

---

### Initial Setup

#### 1. Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Import repository

#### 2. Import Project

1. Click "Import Project"
2. Select GitHub repo: `crm-ai-pro`
3. Configure settings:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install --legacy-peer-deps
```

#### 3. Set Environment Variables

Go to Project Settings → Environment Variables:

**All Environments:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
POSTGRES_ENCRYPTION_KEY=your-encryption-key
```

**Production Only:**
```bash
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**Preview/Development:**
```bash
NEXT_PUBLIC_BASE_URL=$VERCEL_URL
```

#### 4. Deploy

Vercel auto-deploys on every push.

**Manual Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod
```

---

### Vercel Build Configuration

Create `vercel.json` (optional):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "cleanUrls": true,
  "trailingSlash": false
}
```

---

### Vercel CLI Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# List deployments
vercel ls

# View logs
vercel logs

# View environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# Pull environment variables to .env.local
vercel env pull .env.local
```

---

### Preview Deployments

Vercel creates preview deployments for:
- Every pull request
- Every branch push
- Manual deployments

**Preview URL Format:**
```
https://crm-ai-pro-git-branch-name-your-username.vercel.app
```

**Use Cases:**
- Test features before merging
- Share work with team
- Client demos
- QA testing

---

### Custom Domain

#### Add Domain

1. Go to Project Settings → Domains
2. Click "Add"
3. Enter domain: `crm.yourdomain.com`
4. Follow DNS setup instructions

**DNS Configuration:**
```
Type: CNAME
Name: crm
Value: cname.vercel-dns.com
```

5. SSL certificate auto-generated

#### Update Environment

```bash
NEXT_PUBLIC_BASE_URL=https://crm.yourdomain.com
```

---

### Vercel Analytics

Built-in analytics for:
- Page views
- Unique visitors
- Performance metrics
- Web vitals
- User journey

**Enable:**
1. Go to Project → Analytics
2. Toggle "Enable Analytics"

**View in App:**
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Webpack Error Prevention

### Critical Protocol

**MANDATORY: All developers MUST follow these protocols to prevent webpack runtime errors.**

---

### Common Webpack Errors

```
Cannot read properties of undefined (reading 'call')
Webpack Runtime TypeError
Module not found (after package installation)
Invalid hook call
Hot reload not working
```

**Root Cause:** Stale `.next/` cache after:
- Package installation/updates
- Environment variable changes
- Major code refactors
- Git branch switches
- TypeScript error fixes

---

### Prevention Rules

#### 1. ALWAYS Clear Cache After:

- Installing/updating npm packages
- Modifying `.env.local` or `.env`
- Major code refactors
- Switching git branches
- Resolving import errors
- Fixing TypeScript errors

```bash
rm -rf .next
npm run dev
```

#### 2. NPM Package Management

**ALWAYS use `--legacy-peer-deps`:**

```bash
# Correct
npm install --legacy-peer-deps
npm install package-name --legacy-peer-deps
npm update --legacy-peer-deps

# Incorrect (will cause issues)
npm install
npm install package-name
```

#### 3. Server Restart Protocol

When restarting dev server:

```bash
# Kill existing process
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Clear cache
rm -rf .next

# Restart
PORT=3002 npm run dev
```

#### 4. Full Cache Clear

For persistent errors:

```bash
# Nuclear option (full reset)
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

#### 5. After Environment Changes

```bash
# Edit .env.local
code .env.local

# ALWAYS clear cache after
rm -rf .next
npm run dev
```

---

### Troubleshooting Workflow

#### Step 1: Basic Cache Clear

```bash
rm -rf .next
npm run dev
```

#### Step 2: If Error Persists

```bash
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run dev
```

#### Step 3: If Still Failing

```bash
# Full reset
rm -rf .next node_modules package-lock.json .turbo

# Reinstall
npm install --legacy-peer-deps

# Restart on different port
PORT=3003 npm run dev
```

#### Step 4: Check for Issues

- Syntax errors in recent code changes
- Missing imports
- TypeScript errors
- Circular dependencies

```bash
npm run lint
npx tsc --noEmit
```

---

### Best Practices

1. **Clear cache daily** during active development
2. **Clear cache before deploying**
3. **Never commit `.next/` directory** (in `.gitignore`)
4. **Use `--legacy-peer-deps` for all npm commands**
5. **Restart server after major changes**
6. **Monitor webpack compilation logs** for warnings
7. **Test in browser immediately** after code changes

---

### Production Build

ALWAYS clear cache before production builds:

```bash
# Local production build
rm -rf .next && npm run build

# Vercel build command
rm -rf .next && next build

# Vercel install command
npm install --legacy-peer-deps
```

---

## Common Issues & Solutions

### Issue 1: "Module not found" after npm install

**Symptoms:**
```
Error: Cannot find module 'package-name'
```

**Solution:**
```bash
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

---

### Issue 2: Environment variables not loading

**Symptoms:**
- API calls fail with 401/403
- Features disabled unexpectedly
- `undefined` in logs

**Solution:**
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Verify format (no spaces around =)
cat .env.local | grep "="

# 3. Restart server
rm -rf .next
npm run dev

# 4. Check variables in app
# Add to a page: console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

**Note:** Only variables prefixed with `NEXT_PUBLIC_` are available client-side.

---

### Issue 3: Database connection fails

**Symptoms:**
```
Error: Invalid Supabase URL
Error: Failed to fetch
```

**Solution:**
```bash
# 1. Verify Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Test connection
curl https://your-project.supabase.co/rest/v1/

# 3. Check Supabase project status
# Go to https://supabase.com/dashboard

# 4. Verify network
ping your-project.supabase.co

# 5. Check service role key has correct permissions
```

---

### Issue 4: LLM Router not working

**Symptoms:**
- AI features not responding
- "No LLM provider available" error

**Solution:**
```bash
# 1. Validate API keys
npm run test:validate

# 2. Check key format
echo $OPENAI_API_KEY  # Should start with sk-proj- or sk-
echo $ANTHROPIC_API_KEY  # Should start with sk-ant-api03-

# 3. Verify feature flags
echo $LLM_ENABLED  # Should be true
echo $USE_LLM_ROUTER  # Should be true

# 4. Test provider directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 5. Check logs for specific errors
npm run dev | grep -i "llm\|openai\|anthropic"
```

---

### Issue 5: Build fails in production

**Symptoms:**
```
Error: Build failed
Type errors
Lint errors
```

**Solution:**
```bash
# 1. Test build locally
npm run build

# 2. Fix TypeScript errors
npx tsc --noEmit

# 3. Fix lint errors
npm run lint:fix

# 4. Clear cache and retry
rm -rf .next
npm run build

# 5. Check for environment-specific issues
NODE_ENV=production npm run build
```

---

### Issue 6: Hot reload not working

**Symptoms:**
- Changes don't appear
- Need manual refresh

**Solution:**
```bash
# 1. Clear .next cache
rm -rf .next

# 2. Restart server
npm run dev

# 3. Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 4. Disable browser cache
# Open DevTools → Network → Disable cache

# 5. Try different port
PORT=3003 npm run dev
```

---

### Issue 7: Docker container fails to start

**Symptoms:**
```
Error response from daemon
Container exited with code 1
```

**Solution:**
```bash
# 1. Check Docker logs
docker-compose logs crm-app

# 2. Rebuild without cache
docker-compose build --no-cache

# 3. Verify .env.local is NOT copied to container
# (Docker should use env_file instead)

# 4. Check port conflicts
lsof -ti:3000 | xargs kill -9

# 5. Remove old containers
docker-compose down -v
docker-compose up --build
```

---

### Issue 8: Migration fails

**Symptoms:**
```
Error: relation already exists
Error: column does not exist
```

**Solution:**
```bash
# 1. Check migration order
ls -la supabase/migrations/

# 2. Check which migrations ran
# In Supabase Dashboard → SQL Editor:
SELECT * FROM supabase_migrations.schema_migrations;

# 3. Rollback failed migration
# Create rollback SQL and run

# 4. Re-run migrations
supabase db push

# 5. If all else fails, reset database (DANGER)
# This deletes ALL data
supabase db reset
```

---

### Issue 9: API rate limits

**Symptoms:**
```
Error: Rate limit exceeded
HTTP 429 Too Many Requests
```

**Solution:**
```bash
# 1. Check API usage dashboard
# OpenAI: https://platform.openai.com/usage
# Anthropic: https://console.anthropic.com/settings/usage

# 2. Implement caching
# Enable Redis profile in Docker

# 3. Add rate limiting
# See lib/llm/rate-limiter.ts

# 4. Rotate to different provider
# LLM Router automatically fails over

# 5. Upgrade API plan if needed
```

---

### Issue 10: Voice agent not responding

**Symptoms:**
- ElevenLabs integration silent
- MCP tools not working

**Solution:**
```bash
# 1. Check ElevenLabs credentials
echo $ELEVENLABS_API_KEY
echo $ELEVENLABS_AGENT_ID

# 2. Verify MCP server is running
curl http://localhost:3001/health

# 3. Check MCP server logs
docker-compose logs mcp-server

# 4. Test MCP tools
# See SingleSources/VOICE_AGENT_README.md

# 5. Reconfigure agent
npm run elevenlabs:configure
```

---

### Getting Help

#### Documentation

- **Architecture:** `SingleSources/UI_UX_MASTER_ROADMAP.md`
- **MCP Tools:** `SingleSources/MCP_TOOL_REQUIREMENTS.md`
- **Voice Agent:** `SingleSources/VOICE_AGENT_README.md`
- **Theme System:** `THEME_VARIABLES_REFERENCE.md`

#### Logs

```bash
# Application logs
npm run dev

# Docker logs
docker-compose logs -f

# Railway logs
railway logs --follow

# Vercel logs
vercel logs
```

#### Health Check

```bash
npm run health-check
```

#### Support

- **Email:** douglas.talley@legacyai.space
- **GitHub Issues:** https://github.com/CaptainPhantasy/crm-ai-pro/issues

---

## Summary

This document is the **single source of truth** for configuration and deployment of CRM-AI PRO.

**Key Takeaways:**

1. **Environment Setup:** Copy `.env.example`, fill in values, validate with `npm run test:validate`
2. **Development:** Use `npm run dev`, clear `.next/` cache often
3. **NPM:** Always use `--legacy-peer-deps`
4. **Database:** Run migrations in order, use Supabase Dashboard or CLI
5. **Deployment:** Use automated scripts or platform auto-deploy
6. **Webpack:** Clear cache after package/env changes
7. **Troubleshooting:** Follow step-by-step workflows above

**Quick Start:**
```bash
git clone repo
npm install --legacy-peer-deps
cp .env.example .env.local
# Edit .env.local
npm run setup:db
npm run seed
npm run test:validate
npm run dev
```

---

**Last Updated:** November 28, 2025 - 1:45 PM
**Maintained By:** Legacy AI Development Team
**Next Review:** December 15, 2025
