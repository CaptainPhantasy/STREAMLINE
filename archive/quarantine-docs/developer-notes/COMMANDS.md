# Local Implementation Guide - Subscription Performance Fix

**Environment:** Local Development  
**Estimated Time:** 10-15 minutes  
**Risk Level:** LOW (easy rollback)

---

## Quick Implementation Steps

### Step 1: Backup Original Files (30 seconds)
```bash
cd /Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO

# Backup conversation list
cp components/dashboard/conversation-list.tsx components/dashboard/conversation-list.BACKUP.tsx

# Backup jobs page
cp app/\(dashboard\)/jobs/page.tsx app/\(dashboard\)/jobs/page.BACKUP.tsx
```

---

### Step 2: Apply Fixed Files (30 seconds)
```bash
# Replace conversation list with fixed version
cp components/dashboard/conversation-list.FIXED.tsx components/dashboard/conversation-list.tsx

# Replace jobs page with fixed version
cp app/\(dashboard\)/jobs/page.FIXED.tsx app/\(dashboard\)/jobs/page.tsx
```

**Note:** The utility files are already in place:
- ✅ `hooks/use-account.ts`
- ✅ `lib/utils/debounce.ts`

---

### Step 3: Start Development Server (if not running)
```bash
npm run dev
# or
yarn dev
```

Wait for the server to compile...

---
### 4. Start dev server
```bash
npm run dev
```

### 5. Test URLs
```
http://localhost:3000/jobs
http://localhost:3000/inbox
```

---

## Rollback Commands (If Needed)

```bash
cd /Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO && \
cp components/dashboard/conversation-list.BACKUP.tsx components/dashboard/conversation-list.tsx && \
cp app/\(dashboard\)/jobs/page.BACKUP.tsx app/\(dashboard\)/jobs/page.tsx && \
echo "✅ Rollback complete! Restart your dev server."
```

---

## Verification Commands

### Check files exist
```bash
ls -la hooks/use-account.ts
ls -la lib/utils/debounce.ts
ls -la components/dashboard/conversation-list.FIXED.tsx
ls -la app/\(dashboard\)/jobs/page.FIXED.tsx
```

### Check for TypeScript errors
```bash
npm run type-check
```

### View what changed
```bash
# Compare conversation list
diff components/dashboard/conversation-list.BACKUP.tsx components/dashboard/conversation-list.tsx

# Compare jobs page
diff app/\(dashboard\)/jobs/page.BACKUP.tsx app/\(dashboard\)/jobs/page.tsx
```

---

## That's all you need!

For detailed information, see `LOCAL_IMPLEMENTATION.md`
