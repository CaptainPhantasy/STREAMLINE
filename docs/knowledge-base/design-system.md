# Design System & Visual Standards

**Last Updated**: 15:02:54 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Critical design rules that MUST be followed to prevent invisible/unreadable UI elements

---

## CRITICAL RULE #1: TEXT CONTRAST

### ⚠️ NEVER USE WHITE TEXT ON WHITE BACKGROUNDS

**This is a CRITICAL, NON-NEGOTIABLE rule. Violating this makes text completely invisible to users.**

#### The Problem
- White text (`text-white`) on white backgrounds (`bg-white`, `bg-theme-card`, etc.) = **INVISIBLE TEXT**
- Black text (`text-black`) on black backgrounds = **INVISIBLE TEXT**
- Any text color that matches its background = **INVISIBLE TEXT**

#### The Solution
**ALWAYS check text color against background color before committing:**

1. **On light backgrounds** (white, light gray, theme-card):
   - ✅ Use: `text-theme-primary`, `text-gray-900`, `text-black`
   - ❌ NEVER use: `text-white`, `text-gray-100`, `text-gray-50`

2. **On dark backgrounds** (dark theme, dark cards):
   - ✅ Use: `text-white`, `text-gray-100`, `text-theme-primary` (if theme-primary is light)
   - ❌ NEVER use: `text-black`, `text-gray-900` (unless background is light)

3. **On colored backgrounds**:
   - ✅ Use contrasting colors (dark text on light colors, light text on dark colors)
   - ✅ Test contrast ratio meets WCAG AA minimum (4.5:1 for normal text)

#### Common Mistakes to Avoid
- ❌ `className="text-white"` on a white card background
- ❌ `className="text-white"` inside `<Card>` components (cards are usually white/light)
- ❌ `className="text-white"` on labels/descriptions without checking background
- ❌ Assuming "theme" colors will automatically contrast (they don't)

#### Verification Checklist
Before committing ANY UI change, verify:
- [ ] Text color is visible against its background
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Text is readable in both light and dark themes (if applicable)
- [ ] Labels, descriptions, and helper text are visible
- [ ] Form labels are visible
- [ ] Button text is visible
- [ ] Error messages are visible

---

## CRITICAL RULE #2: THEME COLOR USAGE

### Use Theme Variables Correctly

**Theme color variables:**
- `text-theme-primary` - Primary text color (usually dark on light backgrounds)
- `text-theme-subtle` - Subtle/secondary text color
- `text-theme-accent-primary` - Accent color for emphasis
- `bg-theme-card` - Card background (usually white/light)
- `bg-theme-surface` - Surface background
- `bg-theme-secondary` - Secondary background

**Rules:**
- `text-theme-primary` is designed for light backgrounds
- `text-white` is ONLY for dark backgrounds
- Always check what background your text sits on before choosing text color

---

## CRITICAL RULE #3: FORM ELEMENTS

### Labels and Form Text

**Labels:**
- On light backgrounds: Use `text-theme-primary` or `text-gray-900`
- On dark backgrounds: Use `text-white` or `text-gray-100`
- **NEVER** use `text-white` on light card backgrounds

**Helper text:**
- Use `text-theme-subtle` or `text-muted-foreground` for subtle text
- Ensure it's still readable (not too light)

**Error messages:**
- Use `text-destructive` (usually red)
- Ensure background provides contrast

---

## CRITICAL RULE #4: CARD COMPONENTS

### Cards Usually Have Light Backgrounds

**Default Card backgrounds:**
- `<Card>` components typically have white/light backgrounds
- Text inside cards should use dark colors (`text-theme-primary`, `text-gray-900`)
- **NEVER** use `text-white` inside cards unless card has explicit dark background

**Exception:**
- If card has `className="bg-dark"` or similar, then `text-white` is appropriate
- Always verify background color before choosing text color

---

## CRITICAL RULE #5: BUTTONS AND INTERACTIVE ELEMENTS

### Button Text Must Be Visible

**Button text:**
- Light buttons (default, outline): Use dark text (`text-theme-primary`, `text-black`)
- Dark buttons (primary, destructive): Use light text (`text-white`)
- **Always verify button text is visible against button background**

**Links:**
- Use `text-theme-accent-primary` or `text-blue-600` for links
- Ensure links are visible against background

---

## Verification Process

### Before Every UI Change

1. **Identify the background:**
   - What component contains this text?
   - What is the background color?
   - Is it light or dark?

2. **Choose appropriate text color:**
   - Light background → Dark text
   - Dark background → Light text
   - Colored background → Contrasting text

3. **Test visually:**
   - Actually render the component
   - Verify text is visible
   - Check contrast ratio if possible

4. **Verify in context:**
   - Check how it looks in the actual page
   - Verify it works in both light/dark themes (if applicable)
   - Test on different screen sizes

---

## Common Patterns

### ✅ CORRECT Patterns

```tsx
// Light card with dark text
<Card>
  <CardContent>
    <Label className="text-theme-primary">Email</Label>
    <p className="text-theme-subtle">Helper text</p>
  </CardContent>
</Card>

// Dark background with light text
<div className="bg-gray-900">
  <Label className="text-white">Email</Label>
</div>

// Theme-aware text
<Label className="text-theme-primary">Remember me</Label>
```

### ❌ INCORRECT Patterns

```tsx
// White text on white card (INVISIBLE)
<Card>
  <CardContent>
    <Label className="text-white">Email</Label>  // ❌ WRONG
  </CardContent>
</Card>

// White text on light background (INVISIBLE)
<div className="bg-white">
  <p className="text-white">Text</p>  // ❌ WRONG
</div>
```

---

## Enforcement

**This document MUST be referenced:**
- Before creating any new UI component
- Before modifying existing UI components
- Before committing any changes that affect text visibility
- In code reviews
- In agent prompts for UI work

**If you violate this rule:**
- The text will be invisible to users
- Users cannot read instructions, labels, or content
- The UI becomes unusable
- This is a CRITICAL bug that must be fixed immediately

---

## Related Documentation

- `docs/bug-finder-verification/UI-UX-VERIFICATION-REQUIREMENTS.md` - Visual verification checklist
- `docs/bug-finder-verification/AGENT-PROMPTS.md` - Agent instructions that reference this
- Component structure documentation for theme usage patterns

---

**Remember: If humans can't see it, it doesn't matter if the code works. Always verify text is visible.**

---

15:02:54 Dec 03, 2025

