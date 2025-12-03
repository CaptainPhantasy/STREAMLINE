# CRM-AI Pro Critical Fixes Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Preparation
- [ ] Backup current database
- [ ] Backup MCP server code
- [ ] Document current state for rollback
- [ ] Schedule maintenance window (if needed)

### 2. Verify Prerequisites
- [ ] Database access credentials ready
- [ ] MCP server deployment permissions
- [ ] Supabase CLI installed and authenticated
- [ ] Git repository clean (no uncommitted changes)

## Deployment Steps

### 1. Database Migration (Tags & Notes)
```bash
# 1. Navigate to project root
cd /Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO

# 2. Verify migration file exists
ls supabase/migrations/20251128_add_tags_and_notes.sql

# 3. Run migration (choose ONE method):
# Method A: Supabase CLI
supabase db push

# Method B: Manual SQL
# Copy contents to Supabase SQL Editor and run

# Method C: Migration runner
npm run migrate:up 20251128_add_tags_and_notes
```

### 2. MCP Server Updates

#### Backup Current Version
```bash
cd mcp-server
cp index.ts index.ts.backup.$(date +%Y%m%d)
```

#### Apply Technician Search Fix
```bash
# Apply patch
patch -p1 < fixes/technician-search.patch

# Verify no errors
echo $?
# Should return 0
```

#### Apply Tags/Notes Tools
```bash
# Apply patch
patch -p1 < fixes/add-tags-notes-tools.patch

# Verify no errors
echo $?
# Should return 0
```

#### Restart MCP Server
```bash
# Stop current server
pkill -f "node.*mcp-server"

# Start new server
npm run dev
```

### 3. Agent Prompt Updates

These are reference documents - your AI team needs to:
1. Review all prompt files in `prompts/fixes/`
2. Apply changes to your AI system
3. Test agent behavior with new prompts

### 4. Verify Edge Functions
```bash
# Check all functions are deployed
supabase functions list

# Should show 12 functions with ACTIVE status
```

## Post-Deployment Verification

### 1. Database Verification
```sql
-- Connect to your database and run:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('tags', 'contact_tag_assignments', 'notes', 'contact_notes', 'job_notes');

-- Should return 5 rows
```

### 2. MCP Server Verification
```bash
# Test technician search
# Search for "Jake" - should only return technicians

# Test new tools exist
# Check for: add_tag_to_contact, add_note_to_contact, add_note_to_job, remove_tag_from_contact
```

### 3. End-to-End Testing
Test these complete workflows:

#### Tag System Test:
1. Create a contact
2. Add a tag → Should succeed
3. Assign tag to contact → Should succeed
4. View contact tags → Should show tag

#### Notes System Test:
1. Add note to contact → Should succeed
2. Add note to job → Should succeed
3. View notes → Should display correctly

#### Technician Assignment Test:
1. Search for "Jake technician" → Should find Jake
2. Search for non-existent tech → Should offer alternatives
3. Should not loop on failed searches

#### Error Handling Test:
1. Try to use duplicate email → Should show clear error
2. Try invalid email format → Should be rejected
3. Trigger database error → Should get specific message

#### Conversation Flow Test:
1. Pause during conversation → Should wait 45s before follow-up
2. Should NOT say "Are you still there?"
3. Should not repeat questions

## Rollback Procedures

### If Database Migration Fails
```bash
# Create rollback file
cat > rollback.sql << 'EOF'
DROP TABLE IF EXISTS job_notes;
DROP TABLE IF EXISTS contact_notes;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS contact_tag_assignments;
DROP TABLE IF EXISTS tags;
EOF

# Run rollback
supabase db push rollback.sql
```

### If MCP Server Fails
```bash
cd mcp-server
# Restore backup
cp index.ts.backup.$(date +%Y%m%d) index.ts

# Reverse patches
patch -p1 -R < fixes/technician-search.patch
patch -p1 -R < fixes/add-tags-notes-tools.patch

# Restart server
npm run dev
```

## Monitoring

After deployment, monitor:
- MCP server logs for errors
- Database query performance
- Agent conversation quality
- User feedback on error messages

## Documentation Updates

- [ ] Update API documentation with new tools
- [ ] Update database schema documentation
- [ ] Create user guide for new features
- [ ] Document any limitations or known issues

## Success Criteria

✅ All 28 Jira issues resolved:
- [ ] Tags can be created and assigned
- [ ] Notes can be added to contacts/jobs
- [ ] Technicians can be found by name
- [ ] No repetitive agent questions
- [ ] Clear error messages
- [ ] No duplicate emails created
- [ ] Smooth conversation flow

## Contact Information

For deployment issues:
- Database: DBA Team
- MCP Server: Backend Team
- AI Prompts: ML Team
- General: Create Jira ticket

## Final Sign-off

Deployed by: ____________________ Date: ___________
Verified by: ____________________ Date: ___________
Approved by: ____________________ Date: ___________