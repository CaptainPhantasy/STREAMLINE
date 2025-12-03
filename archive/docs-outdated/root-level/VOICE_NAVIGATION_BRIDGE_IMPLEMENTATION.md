# Voice Navigation Bridge Implementation Guide

## Overview

This document describes the implementation of the **Client-Side UI Bridge** pattern to solve the "Phantom Navigation" problem in the CRM-AI PRO voice agent integration.

## The Problem: "Phantom Navigation"

### Before Implementation:
```
User: "Go to settings"
   ↓
ElevenLabs Agent decides to navigate
   ↓
Agent calls navigation tool on MCP Server (Supabase Edge Function)
   ↓
Server executes: ✅ Logs "Success"
   ↓
Server CANNOT access browser DOM/window ❌
   ↓
User's browser never navigates 😞
```

**Result:** The agent thinks navigation happened, but the user sees no change. This creates a "split brain" where the agent and the user experience different realities.

## The Solution: Client-Side Tool Registration

### After Implementation:
```
User: "Go to settings"
   ↓
ElevenLabs Agent decides to navigate
   ↓
Agent calls navigation tool (registered CLIENT-SIDE)
   ↓
Tool executes IN THE BROWSER ✅
   ↓
router.push('/settings') ✅
   ↓
User sees the settings page 🎉
   ↓
Agent receives success confirmation ✅
```

## Architecture

We've implemented a **Shared Conversation Context** pattern with the following components:

### 1. VoiceConversationProvider (components/voice-conversation-provider.tsx)

**Purpose:** Provides a SINGLE shared conversation instance for the entire application.

**Key Features:**
- Creates ONE `useConversation` hook instance
- Registers client-side tools (navigation, UI actions, etc.)
- Prevents duplicate WebRTC sessions
- Provides `startSessionWithTools()` method

**Client Tools Registered:**

| Tool Name | Description | Parameters | Browser API Used |
|-----------|-------------|------------|------------------|
| `navigation` | Navigate to a route | `route: string` | `router.push()` |
| `get_current_page` | Get current route | none | `pathname` |
| `scroll_to_section` | Scroll to element | `sectionId: string` | `element.scrollIntoView()` |
| `trigger_ui_action` | Trigger custom UI events | `action: string, payload?: object` | `CustomEvent` |
| `open_new_tab` | Open URL in new tab | `url: string` | `window.open()` |

### 2. VoiceNavigationBridge (components/voice-navigation-bridge.tsx)

**Purpose:** Marker component that enables client-side tool execution.

**Key Features:**
- Headless component (renders `null`)
- Mounts in root layout
- Ensures VoiceConversationProvider is active
- No UI, purely logical

**Note:** There are TWO versions of this file:
- `voice-navigation-bridge.tsx` - Standalone version (auto-starts session)
- `voice-navigation-bridge-simple.tsx` - Marker version (used with Provider pattern)

### 3. VoiceAgentWidget (Updated)

**Purpose:** UI controls for the voice conversation.

**Changes:**
- Uses `useVoiceConversation()` hook (shared context)
- No longer creates its own `useConversation()` instance
- Calls `startSessionWithTools()` when user clicks "Start a call"
- All UI controls work with the shared session

**Files:**
- `components/voice-agent/voice-agent-widget.tsx` - Original (needs update)
- `components/voice-agent/voice-agent-widget-updated.tsx` - Updated version

## Integration Steps

### Phase 1: ✅ Add VoiceConversationProvider

**File:** `components/providers.tsx`

```typescript
import { VoiceConversationProvider } from '@/components/voice-conversation-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmDialogProvider>
        <VoiceConversationProvider>
          {children}
        </VoiceConversationProvider>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  )
}
```

### Phase 2: ✅ Inject VoiceNavigationBridge into Root Layout

**File:** `app/layout.tsx`

```typescript
import { VoiceNavigationBridge } from "@/components/voice-navigation-bridge"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
          {/* Voice Navigation Bridge - Enables client-side tool execution */}
          <VoiceNavigationBridge />
        </Providers>
      </body>
    </html>
  )
}
```

### Phase 3: 🔄 Update VoiceAgentWidget (REQUIRED)

**File:** `components/layout/sidebar-nav.tsx`

**Option A: Quick Fix (Disable VoiceAgentWidget temporarily)**
```typescript
// Comment out the widget temporarily
// <VoiceAgentWidget />
```

**Option B: Use Updated Widget (Recommended)**
```typescript
// Update import
import { VoiceAgentWidget } from '@/components/voice-agent/voice-agent-widget-updated'
```

**Option C: Update Original Widget**

Replace the original `voice-agent-widget.tsx` with the updated version, or manually update it to use `useVoiceConversation()`.

## Testing

### Test Case 1: Basic Navigation
1. Open the CRM application
2. Click "Start a call" (if using updated widget)
3. Say: "Go to jobs"
4. **Expected:** Browser navigates to `/jobs` route
5. **Expected:** Agent confirms "I've navigated to the jobs page"

### Test Case 2: Current Page Query
1. Navigate to `/contacts` manually
2. Start a voice call
3. Say: "What page am I on?"
4. **Expected:** Agent responds with "You're on the contacts page"

### Test Case 3: Scroll to Section
1. Navigate to a page with sections (IDs required)
2. Say: "Scroll to the bottom" or "Scroll to [section-id]"
3. **Expected:** Page scrolls to the specified section

