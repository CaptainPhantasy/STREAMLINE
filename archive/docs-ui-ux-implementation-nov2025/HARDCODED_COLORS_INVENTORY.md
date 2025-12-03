# Hardcoded Colors Inventory - Mobile Pages

**Generated:** November 28, 2025
**Purpose:** Complete inventory of hardcoded blue and gray colors that need theme variable replacement

---

## Hardcoded Blue Colors (20+ instances)

### app/m/tech/layout.tsx
**Line 25:**
```typescript
<div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2">
```
**Fix:**
```typescript
<div className="bg-[var(--color-accent-primary)] text-white px-4 py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2">
```

---

### app/m/tech/dashboard/page.tsx

**Line 59:** Loading spinner
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
```
**Fix:**
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

**Line 80-81:** Current job card
```typescript
<div className="bg-blue-900/50 border border-blue-500 rounded-2xl p-4 mb-6">
  <div className="text-blue-400 text-sm font-bold mb-2">
```
**Fix:**
```typescript
<div className="bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)] rounded-2xl p-4 mb-6">
  <div className="text-[var(--color-accent-primary)] text-sm font-bold mb-2">
```

**Line 130:** Status badge (in_progress)
```typescript
job.status === 'in_progress' ? 'bg-blue-900 text-blue-400' :
```
**Fix:**
```typescript
job.status === 'in_progress' ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]' :
```

---

### app/m/tech/job/[id]/page.tsx

**Line 474:** Loading spinner
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
```
**Fix:**
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

**Line 519:** Map icon
```typescript
<MapPin className="w-16 h-16 mx-auto text-blue-400 mb-4" />
```
**Fix:**
```typescript
<MapPin className="w-16 h-16 mx-auto text-[var(--color-accent-primary)] mb-4" />
```

**Line 693:** Signature icon
```typescript
<PenTool className="w-16 h-16 mx-auto text-blue-400 mb-4" />
```
**Fix:**
```typescript
<PenTool className="w-16 h-16 mx-auto text-[var(--color-accent-primary)] mb-4" />
```

---

### app/m/sales/dashboard/page.tsx

**Line 65:** Loading spinner
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
```
**Fix:**
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

**Line 82-83:** Next meeting card
```typescript
<div className="bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-500/50 rounded-2xl p-5 mb-6">
  <div className="text-blue-300 text-sm font-bold mb-2">NEXT UP</div>
```
**Fix:**
```typescript
<div className="bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20 border border-[var(--color-accent-primary)]/50 rounded-2xl p-5 mb-6">
  <div className="text-[var(--color-accent-primary)] text-sm font-bold mb-2">NEXT UP</div>
```

---

### app/m/sales/briefing/[contactId]/page.tsx

**Line 70:** Loading spinner
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
```
**Fix:**
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)] mx-auto mb-4" />
```

**Line 83:** Back button
```typescript
<button onClick={() => router.back()} className="mt-4 text-blue-400">
```
**Fix:**
```typescript
<button onClick={() => router.back()} className="mt-4 text-[var(--color-accent-primary)]">
```

**Line 100:** Avatar background
```typescript
<div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
```
**Fix:**
```typescript
<div className="w-16 h-16 bg-[var(--color-accent-primary)] rounded-full flex items-center justify-center text-2xl font-bold">
```

**Line 107:** Company name
```typescript
<div className="flex items-center gap-2 text-blue-300">
```
**Fix:**
```typescript
<div className="flex items-center gap-2 text-[var(--color-accent-primary)]/80">
```

**Line 208:** Meeting timeline
```typescript
<div key={meeting.id} className="border-l-2 border-blue-500 pl-3">
```
**Fix:**
```typescript
<div key={meeting.id} className="border-l-2 border-[var(--color-accent-primary)] pl-3">
```

---

### app/m/sales/meeting/[id]/page.tsx

**Line 223:** Timer text
```typescript
<div className="text-3xl font-mono text-blue-400">{formatTime(duration)}</div>
```
**Fix:**
```typescript
<div className="text-3xl font-mono text-[var(--color-accent-primary)]">{formatTime(duration)}</div>
```

---

### app/m/owner/dashboard/page.tsx

**Line 79:** Loading spinner
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
```
**Fix:**
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

