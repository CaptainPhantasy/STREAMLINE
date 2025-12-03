# ElevenLabs Voice Agent Setup Checklist

Use this checklist to verify your ElevenLabs voice agent setup is complete and working correctly.

## 🚀 Quick Setup

### Environment Configuration

- [ ] **Master Switch Enabled**: `NEXT_PUBLIC_ENABLE_VOICE_AGENT=true`
- [ ] **Provider Selected**: `NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs`
- [ ] **API Key Configured**: `ELEVENLABS_API_KEY=sk_xxxxxx`
- [ ] **Agent ID Set**: `ELEVENLABS_AGENT_ID=agent_xxxxxx` (optional, will use default)

### Package Dependencies

- [ ] **Install ElevenLabs SDK**: `npm install @elevenlabs/react`
- [ ] **Verify Package**: Check `package.json` for `@elevenlabs/react`

### Module Files

- [ ] **Module Directory**: `voice-agents/elevenlabs/` exists
- [ ] **Components**: All component files present
- [ ] **Configuration**: Config utilities present
- [ ] **Types**: TypeScript definitions present

## 🔧 Detailed Verification

### 1. Environment Variables

Run this command to check your environment:

```bash
grep -E "(NEXT_PUBLIC_ENABLE_VOICE_AGENT|NEXT_PUBLIC_VOICE_PROVIDER|ELEVENLABS_)" .env.local
```

Expected output:
```
NEXT_PUBLIC_ENABLE_VOICE_AGENT=true
NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_your-actual-key-here
ELEVENLABS_AGENT_ID=agent_your-agent-id
```

### 2. Module Structure Verification

Check all required files exist:

```bash
ls -la voice-agents/elevenlabs/
```

Required files:
- [ ] `components/elevenlabs-voice-conversation-provider.tsx`
- [ ] `components/elevenlabs-voice-widget.tsx`
- [ ] `lib/elevenlabs-client-wrapper.ts`
- [ ] `utils/elevenlabs-config.ts`
- [ ] `types/elevenlabs.types.ts`
- [ ] `README.md`
- [ ] `SETUP_CHECKLIST.md` (this file)

### 3. TypeScript Compilation

Verify no TypeScript errors:

```bash
npx tsc --noEmit
```

Expected: No error output

### 4. Development Server

Start the development server:

```bash
rm -rf .next
npm run dev
```

Expected:
- [ ] Server starts without errors
- [ ] No webpack compilation errors
- [ ] Voice modules load successfully

### 5. Browser Testing

Open your browser to `http://localhost:3000`:

#### Console Verification

Open browser dev tools (F12) and check console:

- [ ] No voice-related error messages
- [ ] `[ElevenLabs]` logs appear when voice is enabled
- [ ] Configuration validation passes

#### UI Verification

- [ ] Voice widget appears in sidebar (bottom)
- [ ] "Start a call" button is visible
- [ ] No error states shown

## 🎯 Functional Testing

### 1. Voice Widget Test

- [ ] **Widget Visibility**: Voice widget appears in sidebar
- [ ] **Start Call**: Click "Start a call" button
- [ ] **Connection Status**: Shows "Connected" or appropriate status
- [ ] **Controls**: Mute/volume controls appear when expanded
- [ ] **End Call**: Can successfully end voice session

### 2. Microphone Permissions

- [ ] **Permission Request**: Browser requests microphone access
- [ ] **Permission Granted**: Microphone access allowed
- [ ] **Permission Indicator**: Microphone icon shows active status

### 3. Voice Commands Test

Test basic voice commands:

#### Navigation Commands
- [ ] "Go to dashboard" → Navigates to correct dashboard
- [ ] "Show jobs" → Opens jobs page
- [ ] "Go to tech map" → Opens technician map
- [ ] "Open settings" → Opens settings page

#### UI Actions
- [ ] "Create new job" → Opens job creation modal (if implemented)
- [ ] "Show notifications" → Shows notifications panel
- [ ] "Toggle theme" → Switches light/dark mode

#### Error Handling
- [ ] **Invalid Command**: Gracefully handles unrecognized commands
- [ ] **Network Issues**: Shows appropriate error messages
- [ ] **Permission Denied**: Handles microphone denial gracefully

### 4. Error Recovery Test

- [ ] **Connection Loss**: Recovers from network interruptions
- [ ] **API Errors**: Handles API rate limits and errors
- [ ] **Browser Refresh**: Maintains state after page refresh

## 🔍 Advanced Verification

