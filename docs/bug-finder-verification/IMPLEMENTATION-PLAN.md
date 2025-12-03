# Implementation Plan: Code-Based Visual/UX Verification Tool

**Created**: Chain of Thought Analysis  
**Purpose**: Build actual verification tooling that works, not just documentation

---

## The Problem

We have comprehensive documentation but NO actual tooling. The agent needs:
- Code analysis functions that find visual/UX bugs
- Pattern matching for ALL issue types (not just one)
- Fix functions that can actually update code
- Integration with verification workflow

---

## The Solution: Multi-Layer Code Analysis Tool

### Architecture

```
verification-tool/
├── analyzers/
│   ├── color-analyzer.ts      # Color/contrast issues
│   ├── visibility-analyzer.ts  # Visibility issues
│   ├── layout-analyzer.ts      # Layout issues
│   ├── interactive-analyzer.ts # Interactive element issues
│   ├── responsive-analyzer.ts  # Responsive design issues
│   ├── accessibility-analyzer.ts # Accessibility issues
│   └── form-analyzer.ts        # Form usability issues
├── patterns/
│   └── bug-patterns.ts         # Comprehensive pattern library
├── fixers/
│   ├── color-fixer.ts          # Fix color issues
│   ├── visibility-fixer.ts     # Fix visibility issues
│   └── ... (one fixer per analyzer)
├── core/
│   ├── code-reader.ts          # Read and parse code files
│   ├── ast-parser.ts           # Parse AST for structured analysis
│   ├── pattern-matcher.ts      # Match patterns in code
│   └── fix-applier.ts          # Apply fixes to code
└── main.ts                     # Main verification runner
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
**Goal**: Build foundation for code analysis

**Tasks**:
1. Create `code-reader.ts` - Read files, extract code
2. Create `ast-parser.ts` - Parse TypeScript/TSX to AST
3. Create `pattern-matcher.ts` - Match regex/pattern rules
4. Create `fix-applier.ts` - Apply code fixes safely

**Deliverable**: Core tools that can read, parse, match, and fix code

---

### Phase 2: Pattern Library
**Goal**: Define ALL bug patterns comprehensively

**Tasks**:
1. Create `bug-patterns.ts` with patterns for:
   - Color issues (white-on-white, low contrast, etc.)
   - Visibility issues (hidden elements, opacity 0, etc.)
   - Layout issues (overlapping, overflow, etc.)
   - Interactive issues (disabled buttons, missing handlers, etc.)
   - Responsive issues (missing breakpoints, fixed widths, etc.)
   - Accessibility issues (missing ARIA, semantic HTML, etc.)
   - Form issues (missing labels, validation, etc.)
   - Typography issues (font sizes, line heights, etc.)
   - Spacing issues (missing margins, inconsistent spacing, etc.)
   - State issues (loading, error, empty states)

**Deliverable**: Complete pattern library covering all visual/UX issues

---

### Phase 3: Analyzers
**Goal**: Build analyzers for each issue category

**Tasks**:
1. **Color Analyzer**:
   - Find hardcoded colors
   - Check color combinations
   - Calculate contrast ratios
   - Find white-on-white, black-on-black
   - Check theme variable usage

2. **Visibility Analyzer**:
   - Find `display: none` on visible elements
   - Find `opacity: 0` on interactive elements
   - Find `visibility: hidden` incorrectly used
   - Find conditional rendering that might never render
   - Find `hidden` classes on visible elements

3. **Layout Analyzer**:
   - Find overlapping elements (absolute/fixed positioning)
   - Find overflow issues
   - Find missing responsive breakpoints
   - Find fixed widths breaking mobile
   - Find z-index issues

4. **Interactive Analyzer**:
   - Find disabled buttons that shouldn't be
   - Find missing onClick handlers
   - Find non-semantic interactive elements
   - Find links without href
   - Find pointer-events incorrectly set

5. **Responsive Analyzer**:
   - Find missing mobile styles
   - Find wrong breakpoint values
   - Find fixed widths
   - Find missing max-widths
   - Find non-responsive layouts

6. **Accessibility Analyzer**:
   - Find missing ARIA labels
   - Find missing alt text
   - Find non-semantic HTML
   - Find missing focus styles
   - Find keyboard navigation issues

7. **Form Analyzer**:
   - Find inputs without labels
   - Find missing placeholders
   - Find missing validation
   - Find missing required indicators

**Deliverable**: Analyzers that find all issues in each category

---

### Phase 4: Fixers
**Goal**: Build fix functions for each issue type

**Tasks**:
1. **Color Fixer**:
   - Replace hardcoded colors with theme variables
   - Fix contrast issues (adjust colors)
   - Fix white-on-white (change one color)
   - Ensure theme variable usage

2. **Visibility Fixer**:
   - Remove incorrect `display: none`
   - Fix `opacity: 0` on visible elements
   - Fix conditional rendering
   - Remove incorrect `hidden` classes

3. **Layout Fixer**:
   - Fix overlapping elements
   - Add responsive breakpoints
   - Replace fixed widths with responsive
   - Fix z-index issues

4. **Interactive Fixer**:
   - Fix disabled states
   - Add missing handlers
   - Fix semantic HTML
   - Fix link hrefs

5. **Responsive Fixer**:
   - Add missing breakpoints
   - Fix breakpoint values
   - Replace fixed widths
   - Add max-widths

6. **Accessibility Fixer**:
   - Add ARIA labels
   - Add alt text
   - Fix semantic HTML
   - Add focus styles

7. **Form Fixer**:
   - Add missing labels
   - Add placeholders
   - Add validation
   - Add required indicators

**Deliverable**: Fix functions that can automatically fix issues

---

### Phase 5: Integration
**Goal**: Integrate with verification workflow

**Tasks**:
1. Create main runner that:
   - Scans all component files
   - Runs all analyzers
   - Applies all fixers
   - Reports results
   - Updates verification matrix

2. Create CLI interface:
   - `npm run verify:visual` - Run visual verification
   - `npm run verify:visual:fix` - Run and fix automatically
   - `npm run verify:visual:report` - Generate report

3. Integrate with agent prompts:
   - Agent calls verification tool
   - Tool finds and fixes issues
   - Agent documents results

**Deliverable**: Working tool integrated with verification system

---

## Technical Approach

### Code Reading
- Use `read_file` tool to read code files
- Parse TypeScript/TSX files
- Extract components, styles, props

### Pattern Matching
- Regex patterns for simple cases
- AST parsing for complex cases
- Cross-file analysis for context

### Fix Application
- Use `search_replace` tool to fix code
- Preserve code structure
- Validate fixes don't break code

### Validation
- TypeScript compiler to validate fixes
- ESLint to check code quality
- Manual review for complex fixes

---

## Success Criteria

**Phase 1 Complete**:
- ✅ Can read and parse code files
- ✅ Can match patterns
- ✅ Can apply fixes

**Phase 2 Complete**:
- ✅ Pattern library covers all issue types
- ✅ Patterns are accurate and comprehensive

**Phase 3 Complete**:
- ✅ All analyzers find issues correctly
- ✅ Analyzers cover all components

**Phase 4 Complete**:
- ✅ All fixers can fix issues automatically
- ✅ Fixes don't break code

**Phase 5 Complete**:
- ✅ Tool integrated with verification workflow
- ✅ Agent can use tool effectively
- ✅ Tool finds and fixes real issues

---

## Next Steps

1. **Start with Phase 1** - Build core infrastructure
2. **Build pattern library** - Define all patterns
3. **Build analyzers** - One at a time, test each
4. **Build fixers** - One at a time, test each
5. **Integrate** - Connect to verification workflow

---

**This is REAL implementation, not documentation. Let's build it.**

