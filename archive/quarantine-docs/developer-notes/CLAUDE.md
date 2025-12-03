# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CRM-AI PRO** is an AI-native Business Operating System designed for service industry businesses (plumbing, HVAC, electrical). It's a comprehensive, role-based CRM platform built with Next.js 14, TypeScript, and PostgreSQL (Supabase) with a strong focus on mobile accessibility and AI integration.

## Development Commands

### Setup & Installation
```bash
# Clone and install dependencies (MUST use legacy-peer-deps)
git clone https://github.com/CaptainPhantasy/crm-ai-pro.git
cd crm-ai-pro
npm install --legacy-peer-deps

# Complete development environment setup
npm run setup:dev    # Sets up env, db, and MCP server

# Environment setup
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Development Server
```bash
# Standard development (port 3000)
npm run dev

# Port 3002 development
# Set NEXT_PUBLIC_BASE_URL=http://localhost:3002 in .env.local
PORT=3002 npm run dev

# Docker development
npm run dev:docker      # CRM app only
npm run dev:full        # CRM + MCP server
npm run dev:local-db    # With local Supabase

# Production builds
npm run build
npm run start
```

### Testing
```bash
# Run all tests (validation + API + UI)
npm test

# Individual test suites
npm run test:validate   # Environment validation
npm run test:api        # API endpoint tests (Vitest)
npm run test:ui         # End-to-end tests (Playwright)
npm run test:e2e        # Full E2E test suite
npm run test:unit       # Unit tests only

# Test with specific roles (Playwright projects)
npx playwright test --project=owner
npx playwright test --project=admin
npx playwright test --project=tech
```

### Database & Utilities
```bash
# Database operations
npm run setup:db        # Run migrations
npm run seed           # Seed comprehensive test data

# Linting and code quality
npm run lint
npm run lint:fix

# Specific utilities
npm run elevenlabs:configure  # Configure voice agent
npm run health-check          # System health check
npm run geocode-jobs         # Geocode existing job addresses
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript 5.9
- **Database**: PostgreSQL with Supabase (Row Level Security enabled)
- **Authentication**: Supabase Auth with JWT + custom role-based permissions
- **UI**: Tailwind CSS + Radix UI components
- **State Management**: React Query (TanStack Query) + Context API
- **Real-time**: Supabase Realtime subscriptions, WebSockets
- **AI Integration**: OpenAI, Anthropic Claude, ElevenLabs voice agents
- **Testing**: Vitest (unit), Playwright (E2E), role-based testing
- **Deployment**: Railway with auto-deploy from GitHub

### Core Architecture Patterns

#### 1. Multi-Role System
The system implements 5 distinct user roles with specialized interfaces:
- **Owner**: Full system access, financial management
- **Admin**: Business operations, user management
- **Dispatcher**: Job scheduling, technician coordination
- **Tech**: Mobile job execution, customer interactions
- **Sales**: Lead management, customer acquisition

#### 2. Mobile-First Design
- Dedicated mobile routes under `/m/` for field-optimized interfaces
- Progressive Web App (PWA) with offline capabilities
- Role-specific mobile experiences (tech dashboard, sales tools)

#### 3. AI-First Architecture
- **Intelligent LLM Router**: Cost optimization through strategic model selection
- **Voice AI Agent**: ElevenLabs-powered conversational AI
- **Multi-provider support**: OpenAI, Anthropic, Google Gemini
- **API key encryption**: Database encryption using pgcrypto

#### 4. Permission-Based Access Control
- Granular permissions defined in `lib/types/permissions.ts`
- Role-based UI components and API route protection
- Permission gates throughout the application

## Key Directories

