# Onboarding System Integration Guide

## Overview

The onboarding system provides a complete wizard-based user onboarding flow with progress tracking, role-specific steps, and completion celebration. The system is fully modular and can be extracted to other projects.

## Architecture

```
/lib/types/onboarding.ts          # TypeScript type definitions
/lib/api/onboarding.ts             # API client functions
/lib/hooks/use-onboarding.ts       # React hook for state management
/lib/config/onboarding-flows.tsx   # Role-specific flow configurations

/components/onboarding/
  ├── OnboardingWizard.tsx         # Main wizard container
  ├── OnboardingStep.tsx           # Individual step wrapper
  ├── OnboardingProgress.tsx       # Progress indicator
  ├── OnboardingTooltip.tsx        # Feature highlight tooltips
  ├── OnboardingChecklist.tsx      # Dashboard checklist
  └── index.ts                     # Barrel exports

/app/api/onboarding/
  ├── status/route.ts              # GET/PUT status
  ├── complete/route.ts            # POST complete
  ├── dismiss/route.ts             # POST dismiss
  ├── restart/route.ts             # POST restart
  └── analytics/route.ts           # POST analytics events

/supabase/migrations/
  └── 20251127_create_user_onboarding.sql  # Database schema
```

## Quick Start

### 1. Install Dependencies

```bash
npm install react-confetti
```

### 2. Run Database Migration

```bash
# Apply the migration to create the user_onboarding_status table
supabase db push
```

### 3. Basic Usage

```tsx
import { OnboardingWizard } from '@/components/onboarding'

export default function OnboardingPage() {
  const { data: user } = useUser()

  return (
    <OnboardingWizard
      role={user.role}
      userId={user.id}
      onComplete={() => router.push('/dashboard')}
      progressIndicator="steps"
    />
  )
}
```

## Integration Patterns

### Pattern 1: Show on First Login

```tsx
// app/(dashboard)/layout.tsx

import { OnboardingWizard } from '@/components/onboarding'
import { useOnboarding } from '@/lib/hooks/use-onboarding'

export default function DashboardLayout({ children }) {
  const { data: user } = useUser()
  const { status, loading } = useOnboarding({
    userId: user?.id,
    enabled: !!user
  })

  // Show onboarding if not completed or dismissed
  if (
    !loading &&
    status &&
    !status.completed_at &&
    !status.dismissed_at
  ) {
    return (
      <OnboardingWizard
        role={user.role}
        userId={user.id}
        onComplete={() => window.location.reload()}
        onExit={() => {
          // Save progress and hide wizard
        }}
      />
    )
  }

  return <>{children}</>
}
```

### Pattern 2: Dashboard Checklist

```tsx
// app/(dashboard)/page.tsx

import { OnboardingChecklist } from '@/components/onboarding'
import { getOnboardingChecklistForRole } from '@/lib/config/onboarding-flows'
import { useOnboarding } from '@/lib/hooks/use-onboarding'

export default function DashboardPage() {
  const { data: user } = useUser()
  const { status, updateStatus } = useOnboarding({ userId: user.id })
  const [checklistItems, setChecklistItems] = useState(
    getOnboardingChecklistForRole(user.role)
  )

  const handleItemComplete = async (itemId: string) => {
    // Mark item as complete
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: true } : item
      )
    )

    // Optionally save to backend
    // await updateChecklistItem(itemId, true)
  }

  const handleDismiss = async () => {
    // Hide checklist
    await dismissOnboarding(user.id)
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show checklist if onboarding completed but checklist items remain */}
      {status?.completed_at && (
        <OnboardingChecklist
          items={checklistItems}
          onItemComplete={handleItemComplete}
          onDismiss={handleDismiss}
          showProgress={true}
        />
      )}

      {/* Rest of dashboard */}
    </div>
  )
}
```

### Pattern 3: Feature Tooltips

