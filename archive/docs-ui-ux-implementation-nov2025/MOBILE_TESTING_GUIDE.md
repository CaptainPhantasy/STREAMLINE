# Mobile Testing Guide

**How to Test Every Mobile Feature End-to-End**

---

## Prerequisites

1. Apply all fixes from `MOBILE_CRITICAL_FIXES.md`
2. Clear Next.js cache: `rm -rf .next`
3. Restart dev server: `PORT=3002 npm run dev`
4. Open in mobile device or Chrome DevTools mobile emulator

---

## Test 1: Tech Dashboard & Navigation

### Setup
1. Navigate to: `http://localhost:3002/m/tech/dashboard`
2. Login as a tech user

### Expected Results
```
✅ Header shows "My Jobs"
✅ Current date displayed
✅ VoiceButton visible (bottom-right, orange)
✅ Bottom navigation visible (4 items)
✅ If jobs exist: Current job card shows with orange accent
✅ Loading spinner uses orange (not blue)
✅ Job list displays with status badges
```

### Test Actions
1. **Click on a job card**
   - Should navigate to `/m/tech/job/[id]`
   - Should NOT go to `/tech/job/[id]` (404)

2. **Test bottom navigation**
   - Click Home icon → Stay on dashboard
   - Click Jobs icon → Stay on dashboard
   - Click Map icon → Navigate to map page
   - Click Profile icon → Navigate to profile page
   - Active tab should highlight in orange

3. **Test VoiceButton**
   - Click VoiceButton
   - Should turn red and pulse
   - Microphone permission should be requested
   - Click again to stop

**Pass Criteria:** All navigation works, no 404 errors, colors are orange

---

## Test 2: Tech Job - Complete 7 Gates

### Setup
1. Navigate to: `http://localhost:3002/m/tech/dashboard`
2. Click on a job to enter job detail page

### Gate 1: Arrival
```
Expected:
✅ Large MapPin icon (orange, not blue)
✅ "Confirm Arrival" heading
✅ Address displayed
✅ "I'VE ARRIVED" button (green)
✅ GPS location permissions requested
```

**Test Action:** Click "I'VE ARRIVED"
- Should log GPS coordinates
- Should advance to Gate 2

### Gate 2: Before Photos
```
Expected:
✅ Camera icon (amber)
✅ "Before Photos" heading
✅ "TAKE PHOTO" button
✅ Photo counter shows "0 photo(s) taken"
✅ "CONTINUE" button disabled
```

**Test Action:**
1. Click "TAKE PHOTO" → Camera opens
2. Take a photo → Preview appears as thumbnail
3. Click "CONTINUE" → Advances to Gate 3

### Gate 3: Work Complete
```
Expected:
✅ Green checkmark icon
✅ "Work Complete?" heading
✅ "WORK IS COMPLETE" button (green)
```

**Test Action:** Click button → Advances to Gate 4

### Gate 4: After Photos
```
Expected:
✅ Green camera icon
✅ "After Photos" heading
✅ Same photo upload flow as Gate 2
```

**Test Action:** Take after photo → Continue → Advances to Gate 5

### Gate 5: Satisfaction Rating
```
Expected:
✅ Yellow star icon
✅ "Customer Satisfaction" heading
✅ 5 rating buttons (1-3 red, 4-5 green)
✅ Warning text about ratings 1-3
```

**Test Actions:**
1. **Click rating 1-3** → Alert: "Manager has been notified" → Skip to Gate 7
2. **Click rating 4-5** → Advances to Gate 6

### Gate 6: Review Request
```
Expected:
✅ Purple gift icon
✅ "Leave a Review?" heading
✅ "YES - 5% OFF" button (green)
✅ "NO THANKS" button (gray)
```

**Test Action:** Click either button → Advances to Gate 7

### Gate 7: Signature
```
Expected:
✅ Pen icon (orange, not blue)
✅ "Customer Signature" heading
✅ White signature canvas
✅ "Clear Signature" button appears after signing
✅ "COMPLETE JOB" button
```

**Test Actions:**
1. Try to complete without signature → Alert: "Please provide a signature first"
2. Draw signature on canvas
3. Click "Clear Signature" → Canvas clears
4. Draw signature again
5. Click "COMPLETE JOB" → Shows success screen
6. Click "BACK TO DASHBOARD" → Returns to `/m/tech/dashboard` (not `/tech/dashboard`)

