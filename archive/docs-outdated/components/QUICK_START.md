# Onboarding System - Quick Start

**TL;DR:** Complete onboarding wizard system ready to use in 3 steps.

---

## 1. Install Dependencies

```bash
npm install react-confetti
```

## 2. Run Database Migration

```bash
supabase db push

# or manually
psql -U postgres -d your_db < supabase/migrations/20251127_create_user_onboarding.sql
```

## 3. Use in Your App

```tsx
import { OnboardingWizard } from '@/components/onboarding'

export default function OnboardingPage() {
  const { data: user } = useUser()

  return (
    <OnboardingWizard
      role={user.role}
      userId={user.id}
      onComplete={() => router.push('/dashboard')}
    />
  )
}
```

**That's it!** The wizard will automatically show the correct flow for each role.

---

## Role-Specific Flows

- **Owner:** 7 steps (company setup, team, customers, jobs, integrations, AI)
- **Tech:** 5 steps (mobile-optimized for field work)
- **Sales:** 5 steps (mobile-optimized with AI features)
- **Dispatcher:** 4 steps (dispatch map and job assignment)
- **Admin:** 3 steps (user management and settings)

---

## Show on First Login

```tsx
// app/(dashboard)/layout.tsx
import { useOnboarding } from '@/lib/hooks/use-onboarding'

const { status } = useOnboarding({ userId: user.id })

if (!status?.completed_at && !status?.dismissed_at) {
  return <OnboardingWizard role={user.role} userId={user.id} />
}
```

---

## Dashboard Checklist

```tsx
import { OnboardingChecklist } from '@/components/onboarding'
import { getOnboardingChecklistForRole } from '@/lib/config/onboarding-flows'

<OnboardingChecklist
  items={getOnboardingChecklistForRole(user.role)}
  onItemComplete={handleComplete}
  onDismiss={handleDismiss}
/>
```

---

## Feature Tooltips

```tsx
import { OnboardingTooltipManager } from '@/components/onboarding'

const tooltips = [
  {
    id: 'feature-1',
    target: '#button-id',
    title: 'Feature Name',
    content: 'Explanation of what this does',
    position: 'bottom'
  }
]

<OnboardingTooltipManager
  tooltips={tooltips}
  onComplete={() => localStorage.setItem('tooltips-seen', 'true')}
/>
```

---

## Restart Onboarding (Settings Page)

```tsx
import { restartOnboarding } from '@/lib/api/onboarding'

<Button onClick={() => restartOnboarding(user.id)}>
  Restart Onboarding
</Button>
```

---

## Files Created

### Core System (21 files)
- 1 database migration
- 1 types file
- 1 API client
- 2 hooks
- 1 config file
- 5 UI components + 1 UI component (progress)
- 5 API routes
- 2 documentation files
- 1 completion report

### Where Things Live
```
lib/types/onboarding.ts           # TypeScript types
lib/api/onboarding.ts              # API client
lib/hooks/use-onboarding.ts        # React hook
lib/config/onboarding-flows.tsx    # Role flows

components/onboarding/
  ├── OnboardingWizard.tsx         # Main wizard
  ├── OnboardingStep.tsx           # Step wrapper
  ├── OnboardingProgress.tsx       # Progress bar
  ├── OnboardingTooltip.tsx        # Tooltips
  ├── OnboardingChecklist.tsx      # Checklist
  └── index.ts                     # Exports

app/api/onboarding/
  ├── status/route.ts              # GET/PUT status
  ├── complete/route.ts            # POST complete
  ├── dismiss/route.ts             # POST dismiss
  ├── restart/route.ts             # POST restart
  └── analytics/route.ts           # POST analytics

supabase/migrations/
  └── 20251127_create_user_onboarding.sql
```

---

## Customization

### Change Steps for a Role

Edit `/lib/config/onboarding-flows.tsx`:

```tsx
export const ownerOnboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'my-custom-step',
    title: 'My Custom Step',
    description: 'Description here',
    icon: MyIcon,
    content: <div>Step content</div>,
    skippable: true,
  },
  // ... more steps
]
```

### Add New Role

```tsx
// In onboarding-flows.tsx
export const myRoleOnboardingSteps: OnboardingStepConfig[] = [...]

// Update getOnboardingFlowForRole()
case 'my-role':
  return { role, steps: myRoleOnboardingSteps }
```

---

## Testing

### Manual Test Checklist

- [ ] Wizard displays
- [ ] Progress updates
- [ ] Next/Previous work
- [ ] Skip works (skippable steps)
- [ ] Exit saves progress
- [ ] Confetti on completion
- [ ] Checklist displays
- [ ] Tooltips highlight correctly

### Reset for Testing

```typescript
import { restartOnboarding } from '@/lib/api/onboarding'
await restartOnboarding(userId)
```

---

## Props Reference

### OnboardingWizard

```tsx
<OnboardingWizard
  role="owner"                    // Required: user role
  userId="xxx"                    // Required: user ID
  onComplete={() => {}}           // Optional: completion callback
  onDismiss={() => {}}            // Optional: dismiss callback
  onExit={() => {}}               // Optional: exit callback
  customSteps={[...]}             // Optional: override default steps
  progressIndicator="steps"       // Optional: "steps" | "dots" | "progress-bar"
  allowSkip={true}                // Optional: allow skipping (default: true)
  allowExit={true}                // Optional: allow exit (default: true)
  showConfetti={true}             // Optional: show confetti (default: true)
  className=""                    // Optional: custom classes
/>
```

### OnboardingChecklist

```tsx
<OnboardingChecklist
  items={[
    {
      id: 'item-1',
      title: 'Do something',
      description: 'Description',
      link: '/page',
      completed: false
    }
  ]}
  onItemComplete={(itemId) => {}}
  onDismiss={() => {}}
  showProgress={true}
/>
```

---

## API Endpoints

```
GET  /api/onboarding/status?userId=xxx
PUT  /api/onboarding/status
POST /api/onboarding/complete
POST /api/onboarding/dismiss
POST /api/onboarding/restart
POST /api/onboarding/analytics
```

---

## Need More Help?

- 📖 **Full Integration Guide:** `/components/onboarding/INTEGRATION_GUIDE.md`
- 📊 **Completion Report:** `/SWARM_10_COMPLETION_REPORT.md`
- 💻 **Source Code:** All components have detailed JSDoc comments

---

**Created by:** Swarm 10: Onboarding System
**Date:** 2025-11-27
**Status:** ✅ Production Ready
