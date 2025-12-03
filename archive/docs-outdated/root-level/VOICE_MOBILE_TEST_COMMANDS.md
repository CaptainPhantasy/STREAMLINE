# Voice Mobile Navigation - Test Commands

## 🎤 Quick Test Script

**Prerequisites:**
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:3002`
3. Open browser console (F12)
4. Click "Start a call" in sidebar
5. Wait for "Connected to voice agent" message

---

## 🧪 Test Commands (Copy & Paste)

### Tech Role Tests:

```
1. "Go to tech dashboard"
   → Expected: /m/tech/dashboard
   → Console: [VoiceNavigation] Route requested: "go to tech dashboard" → Navigating to: /m/tech/dashboard

2. "Show tech map"
   → Expected: /m/tech/map
   → Console should show route transformation

3. "Open tech job 123"
   → Expected: /m/tech/job/123
   → Console should show ID extraction

4. "Tech profile"
   → Expected: /m/tech/profile

5. Navigate to /m/tech/job/456 manually, then say: "Go to dashboard"
   → Expected: /m/tech/dashboard (context-aware!)
```

### Sales Role Tests:

```
1. "Go to sales dashboard"
   → Expected: /m/sales/dashboard

2. "Show leads"
   → Expected: /m/sales/leads

3. "Open briefing for contact-id-123"
   → Expected: /m/sales/briefing/contact-id-123

4. "Sales profile"
   → Expected: /m/sales/profile

5. Navigate to /m/sales/leads manually, then say: "Go to dashboard"
   → Expected: /m/sales/dashboard (context-aware!)
```

### Owner Role Tests:

```
1. "Go to owner dashboard"
   → Expected: /m/owner/dashboard

2. "Owner home"
   → Expected: /m/owner/dashboard
```

---

## ✅ Verification Checklist

### Console Checks:
- [ ] Only ONE "[VoiceConversation] Connected to voice agent" message
- [ ] NO "Session already started" warnings
- [ ] Each navigation shows: `Route requested: "..." → Navigating to: ...`
- [ ] No errors or warnings

### Browser Checks:
- [ ] URL changes instantly (no page reload)
- [ ] Route matches expected `/m/` path
- [ ] Page content loads correctly
- [ ] No visual glitches or flashes

### Agent Checks:
- [ ] Agent confirms navigation: "Navigated to..."
- [ ] Agent understands context: "You're on the tech dashboard"
- [ ] Agent can navigate multiple times without issues

---

## 🐛 Known Issues & Solutions

### Issue: "Cannot start session"
**Fix:** Refresh page, verify ElevenLabs agent ID is correct

### Issue: Navigation not working
**Check:**
1. Is VoiceConversationProvider in providers.tsx? ✓
2. Is VoiceNavigationBridge in layout.tsx? ✓
3. Is voice-agent-widget.tsx using useVoiceConversation()? ✓

### Issue: Wrong route opened
**Debug:** Check console log to see what pattern matched
**Example:** `Route requested: "show map" → Navigating to: /m/tech/map`
If wrong, add more specific pattern matching

---

## 🎯 Success Criteria

| Test | Pass Criteria |
|------|---------------|
| Tech Dashboard | Routes to `/m/tech/dashboard` |
| Sales Dashboard | Routes to `/m/sales/dashboard` |
| Context Awareness | "Dashboard" adapts to current role |
| ID Extraction | Job/contact IDs parsed from voice |
| Single Session | No duplicate connection warnings |
| Clean Console | Clear, helpful log messages |

---

## 📊 Test Results Template

```
Date: _____________
Tester: _____________

Tech Tests:
[ ] Tech dashboard - PASS / FAIL
[ ] Tech map - PASS / FAIL
[ ] Tech job with ID - PASS / FAIL
[ ] Tech profile - PASS / FAIL
[ ] Context-aware dashboard - PASS / FAIL

Sales Tests:
[ ] Sales dashboard - PASS / FAIL
[ ] Sales leads - PASS / FAIL
[ ] Sales briefing - PASS / FAIL
[ ] Sales profile - PASS / FAIL
[ ] Context-aware dashboard - PASS / FAIL

Owner Tests:
[ ] Owner dashboard - PASS / FAIL

System Tests:
[ ] Single session (no duplicates) - PASS / FAIL
[ ] Clean console (no errors) - PASS / FAIL
[ ] Fast navigation (no reload) - PASS / FAIL

Notes:
_______________________________________
_______________________________________
_______________________________________
```

---

## 🚀 Advanced Testing

### Natural Language Variations:
```
"Take me to the tech dashboard"
"I want to see the sales leads"
"Can you show me job number 789?"
"Open the tech map please"
"What page am I on right now?"
```

All of these should work thanks to smart aliasing!

---

## 📝 Reporting Issues

If you find a bug, please note:
1. Exact voice command used
2. Expected route
3. Actual route (if different)
4. Console output
5. Current route before command

**Example Bug Report:**
```
Command: "Show tech job 123"
Expected: /m/tech/job/123
Actual: /m/tech/dashboard
Console: [VoiceNavigation] Route requested: "show tech job 123" → Navigating to: /m/tech/dashboard
Current Route: /m/sales/leads
Error: Pattern matching failed, defaulted to dashboard
```
