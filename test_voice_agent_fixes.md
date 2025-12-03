# CRM AI Pro - Voice Agent Test Script

**Purpose:** Verify all 4 critical fixes are working in production
**Date:** November 29, 2025
**Tester:** Douglas Talley

## 🎯 Test Overview

This script tests the 4 critical issues that were fixed:
1. **Fake Success Bug** - Error handling now returns clear success/failure
2. **Machine Gun Navigation** - Agent now pauses between actions
3. **Dispatch Map** - Agent can navigate to dispatch page
4. **Ghost Contact Creation** - Agent follows search-first workflow

---

## 📋 Test Instructions

1. **Open ElevenLabs Voice Agent**
   - Go to: https://elevenlabs.io/app/agents/agent_6501katrbe2re0c834kfes3hvk2d
   - Start a voice session

2. **Test Each Scenario Below**
   - Speak the exact prompts provided
   - Record/take notes of agent responses
   - Compare against expected results

3. **Document Findings**
   - Mark each test as ✅ PASS or ❌ FAIL
   - Note any discrepancies
   - Record actual agent responses

---

## 🧪 TEST SCENARIOS

### TEST 1: Fake Success Bug - Error Handling

**Objective:** Verify agent returns clear error messages instead of fake success

#### 1A - Invalid Email Test
```
PROMPT TO SAY:
"Create a new contact with email invalid-email-no-at-symbol"

EXPECTED BEHAVIOR:
❌ OLD (Buggy): "I've created the contact successfully" (lies)
✅ NEW (Fixed): "I couldn't create the contact. The email address appears to be invalid. Please provide a valid email."

RESPONSE TO RECORD:
Actual agent response: _____________________________________________________
```

#### 1B - Missing Required Fields Test
```
PROMPT TO SAY:
"Create a new contact" (without providing any details)

EXPECTED BEHAVIOR:
❌ OLD: Might create empty contact or claim success
✅ NEW: "I need some information to create the contact. What's their first name and email address?"

RESPONSE TO RECORD:
Actual agent response: _____________________________________________________
```

#### 1C - Nonexistent Job Update Test
```
PROMPT TO SAY:
"Update job 999999 to status completed"

EXPECTED BEHAVIOR:
✅ Should return: "I couldn't find job 999999. Please check the job ID and try again."

RESPONSE TO RECORD:
Actual agent response: _____________________________________________________
```

---

### TEST 2: Machine Gun Navigation - Pacing

**Objective:** Verify agent pauses between navigations

#### 2A - Multiple Navigation Test
```
PROMPT TO SAY:
"Take me to jobs, then contacts, then analytics"

EXPECTED BEHAVIOR:
❌ OLD: Rapid-fire navigation through all 3 pages without pausing
✅ NEW:
1. Navigates to jobs
2. [2-3 second pause]
3. "I've taken you to the jobs page..."
4. "Ready to continue?" or "Should I go to contacts next?"
5. Waits for confirmation
6. Only then navigates to contacts

RESPONSE TO RECORD:
Did agent pause between pages? ____ Yes / ____ No
Did agent wait for confirmation? ____ Yes / ____ No
```

#### 2B - Speed Check
```
PROMPT TO SAY:
"Show me the dashboard, then settings, then inbox" (speak normally)

EXPECTED BEHAVIOR:
✅ Should take at least 10-15 seconds total due to pauses
❌ If completed in under 5 seconds, pacing is broken

TIMING TO RECORD:
Time taken: _________ seconds
```

---

### TEST 3: Dispatch Map Navigation

**Objective:** Verify agent can navigate to dispatch map

#### 3A - Direct Dispatch Test
```
PROMPT TO SAY:
"Show me the dispatch map" or "Go to dispatch"

EXPECTED BEHAVIOR:
❌ OLD: "I don't know how to navigate to dispatch" or navigates to wrong page
✅ NEW: Successfully navigates to dispatch page

RESPONSE TO RECORD:
Navigation successful? ____ Yes / ____ No
Page navigated to: _________________________________________________
```

#### 3B - Alternative Phrasing Test
```
PROMPT TO SAY:
"Take me to the dispatch map" or "Open dispatch"

EXPECTED BEHAVIOR:
✅ Should understand various dispatch-related terms

RESPONSE TO RECORD:
Navigation successful? ____ Yes / ____ No
```