### 1. Feature Flags

Test feature flag functionality:

```bash
# Test with voice disabled
NEXT_PUBLIC_ENABLE_VOICE_AGENT=false npm run dev
# Expected: No voice widget or functionality

# Test with voice enabled
NEXT_PUBLIC_ENABLE_VOICE_AGENT=true npm run dev
# Expected: Full voice functionality
```

### 2. Bundle Size Analysis

Check bundle size impact:

```bash
npm run build
# Analyze build output for voice module size
```

Expected:
- [ ] Voice modules are code-split
- [ ] Bundle increases by ~2MB when voice enabled
- [ ] No bundle increase when voice disabled

### 3. Performance Testing

- [ ] **Initial Load**: App loads quickly without voice delay
- [ ] **Lazy Loading**: Voice modules load on-demand
- [ ] **Memory Usage**: No excessive memory consumption
- [ ] **CPU Usage**: Voice processing doesn't block UI

### 4. Cross-Browser Testing

Test in different browsers:

- [ ] **Chrome**: Full functionality
- [ ] **Firefox**: Full functionality
- [ ] **Safari**: Full functionality
- [ ] **Mobile**: Responsive and functional

## 🛠️ Configuration Testing

### 1. API Key Validation

Test with different API key scenarios:

```bash
# Valid API key
ELEVENLABS_API_KEY=sk_valid_key_here

# Invalid API key
ELEVENLABS_API_KEY=invalid_key

# Missing API key
# ELEVENLABS_API_KEY= (commented out)
```

Expected:
- [ ] Valid key: Voice works normally
- [ ] Invalid key: Shows appropriate error message
- [ ] Missing key: Shows configuration error

### 2. Agent ID Testing

Test with different agent configurations:

```bash
# Default agent
# ELEVENLABS_AGENT_ID= (not set)

# Custom agent
ELEVENLABS_AGENT_ID=agent_your_custom_agent_id

# Invalid agent ID
ELEVENLABS_AGENT_ID=invalid_agent_id
```

### 3. Feature Flag Testing

Test individual feature flags:

```bash
# Test with navigation disabled
NEXT_PUBLIC_ENABLE_VOICE_NAVIGATION=false

# Test with UI actions disabled
NEXT_PUBLIC_ENABLE_VOICE_UI_ACTIONS=false

# Test with debug mode
NEXT_PUBLIC_VOICE_DEBUG_MODE=true
```

## 📊 Health Check Script

Run the automated health check:

```bash
npx tsx scripts/setup-voice-optional.ts
```

Expected output:
- [ ] Configuration validation passes
- [ ] All required files found
- [ ] TypeScript compilation successful
- [ ] No critical errors detected

## ✅ Final Verification Checklist

Before going to production, verify:

- [ ] All environment variables set correctly
- [ ] Voice functionality works in development
- [ ] No TypeScript or build errors
- [ ] Error handling works properly
- [ ] Performance is acceptable
- [ ] Security best practices followed
- [ ] Documentation is up to date
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Accessibility features work

## 🔧 Troubleshooting

### Common Issues and Solutions

**Issue**: Voice widget not appearing
- **Solution**: Check `NEXT_PUBLIC_ENABLE_VOICE_AGENT=true` and restart server

**Issue**: Microphone not working
- **Solution**: Grant browser microphone permissions and check HTTPS

**Issue**: Navigation commands not working
- **Solution**: Verify `NEXT_PUBLIC_ENABLE_VOICE_NAVIGATION=true`

**Issue**: API key errors
- **Solution**: Validate ElevenLabs API key format and permissions

**Issue**: Build errors
- **Solution**: Clear cache with `rm -rf .next` and restart

### Getting Help

If issues persist:

1. Check browser console for detailed error messages
2. Review the main README.md documentation
3. Run the health check script
4. Enable debug mode for detailed logging
5. Check ElevenLabs API status and limits

## 📈 Success Criteria

Your ElevenLabs voice agent setup is complete when:

- ✅ Voice widget appears and functions correctly
- ✅ Microphone permissions work properly
- ✅ Voice commands trigger appropriate actions
- ✅ Error handling is graceful and helpful
- ✅ Performance is acceptable
- ✅ All browsers work correctly
- ✅ Configuration is secure and maintainable
- ✅ Documentation is complete and accurate

---

**Last Updated**: 2025-12-01
**Version**: 1.0.0
**Module**: ElevenLabs Voice Agent for CRM-AI-PRO