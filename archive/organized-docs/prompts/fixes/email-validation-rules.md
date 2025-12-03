# Email Validation Rules for CRM-AI Pro Agent

## Problem Statement
The agent currently accepts incomplete or ambiguous email addresses and allows duplicate emails to be used for multiple users.

## Validation Rules

### 1. **Format Validation**

Always validate email format before proceeding:

```
Required format: user@domain.tld

Valid examples:
- john.doe@example.com
- jsmith@company.co.uk
- user-name@sub.domain.org

Invalid examples:
- john@ (missing domain)
- @example.com (missing user)
- john.example.com (missing @)
- john@localhost (internal domains not allowed)
- john@317plumber (missing .tld)
```

### 2. **Duplicate Detection**

Before creating a user with an email:

```
1. Check if email already exists in system
2. If found, show existing user details
3. Offer alternatives to proceed
```

### 3. **Confirmation Workflow**

```
When user provides email:
1. Validate format
2. Check for duplicates
3. Read back email for confirmation
4. Proceed only after explicit confirmation

Example:
"You entered: ryan@317plumber.com
This email appears to belong to Ryan Smith (Account Owner).

Creating a new technician with this email would:
- Remove access from Ryan Smith
- Transfer all of Ryan's data to the new technician

Options:
1. Use a different email for the technician
2. Update Ryan Smith's role to 'technician'
3. Contact Ryan to confirm this change

Which would you prefer?"
```

### 4. **Specific Prompts**

#### Initial Email Request:
```
"I need an email address for the [user type]. Please provide:
- A complete email address (user@domain.com)
- One that hasn't been used in the system before

What email should I use?"
```

#### Format Validation Failed:
```
"'[email]' is not a valid email format.

A valid email needs:
- A username (before @)
- A domain name (after @)
- A top-level domain (.com, .org, etc.)

Example: john.doe@example.com

Please provide the complete email address:"
```

#### Duplicate Email Detected:
```
"⚠️ This email is already in use:

Email: [email]
Current User: [name] ([role])
Account: [account name]
Created: [date]

To maintain data integrity, each email can only be used once.

Options:
1. **Use a different email** for the new [user type]
2. **Modify the existing user** ([name]) to be a [role]
3. **Deactivate the existing user** and create a new one
4. **Contact support** for help with this situation

What would you like to do?"
```

#### Confirm Before Creation:
```
"About to create [user type] with:
Name: [full name]
Email: [email@email.com]
Role: [role]

Please confirm:
- 'yes' to create this user
- 'no' to make changes
- Type 'email' to change the email address

Confirm?"
```

### 5. **Email Suggestion System**

When user types partial or ambiguous email:

```
If user types "ryan@317plumber":
"Did you mean:
- ryan@317plumber.com
- ryan@317plumbing.com
- support@317plumber.com

Or please type the complete email address:"
```

### 6. **Edge Cases**

#### Technician vs Contact Email:
```
"Creating a technician user requires a unique email.
If you want to associate this email with a contact (not a user account):
1. Use 'Create Contact' instead
2. Contacts can share emails with users
3. Contacts don't need login credentials

Would you like to create a contact instead?"
```

#### Temporary/Disposable Emails:
```
"Please provide a permanent business email address.
Temporary or disposable emails (like gmail.com, yahoo.com) should not be used for business accounts.

Recommended format:
[firstname].[lastname]@[company].com

What permanent email should we use?"
```

### 7. **Implementation Checklist**

```typescript
// Email validation function to implement:
function validateEmail(email: string) {
  // 1. Check format with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'format' }
  }

  // 2. Check for disposable domains
  if (isDisposableDomain(email)) {
    return { valid: false, reason: 'disposable' }
  }

  // 3. Check for duplicates in database
  const existing = await checkEmailExists(email)
  if (existing) {
    return { valid: false, reason: 'duplicate', user: existing }
  }

  return { valid: true }
}
```

### 8. **Testing Scenarios**

1. Create user with incomplete email (ryan@317plumber)
2. Try to reuse account owner's email for technician
3. Use malformed email formats
4. Test with temporary email services
5. Attempt duplicate creation in same session
6. Test confirmation workflow

### 9. **Success Metrics**

- Zero invalid emails accepted
- Zero duplicate emails created
- All emails confirmed before user creation
- Clear error messages for validation failures
- Users understand why duplicate emails aren't allowed

### 10. **Prompt Integration**

Add to system prompt:
```
When collecting email addresses:
1. Always validate format (user@domain.tld)
2. Check for duplicates in the system
3. Show existing user details if duplicate found
4. Get explicit confirmation before creating users
5. Suggest complete emails for partial entries
6. Don't accept temporary/personal emails for business accounts
7. Differentiate between contact emails and user emails
```