### Test Case 4: Multiple Navigations
1. Start a voice call
2. Say: "Go to jobs"
3. Say: "Now go to contacts"
4. Say: "Now go to settings"
5. **Expected:** Browser navigates to each route in sequence

## Success Metrics

✅ **Parity:** When the user says "Go to jobs," the URL changes to `/jobs` instantly without a page reload

✅ **Feedback:** The Agent receives the return value from the client tool and confirms "I've opened the jobs page"

✅ **Isolation:** This logic does not interfere with the existing VoiceWidget UI visualization; it purely handles the intent-to-action pipeline

## Troubleshooting

### Issue: "Cannot use JSX unless the '--jsx' flag is provided"
**Solution:** This is a TypeScript compiler error during build. It's resolved by Next.js configuration. If you see this during `tsc --noEmit`, it's safe to ignore.

### Issue: Two voice sessions starting
**Symptom:** User clicks "Start a call" and two WebRTC connections are created

**Cause:** Both VoiceNavigationBridge and VoiceAgentWidget are calling `startSession()`

**Solution:** Use the Provider pattern and ensure only ONE component starts the session. See Phase 3 above.

### Issue: Navigation not working
**Symptom:** User says "Go to jobs" but nothing happens

**Possible Causes:**
1. VoiceConversationProvider not in providers tree
2. VoiceNavigationBridge not mounted
3. Session not started with `clientTools`
4. Agent not configured to use client-side tools

**Debug Steps:**
1. Check browser console for `[VoiceNavigation] Navigating to: /jobs`
2. Check ElevenLabs agent configuration
3. Verify `startSessionWithTools()` is being called
4. Check for TypeScript errors in build

### Issue: Agent still using server-side MCP tools
**Symptom:** Agent logs show MCP server calls, not client-side tool execution

**Solution:** The ElevenLabs agent may need to be reconfigured to prefer client-side tools over server-side MCP tools. Check agent configuration in ElevenLabs dashboard.

## Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    App Root Layout                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Providers                               │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │      VoiceConversationProvider              │ │  │
│  │  │                                             │ │  │
│  │  │  • Creates ONE useConversation instance    │ │  │
│  │  │  • Registers client-side tools             │ │  │
│  │  │  • Provides startSessionWithTools()        │ │  │
│  │  │                                             │ │  │
│  │  │  ┌─────────────────────────────────────┐  │ │  │
│  │  │  │   {children}                        │  │ │  │
│  │  │  │                                     │  │ │  │
│  │  │  │   ┌─────────────────────────────┐  │  │ │  │
│  │  │  │   │    SidebarNav              │  │  │ │  │
│  │  │  │   │                            │  │  │ │  │
│  │  │  │   │  ┌──────────────────────┐ │  │  │ │  │
│  │  │  │   │  │ VoiceAgentWidget   │ │  │  │ │  │
│  │  │  │   │  │ (Updated)          │ │  │  │ │  │
│  │  │  │   │  │                    │ │  │  │ │  │
│  │  │  │   │  │ Uses shared context│ │  │  │ │  │
│  │  │  │   │  │ for UI controls    │ │  │  │ │  │
│  │  │  │   │  └──────────────────────┘ │  │  │ │  │
│  │  │  │   └─────────────────────────────┐  │  │ │  │
│  │  │  │                                 │  │  │ │  │
│  │  │  │   ┌─────────────────────────────┐  │  │ │  │
│  │  │  │   │  VoiceNavigationBridge     │  │  │ │  │
│  │  │  │   │  (Marker component)        │  │  │ │  │
│  │  │  │   └─────────────────────────────┘  │  │ │  │
│  │  │  └──────────────────────────────────────┘  │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

USER ACTION:
"Go to jobs" → Agent calls navigation tool → Executes in browser → router.push('/jobs')
```

## Future Enhancements

### Potential Additional Client Tools:
- `refresh_page`: Reload current route
- `go_back`: Browser back navigation
- `show_toast`: Display toast notifications
- `open_sidebar`: Toggle sidebar visibility
- `focus_search`: Focus search input
- `play_sound`: Play audio feedback
- `vibrate`: Haptic feedback (mobile)

### Advanced Integration:
- Add voice command history
- Implement voice command shortcuts
- Add voice-triggered form filling
- Integrate with keyboard shortcuts
- Add voice-controlled filters

## Notes

- This implementation uses the ElevenLabs React SDK v0.11.3
- Client tools are passed to `startSession()` via the (potentially undocumented) `clientTools` parameter
- The `@ts-expect-error` comment is used because the SDK types may not include `clientTools` yet
- All client tools execute synchronously in the browser context
- Tools return structured responses that the agent can use for confirmation

## Related Files

- `components/voice-conversation-provider.tsx` - Context provider
- `components/voice-navigation-bridge.tsx` - Bridge component
- `components/voice-navigation-bridge-simple.tsx` - Simplified bridge
- `components/voice-agent/voice-agent-widget.tsx` - Original widget
- `components/voice-agent/voice-agent-widget-updated.tsx` - Updated widget
- `components/providers.tsx` - App providers (includes voice provider)
- `app/layout.tsx` - Root layout (includes bridge)
- `components/layout/sidebar-nav.tsx` - Sidebar (renders widget)

## Contact & Support

For questions or issues with this implementation, refer to:
- ElevenLabs React SDK Documentation
- Next.js App Router Documentation
- This repository's GitHub Issues
