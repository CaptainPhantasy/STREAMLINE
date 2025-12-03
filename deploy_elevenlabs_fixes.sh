#!/bin/bash

# ElevenLabs Voice AI - Critical Fixes Deployment Script
# This script deploys all necessary fixes to resolve production issues

echo "🚀 Deploying ElevenLabs Voice AI Critical Fixes..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "supabase/functions/mcp-server/index.ts" ]; then
    echo -e "${RED}❌ ERROR: Must run from CRM-AI-PRO root directory${NC}"
    exit 1
fi

# Step 1: Backup current files
echo -e "${YELLOW}📋 Step 1: Creating backups...${NC}"
cp supabase/functions/mcp-server/index.ts supabase/functions/mcp-server/index.ts.backup
cp SingleSources/VOICE_AGENT_README.md SingleSources/VOICE_AGENT_README.md.backup
echo -e "${GREEN}✅ Backups created${NC}"

# Step 2: Apply MCP Server Fixes
echo -e "${YELLOW}📋 Step 2: Applying MCP Server fixes...${NC}"

# Check if fixes are already applied
if grep -q "success: false" supabase/functions/mcp-server/index.ts; then
    echo -e "${GREEN}✅ MCP Server fixes already applied${NC}"
else
    # Apply create_contact fix
    sed -i.bak 's/return { error: `Failed to create contact: ${error.message}` }/return {\n    success: false,\n    error: `Failed to create contact: ${error.message}`,\n    contactId: null,\n    contact: null\n  }/g' supabase/functions/mcp-server/index.ts

    # Apply create_job fix (similar pattern)
    sed -i 's/return { error: `Failed to create job: ${error.message}` }/return {\n    success: false,\n    error: `Failed to create job: ${error.message}`,\n    jobId: null,\n    job: null\n  }/g' supabase/functions/mcp-server/index.ts

    # Add dispatch to navigation enum
    sed -i "s/'dashboard'\]/'dashboard', 'dispatch'\]/g" supabase/functions/mcp-server/index.ts

    # Update navigate description to include dispatch
    sed -i 's/Analytics, Finance, Settings, etc\./Analytics, Finance, Settings, Dispatch, etc./g' supabase/functions/mcp-server/index.ts
    sed -i 's/Take me to the inbox", "Open analytics"/Take me to the inbox", "Open dispatch map", "Navigate to analytics"/g' supabase/functions/mcp-server/index.ts

    echo -e "${GREEN}✅ MCP Server fixes applied${NC}"
fi

# Step 3: Add Pacing Protocols to Voice Agent README
echo -e "${YELLOW}📋 Step 3: Adding Pacing Protocols...${NC}"

if grep -q "PACING PROTOCOLS" SingleSources/VOICE_AGENT_README.md; then
    echo -e "${GREEN}✅ Pacing protocols already exist${NC}"
else
    # Add pacing protocols after "Natural Interaction" section
    PACING_PROTOCOLS='

## 🚨 PACING PROTOCOLS (CRITICAL FOR USER EXPERIENCE)

### Post-Action Latency Rules:
1. **After navigating:** Wait 2 seconds before speaking
   - "Navigate to jobs" → [2-second pause] → "I'\''ve taken you to the jobs page"

2. **After database writes:** Wait 1.5 seconds
   - Create/update operations need processing time

3. **Between tool calls:** Minimum 1 second pause
   - Prevents overwhelming the user

4. **After multi-step processes:** Confirm each step
   - "I'\''ve created the contact. Shall I create the job now?"

### Speech Pacing Settings:
- Speak at 0.9x speed (slightly slower than normal)
- Add 200ms pauses after commas
- Add 500ms pauses after periods
- Add 1-second pause when switching topics

### User Experience Rules:
- NEVER navigate through more than 2 pages without user confirmation
- ALWAYS announce what you'\''re about to do before doing it
- WAIT for user acknowledgment after major actions
'

    # Insert after "Natural Interaction" line
    sed -i "/Natural Interaction/a\\${PACING_PROTOCOLS}" SingleSources/VOICE_AGENT_README.md

    echo -e "${GREEN}✅ Pacing protocols added${NC}"