```tsx
// Show tooltip for first-time feature use

import { OnboardingTooltipManager } from '@/components/onboarding'
import { useState, useEffect } from 'react'

export function DispatchMap() {
  const [showTooltips, setShowTooltips] = useState(false)

  useEffect(() => {
    // Check if user has seen dispatch tooltips
    const seen = localStorage.getItem('dispatch-tooltips-seen')
    if (!seen) {
      setShowTooltips(true)
    }
  }, [])

  const tooltips = [
    {
      id: 'tech-markers',
      target: '#tech-list',
      title: 'Technician List',
      content: 'View all technicians and their current status.',
      position: 'right',
    },
    {
      id: 'drag-assign',
      target: '#job-list',
      title: 'Drag to Assign',
      content: 'Drag jobs to technicians on the map to assign them.',
      position: 'left',
    },
  ]

  const handleComplete = () => {
    localStorage.setItem('dispatch-tooltips-seen', 'true')
    setShowTooltips(false)
  }

  return (
    <>
      <div>
        {/* Map UI */}
      </div>

      {showTooltips && (
        <OnboardingTooltipManager
          tooltips={tooltips}
          onComplete={handleComplete}
        />
      )}
    </>
  )
}
```

## Custom Onboarding Flows

### Create Custom Steps

```tsx
import type { OnboardingStepConfig } from '@/lib/types/onboarding'
import { Users, Settings } from 'lucide-react'

const customSteps: OnboardingStepConfig[] = [
  {
    id: 'step-1',
    title: 'Welcome',
    description: 'Let\'s get started',
    icon: Users,
    content: <div>Welcome to our platform!</div>,
    validation: async () => {
      // Optional: Validate before allowing next step
      return true
    },
    skippable: false,
  },
  {
    id: 'step-2',
    title: 'Configure Settings',
    description: 'Set your preferences',
    icon: Settings,
    component: SettingsStepComponent, // Custom component
    skippable: true,
  },
]

// Use custom steps
<OnboardingWizard
  role="owner"
  userId={user.id}
  customSteps={customSteps}
  onComplete={handleComplete}
/>
```

### Custom Step Component

```tsx
import type { OnboardingStepProps } from '@/lib/types/onboarding'

function SettingsStepComponent({
  onNext,
  onPrevious,
  isFirst,
  isLast,
  stepData,
  setStepData
}: OnboardingStepProps) {
  const [settings, setSettings] = useState(stepData?.settings || {})

  const handleSave = async () => {
    // Save settings
    await saveSettings(settings)

    // Store in step data
    setStepData?.({ settings })

    // Proceed to next step
    onNext()
  }

  return (
    <div>
      <input
        value={settings.name}
        onChange={e => setSettings({ ...settings, name: e.target.value })}
      />
      <button onClick={handleSave}>Save & Continue</button>
    </div>
  )
}
```

## Configuration Options

### OnboardingWizard Props

```typescript
interface OnboardingWizardProps {
  role: UserRole                      // User role for role-specific flow
  userId: string                      // User ID for status tracking
  onComplete?: () => void             // Callback when onboarding completes
  onDismiss?: () => void              // Callback when user dismisses
  onExit?: () => void                 // Callback when user exits (saves progress)
  customSteps?: OnboardingStepConfig[] // Override default role steps
  progressIndicator?: 'steps' | 'dots' | 'progress-bar' // Visual style
  allowSkip?: boolean                 // Allow skipping individual steps
  allowExit?: boolean                 // Allow exiting wizard (saves progress)
  showConfetti?: boolean              // Show confetti on completion
  className?: string                  // Custom CSS classes
}
```

### Progress Indicator Variants

```tsx
// Step numbers with labels (default)
<OnboardingWizard progressIndicator="steps" />

// Simple dots
<OnboardingWizard progressIndicator="dots" />

// Progress bar
<OnboardingWizard progressIndicator="progress-bar" />
```

## API Reference

### Hooks

#### useOnboarding

```typescript
const {
  status,              // Current onboarding status
  loading,             // Loading state
  error,               // Error object if failed
  updateStatus,        // Update progress
  completeOnboarding,  // Mark complete
  dismissOnboarding,   // Dismiss/skip
  restartOnboarding,   // Reset to beginning
  refetch,             // Refetch status
} = useOnboarding({
  userId: user.id,
  enabled: true,
  onSuccess: (status) => {},
  onError: (error) => {},
  onComplete: () => {},
  onDismiss: () => {}
})
```

### API Client

