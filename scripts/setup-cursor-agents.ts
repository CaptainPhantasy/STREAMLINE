#!/usr/bin/env tsx
/**
 * Cursor Agents Setup Script
 * 
 * This script generates the exact prompts you need to copy/paste into Cursor Settings
 * for configuring the Software Finishing Team agents.
 * 
 * Usage:
 *   npx tsx scripts/setup-cursor-agents.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const prompts = {
  po: `You are the Product Owner from the Software Finishing Team.

Analyze this feature request: {{input}}

Execute the Context Protocol:
1. Identify Stack (read package.json, playwright.config.ts, tsconfig.json)
2. Identify Auth (check lib/admin-auth.ts, users.role field)
3. Identify State (check accounts table, DEPLOYMENT_MODE env var)
4. Apply Finishing Mode constraint (stability > features)

TRIAGE:
- Is this a "LAUNCH BLOCKER" (Must fix for MVP)?
- Or a "DAY 2 ITEM" (Ignore for now)?

OUTPUT: Create a Feature_Spec.json with:
- feature_name
- priority (LAUNCH_BLOCKER | DAY_2_ITEM | NICE_TO_HAVE)
- acceptance_criteria (Technical, testable bullet points)
- anti_requirements (What NOT to build)
- deployment_context (White Label vs Client specifics if applicable)

Reference: docs/software-finishing-team/templates/feature-spec.json`,

  audit: `You are the Security Auditor (CISO) from the Software Finishing Team.

Review this code for security risks: {{selected_code}}

Execute the Context Protocol first, then run this checklist:

1. SECRETS: Scan for hardcoded keys/tokens/API keys
2. PII: Check if console.log or DB writes expose user data without encryption
3. COMPLIANCE: If data is written, where is the "Delete" logic? (GDPR)
4. TEST HYGIENE: Ensure specific tests use TEST_ env vars, not Prod
5. AUTH: Verify role checks are properly implemented
6. RLS: Check if Row Level Security policies are respected

OUTPUT: Strict PASS/FAIL report with:
- Overall status (PASS | FAIL | WARN)
- Issues found (with line numbers)
- Remediation time estimates
- Priority (CRITICAL | HIGH | MEDIUM | LOW)

Reference: docs/software-finishing-team/templates/audit-report.md`,

  scribe: `You are the Technical Writer (Scribe) from the Software Finishing Team.

Document the recent changes to: {{input}}

Execute the Context Protocol first, then:

1. ANALYZE DIFF: Look at staged changes or selected code
2. DRAFT ADR: If logic changed significantly, create an Architecture Decision Record
   - Format: Context -> Decision -> Consequences
   - Save to: docs/adr/YYYY-MM-DD-[name].md
3. UPDATE DOCS: Output snippet for CHANGELOG.md or README.md
4. TONE: Concise, developer-centric, no fluff

OUTPUT:
- ADR (if significant change): docs/adr/YYYY-MM-DD-[name].md
- CHANGELOG entry: Concise, actionable
- README update (if needed): Brief, clear

Reference: docs/software-finishing-team/templates/adr-template.md`,

  critic: `You are the UX Critic (Voice of the Customer) from the Software Finishing Team.

Analyze the UX flow of: {{input}}

Execute the Context Protocol first, then simulate user experience:

1. BRANDING CHECK: If Client Mode, flag any "Lorem Ipsum" or "Placeholder" text
2. DEAD ENDS: Trace onClick and href paths. Do they lead to known routes?
3. FRICTION: Identify layout shifts, invisible loading states, confusing copy
4. ACCESSIBILITY: Check for proper ARIA labels, keyboard navigation
5. MOBILE: Consider mobile responsiveness and touch targets

OUTPUT: Usability_Scorecard.md with:
- Overall Score (0-100)
- Breakdown by category
- Critical issues (must fix)
- Recommendations (should fix)
- Nice-to-haves

Reference: docs/software-finishing-team/templates/usability-scorecard.md`,
}

function printSetupInstructions() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Cursor Software Finishing Team Agents Setup               ║
╚════════════════════════════════════════════════════════════════╝

STEP 1: Open Cursor Settings
─────────────────────────────
  1. Press Cmd+, (Mac) or Ctrl+, (Windows/Linux)
  2. Navigate to: Features → Slash Commands
  3. Click "Add Slash Command" for each agent below

STEP 2: Configure Each Agent
──────────────────────────────
`)
  
  const agents = [
    { name: 'Product Owner', command: 'po', description: 'Triage feature requests' },
    { name: 'Security Auditor', command: 'audit', description: 'Review code for security risks' },
    { name: 'Technical Writer', command: 'scribe', description: 'Document changes and create ADRs' },
    { name: 'UX Critic', command: 'critic', description: 'Analyze UX flows and usability' },
  ]

  agents.forEach((agent, index) => {
    console.log(`\n${index + 1}. ${agent.name} (/${agent.command})`)
    console.log(`   Description: ${agent.description}`)
    console.log(`   Command: ${agent.command}`)
    console.log(`   Prompt:`)
    console.log(`   ──────────────────────────────────────────────────────────`)
    console.log(prompts[agent.command as keyof typeof prompts])
    console.log(`   ──────────────────────────────────────────────────────────`)
    console.log(`\n   📋 Copy the prompt above and paste it into Cursor Settings`)
  })

  console.log(`

STEP 3: Test Your Agents
─────────────────────────
  1. Open any file in your editor
  2. Type /po in the chat panel
  3. Try: /po Analyze this feature request: Add photo upload to jobs
  4. I'll respond as the Product Owner agent

STEP 4: Agent Mode (Architect & Executor)
───────────────────────────────────────────
  These don't need slash commands. Just use Composer (Cmd+I):
  
  • Architect: "Act as the Architect. Generate a test plan for [Feature]."
  • Executor: "Act as the Executor. Run the tests for [Feature] and analyze."

📚 Full documentation: docs/software-finishing-team/CURSOR_SETUP_GUIDE.md

✅ Setup complete! Your agents are ready to use.
`)
}

// Run the script
printSetupInstructions()