fi

# Step 4: Add Contact-Job Creation Protocol
echo -e "${YELLOW}📋 Step 4: Adding Contact-Job Creation Protocol...${NC}"

if grep -q "CONTACT-JOB CREATION PROTOCOL" SingleSources/VOICE_AGENT_README.md; then
    echo -e "${GREEN}✅ Contact-Job protocol already exists${NC}"
else
    # Add the protocol after "Best Practices" section
    CONTACT_PROTOCOL='

## 🚨 CONTACT-JOB CREATION PROTOCOL (CRITICAL)

### REQUIRED SEQUENCE - NO EXCEPTIONS:
1. **ALWAYS** search for existing contacts first
2. **ONLY** use valid UUIDs for job creation
3. **NEVER** assume contact exists without verification

### CORRECT WORKFLOW:
```
User: "Create a job for Sarah Johnson"
Agent:
1. search_contacts("Sarah Johnson")
2. If found → create_job(contactId: "returned-uuid", ...)
3. If not found → create_contact(...) → get UUID → create_job(contactId: "new-uuid", ...)
```

### FORBIDDEN PATTERNS:
❌ NEVER: create_job(contactName: "Sarah Johnson", ...)
❌ NEVER: Use names where UUIDs are required
❌ NEVER: Skip contact search for job creation

### VALIDATION CHECKLIST:
- [ ] Contact UUID is valid (not null/undefined)
- [ ] Contact actually exists in database
- [ ] Job creation uses contactId (not contactName)
- [ ] Error handling verifies success with returned ID
'

    sed -i "/Best Practices:/a\\${CONTACT_PROTOCOL}" SingleSources/VOICE_AGENT_README.md

    echo -e "${GREEN}✅ Contact-Job protocol added${NC}"
fi

# Step 5: Deploy to Supabase
echo -e "${YELLOW}📋 Step 5: Deploying to Supabase...${NC}"
read -p "Do you want to deploy MCP server changes now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd supabase/functions/mcp-server
    npx supabase functions deploy mcp-server --no-verify-jwt
    cd ../../..

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MCP Server deployed successfully${NC}"
    else
        echo -e "${RED}❌ MCP Server deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping deployment. Run manually: cd supabase/functions/mcp-server && npx supabase functions deploy mcp-server${NC}"
fi

# Step 6: Instructions for ElevenLabs
echo -e "${YELLOW}📋 Step 6: ElevenLabs Agent Update Required${NC}"
echo "🔧 MANUAL STEP REQUIRED:"
echo "1. Go to ElevenLabs Dashboard"
echo "2. Select Agent: agent_6501katrbe2re0c834kfes3hvk2d"
echo "3. Update System Prompt with sections from: SingleSources/VOICE_AGENT_README.md"
echo "   - PACING PROTOCOLS"
echo "   - CONTACT-JOB CREATION PROTOCOL"
echo "4. Save and test"

# Step 7: Verification
echo -e "${YELLOW}📋 Step 7: Run verification tests${NC}"
echo "Run: node test_elevenlabs_fixes.js"
echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}✅ Deployment process completed!${NC}"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Update ElevenLabs agent system prompt (see above)"
echo "2. Run tests: node test_elevenlabs_fixes.js"
echo "3. Monitor production for improvements"
echo ""
echo "📁 Files modified:"
echo "   - supabase/functions/mcp-server/index.ts"
echo "   - SingleSources/VOICE_AGENT_README.md"
echo ""
echo "💾 Backups created:"
echo "   - supabase/functions/mcp-server/index.ts.backup"
echo "   - SingleSources/VOICE_AGENT_README.md.backup"
echo ""
echo "🔍 To rollback:"
echo "   cp supabase/functions/mcp-server/index.ts.backup supabase/functions/mcp-server/index.ts"
echo "   cp SingleSources/VOICE_AGENT_README.md.backup SingleSources/VOICE_AGENT_README.md"