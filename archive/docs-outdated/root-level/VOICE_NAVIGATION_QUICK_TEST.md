# Voice Navigation - Quick Test

## 🚀 Start Here

### 1. Clear Cache & Start Server
```bash
rm -rf .next && PORT=3002 npm run dev
```

### 2. Open Browser
```
http://localhost:3002
```

### 3. Open Console (F12)
Filter console by: `🚨`

---

## 🎤 Test Commands

### Say: "Go to tech dashboard"

**✅ Expected Console Output:**
```
🚨 startSessionWithTools() CALLED
🚨 REGISTERING CLIENT TOOLS NOW...
🚀 STARTING SESSION... Registering Client Tools: [ 'navigation', 'get_current_page', 'scroll_to_section', 'trigger_ui_action', 'open_new_tab' ]
🚨 Navigation tool handler type: function
✅ Session Started Successfully

(When you speak:)
🚨 VOICE BRIDGE RECEIVED SIGNAL: go to tech dashboard
🚨 CLIENT TOOL HANDLER EXECUTING IN BROWSER
[VoiceNavigation] Route requested: "go to tech dashboard" → Navigating to: /m/tech/dashboard
```

**✅ Expected Browser Behavior:**
- URL: `http://localhost:3002/m/tech/dashboard`
- No page reload
- Content updates

**❌ If You See:**
```
Tool succeeded: navigation (1ms)
```
**But NO:** `🚨 VOICE BRIDGE RECEIVED SIGNAL`

**→ Client tools are NOT registered! Check ElevenLabs agent config.**

---

## 🔍 Debug Checklist

- [ ] Console shows: `🚀 STARTING SESSION... Registering Client Tools:`
- [ ] Console shows: `✅ Session Started Successfully`
- [ ] Console shows: `🚨 VOICE BRIDGE RECEIVED SIGNAL:` (when speaking)
- [ ] URL changes to `/m/tech/dashboard`
- [ ] No page reload occurs

---

## 📋 Test Matrix

| Command | Expected Route | Status |
|---------|----------------|--------|
| "Go to tech dashboard" | `/m/tech/dashboard` | 🔲 |
| "Go to sales dashboard" | `/m/sales/dashboard` | 🔲 |
| "Show tech map" | `/m/tech/map` | 🔲 |
| "Show sales leads" | `/m/sales/leads` | 🔲 |
| "Go to owner dashboard" | `/m/owner/dashboard` | 🔲 |

---

## 🐛 If Test Fails

1. **Check:** Is `[VoiceNavigationBridge] Mounted` in console?
   - **No?** → Bridge not loaded, check layout.tsx

2. **Check:** Do you see `🚀 STARTING SESSION...`?
   - **No?** → Session not starting, check VoiceAgentWidget

3. **Check:** Do you see `🚨 VOICE BRIDGE RECEIVED SIGNAL:`?
   - **No?** → Tools not registered OR wrong session active
   - **Check ElevenLabs agent config**

4. **Nuclear Option:**
```bash
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
PORT=3002 npm run dev
```

---

**Last Updated:** 2025-11-28
**Status:** Fixes applied, ready for testing
