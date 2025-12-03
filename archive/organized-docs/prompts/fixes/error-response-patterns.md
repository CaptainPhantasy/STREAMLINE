# Error Response Patterns for CRM-AI Pro Agent

## Purpose
This document provides improved error handling patterns for the CRM-AI Pro agent to ensure accurate, helpful responses when operations fail.

## Key Principles

### 1. **Never Blame "The System"**
- Avoid vague statements like "The system is blocking notes"
- Always provide specific error details
- Explain what actually failed and why

### 2. **Categorize Errors Properly**

#### Database Schema Errors
When tables are missing:
```
❌ Bad: "I can't add notes right now due to system limitations"
✅ Good: "The notes feature requires database tables that aren't installed yet. Please run the migration: `supabase/migrations/20251128_add_tags_and_notes.sql`"
```

#### Permission Errors
When access is denied:
```
❌ Bad: "You don't have permission to do this"
✅ Good: "This action requires admin privileges. Please contact your account administrator or ensure you're logged in with the correct role."
```

#### Validation Errors
When input is invalid:
```
❌ Bad: "That didn't work"
✅ Good: "The email format is invalid. Please provide a complete email address (e.g., user@example.com)"
```

#### Network/API Errors
When services are unreachable:
```
❌ Bad: "Something went wrong"
✅ Good: "Unable to connect to the email service. This might be a network issue. Please try again in a few minutes."
```

### 3. **Provide Specific Next Steps**

For each error, always include:
1. **What went wrong** (specific and technical but understandable)
2. **Why it went wrong** (root cause if known)
3. **How to fix it** (immediate actionable steps)
4. **Alternative approaches** (if any)

### 4. **Error Response Templates**

#### Missing Database Tables
```
"The [feature] functionality is not available because the required database tables are missing.
To fix this:
1. Run the migration: `supabase/migrations/[migration_file].sql`
2. Or contact your administrator to apply the database schema updates
3. After migration, retry this operation

Would you like me to help you with something else while this is being resolved?"
```

#### Technician Not Found
```
"I searched for technicians matching '[name]' but couldn't find anyone in the system.

This could mean:
1. The technician hasn't been added to the system yet
2. They might be listed under a different name
3. They could be in the system but not marked as a technician

Options:
- Search for a different name
- Create a new technician profile
- View all technicians to choose from

What would you like to do?"
```

#### Duplicate Email Detection
```
"The email '[email]' is already associated with another user in the system.

To maintain data integrity, each email can only be used once.

Options:
1. Use a different email address
2. Check if the existing user is the same person
3. Contact support to update the existing user's email

Would you like to search for the existing user with this email?"
```

#### Job Status Update Failed
```
"I couldn't update the job status to '[new_status]'.

This could be because:
- The job might already be in this status
- There might be a workflow restriction
- The job status transition might not be allowed

Current job status: [current_status]
Allowed next statuses: [list of allowed statuses]

Would you like to:
1. Try updating to a different status
2. Check the job details first
3. Contact support for help with this transition"
```

### 5. **Recovery Strategies**

#### For Repeated Failures
If an operation fails 3 times:
```
"I've tried [operation] three times without success. Let's try a different approach:

1. We can skip this step and come back later
2. I can help you do this manually through a different method
3. You might need to contact support for assistance

Which would you prefer?"
```

#### For Unknown Errors
```
"I encountered an unexpected error: [error_code if available]

Let's try these steps:
1. Refresh the page/app and try again
2. Check if you have a stable internet connection
3. Try a simpler version of this request

If the problem continues, please report this error with these details:
- Time: [timestamp]
- Operation: [what you were trying to do]
- Error: [error message]

Would you like to try something else?"
```

### 6. **Success Confirmation Patterns**

Always confirm successful operations clearly:
```
"✅ [Operation] completed successfully!

Details:
- [Specific outcome]
- [Reference/ID if applicable]
- [Next steps if any]

Is there anything else you'd like to do?"
```

## Implementation Checklist

- [ ] Review all existing prompt templates
- [ ] Replace vague error messages with specific ones
- [ ] Add error categorization logic
- [ ] Include recovery options for each error type
- [ ] Test error responses with various failure scenarios
- [ ] Ensure no blame is placed on "the system"
- [ ] Verify all errors provide actionable next steps

## Testing Scenarios

1. Add notes when tables don't exist
2. Search for non-existent technician
3. Try to use duplicate email
4. Attempt invalid job status transition
5. Network failure during API calls
6. Permission denied scenarios
7. Invalid data validation failures

Apply these patterns to ensure users always receive helpful, actionable error messages.