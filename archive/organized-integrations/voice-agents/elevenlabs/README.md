# ElevenLabs Voice Agent Module

A modular, isolated voice agent implementation for CRM-AI-PRO using ElevenLabs technology. This module provides complete voice assistant functionality while maintaining clean separation from the core CRM platform.

## Overview

The ElevenLabs Voice Agent Module enables natural voice interactions with the CRM system, allowing users to:

- Navigate between pages using voice commands
- Trigger UI actions and open modals
- Access CRM data and operations
- Execute 97+ business operations via voice
- Enjoy hands-free operation for field technicians

## Features

### 🎯 Core Functionality
- **Natural Language Processing**: Advanced conversational AI capabilities
- **Voice Navigation**: Smart routing between CRM pages
- **UI Integration**: Trigger modals, forms, and actions by voice
- **Context Awareness**: User role and account-specific interactions
- **Error Handling**: Graceful degradation and fallback mechanisms

### 🔧 Technical Features
- **Modular Architecture**: Completely optional with lazy loading
- **Feature Flags**: Granular control over voice features
- **Error Boundaries**: Comprehensive error handling and recovery
- **Bundle Optimization**: ~2MB savings when disabled
- **TypeScript Support**: Full type safety and IntelliSense

## Quick Start

### 1. Configuration

Add these environment variables to your `.env.local`:

```bash
# Enable voice features
NEXT_PUBLIC_ENABLE_VOICE_AGENT=true
NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs

# ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_your-elevenlabs-key-here
ELEVENLABS_AGENT_ID=agent_6501katrbe2re0c834kfes3hvk2d
```

### 2. Install Dependencies

```bash
npm install @elevenlabs/react
```

### 3. Restart Development Server

```bash
rm -rf .next
npm run dev
```

## Module Structure

```
voice-agents/elevenlabs/
├── components/
│   ├── elevenlabs-voice-conversation-provider.tsx  # Main voice provider
│   └── elevenlabs-voice-widget.tsx                # UI controls
├── lib/
│   └── elevenlabs-client-wrapper.ts               # SDK wrapper with error handling
├── utils/
│   └── elevenlabs-config.ts                       # Configuration management
├── types/
│   └── elevenlabs.types.ts                        # TypeScript definitions
├── api/
│   └── config/route.ts                            # Configuration endpoint
├── README.md                                      # This file
└── SETUP_CHECKLIST.md                             # Setup verification
```

## API Reference

### Components

#### `ElevenLabsVoiceConversationProvider`

Main provider component that wraps your application with voice functionality.

```tsx
import { ElevenLabsVoiceConversationProvider } from 'voice-agents/elevenlabs/components/elevenlabs-voice-conversation-provider'

<ElevenLabsVoiceConversationProvider onError={(error) => console.error(error)}>
  <YourApp />
</ElevenLabsVoiceConversationProvider>
```

**Props:**
- `children`: ReactNode - Your application components
- `onError?`: (error: Error) => void - Error handler callback

#### `ElevenLabsVoiceWidget`

UI component for voice controls (start/stop calls, mute, volume).

```tsx
import { ElevenLabsVoiceWidget } from 'voice-agents/elevenlabs/components/elevenlabs-voice-widget'

<ElevenLabsVoiceWidget
  onStatusChange={(status) => console.log(status)}
  onError={(error) => console.error(error)}
/>
```

**Props:**
- `className?`: string - Additional CSS classes
- `onStatusChange?`: (status: string) => void - Status change callback
- `onError?`: (error: Error) => void - Error handler callback

### Hooks

#### `useElevenLabsVoiceConversation`

Access the voice conversation context from any component.

```tsx
import { useElevenLabsVoiceConversation } from 'voice-agents/elevenlabs/components/elevenlabs-voice-conversation-provider'

const { conversation, startSessionWithTools } = useElevenLabsVoiceConversation()
```

**Returns:**
- `conversation`: ElevenLabs conversation object
- `startSessionWithTools`: Function to start voice session with client tools

### Configuration

#### `getElevenLabsConfig()`

Get current ElevenLabs configuration and validation status.

```tsx
import { getElevenLabsConfig } from 'voice-agents/elevenlabs/utils/elevenlabs-config'

const config = getElevenLabsConfig()
console.log(config.enabled, config.isValid)
```

#### `isElevenLabsEnabled()`

Check if ElevenLabs voice is properly configured and enabled.

```tsx
import { isElevenLabsEnabled } from 'voice-agents/elevenlabs/utils/elevenlabs-config'

if (isElevenLabsEnabled()) {
  // Voice features are available
}
```

#### `getUserContext()`

Get authenticated user context for voice sessions.

```tsx
import { getUserContext } from 'voice-agents/elevenlabs/utils/elevenlabs-config'

const userContext = await getUserContext()
// Returns: { user_identifier, user_name, user_role, account_id }
```

## Voice Commands

### Navigation Commands

- "Go to dashboard" → Navigate to role-specific dashboard
- "Show jobs" → Open jobs list
- "Open job 123" → Navigate to specific job
- "Go to tech map" → Open technician map view
- "Show contacts" → Open contacts page
- "Go to settings" → Open settings page

