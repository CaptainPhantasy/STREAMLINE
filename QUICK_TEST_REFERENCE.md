# Quick Test Reference

## 🎯 4 Critical Tests - Speak These Exact Phrases

### 1. FAKE SUCCESS BUG
- `"Create a new contact with email invalid-email-no-at-symbol"`
  - Should get: "The email appears to be invalid"
  - ❌ BAD: "Contact created successfully"

- `"Create a new contact"` (no details)
  - Should get: "I need their name and email"

### 2. MACHINE GUN NAVIGATION
- `"Take me to jobs, then contacts, then analytics"`
  - Should pause 2-3 seconds between each
  - Should ask "Ready to continue?" between pages
  - ❌ BAD: Rapid-fire navigation

### 3. DISPATCH MAP
- `"Show me the dispatch map"` or `"Go to dispatch"`
  - Should navigate successfully
  - ❌ BAD: "I don't know how to navigate there"

### 4. GHOST CONTACT CREATION
- **Have "Test Customer" in CRM first**
- `"Create a job for Test Customer to fix a leak"`
  - Should say: "I found Test Customer..."
  - Should search first, then create job

- `"Create a job for Jane Doe for plumbing"` (Jane doesn't exist)
  - Should ask: "What's Jane's phone number?"
  - Should create contact, then job

---

## ✅ SUCCESS INDICATORS
- Clear error messages for invalid data
- 2-3 second pauses between navigations
- Dispatch map navigation works
- Agent searches before creating jobs

## ❌ FAILURE INDICATORS
- Claims success with invalid data
- Rapid navigation without pausing
- Can't find dispatch page
- Creates jobs without searching

---

## Timing Guide
- Multiple navigations: Should take 10-15+ seconds
- Single navigation: 2-3 second pause before speaking
- Contact search: Should mention searching

---

## Record These
1. Did agent pause between pages? Y/N
2. Did agent validate data? Y/N
3. Did dispatch work? Y/N
4. Did agent search first? Y/N