```
app/
├── api/                    # 58 API endpoints covering all business functions
│   ├── llm/               # AI routing and management
│   ├── jobs/              # Job dispatch and management
│   ├── contacts/          # Customer management
│   └── voice-command/     # Voice navigation commands
├── m/                     # Mobile-first PWA interfaces
│   ├── owner/             # Owner mobile dashboard
│   ├── sales/             # Sales team mobile tools
│   └── tech/              # Technician mobile interface
└── (dashboard)/           # Desktop dashboard interfaces

components/
├── ui/                   # Reusable UI primitives (shadcn/ui style)
├── auth/                 # Authentication components
├── dashboard/            # Dashboard-specific components
├── dispatch/             # Dispatch and technician management
└── voice-agent/          # Voice agent integration

lib/
├── auth/                 # Authentication helpers and middleware
├── llm/                  # AI/LLM routing and management
├── types/                # TypeScript definitions
├── hooks/                # Custom React hooks
├── security/             # Security utilities and JWT handling
└── permissions/          # Role-based access control system

tests/
├── api/                  # API endpoint tests (Vitest)
├── e2e/                  # End-to-end tests (Playwright)
└── ui/                   # UI workflow tests
```

## Environment Configuration

### Required Environment Variables
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (At least ONE required)
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Database Encryption (REQUIRED)
POSTGRES_ENCRYPTION_KEY=your-secure-32-char-password

# Email (REQUIRED)
RESEND_API_KEY=re_your-key

# Voice AI (Optional)
ELEVENLABS_API_KEY=sk_xxxxx

# Server Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Default port, can be changed to 3002
USE_LLM_ROUTER=true
```

### Special Configuration Requirements
- **API Key Encryption**: All API keys are encrypted in the database using `POSTGRES_ENCRYPTION_KEY`
- **LLM Router**: Requires at least one AI provider configured
- **Multi-tenant**: Account-based isolation with `account_id` in all tables

## Database Schema

### Key Tables
- **accounts**: Multi-tenant account management
- **users**: User management with role-based permissions
- **jobs**: Work order management with GPS/location
- **contacts**: Complete CRM customer management
- **estimates**: Financial management and quotes
- **documents**: File storage and management
- **notifications**: Real-time alert system

### Migration System
- Migrations in `supabase/migrations/`
- Row Level Security (RLS) policies enforced throughout
- Real-time subscriptions enabled for live updates

## Testing Strategy

### Hybrid Test Pyramid
- **90% mocked tests**: Fast unit and integration tests using Vitest
- **10% live integration**: Role-based E2E tests using Playwright
- **Role-based testing**: Separate test projects for each user role
- **UUID-based data isolation**: Clean test data management

### Test Organization
```
tests/
├── api/                  # API endpoint tests with role validation
├── e2e/                  # Role-based E2E workflows
│   ├── owner.spec.ts     # Owner-specific workflows
│   ├── admin.spec.ts     # Admin workflows
│   └── tech.spec.ts      # Technician mobile workflows
└── ui/                   # UI component tests
```

### Running Tests by Role
```bash
# Test specific user roles
npx playwright test --project=owner    # Owner workflows
npx playwright test --project=admin    # Admin workflows
npx playwright test --project=tech     # Technician mobile
npx playwright test --project=sales    # Sales workflows
```

## AI Integration

### LLM Router System
- **Cost Optimization**: 90% savings through intelligent model routing
- **Provider Selection**: Automatic routing based on task complexity
- **Fallback Support**: Multiple provider support for reliability
- **Usage Tracking**: Monitor and control AI costs

### Voice Agent Features
- **ElevenLabs Integration**: React SDK for voice interactions
- **MCP Server**: Separate container for voice processing
- **Real-time Communication**: WebSocket integration
- **Mobile Voice Navigation**: Hands-free operation for technicians

## Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control with 87+ permission types
- Impersonation capabilities for admin users
- Secure session management

### Data Protection
- API key encryption using pgcrypto
- Row Level Security (RLS) policies
- Input validation throughout the application
- Audit logging for compliance

## Development Workflows

### Webpack Error Prevention
Based on development experience, follow these protocols:

1. **Cache Clearing**: Clear `.next/` cache after package updates
   ```bash
   rm -rf .next && npm run dev
   ```

2. **Package Installation**: Always use legacy peer dependencies
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Server Restart**: Kill processes and clear cache if errors occur
   ```bash
   lsof -ti:3000 | xargs kill -9 2>/dev/null
   rm -rf .next
   npm run dev
   ```

### Feature Development
1. Identify the user role(s) for the feature
2. Check permissions in `lib/types/permissions.ts`
3. Implement role-based UI components
4. Add corresponding API routes with permission checks
5. Write role-specific tests
6. Test mobile interfaces at `/m/` routes

### Database Changes
1. Create migration in `supabase/migrations/`
2. Update TypeScript types in `lib/types/`
3. Run migration: `npm run setup:db`
4. Test with role-based permissions
5. Update RLS policies if needed

## Production Deployment

### Railway Deployment
- Auto-deploy from `main` branch
- Environment variables set in Railway dashboard
- Build command: `npm run build`
- Start command: `npm run start`

### Docker Support
- Multi-container setup: CRM app + MCP server + Supabase
- Production-ready configurations
- Health check endpoints included

## Common Development Patterns

### Permission Checks
```typescript
import { hasPermission } from '@/lib/permissions'
import { requireAuth } from '@/lib/auth'