**Pass Criteria:** All 7 gates complete successfully, GPS logged, photos uploaded, signature captured

---

## Test 3: Tech Map

### Setup
1. Navigate to: `http://localhost:3002/m/tech/map`

### Expected Results
```
✅ "Job Locations" header
✅ Job count displayed
✅ List of jobs with addresses
✅ Status badges use orange for in_progress
✅ "Navigate" buttons for each job (orange)
```

### Test Actions
1. Click "Navigate" button
   - Should open Google Maps in new tab
   - Should have correct address in URL

**Pass Criteria:** Map opens correctly with address

---

## Test 4: Tech Profile

### Setup
1. Navigate to: `http://localhost:3002/m/tech/profile`

### Expected Results
```
✅ User initials in orange circle
✅ User name and email displayed
✅ Stats grid (Jobs Done, Avg Rating, On Time)
✅ Stats use orange accent color
✅ "App Settings" button
```

**Pass Criteria:** Profile displays correctly

---

## Test 5: Sales Dashboard

### Setup
1. Navigate to: `http://localhost:3002/m/sales/dashboard`
2. Login as a sales user

### Expected Results
```
✅ Greeting based on time of day
✅ Meeting count displayed
✅ VoiceButton present (bottom-right, orange)
✅ Bottom navigation (4 items)
✅ Next meeting card with orange accent
✅ Quick action buttons
```

### Test Actions
1. **Click "BRIEFING" on next meeting card**
   - Should navigate to `/m/sales/briefing/[contactId]` (NOT `/sales/briefing/...`)

2. **Click "START" on next meeting card**
   - Should navigate to `/m/sales/meeting/[id]` (NOT `/sales/meeting/...`)

3. **Click "NEW MEETING" button**
   - Should navigate to `/m/sales/meeting/new` (NOT `/sales/meeting/new`)

4. **Test bottom navigation**
   - All 4 tabs should work
   - Active tab highlights in orange

**Pass Criteria:** All links work correctly, no 404 errors

---

## Test 6: Sales Briefing

### Setup
1. Navigate to: `http://localhost:3002/m/sales/briefing/[contactId]`

### Expected Results
```
✅ Loading spinner is orange (not blue)
✅ Header gradient uses orange (not blue)
✅ Contact avatar uses orange background (not blue)
✅ Lifetime value shown with dollar icon
✅ "CALL" and "EMAIL" buttons
✅ Open issues section (if any)
✅ Personal notes section
✅ Suggested topics with purple gradient
✅ Recent work history
✅ Meeting history
✅ Contact details
✅ VoiceButton present
```

### Test Actions
1. **Click "CALL" button**
   - Should open phone dialer with tel: link

2. **Click "EMAIL" button**
   - Should open email client with mailto: link

3. **Check all colors**
   - No blue colors should be visible
   - All accents should be orange

**Pass Criteria:** All data displays, all buttons work, all colors are themed

---

## Test 7: Sales Meeting Recording

### Setup
1. Navigate to: `http://localhost:3002/m/sales/meeting/new`

### Expected Results
```
✅ "Meeting Mode" header
✅ Timer shows "0:00"
✅ Status indicator (gray when idle)
✅ Transcript area (empty, shows prompt)
✅ "START RECORDING" button (green)
```

### Test Actions

#### Start Recording
1. Click "START RECORDING"
2. Allow microphone access
3. Speak into microphone

**Expected:**
- Status indicator turns red and pulses
- Header shows "Recording"
- Timer starts counting
- Transcript appears in real-time
- Timer text is orange (not blue)

#### Pause/Resume
1. Click "PAUSE" button
2. Status turns yellow
3. Header shows "Paused"
4. Timer stops
5. Click "RESUME"
6. Recording continues

#### Stop and Save
1. Click "STOP" button
2. "SAVE & ANALYZE" button appears
3. Click "SAVE & ANALYZE"
4. Alert shows:
   - AI Analysis header
   - Summary
   - Action items
   - Sentiment
   - Next steps
5. Redirects to `/m/sales/dashboard` (NOT `/sales/dashboard`)

**Pass Criteria:** Recording works, transcription appears, AI analysis works, navigation correct

---

## Test 8: Sales Leads

### Setup
1. Navigate to: `http://localhost:3002/m/sales/leads`

### Expected Results
```
✅ "Sales Pipeline" header
✅ Lead count displayed
✅ Lead list with status badges
✅ Hot leads = red badge
✅ Warm leads = orange badge
✅ Cold leads = gray badge
✅ Lead values displayed in orange
```

