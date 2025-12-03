# Agent Guidelines: Type Architecture Rules

**Based on HardLesson1.md - Preventing Type Architecture Failures**

## 🚨 MANDATORY RULES

### Rule #1: ALWAYS Create `types/<domain>.ts` FIRST

**Before writing ANY code for a new domain feature:**

1. ✅ Create `types/<domain>.ts` file
2. ✅ Define ALL domain interfaces upfront
3. ✅ Define ALL API response interfaces
4. ✅ Export everything from the types file
5. ✅ THEN start building hooks, components, or API routes

**Domains that require type files:**
- Jobs → `types/jobs.ts` (already exists in `types/index.ts`)
- Contacts → `types/contacts.ts` (already exists in `types/index.ts`)
- Invoices → `types/invoices.ts` ✅
- Payments → `types/payments.ts` ✅
- Notifications → `types/notifications.ts` ✅
- Campaigns → `types/campaigns.ts` ✅
- Email Templates → `types/email-templates.ts` ✅
- Contact Tags → `types/contact-tags.ts` ✅
- Call Logs → `types/call-logs.ts` ✅
- Job Photos → `types/job-photos.ts` ✅
- Job Materials → `types/job-materials.ts` ✅
- Analytics → `types/analytics.ts` ✅
- Reports → `types/reports.ts` ✅
- Search → `types/search.ts` ✅
- Voice → `types/voice.ts` ✅
- Automation → `types/automation.ts` ✅
- Admin → `types/admin.ts` ✅
- Tech → `types/tech.ts` ✅

### Rule #2: NEVER Use `unknown[]` in API Responses

**FORBIDDEN:**
```typescript
const results: {
  jobs: unknown[]
  contacts: unknown[]
} = { ... }
```

**REQUIRED:**
```typescript
import type { SearchResults } from '@/types/search'

const results: SearchResults = { ... }
```

### Rule #3: NEVER Use `any` in Core Domain Logic

**FORBIDDEN:**
```typescript
toolCalls?: Array<{ name: string; arguments: any }>
result?: any
```

**REQUIRED:**
```typescript
import type { VoiceMessage } from '@/types/voice'

toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>
result?: unknown
```

**Exception:** Only acceptable in error handling or external API integrations where types are truly unknown.

### Rule #4: NEVER Define Types Inline in Components

**FORBIDDEN:**
```typescript
// In component file
interface SearchResults {
  jobs: Array<{ ... }>
  contacts: Array<{ ... }>
}
```

**REQUIRED:**
```typescript
// In types/search.ts
export interface SearchResults {
  jobs: SearchResultJob[]
  contacts: SearchResultContact[]
}

// In component
import type { SearchResults } from '@/types/search'
```

### Rule #5: ALWAYS Import Types from Centralized Files

**FORBIDDEN:**
- Duplicating interfaces across files
- Defining types in hooks
- Defining types in components
- Defining types in API routes

**REQUIRED:**
- All types imported from `types/<domain>.ts`
- Single source of truth for each domain
- Types shared across hooks, components, and API routes

## 📋 Pre-Feature Checklist

Before starting ANY new domain feature:

- [ ] **Scan repo for existing patterns** (check `types/` directory)
- [ ] **Create `types/<domain>.ts` FIRST**
- [ ] **Define all domain objects** (Entity, CreateRequest, UpdateRequest, etc.)
- [ ] **Define all API response interfaces** (ListResponse, DetailResponse, CreateResponse, etc.)
- [ ] **Ensure zero `unknown[]` in architecture**
- [ ] **Ensure zero `any` in core logic**

## 📋 Pre-Component Checklist

Before writing hooks or components:

- [ ] **Import shared types from `types/<domain>.ts`**
- [ ] **Avoid inline type definitions**
- [ ] **Refuse to proceed without a type architecture**

## 📋 Pre-Submit Checklist

Before declaring success:

- [ ] **Zero `any` in core domain logic**
- [ ] **Zero `unknown[]` in API responses**
- [ ] **Zero duplicated interfaces**
- [ ] **All components using shared types**
- [ ] **All API responses properly typed**
- [ ] **All casting removed unless justified**
- [ ] **Build passes with no type errors**

