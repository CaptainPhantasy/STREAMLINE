# E2E API Endpoint Test Results & Playwright Test Plan

## Current Test Results

### ✅ Working
1. **Database Connection** - Direct Supabase access works (279ms)
2. **Direct Database Operations** - Can create accounts, contacts via direct DB access (278ms)

### ❌ Not Working (500 Errors)
All API endpoints are returning HTTP 500:
- `/api/seed` - POST
- `/api/contacts` - GET, POST
- `/api/jobs` - GET, POST
- `/api/ai/draft` - POST
- `/api/send-message` - POST
- `/api/webhooks/elevenlabs` - POST

**Root Cause**: Missing `.next/fallback-build-manifest.json` - Next.js build issue

## Endpoint Inventory

### Public/Service Role Endpoints
- `POST /api/seed` - Seeds test data (uses service role key)

### Authenticated Endpoints (Require User Session)
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get contact by ID
- `PATCH /api/contacts/[id]` - Update contact
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/[id]` - Get job by ID
- `PATCH /api/jobs/[id]/status` - Update job status
- `PATCH /api/jobs/[id]/assign` - Assign technician
- `POST /api/jobs/[id]/upload-photo` - Upload job photo
- `GET /api/tech/jobs` - Get tech's assigned jobs
- `PATCH /api/tech/jobs/[id]/status` - Update job status (tech)
- `POST /api/ai/draft` - Generate AI draft reply
- `POST /api/send-message` - Send message/email

### Webhook Endpoints
- `POST /api/webhooks/elevenlabs` - Voice command webhook

## Playwright Test Plan

### Phase 1: Basic Navigation & UI Tests
1. **Homepage Redirect**
   - Visit `/` → Should redirect to `/inbox`
   
2. **Sidebar Navigation**
   - Click "Inbox" → Navigate to `/inbox`
   - Click "Jobs" → Navigate to `/jobs`
   - Click "Contacts" → Navigate to `/contacts`
   - Click "Tech View" → Navigate to `/tech/dashboard`

3. **Page Load Tests**
   - Each page loads without errors
   - Sidebar is visible and functional
   - Content area displays correctly

### Phase 2: Inbox/Conversation Tests
1. **Empty State**
   - Visit `/inbox` with no conversations
   - Verify empty state message displays
   
2. **Conversation List** (after seeding)
   - Seed database via API
   - Verify conversations appear in sidebar
   - Click conversation → Message thread opens
   
3. **Message Thread**
   - Select conversation
   - Verify messages display
   - Verify message input field exists
   - Type message and click send
   - Verify message appears in thread

4. **AI Draft Feature**
   - Select conversation with messages
   - Click "Auto-Draft" button
   - Wait for AI response
   - Verify draft appears in input field
   - Verify draft is editable

### Phase 3: Jobs Management Tests
1. **Jobs List**
   - Visit `/jobs`
   - Verify jobs display (if any exist)
   - Verify stats cards show correct data
   
2. **Seed Test Data**
   - Click "Seed Test Data" button
   - Confirm dialog
   - Verify success message
   - Verify jobs appear in list
   
3. **Create Job**
   - Click "New Job" button
   - Verify dialog opens
   - Fill out form:
     - Select contact from dropdown
     - Enter description
     - Set scheduled start/end (optional)
     - Select status
   - Click "Create Job"
   - Verify success message
   - Verify job appears in list
   
4. **View Job**
   - Click "View" on a job
   - Verify job details display (or modal opens)

### Phase 4: Contacts Management Tests
1. **Contacts List**
   - Visit `/contacts`
   - Verify contacts display (if any exist)
   - Verify stats cards
   
2. **Search Contacts**
   - Type in search box
   - Verify filtered results appear
   - Clear search → All contacts show
   
3. **Add Contact** (if implemented)
   - Click "Add Contact" button
   - Fill out form
   - Submit
   - Verify contact appears in list
   
4. **View Contact**
   - Click "View" on a contact
   - Verify contact details (or alert if not implemented)
   
5. **Message Contact**
   - Click "Message" on a contact
   - Verify navigates to inbox with conversation (or alert)

### Phase 5: Tech Dashboard Tests
1. **Tech Dashboard**
   - Visit `/tech/dashboard`
   - Verify assigned jobs display
   - Verify job cards show correct information
   
2. **Update Job Status**
   - Click on a job
   - Update status dropdown
   - Verify status updates
   
3. **Upload Photo**
   - Click "Add Photo" button
   - Select image file
   - Verify upload succeeds
   - Verify photo appears

### Phase 6: Error Handling Tests
1. **Network Errors**
   - Disconnect network
   - Try to create job → Verify error message
   
2. **Validation Errors**
   - Try to create job without required fields
   - Verify validation messages
   
3. **Empty States**
   - Test all pages with no data
   - Verify appropriate empty states

### Phase 7: Real User Journey Tests
1. **Complete Workflow: New Lead to Completed Job**
   - Start with empty database
   - Seed test data
   - View inbox → See new conversation
   - Open conversation → Read customer message
   - Use AI draft → Generate reply
   - Send message to customer
   - Create job from contact
   - Assign technician
   - Update job status through workflow
   - Mark job as completed
   - Verify all data persists

2. **Multi-Page Workflow**
   - Start in inbox
   - Navigate to contacts
   - Search for contact
   - Message contact → Returns to inbox
   - Create job from jobs page
   - View job details
   - Navigate to tech dashboard
   - Update job status

## Test Implementation Strategy

### 1. Setup
```typescript
// tests/setup.ts
- Start dev server
- Seed database before each test suite
- Clean up after tests
```

### 2. Page Object Model
```typescript
// tests/pages/InboxPage.ts
// tests/pages/JobsPage.ts
// tests/pages/ContactsPage.ts
// tests/pages/TechDashboardPage.ts
```

### 3. Test Data Management
```typescript
// tests/fixtures/test-data.ts
- Test contacts
- Test jobs
- Test conversations
```

### 4. Authentication Mock
```typescript
// tests/auth.ts
- Mock Supabase auth
- Set up test user session
```

## Next Steps

1. **Fix API Route Issues**
   - Resolve build manifest error
   - Test all endpoints return proper responses
   
2. **Implement Authentication in Tests**
   - Set up test user
   - Mock auth for Playwright
   
3. **Create Playwright Test Suite**
   - Install Playwright
   - Set up test configuration
   - Implement page objects
   - Write tests following plan above

4. **CI/CD Integration**
   - Run tests on every commit
   - Generate test reports

## Current Status

- ✅ Database connectivity confirmed
- ✅ Direct database operations work
- ❌ API endpoints need build fix
- ⏳ Playwright tests pending API fix