**Line 181:** Status badge (en_route)
```typescript
tech.status === 'en_route' ? 'bg-blue-900 text-blue-400' :
```
**Fix:**
```typescript
tech.status === 'en_route' ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]' :
```

**Line 245:** Icon color mapping
```typescript
blue: 'text-blue-400',
```
**Fix:**
```typescript
blue: 'text-[var(--color-accent-primary)]',
```

---

### app/m/office/dashboard/page.tsx

**Line 85:** Loading spinner
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
```
**Fix:**
```typescript
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
```

**Line 222:** Button
```typescript
className="px-4 py-2 bg-blue-600 rounded-lg font-bold text-sm"
```
**Fix:**
```typescript
className="px-4 py-2 bg-[var(--color-accent-primary)] rounded-lg font-bold text-sm"
```

---

## Hardcoded Gray Colors (11 files)

The following files contain hardcoded gray colors that should be replaced with theme variables:

### Files List
1. `app/m/sales/profile/page.tsx`
2. `app/m/sales/leads/page.tsx`
3. `app/m/tech/profile/page.tsx`
4. `app/m/tech/map/page.tsx`
5. `app/m/sales/dashboard/page.tsx`
6. `app/m/tech/dashboard/page.tsx`
7. `app/m/sales/meeting/[id]/page.tsx`
8. `app/m/tech/job/[id]/page.tsx`
9. `app/m/owner/dashboard/page.tsx`
10. `app/m/office/dashboard/page.tsx`
11. `app/m/sales/briefing/[contactId]/page.tsx`

### Common Patterns to Replace

**Dark Backgrounds:**
```typescript
bg-gray-900 → bg-[var(--color-bg-primary)]
bg-gray-800 → bg-[var(--color-bg-secondary)]
bg-gray-700 → bg-[var(--color-bg-tertiary)]
```

**Light Text:**
```typescript
text-white → text-[var(--color-text-primary)]
text-gray-300 → text-[var(--color-text-secondary)]
text-gray-400 → text-[var(--color-text-tertiary)]
```

**Borders:**
```typescript
border-gray-700 → border-[var(--color-border-primary)]
border-gray-600 → border-[var(--color-border-secondary)]
```

**Hover/Active States:**
```typescript
hover:bg-gray-800 → hover:bg-[var(--color-bg-secondary)]
hover:text-gray-200 → hover:text-[var(--color-text-primary)]
active:bg-gray-700 → active:bg-[var(--color-bg-tertiary)]
```

---

## Replacement Strategy

### Phase 1: Blue Colors (High Priority)
1. Start with loading spinners (most visible)
2. Then fix prominent UI elements (cards, headers)
3. Then fix status badges
4. Finally fix icons and small elements

### Phase 2: Gray Colors (Medium Priority)
1. Start with backgrounds (most visible)
2. Then fix text colors
3. Then fix borders
4. Finally fix hover/active states

### Phase 3: Testing (High Priority)
1. Test each file after modification
2. Verify in all 4 themes (light, dark, warm, system)
3. Check loading states, hover states, active states
4. Clear cache between tests: `rm -rf .next`

---

## Verification Commands

### Find Remaining Blue Colors
```bash
grep -n "bg-blue-\|text-blue-\|border-blue-" app/m/**/*.tsx
```

### Find Remaining Gray Colors
```bash
grep -n "bg-gray-[789]00\|text-gray-[34]00\|border-gray-[67]00" app/m/**/*.tsx
```

### Verify Theme Variables Used
```bash
grep -n "var(--color-" app/m/**/*.tsx
```

---

## Summary

**Total Blue Colors:** 20+ instances across 8 files
**Total Gray Colors:** Unknown (requires file-by-file inspection of 11 files)
**Total Files Needing Updates:** 11 files

**Estimated Time:**
- Blue color replacement: 1-2 hours
- Gray color replacement: 1-2 hours
- Testing: 1-2 hours
- Total: 3-6 hours

**Priority Order:**
1. Loading spinners (most visible during page loads)
2. Prominent cards and headers (most visible static elements)
3. Status badges (important for status communication)
4. Backgrounds and borders (subtle but important)
5. Icons and small elements (least visible but still needed)