## 🎯 Type File Structure

Each `types/<domain>.ts` file should follow this pattern:

```typescript
// 1. Import shared types
import { Json } from './index'
import { Contact, Job } from './index'

// 2. Define domain enums/types
export type DomainStatus = 'draft' | 'active' | 'completed'

// 3. Define main entity interface
export interface DomainEntity {
  id: string
  account_id: string
  // ... all fields
  // Relations (optional)
  related_entity?: RelatedEntity
}

// 4. Define request/response interfaces
export interface DomainCreateRequest {
  // ...
}

export interface DomainUpdateRequest {
  // ...
}

export interface DomainListResponse {
  items: DomainEntity[]
  total?: number
}

export interface DomainDetailResponse {
  item: DomainEntity
}

export interface DomainCreateResponse {
  success: true
  item: DomainEntity
}
```

## 🔍 Pattern Detection

When adding a new domain, look for existing patterns:

1. **Check `types/` directory** - See how other domains are structured
2. **Check API routes** - See how responses are typed
3. **Check components** - See how types are imported
4. **Follow the same pattern** - Consistency is key

## 🚫 Anti-Patterns to Avoid

### ❌ Scattered Types
```typescript
// DON'T: Types in hooks
// hooks/useBoards.ts
interface Board { ... }

// DON'T: Types in components
// components/BoardView.tsx
interface BoardViewProps { ... }
```

### ❌ Missing Types
```typescript
// DON'T: Missing interfaces
const views: unknown[] = [] // Missing View interface
const groups: unknown[] = [] // Missing Group interface
```

### ❌ Type Shortcuts
```typescript
// DON'T: Using any/unknown[] as shortcuts
const results: unknown[] = []
const data: any = response.json()
```

### ❌ Inline Types
```typescript
// DON'T: Defining types inline
function Component() {
  const [data, setData] = useState<Array<{
    id: string
    name: string
  }>>([])
}
```

## ✅ Success Patterns

### ✅ Centralized Types
```typescript
// types/boards.ts
export interface Board { ... }
export interface View { ... }
export interface Group { ... }
```

### ✅ Proper API Responses
```typescript
// app/api/boards/route.ts
import type { BoardListResponse } from '@/types/boards'

export async function GET() {
  // ...
  return NextResponse.json<BoardListResponse>({ boards })
}
```

### ✅ Shared Component Types
```typescript
// components/BoardView.tsx
import type { Board, View } from '@/types/boards'

interface BoardViewProps {
  board: Board
  view: View
}
```

## 📚 Reference: Existing Type Files

All type files are in `types/` directory:

- `types/index.ts` - Core types (Account, User, Contact, Conversation, Message, Job)
- `types/search.ts` - Search functionality
- `types/invoices.ts` - Invoice management
- `types/payments.ts` - Payment processing
- `types/notifications.ts` - Notifications
- `types/campaigns.ts` - Marketing campaigns
- `types/email-templates.ts` - Email templates
- `types/contact-tags.ts` - Contact tagging
- `types/call-logs.ts` - Call logging
- `types/job-photos.ts` - Job photos
- `types/job-materials.ts` - Job materials
- `types/analytics.ts` - Analytics
- `types/reports.ts` - Reports
- `types/voice.ts` - Voice features
- `types/automation.ts` - Automation rules
- `types/admin.ts` - Admin features
- `types/tech.ts` - Tech features

## 🎓 Lessons from HardLesson1.md

1. **Planning Failure**: Types were built ad-hoc, not upfront
2. **Speed Over Structure**: Speed prioritized over type architecture
3. **No Pattern Inference**: Failed to follow existing patterns (like Gates system)
4. **Type Scattering**: Types scattered across hooks, components, missing entirely
5. **Shortcuts**: Used `any` and `unknown[]` to avoid defining types

**Prevention**: Follow these guidelines to prevent the same failures.

## 🚀 Quick Start for New Domain

1. Create `types/<domain>.ts`
2. Define all interfaces
3. Export everything
4. Import in API routes
5. Import in components
6. Never use `unknown[]` or `any`

---

**Remember:** Type architecture FIRST, implementation SECOND. This prevents cascading errors and ensures maintainability.