**Pass Criteria:** Leads display correctly, colors are themed

---

## Test 9: Sales Profile

### Setup
1. Navigate to: `http://localhost:3002/m/sales/profile`

### Expected Results
```
✅ User initials in orange circle
✅ Stats: Deals Won, Revenue, Conversion Rate
✅ Stats use orange accent
✅ "App Settings" button
```

**Pass Criteria:** Profile displays correctly

---

## Test 10: Owner Dashboard

### Setup
1. Navigate to: `http://localhost:3002/m/owner/dashboard`
2. Login as owner

### Expected Results
```
✅ "Dashboard" header
✅ Alert section (if escalations exist)
✅ Revenue cards (Today, This Week)
✅ Stats cards with colored icons
✅ Jobs progress bar (blue-to-green gradient is OK)
✅ Team status list
✅ En route status uses orange (not blue)
✅ Quick action buttons
```

### Test Actions
1. Check loading spinner is orange (not blue)
2. Verify en route status badge is orange
3. Click "REPORTS" → Should go to `/m/owner/reports` (NOT `/owner/reports`)
4. Click "SCHEDULE" → Should go to `/m/owner/schedule` (NOT `/owner/schedule`)

**Pass Criteria:** All data displays, no blue badges, links correct

---

## Test 11: Office Dashboard

### Setup
1. Navigate to: `http://localhost:3002/m/office/dashboard`
2. Login as office user

### Expected Results
```
✅ "Office Dashboard" header
✅ Stats cards (Jobs Today, Avg Rating)
✅ Escalation alert (if any)
✅ Escalation queue
✅ Quick action buttons
```

### Test Actions
1. **If escalations exist:**
   - Click "Handle" button
   - Card expands
   - "Call" button visible (orange background, not blue)
   - Resolution notes textarea visible
   - Click "Call" → Opens phone dialer
   - Type resolution notes
   - Click "MARK RESOLVED" → Escalation disappears

2. **Check colors:**
   - Loading spinner is orange (not blue)
   - Handle button is orange (not blue)

**Pass Criteria:** Escalation handling works, all colors themed

---

## Test 12: Offline Mode

### Setup
1. Complete Test 2 (Tech Job) up to Gate 2
2. Open DevTools → Network tab
3. Enable "Offline" mode

### Test Actions
1. **Take a photo** → Should still work (saved locally)
2. **Complete Gate 2** → Should still advance
3. **Continue through gates** → Should continue working
4. **Complete signature** → Should accept signature
5. **Check browser console** → Should show "pending sync" messages

### Re-enable Network
1. Disable "Offline" mode
2. Wait 5-10 seconds
3. Check browser console → Should show "sync complete"
4. Verify job status updated in database

**Pass Criteria:** All gates work offline, data syncs when online

---

## Test 13: GPS Tracking

### Setup
1. Navigate to tech job page
2. Allow location permissions

### Test Actions
1. **Click "I'VE ARRIVED"**
   - Browser requests location
   - GPS coordinates logged
   - Check browser console for GPS log

2. **Complete all gates to signature**
3. **Click "COMPLETE JOB"**
   - Departure GPS logged
   - Check console for departure log

**Pass Criteria:** GPS coordinates logged at arrival and departure

---

## Test 14: Voice Commands

### Setup
1. Navigate to any mobile page
2. Click VoiceButton

### Test Actions
1. VoiceButton turns red and pulses
2. Microphone permission requested
3. Speak a command (e.g., "show my jobs")
4. Voice recognition transcribes speech
5. Check console for voice input logs

**Pass Criteria:** Voice recognition works, commands logged

---

## Test 15: PWA Installation

### Setup
1. Open in Chrome on mobile or desktop
2. Navigate to `http://localhost:3002/m/tech/dashboard`

### Test Actions
1. **Chrome should show "Install" prompt** in address bar
2. Click "Install"
3. App installs as standalone app
4. Open installed app
5. No browser chrome visible
6. Status bar matches theme color (orange)

**Pass Criteria:** App installs and runs as PWA

---

## Test 16: Push Notifications

### Setup
1. Open mobile app
2. Allow notification permissions

### Test Actions
1. Create a test notification (via backend)
2. Notification should appear
3. Click notification
4. App opens to correct page

**Pass Criteria:** Notifications work and navigate correctly

---