### UI Actions

- "Create new job" → Open job creation modal
- "Show notifications" → Display notifications panel
- "Toggle theme" → Switch between light/dark mode
- "Scroll to top" → Scroll to page top
- "Go back" → Navigate to previous page

### Business Operations

The voice agent can execute 97+ CRM operations including:

- **Job Management**: Create, update, assign jobs
- **Contact Management**: Search, create, update contacts
- **Scheduling**: View calendar, create appointments
- **Communication**: Send messages, generate drafts
- **Analytics**: View reports, get statistics

## Error Handling

The module includes comprehensive error handling:

### Error Boundaries

All voice components are wrapped with error boundaries that:
- Catch runtime errors gracefully
- Provide fallback UI when voice features fail
- Include retry mechanisms with exponential backoff
- Log detailed error information for debugging

### Graceful Degradation

When voice features encounter errors:
- The CRM continues to function normally
- Users see helpful error messages
- Automatic retry attempts are performed
- Fallback to manual operation is seamless

## Development

### Testing Voice Features

1. **Enable Debug Mode**:
   ```bash
   NEXT_PUBLIC_VOICE_DEBUG_MODE=true
   ```

2. **Check Browser Console**:
   - Look for `[ElevenLabs]` prefixed logs
   - Verify connection status
   - Check for configuration errors

3. **Voice Commands**:
   - Use browser's microphone permissions
   - Test with clear, natural language
   - Verify navigation and UI actions

### Debugging

Enable detailed logging:

```bash
NEXT_PUBLIC_VOICE_ENABLE_LOGGING=true
NEXT_PUBLIC_VOICE_DEBUG_MODE=true
```

Common issues:

1. **API Key Issues**:
   - Verify ELEVENLABS_API_KEY format
   - Check key permissions and usage limits

2. **Audio Permissions**:
   - Ensure microphone access is granted
   - Check browser security settings

3. **Network Issues**:
   - Verify internet connection
   - Check firewall/VPN settings

## Performance

### Bundle Size Impact

- **When Enabled**: ~2MB additional bundle size
- **When Disabled**: No impact (module not loaded)
- **Lazy Loading**: Module loads only when enabled

### Optimization Features

- Dynamic imports prevent unnecessary loading
- Code splitting isolates voice functionality
- Suspense boundaries prevent blocking
- Error boundaries prevent crashes

## Security

### API Key Protection

- API keys stored in environment variables
- Server-side validation prevents client exposure
- Key rotation supported without code changes
- Usage monitoring and rate limiting

### Authentication

- Voice sessions require authenticated users
- User context automatically included
- Role-based permissions enforced
- Audit logging for all voice actions

## Migration Guide

### From Previous Versions

If upgrading from a previous voice implementation:

1. **Update Environment Variables**:
   ```bash
   # Old variables are still supported
   ELEVENLABS_API_KEY=sk_xxx

   # New feature flags (optional)
   NEXT_PUBLIC_ENABLE_VOICE_AGENT=true
   NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs
   ```

2. **Update Imports**:
   ```tsx
   // Old
   import { VoiceConversationProvider } from '@/components/voice-conversation-provider'

   // New (automatic via VoiceProviderWrapper)
   // No import needed - handled automatically
   ```

3. **Verify Configuration**:
   ```bash
   npm run setup:voice
   ```

### Feature Flags

Granular control over voice features:

```bash
# Master switch
NEXT_PUBLIC_ENABLE_VOICE_AGENT=true

# Specific features
NEXT_PUBLIC_ENABLE_VOICE_NAVIGATION=true
NEXT_PUBLIC_ENABLE_VOICE_UI_ACTIONS=true
NEXT_PUBLIC_ENABLE_VOICE_TRANSCRIPTION=false
NEXT_PUBLIC_ENABLE_VOICE_RECORDING=false
```

## Troubleshooting

### Common Issues

**Voice Not Working**:
1. Check `NEXT_PUBLIC_ENABLE_VOICE_AGENT=true`
2. Verify API key configuration
3. Ensure microphone permissions
4. Check browser console for errors

**Navigation Not Working**:
1. Verify `NEXT_PUBLIC_ENABLE_VOICE_NAVIGATION=true`
2. Check route mapping in conversation provider
3. Test with different voice commands

**UI Actions Not Working**:
1. Verify `NEXT_PUBLIC_ENABLE_VOICE_UI_ACTIONS=true`
2. Check event listeners in navigation bridge
3. Test custom event dispatching

### Support

For issues and support:

1. **Documentation**: Check this README and SETUP_CHECKLIST.md
2. **Health Check**: Run `npm run setup:voice`
3. **Debug Mode**: Enable debug logging
4. **Logs**: Check browser console and server logs

## Contributing

When contributing to the ElevenLabs module:

1. Follow the existing code structure and patterns
2. Include comprehensive TypeScript types
3. Add error boundaries for new components
4. Update documentation for new features
5. Test with voice features both enabled and disabled

## License

This module is part of CRM-AI-PRO and follows the same license terms.