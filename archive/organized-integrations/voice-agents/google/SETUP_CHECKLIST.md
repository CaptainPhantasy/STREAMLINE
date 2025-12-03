# Google Voice Agent Setup Checklist

## ✅ Pre-Setup Requirements

- [ ] Google Cloud Project created
- [ ] Generative Language API enabled
- [ ] Gemini API key generated
- [ ] Node.js 18+ installed
- [ ] HTTPS available (required for microphone)

## ✅ Configuration Setup

### 1. Environment Variables (.env.local)
```env
# Required
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NEXT_PUBLIC_MCP_SERVER_URL=https://your-mcp-server.supabase.co/functions/v1/mcp-server
NEXT_PUBLIC_VOICE_PROVIDER=google
```

- [ ] `GOOGLE_GEMINI_API_KEY` set with valid key
- [ ] `NEXT_PUBLIC_SUPABASE_URL` exists (from base setup)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists (from base setup)

### 2. Google Cloud Setup
- [ ] Go to: https://makersuite.google.com/app/apikey
- [ ] Create new API key
- [ ] Copy key to .env.local
- [ ] Enable Gemini API in project
- [ ] Check quota limits (default 60 requests/minute)

## ✅ File Structure Setup

- [ ] Copy `voice-agents/google` to project root
- [ ] `api/token/route.ts` accessible at `/api/voice/token`
- [ ] `public/worklets/pcm-processor.js` copied to public folder
- [ ] All TypeScript files compile without errors

## ✅ Integration Steps

### 1. Provider Setup
- [ ] Import `GoogleVoiceConversationProvider`
- [ ] Replace ElevenLabs provider in app root
- [ ] Update VoiceAgentWidget to use Google provider
- [ ] Test hot-swap wrapper if using

### 2. Route Testing
Test these voice commands:
- [ ] "Go to dashboard" → Should navigate to correct role dashboard
- [ ] "Open jobs" → Should navigate to jobs page
- [ ] "Show me tech map" → Should navigate to /m/tech/map
- [ ] "Create contact Test User" → Should call MCP tool
- [ ] "Get analytics" → Should fetch dashboard stats

### 3. Audio Testing
- [ ] Microphone permission granted
- [ ] Audio input visible in browser tab
- [ ] Can hear Gemini responses
- [ ] Voice detection working
- [ ] No echo or feedback

## ✅ Error Handling Test

Test error scenarios:
- [ ] Invalid API key → Shows error message
- [ ] Microphone denied → Graceful fallback
- [ ] Network disconnect → Reconnection attempt
- [ ] Invalid tool call → Error response
- [ ] Session timeout → Clean disconnect

## ✅ Performance Checks

- [ ] Connection time < 3 seconds
- [ ] Voice latency < 500ms
- [ ] Tool response < 2 seconds
- [ ] Memory usage < 20MB
- [ ] No memory leaks on reconnect

## ✅ Browser Compatibility

Test in:
- [ ] Chrome 88+
- [ ] Firefox 90+
- [ ] Safari 14+
- [ ] Edge 88+

## ✅ Production Checklist

- [ ] Environment variables set in production
- [ ] API route deployed correctly
- [ ] SSL certificate active
- [ ] Microphone policy headers set
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Logging enabled for debugging

## ✅ Troubleshooting Commands

```bash
# Check if API key is valid
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY"

# Test MCP server
curl -X POST https://expbvujyegxmxvatcjqt.supabase.co/functions/v1/mcp-server \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Check Next.js compilation
npm run build
```

## ✅ Monitoring & Analytics

Add monitoring for:
- [ ] Session success/failure rate
- [ ] Average response time
- [ ] Tool usage frequency
- [ ] Error types and counts
- [ ] User engagement metrics

## ✅ Security Review

- [ ] API key not exposed client-side
- [ ] Authentication required for tools
- [ ] User context validated
- [ ] Rate limiting active
- [ ] Input sanitization in place
- [ ] CORS properly configured

## ✅ Documentation Updates

- [ ] User guide updated
- [ ] API documentation current
- [ ] Troubleshooting guide complete
- [ ] Changelog maintained
- [ ] Migration guide verified

---

## Quick Verification Script

```bash
#!/bin/bash
echo "🔍 Google Voice Agent Setup Verification"

# Check environment variables
if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
  echo "❌ GOOGLE_GEMINI_API_KEY not set"
  exit 1
else
  echo "✅ GOOGLE_GEMINI_API_KEY found"
fi

# Check file structure
if [ -f "voice-agents/google/components/google-voice-conversation-provider.tsx" ]; then
  echo "✅ Google provider exists"
else
  echo "❌ Google provider missing"
fi

if [ -f "public/worklets/pcm-processor.js" ]; then
  echo "✅ PCM processor exists"
else
  echo "❌ PCM processor missing"
fi

# Check Next.js build
echo "🏗️ Running build check..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
fi

echo "✨ Verification complete!"
```