## Test 17: Theme Consistency Check

### Visual Inspection
Go through every page and verify:

```
❌ NO blue colors anywhere (except intentional progress bars)
✅ All accent colors are orange (#F97316)
✅ All loading spinners are orange
✅ All buttons use theme colors
✅ All status badges use theme colors
✅ All active navigation uses orange
✅ All focused inputs use orange
```

### Pages to Check
- [ ] Tech Dashboard
- [ ] Tech Job Detail
- [ ] Tech Map
- [ ] Tech Profile
- [ ] Sales Dashboard
- [ ] Sales Briefing
- [ ] Sales Meeting
- [ ] Sales Leads
- [ ] Sales Profile
- [ ] Owner Dashboard
- [ ] Office Dashboard

**Pass Criteria:** ZERO hardcoded blue colors visible

---

## Test 18: Cross-Device Testing

### Devices to Test
1. **iPhone (Safari)**
   - Test all touch interactions
   - Verify 44px minimum touch targets
   - Test photo upload from camera
   - Test signature canvas with touch

2. **Android (Chrome)**
   - Test all touch interactions
   - Test voice recording
   - Test PWA installation

3. **iPad (Safari)**
   - Test landscape mode
   - Verify bottom nav stays visible

4. **Desktop (Chrome Mobile Emulator)**
   - Test all workflows
   - Use device toolbar to test different screen sizes

**Pass Criteria:** App works on all devices

---

## Test 19: Performance Testing

### Metrics to Check
1. **Page Load Time**
   - First page load: < 2 seconds
   - Subsequent pages: < 1 second

2. **Offline Cache**
   - Pages load instantly when offline

3. **Photo Upload**
   - Upload completes within 3 seconds

4. **Voice Recording**
   - No lag in transcription

**Pass Criteria:** All performance metrics met

---

## Final Checklist

### Before Testing
- [ ] Applied all fixes from `MOBILE_CRITICAL_FIXES.md`
- [ ] Created missing API routes
- [ ] Cleared Next.js cache
- [ ] Restarted dev server

### Tech Mobile
- [ ] Dashboard navigation works
- [ ] Complete 7-gate workflow
- [ ] Map navigation works
- [ ] Profile displays stats
- [ ] Offline mode works
- [ ] GPS tracking works

### Sales Mobile
- [ ] Dashboard navigation works
- [ ] Briefing displays all data
- [ ] Meeting recording works
- [ ] Transcription appears in real-time
- [ ] AI analysis returns results
- [ ] Leads page displays
- [ ] Profile displays stats

### Owner Mobile
- [ ] Dashboard shows all stats
- [ ] Team status updates
- [ ] All links work

### Office Mobile
- [ ] Escalation queue works
- [ ] Call buttons work
- [ ] Resolution notes save

### Components
- [ ] BigButton works in all variants
- [ ] VoiceButton position correct
- [ ] Bottom navigation highlights active tab

### Theme
- [ ] Zero blue colors visible
- [ ] All orange accents consistent
- [ ] Loading spinners themed

### Offline
- [ ] Service worker registered
- [ ] Gates save offline
- [ ] Data syncs when online

### PWA
- [ ] App installs as PWA
- [ ] Icons display correctly
- [ ] Standalone mode works

---

## Bug Reporting Template

If you find issues, report them using this format:

```markdown
## Bug: [Short Description]

**Page:** /m/tech/dashboard
**Device:** iPhone 14, iOS 17, Safari
**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Navigate to X
2. Click Y
3. Observe Z

**Expected:**
[What should happen]

**Actual:**
[What actually happens]

**Screenshots:**
[If applicable]

**Console Errors:**
[If applicable]
```

---

## Success Criteria

All tests pass when:
- ✅ All 18 tests complete successfully
- ✅ Zero 404 errors
- ✅ Zero hardcoded blue colors
- ✅ All workflows complete end-to-end
- ✅ Offline mode works
- ✅ GPS tracking works
- ✅ PWA installs correctly
- ✅ Works on all devices

**Ready for Production:** When all checkboxes are ticked ✅

---

## Related Documents

- 📋 Full Report: `MOBILE_VERIFICATION_COMPLETE.md`
- 🔧 Fix Instructions: `MOBILE_CRITICAL_FIXES.md`
- 📊 Summary: `MOBILE_VERIFICATION_SUMMARY.md`
- 🧪 This Guide: `MOBILE_TESTING_GUIDE.md`