// API route protection
export async function GET(request: Request) {
  const user = await requireAuth(request)
  if (!hasPermission(user.role, 'view_all_jobs')) {
    return new Response('Unauthorized', { status: 403 })
  }
}

// Component protection
if (!hasPermission(user.role, 'manage_users')) {
  return <AccessDenied />
}
```

### AI Router Usage
```typescript
import { llmRouter } from '@/lib/llm/router'

const response = await llmRouter.generate({
  prompt: 'Customer service response',
  context: 'plumbing business',
  complexity: 'simple'  // Routes to cost-effective model
})
```

### Real-time Subscriptions
```typescript
import { createClient } from '@/lib/supabase'

const supabase = createClient()
supabase
  .channel('jobs')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'jobs' },
    (payload) => updateJobUI(payload.new)
  )
  .subscribe()
```

## Webpack Error Prevention Protocol

**CRITICAL**: All agents MUST follow these protocols to prevent webpack runtime errors:

### 1. Before Any Code Changes:
- NEVER make code changes without first checking if `.next/` cache needs clearing
- ALWAYS clear `.next/` cache after:
  - Installing or updating npm packages
  - Modifying environment variables (`.env.local`, `.env`)
  - Major code refactors or file restructuring
  - Switching git branches with significant changes

### 2. NPM Package Management:
- ALWAYS use `npm install --legacy-peer-deps` when installing packages
- NEVER run `npm install` without the `--legacy-peer-deps` flag
- The `.npmrc` file enforces this automatically, but verify it exists
- If peer dependency conflicts arise, IMMEDIATELY clear cache and reinstall

### 3. Cache Clearing Commands (use these frequently):
```bash
# Standard cache clear (use after env changes or package updates)
rm -rf .next

# Full cache clear (use when webpack errors persist)
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps

# Automated fix script (use for persistent webpack errors)
./scripts/fix-webpack-error.sh
```

### 4. Server Restart Protocol:
When restarting the development server, ALWAYS:
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Clear cache
rm -rf .next

# Restart server
npm run dev
# or
PORT=3002 npm run dev
```

### 5. Error Detection:
If you see ANY of these errors, IMMEDIATELY apply the fix:
- "Cannot read properties of undefined (reading 'call')"
- "Webpack Runtime TypeError"
- "Module not found" after package installation
- "Invalid hook call" or React errors
- Hot reload not working

**Immediate fix**: `rm -rf .next && npm run dev`

### 6. Documentation Reference:
- Automated fix script: `scripts/fix-webpack-error.sh`
- NPM config: `.npmrc` (auto-applies legacy-peer-deps)

### 7. Code Modification Rules:
- BEFORE editing any file in `lib/`, `app/`, or `components/`: Consider if cache needs clearing
- AFTER editing environment variables: ALWAYS clear `.next/` cache
- AFTER fixing import errors: ALWAYS clear `.next/` cache
- AFTER resolving TypeScript errors: ALWAYS clear `.next/` cache