```typescript
import {
  getOnboardingStatus,
  updateOnboardingStatus,
  completeOnboarding,
  dismissOnboarding,
  restartOnboarding,
} from '@/lib/api/onboarding'

// Get status
const status = await getOnboardingStatus(userId)

// Update progress
await updateOnboardingStatus(userId, {
  current_step: 2,
  steps_completed: ['step-1', 'step-2']
})

// Complete
await completeOnboarding(userId)

// Dismiss
await dismissOnboarding(userId)

// Restart
await restartOnboarding(userId)
```

## Extracting for Other Projects

### 1. Copy Core Files

```bash
# Types and logic (reusable)
cp -r lib/types/onboarding.ts other-project/lib/types/
cp -r lib/api/onboarding.ts other-project/lib/api/
cp -r lib/hooks/use-onboarding.ts other-project/lib/hooks/
cp -r components/onboarding/ other-project/components/
```

### 2. Copy Project-Specific Files

```bash
# Customize these for your project
cp lib/config/onboarding-flows.tsx other-project/lib/config/
cp app/api/onboarding/ other-project/app/api/
cp supabase/migrations/20251127_create_user_onboarding.sql other-project/supabase/migrations/
```

### 3. Customize Onboarding Flows

Edit `lib/config/onboarding-flows.tsx` to define your project's onboarding steps for each role.

### 4. Update API Base URL (if needed)

```typescript
// lib/api/onboarding.ts
export const onboardingAPI = new OnboardingAPI({
  baseUrl: 'https://api.yourproject.com/onboarding', // Change this
  onError: (error) => {
    console.error('Onboarding API Error:', error)
  }
})
```

## Analytics & Tracking

The system tracks these events:

- `onboarding_started` - User begins onboarding
- `onboarding_step_completed` - User completes a step
- `onboarding_completed` - User finishes all steps
- `onboarding_dismissed` - User dismisses/skips onboarding
- `onboarding_exited` - User exits (saves progress)

Integrate with your analytics provider:

```typescript
// lib/api/onboarding.ts

import { trackEvent } from '@/lib/analytics' // Your analytics SDK

export const trackOnboardingEvent = async (event: any) => {
  // Send to PostHog, Mixpanel, Amplitude, etc.
  await trackEvent(event.event, {
    userId: event.userId,
    role: event.role,
    stepNumber: event.stepNumber,
    timestamp: event.timestamp,
  })
}
```

## Testing

### Manual Testing Checklist

- [ ] Onboarding wizard displays on first login
- [ ] Progress indicator updates as steps complete
- [ ] "Previous" button works correctly
- [ ] "Skip" button works on skippable steps
- [ ] "Exit" button saves progress
- [ ] Validation prevents proceeding if failed
- [ ] Confetti shows on completion
- [ ] Checklist displays on dashboard
- [ ] Checklist items can be marked complete
- [ ] Tooltips highlight correct UI elements
- [ ] Mobile responsive (Tech/Sales flows)

### Test Different Roles

```bash
# Create test users with different roles
npm run create-test-user -- --role=owner
npm run create-test-user -- --role=tech
npm run create-test-user -- --role=sales
```

### Reset Onboarding

```typescript
// For testing purposes
await restartOnboarding(userId)
```

## Troubleshooting

### Wizard doesn't appear

1. Check onboarding status: `SELECT * FROM user_onboarding_status WHERE user_id = 'xxx'`
2. Ensure `completed_at` and `dismissed_at` are NULL
3. Check browser console for errors

### Progress not saving

1. Verify API routes are accessible
2. Check network tab for failed requests
3. Ensure user is authenticated
4. Check RLS policies on `user_onboarding_status` table

### Confetti not showing

1. Ensure `react-confetti` is installed: `npm install react-confetti`
2. Check `showConfetti` prop is true (default)
3. Check browser console for errors

## Best Practices

1. **Keep steps concise**: 3-7 steps per role
2. **Make optional steps skippable**: Don't force users through everything
3. **Provide clear CTAs**: Link to pages where tasks can be completed
4. **Test mobile flows**: Tech/Sales are mobile-first
5. **Track analytics**: Monitor completion rates and drop-off points
6. **Allow restart**: Let users re-run onboarding from settings

## Support

For issues or questions:
- Check this guide first
- Review component source code comments
- Test with different user roles
- Check database RLS policies
- Enable verbose logging in API routes

---

**Version:** 1.0
**Last Updated:** 2025-11-27
**Agent:** Swarm 10: Onboarding System
