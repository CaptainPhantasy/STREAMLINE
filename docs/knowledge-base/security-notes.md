# Security Notes

**Last Updated**: 15:15:00 Dec 03, 2025 (America/Indiana/Indianapolis)  
**Purpose**: Document security-related patterns and false positive warnings

---

## Supabase `getSession()` Warnings

### The Warning

You may see warnings in the console:
```
Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.
```

### Why This Warning Appears

Supabase warns about using `getSession()` because the session data comes from cookies/storage and may not be authentic. However, **this warning is a false positive** when used correctly.

### Correct Pattern (What We Use)

The **recommended secure pattern** is:

1. **First**: Call `getUser()` to verify authentication with the Supabase Auth server
2. **Then**: Call `getSession()` to get the access token (only after verification)

```typescript
// Step 1: Verify authentication (SECURE)
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return // Not authenticated
}

// Step 2: Get session token (SAFE - user already verified)
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session?.access_token
```

### Where We Use This Pattern

- `app/api/auth/session/route.ts` - Session endpoint (needs access token)
- `lib/auth-helper.ts` - Authentication helper (needs access token for API calls)
- `app/api/ai/draft/route.ts` - AI draft endpoint (needs access token)

### Why We Can't Avoid `getSession()`

After `getUser()` verification, we still need the `access_token` from the session for:
- Making authenticated API calls
- Passing tokens to client-side code
- Token refresh operations

There's no way to get the access token without calling `getSession()`, but since we verify with `getUser()` first, this is secure.

### Conclusion

**These warnings are false positives** - we're using the correct secure pattern. The warnings appear because Supabase's internal code checks for `getSession()` calls and warns regardless of context, but our code is secure because we verify with `getUser()` first.

---

## Security Best Practices

### Always Verify Before Using Session Data

✅ **CORRECT**:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return // Not authenticated
const { data: { session } } = await supabase.auth.getSession()
```

❌ **INCORRECT**:
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session?.user) return // UNSAFE - session data not verified
```

### Use `getUser()` for Authentication Checks

Always use `getUser()` to verify authentication before trusting any user data.

---

15:15:00 Dec 03, 2025