---

### TEST 4: Ghost Contact Creation - Search-First Workflow

**Objective:** Verify agent searches for contacts before creating jobs

#### 4A - Existing Customer Test
```
FIRST: Ensure you have a test contact in your CRM (e.g., "Test Customer")

PROMPT TO SAY:
"Create a job for Test Customer to fix a leaky faucet"

EXPECTED BEHAVIOR:
✅ CORRECT FLOW:
1. Agent searches for "Test Customer"
2. Finds existing contact
3. Creates job linked to found contact ID
4. Says: "I found Test Customer in your contacts and created a job..."

❌ WRONG FLOW:
1. Agent immediately creates job with contact name
2. Doesn't verify contact exists

RESPONSE TO RECORD:
Did agent search first? ____ Yes / ____ No
Did agent mention finding contact? ____ Yes / ____ No
```

#### 4B - New Customer Test
```
PROMPT TO SAY:
"Create a job for Jane Doe for plumbing repair" (assuming Jane doesn't exist)

EXPECTED BEHAVIOR:
✅ CORRECT FLOW:
1. Agent searches for "Jane Doe"
2. Doesn't find contact
3. Asks: "I don't see Jane Doe in your contacts. What's her phone number?"
4. Creates contact first, then job
5. Links job to new contact ID

❌ WRONG FLOW:
1. Creates job with "Jane Doe" as name without verifying existence

RESPONSE TO RECORD:
Did agent search for Jane? ____ Yes / ____ No
Did agent ask for contact details? ____ Yes / ____ No
```

#### 4C - UUID Verification Test
```
(This tests the internal logic - observe agent's behavior)

EXPECTED BEHAVIOR:
✅ Agent should never say "contactName" when creating jobs
✅ Agent should use "contactId" internally

RESPONSE TO RECORD:
Agent terminology used: contactName / contactId / didn't specify
```

---

## 🔍 Additional Tests (Optional)

### Error Response Structure Test
```
PROMPT TO SAY:
"Find contact xyz-nonexistent"

EXPECTED RESPONSE FORMAT:
✅ Should return JSON-like structure in response:
{ success: false, error: "message", contactId: null }
```

### Memory Test
```
PROMPT TO SAY:
"Remember that we're testing the system" (then disconnect and reconnect)

EXPECTED BEHAVIOR:
✅ Agent should remember context on reconnection
```

---

## 📊 TEST RESULTS SUMMARY

| Test | Expected | Actual | Status |
|------|----------|---------|---------|
| 1A - Invalid Email | Clear error | | |
| 1B - Missing Fields | Ask for info | | |
| 1C - Nonexistent Job | Error message | | |
| 2A - Navigation Pauses | 2-3 sec pauses | | |
| 2B - Speed Check | 10-15 seconds | | |
| 3A - Dispatch Map | Navigate successfully | | |
| 3B - Dispatch Terms | Understand variants | | |
| 4A - Existing Customer | Search-first | | |
| 4B - New Customer | Create then job | | |
| 4C - UUID Usage | Uses contactId | | |

---

## 🚨 FAILURE INDICATORS

If any of these occur, the fix didn't work:

1. **Fake Success Bug Still Present:**
   - Agent claims success for invalid operations
   - No error messages for failures

2. **Machine Gun Navigation Still Present:**
   - Multiple rapid navigations without pausing
   - No confirmation requests

3. **Dispatch Map Still Broken:**
   - "I don't know how to navigate there"
   - Wrong page navigation

4. **Ghost Contact Creation Still Present:**
   - Creates jobs without searching first
   - Uses names instead of IDs internally

---

## 📝 Notes Section

```
General observations:
______________________________________________________________________________
______________________________________________________________________________

Issues found:
______________________________________________________________________________
______________________________________________________________________________

Unexpected behavior:
______________________________________________________________________________
______________________________________________________________________________
```

---

## 🎯 Next Steps

After testing:

1. **If ALL TESTS PASS:** ✅ Fixes are working correctly!
2. **If ANY TEST FAILS:**
   - Note which test failed
   - Record actual behavior
   - We'll adjust the implementation
   - Re-deploy and re-test

---

**Testing completed by:** _________________________
**Date:** _________________________
**Time:** _________________________