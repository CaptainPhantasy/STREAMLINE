# Google Voice Agent Migration Guide

## Overview

This document provides step-by-step instructions to hot-swap the ElevenLabs voice agent with the Google Gemini voice agent.

## Module Structure

```
voice-agents/google/
├── api/token/route.ts              # Server-side token endpoint
├── lib/gemini-client.ts            # WebSocket client for Gemini
├── utils/gemini-tool-mapper.ts     # Tool format conversion utilities
├── components/
│   └── google-voice-conversation-provider.tsx  # Main provider component
├── public/worklets/
│   └── pcm-processor.js            # Audio processing worklet
└── MIGRATION_GUIDE.md              # This file
```

## Prerequisites

1. **Environment Variables** - Add to your `.env.local`:
   ```env
   # Google Gemini API Key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: Override MCP server URL
   NEXT_PUBLIC_MCP_SERVER_URL=https://your-mcp-server.supabase.co/functions/v1/mcp-server
   ```

2. **Google Gemini API Access**:
   - Enable the Generative Language API in your Google Cloud project
   - Get an API key from: https://makersuite.google.com/app/apikey
   - The model `gemini-2.0-flash-exp` must be enabled

## Migration Steps

### Step 1: Copy Files to Project

Copy the entire `voice-agents/google` folder to your project root:
```bash
# If the folder doesn't exist in your project
cp -r voice-agents/google /path/to/your/project/

# Alternative: Copy individual files
cp -r voice-agents/google/api /path/to/your/project/
cp -r voice-agents/google/lib /path/to/your/project/
cp -r voice-agents/google/utils /path/to/your/project/
cp -r voice-agents/google/components /path/to/your/project/
cp -r voice-agents/google/public /path/to/your/project/
```

### Step 2: Update Next.js Configuration

Add the API route to your Next.js configuration. If you're using the App Router, ensure the API route is properly structured.

The API route is already structured for Next.js App Router at `/api/voice/token`.

### Step 3: Update the Voice Widget

Modify your voice widget component to use the Google provider:

```tsx
// Before: components/voice-agent/voice-agent-widget.tsx
// import { useVoiceConversation } from '@/components/voice-conversation-provider'

// After:
import { useGoogleVoiceConversation } from '@/voice-agents/google/components/google-voice-conversation-provider'

// In the component:
const { isConnected, isSpeaking, status, startSessionWithTools, endSession, setMuted } = useGoogleVoiceConversation()
```

### Step 4: Update the App Provider

Replace the ElevenLabs provider with the Google provider in your app root:

```tsx
// app/providers.tsx or app/layout.tsx
// Before:
// import { VoiceConversationProvider } from '@/components/voice-conversation-provider'

// After:
import { GoogleVoiceConversationProvider } from '@/voice-agents/google/components/google-voice-conversation-provider'

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleVoiceConversationProvider>
      {/* Other providers */}
      {children}
    </GoogleVoiceConversationProvider>
  )
}
```

### Step 5: Hot-Swap Implementation

For easy hot-swapping between providers, create a wrapper:

```tsx
// components/voice-provider-wrapper.tsx
'use client'

import { GoogleVoiceConversationProvider } from '@/voice-agents/google/components/google-voice-conversation-provider'
import { VoiceConversationProvider } from '@/components/voice-conversation-provider'

export function VoiceProviderWrapper({ children }: { children: React.ReactNode }) {
  // Toggle this to switch providers
  const useGoogle = process.env.NEXT_PUBLIC_VOICE_PROVIDER === 'google'

  if (useGoogle) {
    return <GoogleVoiceConversationProvider>{children}</GoogleVoiceConversationProvider>
  }

  return <VoiceConversationProvider>{children}</VoiceConversationProvider>
}
```

Then in your `.env.local`:
```env
# Use 'elevenlabs' or 'google'
NEXT_PUBLIC_VOICE_PROVIDER=google
```

### Step 6: Update Audio Worklet Path

The PCM processor needs to be accessible. Copy it to your public folder:

```bash
cp voice-agents/google/public/worklets/pcm-processor.js public/worklets/
```

Or update the path in `gemini-client.ts` to match your public folder structure.

## Testing the Migration

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Check Console Logs**:
   - Look for `[GeminiClient]` logs to verify connection
   - Check for token configuration errors
   - Verify tools are loaded correctly

3. **Test Voice Functionality**:
   - Click "Start a call" in the voice widget
   - Verify microphone permissions are granted
   - Test navigation commands: "Go to dashboard", "Open jobs"
   - Test CRM commands: "Create contact John Doe"

4. **Debug Common Issues**:
   - **401 Unauthorized**: Check Google API key is valid
   - **Microphone Error**: Ensure HTTPS (localhost is exempt)
   - **Tools Not Loading**: Verify MCP server URL and auth
   - **Audio Not Playing**: Check browser audio permissions

## Key Differences to Note

1. **Voice Model**: Google uses "Kore" by default (professional, neutral tone)
2. **Latency**: Slightly different latency characteristics
3. **Tool Format**: Automatic conversion from MCP to Gemini format
4. **Error Handling**: More detailed error messages from Gemini

## Rolling Back

To rollback to ElevenLabs:

1. Restore the original provider:
   ```tsx
   import { VoiceConversationProvider } from '@/components/voice-conversation-provider'
   ```

2. Remove Google environment variables:
   ```env
   # Remove or comment out:
   # GOOGLE_GEMINI_API_KEY=...
   # NEXT_PUBLIC_VOICE_PROVIDER=google
   ```

3. Restart the development server

## Production Deployment

1. **Vercel/Netlify**: Add environment variables in deployment dashboard
2. **Docker**: Add to Docker environment variables
3. **Static Export**: Ensure API routes are properly deployed

## Support

For issues:
1. Check browser console for error messages
2. Verify all environment variables are set
3. Ensure Google Cloud project has APIs enabled
4. Check MCP server is accessible

## Features Working

- ✅ Voice conversation with Gemini
- ✅ Client-side navigation tools
- ✅ MCP server integration (97 tools)
- ✅ User context injection
- ✅ Pacing protocols (2s nav, 1.5s DB writes)
- ✅ Smart route aliases for mobile
- ✅ Error handling and reconnection
- ✅ Microphone mute/unmute
- ✅ Audio playback with PCM conversion