### 8. Prevention Best Practices:
- Run `./scripts/fix-webpack-error.sh` if multiple errors occur
- Keep `.next/` cache fresh (delete if >1 day old during active development)
- Monitor webpack compilation logs for warnings
- Test changes in browser immediately after code modifications
- If HMR (hot reload) stops working, restart server with cache clear

### 9. NEVER:
- ❌ Leave stale `.next/` cache after package updates
- ❌ Modify `package.json` without clearing cache
- ❌ Update Next.js version without full cache clear
- ❌ Ignore webpack warnings in dev console
- ❌ Continue coding if webpack errors appear (fix immediately)

### 10. Production Deployment:
ALWAYS clear cache before production builds:
```bash
rm -rf .next && npm run build
```

**Vercel Build Command**: `rm -rf .next && next build`
**Vercel Install Command**: `npm install --legacy-peer-deps`

---

**Failure to follow these protocols will result in recurring webpack runtime errors that break the application. These are MANDATORY for all agents.**

## Important Notes

- **Port Configuration**:
  - Default development server runs on port 3000
  - Can be changed to port 3002 with `PORT=3002 npm run dev`
  - Docker-compose configures port 3000 by default
  - MCP server (voice AI) runs on port 3001 in Docker setup
- **Test Data**: Use `npm run seed` to create comprehensive test data
- **Role Testing**: Always test features across all relevant user roles
- **Mobile Testing**: Test mobile interfaces at `/m/` routes
- **AI Costs**: Monitor LLM router usage for cost optimization

## DATABASE OPERATIONS: MANDATORY SAFETY PROTOCOLS

**CRITICAL**: All database operations must follow these exact protocols. FAILURE IS NOT AN OPTION.

### 1. NEVER ASSUME SCHEMA
- ALWAYS inspect the actual database structure before writing ANY SQL
- Use the Supabase Dashboard to view table schemas first
- Never assume column names, table names, or data locations
- Production databases can differ from development

### 2. INSPECT BEFORE ACTING
For ANY database operation:
1. **First**: Run a read-only query to understand the structure
   ```sql
   -- Example: Check what tables exist
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

   -- Example: Check table structure
   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
   ```

2. **Second**: Verify data location and format
   ```sql
   -- Example: Find where user data is stored
   SELECT * FROM auth.users WHERE email = 'test@example.com' LIMIT 1;
   ```

3. **Third**: ONLY THEN create update statements
   - AFTER confirming exact table names
   - AFTER confirming exact column names
   - AFTER confirming data types and constraints

### 3. VALIDATION CHECKLIST
Before running ANY SQL on production:
- [ ] Have I seen the actual table schema?
- [ ] Have I verified column names exist?
- [ ] Have I tested on a non-production environment?
- [ ] Is this SQL read-only first?
- [ ] Have I included a rollback strategy?
- [ ] Am I 100% certain this won't corrupt data?

### 4. PRODUCTION DATABASE RULES
- NEVER run UPDATE/DELETE without WHERE clause
- ALWAYS wrap updates in transactions
- NEVER assume email is in a column (check auth.users)
- ALWAYS check if data is in metadata fields
- NEVER trust documentation - verify in the actual database

### 5. CONSEQUENCES
- Violation of these protocols will result in data corruption
- Assumptions about schema are ALWAYS wrong
- Production data is irreplaceable
- There is NO excuse for not verifying first

**REMEMBER**: It takes 5 minutes to verify, but days to recover from a mistake.

## Debugging Common Issues

1. **Webpack Errors**: Clear `.next/` cache and restart
2. **Permission Errors**: Check role assignments in database
3. **AI Router Errors**: Verify API keys and encryption setup
4. **Mobile UI Issues**: Test PWA installation and offline mode
5. **Real-time Updates**: Check Supabase Realtime subscriptions

This codebase represents a mature, production-ready application with sophisticated business logic, modern architecture, and comprehensive testing coverage specifically designed for service industry operations.