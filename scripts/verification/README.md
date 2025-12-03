# Visual/UX Verification Tool

**Purpose**: Code-based verification tool that finds and fixes visual/UX issues

**How It Works**:
1. Reads all component/CSS files
2. Analyzes code for visual/UX bug patterns
3. Fixes issues automatically
4. Reports results

**Usage**:
```bash
# Run verification (find issues)
npm run verify:visual

# Run verification and fix automatically
npm run verify:visual:fix

# Generate detailed report
npm run verify:visual:report
```

**Architecture**:
- `core/` - Core utilities (code reading, parsing, fixing)
- `patterns/` - Bug pattern definitions
- `analyzers/` - Issue detection logic
- `fixers/` - Automatic fix logic
- `main.ts` - Main runner

