# Phase 3 Test Scenarios - Estimates & Parts Management

**Date:** 2025-11-27
**Status:** Ready for Testing
**Coverage Target:** 98%+
**Total Test Scenarios:** 32

---

## Table of Contents

1. [Estimates System Tests (12 scenarios)](#estimates-system-tests)
2. [Parts Management Tests (14 scenarios)](#parts-management-tests)
3. [Email Parts List Tests (6 scenarios)](#email-parts-list-tests)
4. [Test Execution Checklist](#test-execution-checklist)
5. [Sample Test Data](#sample-test-data)
6. [Success Criteria](#success-criteria)

---

## Estimates System Tests

### EST-001: Create Basic Estimate with Labor Items

**Test Name:** Create estimate with single labor item

**Input Data:**
```json
{
  "contactId": "TEST_CONTACT_ID",
  "title": "Kitchen Plumbing Repair",
  "description": "Fix leaking faucet and replace pipes",
  "items": [
    {
      "type": "labor",
      "name": "Plumbing Labor",
      "description": "Expert plumbing services",
      "quantity": 2,
      "unitPrice": 8500,
      "unit": "hour"
    }
  ],
  "taxRate": 0.08,
  "validUntil": "2025-12-31"
}
```

**Expected Result:**
- Estimate created with status: "pending"
- Estimate number generated (e.g., "EST-001")
- Subtotal: $170.00 (2 × $85.00)
- Tax: $13.60 (8% of $170.00)
- Total: $183.60
- `estimate_items` array contains 1 item

**Success Criteria:**
- ✅ Response: `{ success: true, estimate: {...}, message: "..." }`
- ✅ Database: Record exists in `estimates` table
- ✅ Database: Record exists in `estimate_items` table
- ✅ Calculations match expected values (cents-based)

**How to Verify:**
```sql
SELECT * FROM estimates WHERE estimate_number LIKE 'EST-%' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM estimate_items WHERE estimate_id = '[ESTIMATE_ID]';
```

---

### EST-002: Create Estimate with Mixed Items (Labor + Materials)

**Test Name:** Create estimate with labor and materials

**Input Data:**
```json
{
  "contactId": "TEST_CONTACT_ID",
  "title": "Complete HVAC Installation",
  "description": "Full system installation with ductwork",
  "items": [
    {
      "type": "labor",
      "name": "HVAC Labor",
      "description": "Installation services",
      "quantity": 8,
      "unitPrice": 9500,
      "unit": "hour"
    },
    {
      "type": "material",
      "name": "HVAC Unit",
      "description": "High-efficiency 3-ton unit",
      "quantity": 1,
      "unitPrice": 325000,
      "unit": "each"
    },
    {
      "type": "material",
      "name": "Ductwork",
      "description": "Insulated flexible duct",
      "quantity": 50,
      "unitPrice": 1250,
      "unit": "ft"
    }
  ],
  "taxRate": 0.08,
  "customerNotes": "Customer prefers weekend installation"
}
```

**Expected Result:**
- Subtotal: $4,376.00 (($95×8) + $3,250 + ($12.50×50))
- Tax: $350.08 (8% of $4,376.00)
- Total: $4,726.08
- 3 items in `estimate_items`

**Success Criteria:**
- ✅ Subtotal = 437600 cents
- ✅ Tax = 35008 cents
- ✅ Total = 472608 cents
- ✅ All 3 items saved correctly
- ✅ Customer notes preserved

**How to Verify:**
```sql
SELECT subtotal_amount, tax_amount, total_amount, customer_notes
FROM estimates WHERE id = '[ESTIMATE_ID]';
SELECT type, name, quantity, unit_price, total_price
FROM estimate_items WHERE estimate_id = '[ESTIMATE_ID]';
```

---

### EST-003: Calculate Totals with Zero Tax

**Test Name:** Verify calculations work with 0% tax rate

**Input Data:**
```json
{
  "contactId": "TEST_CONTACT_ID",
  "title": "Simple Consultation",
  "items": [
    {
      "type": "labor",
      "name": "Consultation",
      "quantity": 1,
      "unitPrice": 15000,
      "unit": "hour"
    }
  ],
  "taxRate": 0
}
```

**Expected Result:**
- Subtotal: $150.00
- Tax: $0.00
- Total: $150.00

**Success Criteria:**
- ✅ Tax amount = 0 cents
- ✅ Total = Subtotal (no rounding issues)

**How to Verify:**
```sql
SELECT subtotal_amount, tax_amount, total_amount
FROM estimates WHERE id = '[ESTIMATE_ID]';
-- Verify: tax_amount = 0 AND total_amount = subtotal_amount
```

---

### EST-004: Calculate Totals with High Tax Rate

**Test Name:** Verify calculations with 12.5% tax (edge case)

**Input Data:**
```json
{
  "contactId": "TEST_CONTACT_ID",
  "title": "High Tax Test",
  "items": [
    {
      "type": "labor",
      "name": "Service",
      "quantity": 1,
      "unitPrice": 10000,
      "unit": "hour"
    }
  ],
  "taxRate": 0.125
}
```

**Expected Result:**
- Subtotal: $100.00
- Tax: $12.50 (12.5% of $100.00)
- Total: $112.50

**Success Criteria:**
- ✅ Tax = 1250 cents
- ✅ Total = 11250 cents
- ✅ No rounding errors

---

### EST-005: Update Estimate Status to "Sent"

**Test Name:** Update estimate status after sending to customer

**Input Data:**
```json
{
  "estimateId": "TEST_ESTIMATE_ID",
  "status": "sent"
}
```

**Expected Result:**
- Estimate status changes to "sent"
- `updated_at` timestamp updates

**Success Criteria:**
- ✅ Response: `{ success: true, estimate: {...} }`
- ✅ Database: `status = 'sent'`
- ✅ Database: `updated_at` is recent

**How to Verify:**
```sql
SELECT status, updated_at FROM estimates WHERE id = '[ESTIMATE_ID]';
```

---

### EST-006: Update Estimate Status to "Accepted"

**Test Name:** Customer accepts estimate

**Input Data:**
```json
{
  "estimateId": "TEST_ESTIMATE_ID",
  "status": "accepted"
}
```

**Expected Result:**
- Status changes to "accepted"
- Ready for conversion to job

**Success Criteria:**
- ✅ Status = "accepted"
- ✅ `converted_to_job_id` is NULL (not converted yet)

---

### EST-007: Update Estimate Status to "Rejected"

**Test Name:** Customer rejects estimate

**Input Data:**
```json
{
  "estimateId": "TEST_ESTIMATE_ID",
  "status": "rejected"
}
```

**Expected Result:**
- Status changes to "rejected"
- Cannot be converted to job

**Success Criteria:**
- ✅ Status = "rejected"
- ✅ Subsequent conversion attempt fails

---

### EST-008: Convert Accepted Estimate to Job

**Test Name:** Convert accepted estimate to job with materials

**Prerequisites:**
- Estimate exists with status "accepted"
- Estimate has 3 items (1 labor, 2 materials)

**Input Data:**
```json
{
  "estimateId": "TEST_ESTIMATE_ID"
}
```

**Expected Result:**
- New job created with status "scheduled"
- Job description includes estimate title and description
- Job `total_amount` matches estimate `total_amount`
- 3 records inserted into `job_materials`
- Estimate `converted_to_job_id` updated to new job ID

**Success Criteria:**
- ✅ Job created: `jobs.status = 'scheduled'`
- ✅ Job materials copied: Count = 3
- ✅ Material names match estimate item names
- ✅ Material quantities match
- ✅ Material unit costs match estimate unit prices
- ✅ Material total costs calculated correctly
- ✅ Estimate marked as converted: `converted_to_job_id IS NOT NULL`

**How to Verify:**
```sql
-- Check job creation
SELECT id, status, total_amount, description
FROM jobs WHERE id = '[JOB_ID]';

-- Check materials copied
SELECT material_name, quantity, unit, unit_cost, total_cost
FROM job_materials WHERE job_id = '[JOB_ID]';

-- Check estimate marked as converted
SELECT converted_to_job_id FROM estimates WHERE id = '[ESTIMATE_ID]';
```

---

### EST-009: Attempt to Convert Non-Accepted Estimate

**Test Name:** Validation prevents converting pending estimate

**Input Data:**
```json
{
  "estimateId": "PENDING_ESTIMATE_ID"
}
```

**Expected Result:**
- Error: "Only accepted estimates can be converted to jobs"

**Success Criteria:**
- ✅ Conversion fails
- ✅ Error message clear
- ✅ No job created

---

### EST-010: Attempt to Convert Already-Converted Estimate

**Test Name:** Prevent duplicate job creation from same estimate

**Input Data:**
```json
{
  "estimateId": "CONVERTED_ESTIMATE_ID"
}
```

**Expected Result:**
- Error: "Estimate has already been converted to a job"

**Success Criteria:**
- ✅ Conversion blocked
- ✅ No duplicate job created
- ✅ Error message includes existing job ID (optional)

---

### EST-011: Create Estimate with Large Quantities

**Test Name:** Edge case - very large quantities and prices

**Input Data:**
```json
{
  "contactId": "TEST_CONTACT_ID",
  "title": "Large Commercial Job",
  "items": [
    {
      "type": "material",
      "name": "Bulk Material",
      "quantity": 1000,
      "unitPrice": 5000,
      "unit": "each"
    }
  ],
  "taxRate": 0.08
}
```

**Expected Result:**
- Subtotal: $50,000.00
- Tax: $4,000.00
- Total: $54,000.00

**Success Criteria:**
- ✅ No integer overflow
- ✅ Calculations accurate
- ✅ Database stores values correctly

---

### EST-012: Create Estimate with Decimal Quantities

**Test Name:** Support fractional quantities (e.g., 2.5 hours)

**Input Data:**
```json
{
  "contactId": "TEST_CONTACT_ID",
  "title": "Partial Hour Labor",
  "items": [
    {
      "type": "labor",
      "name": "Consulting",
      "quantity": 2.5,
      "unitPrice": 10000,
      "unit": "hour"
    }
  ],
  "taxRate": 0
}
```

**Expected Result:**
- Subtotal: $250.00 (2.5 × $100.00)
- Total: $250.00

**Success Criteria:**
- ✅ Decimal quantity accepted
- ✅ Calculation accurate: 25000 cents

---

## Parts Management Tests

### PART-001: Add Single Part to Job

**Test Name:** Add one part to existing job

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "parts": [
    {
      "name": "PVC Pipe 2 inch",
      "quantity": 10,
      "unit": "ft",
      "unitCost": 1250,
      "supplier": "Home Depot",
      "notes": "White PVC schedule 40"
    }
  ]
}
```

**Expected Result:**
- 1 record inserted into `job_materials`
- Total cost calculated: 12500 cents ($125.00)

**Success Criteria:**
- ✅ Response: `{ success: true, parts: [...], message: "..." }`
- ✅ Database: 1 new record in `job_materials`
- ✅ Material name matches input
- ✅ Total cost = quantity × unit cost (10 × 1250 = 12500)

**How to Verify:**
```sql
SELECT material_name, quantity, unit, unit_cost, total_cost, supplier, notes
FROM job_materials WHERE job_id = '[JOB_ID]' ORDER BY created_at DESC LIMIT 1;
```

---

### PART-002: Add Multiple Parts in Bulk

**Test Name:** Add 5 parts to job in single request

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "parts": [
    {
      "name": "Pipe Fitting Elbow",
      "quantity": 4,
      "unit": "each",
      "unitCost": 350,
      "supplier": "Lowes"
    },
    {
      "name": "PVC Cement",
      "quantity": 1,
      "unit": "can",
      "unitCost": 895,
      "supplier": "Home Depot"
    },
    {
      "name": "Pipe Hanger",
      "quantity": 8,
      "unit": "each",
      "unitCost": 125
    },
    {
      "name": "Teflon Tape",
      "quantity": 2,
      "unit": "roll",
      "unitCost": 299
    },
    {
      "name": "Copper Pipe 1/2 inch",
      "quantity": 25,
      "unit": "ft",
      "unitCost": 450
    }
  ]
}
```

**Expected Result:**
- 5 records inserted
- Total cost for all parts: $26.44
  - Elbows: 4 × $3.50 = $14.00
  - Cement: 1 × $8.95 = $8.95
  - Hangers: 8 × $1.25 = $10.00
  - Tape: 2 × $2.99 = $5.98
  - Copper: 25 × $4.50 = $112.50
  - **Grand Total: $151.43**

**Success Criteria:**
- ✅ All 5 parts inserted
- ✅ Each total_cost calculated correctly
- ✅ Supplier preserved (or NULL if not provided)

**How to Verify:**
```sql
SELECT material_name, quantity, unit_cost, total_cost
FROM job_materials WHERE job_id = '[JOB_ID]'
ORDER BY created_at DESC LIMIT 5;
```

---

### PART-003: List Parts for Job

**Test Name:** Retrieve all parts for a job

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID"
}
```

**Expected Result:**
- Array of parts with all fields
- Parts ordered by creation date (newest first)

**Success Criteria:**
- ✅ Response: `{ parts: [...], count: N }`
- ✅ All parts for job returned
- ✅ No parts from other jobs/accounts

**How to Verify:**
```javascript
// Example response structure
{
  "parts": [
    {
      "id": "uuid",
      "material_name": "...",
      "quantity": 10,
      "unit": "ft",
      "unit_cost": 1250,
      "total_cost": 12500,
      "supplier": "...",
      "notes": "...",
      "created_at": "2025-11-27T..."
    }
  ],
  "count": 5
}
```

---

### PART-004: Update Part Quantity

**Test Name:** Update quantity, recalculate total cost

**Input Data:**
```json
{
  "partId": "TEST_PART_ID",
  "quantity": 20
}
```

**Prerequisites:**
- Part exists with quantity = 10, unit_cost = 1250

**Expected Result:**
- Quantity updated to 20
- Total cost recalculated: 20 × 1250 = 25000 cents

**Success Criteria:**
- ✅ Response: `{ success: true, part: {...} }`
- ✅ Database: `quantity = 20`
- ✅ Database: `total_cost = 25000`

**How to Verify:**
```sql
SELECT quantity, unit_cost, total_cost
FROM job_materials WHERE id = '[PART_ID]';
-- Verify: total_cost = quantity * unit_cost
```

---

### PART-005: Update Part Unit Cost

**Test Name:** Update unit cost, recalculate total cost

**Input Data:**
```json
{
  "partId": "TEST_PART_ID",
  "unitCost": 1500
}
```

**Prerequisites:**
- Part exists with quantity = 10, unit_cost = 1250

**Expected Result:**
- Unit cost updated to 1500
- Total cost recalculated: 10 × 1500 = 15000 cents

**Success Criteria:**
- ✅ Database: `unit_cost = 1500`
- ✅ Database: `total_cost = 15000`

---

### PART-006: Update Part Notes

**Test Name:** Update notes/description without affecting costs

**Input Data:**
```json
{
  "partId": "TEST_PART_ID",
  "notes": "Updated: High-quality schedule 80 PVC, premium grade"
}
```

**Expected Result:**
- Notes updated
- Quantity and costs unchanged

**Success Criteria:**
- ✅ Notes field updated
- ✅ Quantity unchanged
- ✅ Unit cost unchanged
- ✅ Total cost unchanged

---

### PART-007: Update Quantity and Cost Together

**Test Name:** Update both quantity and unit cost in one request

**Input Data:**
```json
{
  "partId": "TEST_PART_ID",
  "quantity": 15,
  "unitCost": 1000
}
```

**Prerequisites:**
- Part exists with quantity = 10, unit_cost = 1250

**Expected Result:**
- Quantity = 15
- Unit cost = 1000
- Total cost = 15 × 1000 = 15000 cents

**Success Criteria:**
- ✅ Both fields updated
- ✅ Total cost recalculated correctly

---

### PART-008: Remove Part from Job

**Test Name:** Delete part record

**Input Data:**
```json
{
  "partId": "TEST_PART_ID"
}
```

**Expected Result:**
- Record deleted from `job_materials`

**Success Criteria:**
- ✅ Response: `{ success: true, message: "Part removed successfully" }`
- ✅ Database: Record no longer exists
- ✅ Other parts for same job unaffected

**How to Verify:**
```sql
SELECT * FROM job_materials WHERE id = '[PART_ID]';
-- Should return no rows
```

---

### PART-009: Validation - Negative Quantity

**Test Name:** Reject negative quantity

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "parts": [
    {
      "name": "Test Part",
      "quantity": -5,
      "unit": "each",
      "unitCost": 1000
    }
  ]
}
```

**Expected Result:**
- Error: "Quantity must be greater than 0"

**Success Criteria:**
- ✅ Validation fails
- ✅ No record inserted
- ✅ Clear error message

---

### PART-010: Validation - Zero Quantity

**Test Name:** Reject zero quantity

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "parts": [
    {
      "name": "Test Part",
      "quantity": 0,
      "unit": "each",
      "unitCost": 1000
    }
  ]
}
```

**Expected Result:**
- Error: "Quantity must be greater than 0"

**Success Criteria:**
- ✅ Validation blocks insertion

---

### PART-011: Validation - Negative Cost

**Test Name:** Reject negative unit cost

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "parts": [
    {
      "name": "Test Part",
      "quantity": 5,
      "unit": "each",
      "unitCost": -1000
    }
  ]
}
```

**Expected Result:**
- Error: "Unit cost must be a positive number"

**Success Criteria:**
- ✅ Validation fails
- ✅ Error message clear

---

### PART-012: Validation - Missing Required Fields

**Test Name:** Reject part without name

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "parts": [
    {
      "quantity": 5,
      "unit": "each",
      "unitCost": 1000
    }
  ]
}
```

**Expected Result:**
- Error: "Material name is required"

**Success Criteria:**
- ✅ Validation catches missing field
- ✅ No partial data inserted

---

### PART-013: Validation - Non-Existent Job

**Test Name:** Attempt to add parts to invalid job ID

**Input Data:**
```json
{
  "jobId": "invalid-uuid-12345",
  "parts": [
    {
      "name": "Test Part",
      "quantity": 1,
      "unit": "each",
      "unitCost": 1000
    }
  ]
}
```

**Expected Result:**
- Error: "Job not found"

**Success Criteria:**
- ✅ Foreign key validation works
- ✅ No orphaned records

---

### PART-014: Cross-Account Security Test

**Test Name:** Verify RLS prevents accessing other account's parts

**Input Data:**
```json
{
  "partId": "OTHER_ACCOUNT_PART_ID"
}
```

**Expected Result:**
- Error: "Part not found" (or 403 Forbidden)

**Success Criteria:**
- ✅ Cannot view parts from other accounts
- ✅ Cannot update parts from other accounts
- ✅ Cannot delete parts from other accounts
- ✅ RLS policies enforced

---

## Email Parts List Tests

### EMAIL-001: Email Parts List - Single Part

**Test Name:** Email formatted parts list with one item

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "recipientEmail": "customer@example.com"
}
```

**Prerequisites:**
- Job exists with customer name
- Job has 1 part: PVC Pipe, qty 10, unit cost $12.50

**Expected Result:**
- Email sent successfully
- HTML formatted with table
- Currency formatted: $12.50 (not $12.5 or 12.50)
- Subtotal: $125.00
- Total: $125.00

**Success Criteria:**
- ✅ Response: `{ success: true, messageId: "...", message: "..." }`
- ✅ Email contains job number
- ✅ Email contains customer name
- ✅ Email contains part details
- ✅ Currency formatting correct

**How to Verify:**
- Check Resend API dashboard for sent email
- Verify email received in customer inbox
- Inspect HTML formatting

---

### EMAIL-002: Email Parts List - Multiple Parts

**Test Name:** Email with 5 different parts

**Prerequisites:**
- Job has 5 parts with various quantities and costs

**Expected Result:**
- All 5 parts listed in table
- Each line shows: name, quantity, unit price, total
- Subtotal = sum of all line totals
- Proper table formatting (borders, headers)

**Success Criteria:**
- ✅ All parts included
- ✅ Table rows formatted correctly
- ✅ Calculations accurate

---

### EMAIL-003: Currency Formatting Verification

**Test Name:** Verify proper dollar/cent formatting

**Test Data:**
- Part 1: $0.99 (edge case - under $1)
- Part 2: $1,234.56 (thousands separator)
- Part 3: $10.00 (exact dollars, show .00)

**Expected Email Content:**
```
Unit Price    Total
$0.99         $0.99
$1,234.56     $1,234.56
$10.00        $10.00
```

**Success Criteria:**
- ✅ No missing decimals (e.g., not "$10")
- ✅ Proper thousand separators
- ✅ Cents always shown (.00, .50, .99)

---

### EMAIL-004: Error - Job Has No Parts

**Test Name:** Handle empty parts list gracefully

**Input Data:**
```json
{
  "jobId": "EMPTY_JOB_ID",
  "recipientEmail": "customer@example.com"
}
```

**Expected Result:**
- Error: "Job has no parts to email"

**Success Criteria:**
- ✅ No email sent
- ✅ Error message clear
- ✅ No partial/empty email

---

### EMAIL-005: Error - Invalid Email Address

**Test Name:** Validate email format

**Input Data:**
```json
{
  "jobId": "TEST_JOB_ID",
  "recipientEmail": "not-an-email"
}
```

**Expected Result:**
- Error: "Invalid email address"

**Success Criteria:**
- ✅ Validation catches bad format
- ✅ No API call to Resend

---

### EMAIL-006: Email with Tax Included

**Test Name:** Include tax in parts list email (if applicable)

**Prerequisites:**
- Job has parts totaling $100.00
- Tax rate 8% ($8.00)

**Expected Result:**
```
Subtotal:  $100.00
Tax (8%):  $8.00
Total:     $108.00
```

**Success Criteria:**
- ✅ Tax line appears if tax > 0
- ✅ Tax calculation correct
- ✅ Grand total includes tax

---

## Test Execution Checklist

### Pre-Testing Setup

- [ ] Dev server running: `PORT=3002 npm run dev`
- [ ] Database accessible (Supabase connection works)
- [ ] `.next/` cache cleared
- [ ] Test account created with sample data
- [ ] Test contact created
- [ ] Resend API configured (for email tests)
- [ ] TypeScript compiles: `npm run build`

---

### Phase 1: Estimates System (EST-001 through EST-012)

Execute in order:

- [ ] EST-001: Create basic estimate
- [ ] EST-002: Create estimate with mixed items
- [ ] EST-003: Zero tax calculation
- [ ] EST-004: High tax calculation
- [ ] EST-005: Update status to "sent"
- [ ] EST-006: Update status to "accepted"
- [ ] EST-007: Update status to "rejected"
- [ ] EST-008: Convert accepted estimate to job
- [ ] EST-009: Block conversion of pending estimate
- [ ] EST-010: Block duplicate conversion
- [ ] EST-011: Large quantities edge case
- [ ] EST-012: Decimal quantities

**Phase 1 Pass Criteria:** 12/12 tests pass

---

### Phase 2: Parts Management (PART-001 through PART-014)

Execute in order:

- [ ] PART-001: Add single part
- [ ] PART-002: Add multiple parts in bulk
- [ ] PART-003: List parts for job
- [ ] PART-004: Update quantity
- [ ] PART-005: Update unit cost
- [ ] PART-006: Update notes only
- [ ] PART-007: Update quantity and cost together
- [ ] PART-008: Remove part
- [ ] PART-009: Validation - negative quantity
- [ ] PART-010: Validation - zero quantity
- [ ] PART-011: Validation - negative cost
- [ ] PART-012: Validation - missing fields
- [ ] PART-013: Validation - non-existent job
- [ ] PART-014: Cross-account security test

**Phase 2 Pass Criteria:** 14/14 tests pass

---

### Phase 3: Email Parts List (EMAIL-001 through EMAIL-006)

Execute in order:

- [ ] EMAIL-001: Single part email
- [ ] EMAIL-002: Multiple parts email
- [ ] EMAIL-003: Currency formatting verification
- [ ] EMAIL-004: Error - no parts
- [ ] EMAIL-005: Error - invalid email
- [ ] EMAIL-006: Email with tax

**Phase 3 Pass Criteria:** 6/6 tests pass

---

### Regression Testing

- [ ] Existing invoices still work
- [ ] Existing payments still work
- [ ] Job creation unaffected
- [ ] Contact management unaffected
- [ ] No console errors on dashboards

---

### Performance Testing

- [ ] Create estimate < 1 second
- [ ] Convert estimate to job < 2 seconds
- [ ] Add 10 parts < 1 second
- [ ] List parts < 500ms
- [ ] Email parts list < 5 seconds

---

### Security Testing

- [ ] RLS policies prevent cross-account access
- [ ] Non-authenticated users blocked
- [ ] Tech role cannot access estimates (if restricted)
- [ ] Proper account_id filtering on all queries

---

## Sample Test Data

### Sample Contact for Testing

```sql
INSERT INTO contacts (account_id, name, email, phone, address, city, state, zip, type)
VALUES (
  '[YOUR_ACCOUNT_ID]',
  'John Smith Test Customer',
  'john.smith.test@example.com',
  '555-0100',
  '123 Main Street',
  'San Francisco',
  'CA',
  '94101',
  'customer'
);
```

### Sample Estimate - Simple

```json
{
  "contactId": "CONTACT_ID",
  "title": "Bathroom Plumbing",
  "description": "Replace toilet and fix sink",
  "items": [
    {
      "type": "labor",
      "name": "Plumbing Labor",
      "quantity": 3,
      "unitPrice": 8500,
      "unit": "hour"
    },
    {
      "type": "material",
      "name": "Toilet",
      "quantity": 1,
      "unitPrice": 35000,
      "unit": "each"
    }
  ],
  "taxRate": 0.08
}
```

**Expected Calculations:**
- Labor: 3 × $85.00 = $255.00
- Toilet: 1 × $350.00 = $350.00
- Subtotal: $605.00
- Tax: $48.40 (8%)
- Total: $653.40

### Sample Estimate - Complex

```json
{
  "contactId": "CONTACT_ID",
  "title": "Complete Kitchen Remodel",
  "description": "Full plumbing and fixture installation",
  "items": [
    {
      "type": "labor",
      "name": "Master Plumber",
      "description": "Licensed master plumber services",
      "quantity": 16,
      "unitPrice": 9500,
      "unit": "hour"
    },
    {
      "type": "labor",
      "name": "Apprentice",
      "description": "Apprentice plumber assistance",
      "quantity": 16,
      "unitPrice": 5500,
      "unit": "hour"
    },
    {
      "type": "material",
      "name": "Kitchen Sink",
      "quantity": 1,
      "unitPrice": 45000,
      "unit": "each"
    },
    {
      "type": "material",
      "name": "Faucet",
      "quantity": 1,
      "unitPrice": 28000,
      "unit": "each"
    },
    {
      "type": "material",
      "name": "Copper Pipe",
      "quantity": 100,
      "unitPrice": 450,
      "unit": "ft"
    },
    {
      "type": "material",
      "name": "PVC Drain Pipe",
      "quantity": 50,
      "unitPrice": 350,
      "unit": "ft"
    },
    {
      "type": "equipment",
      "name": "Pipe Threading Equipment Rental",
      "quantity": 2,
      "unitPrice": 7500,
      "unit": "day"
    }
  ],
  "taxRate": 0.0825,
  "validUntil": "2025-12-15",
  "customerNotes": "Customer requests eco-friendly fixtures. Schedule around holidays."
}
```

**Expected Calculations:**
- Master Plumber: 16 × $95 = $1,520.00
- Apprentice: 16 × $55 = $880.00
- Kitchen Sink: 1 × $450 = $450.00
- Faucet: 1 × $280 = $280.00
- Copper Pipe: 100 × $4.50 = $450.00
- PVC Pipe: 50 × $3.50 = $175.00
- Equipment: 2 × $75 = $150.00
- **Subtotal: $3,905.00**
- **Tax (8.25%): $322.16**
- **Total: $4,227.16**

### Sample Parts for Job

```json
{
  "jobId": "JOB_ID",
  "parts": [
    {
      "name": "PVC Pipe 2 inch",
      "quantity": 10,
      "unit": "ft",
      "unitCost": 1250,
      "supplier": "Home Depot",
      "notes": "Schedule 40, white"
    },
    {
      "name": "Pipe Fitting - 90° Elbow",
      "quantity": 4,
      "unit": "each",
      "unitCost": 350,
      "supplier": "Lowes"
    },
    {
      "name": "PVC Cement",
      "quantity": 1,
      "unit": "can",
      "unitCost": 895,
      "supplier": "Home Depot",
      "notes": "Medium body, blue"
    }
  ]
}
```

**Expected Total:** $26.45
- PVC Pipe: 10 × $12.50 = $125.00
- Elbows: 4 × $3.50 = $14.00
- Cement: 1 × $8.95 = $8.95

---

## Success Criteria

### Overall Test Results

**100% Pass Rate Required:**
- All 32 critical tests must pass
- Zero P0 (blocker) issues
- < 2 P1 (critical) issues with documented workarounds

**Acceptable:**
- Minor edge cases (P2/P3) documented for future fixes
- Performance slightly above target but still usable

---

### Code Quality

- ✅ All TypeScript types defined (no `any` types)
- ✅ No compilation errors
- ✅ Consistent error handling patterns
- ✅ Clear, descriptive error messages
- ✅ Input validation on all tools
- ✅ Currency always in cents (no floating point errors)

---

### Database Integrity

- ✅ All RLS policies enforced
- ✅ Foreign key constraints respected
- ✅ No orphaned records
- ✅ Proper account_id filtering
- ✅ Timestamps auto-populate (`created_at`, `updated_at`)

---

### Functionality

- ✅ Estimates create with items
- ✅ Totals calculate correctly (subtotal, tax, total)
- ✅ Estimate status updates work
- ✅ Estimate converts to job
- ✅ Job materials copied correctly
- ✅ Parts add/update/remove work
- ✅ Parts list emails with proper formatting

---

### User Experience

- ✅ Voice agent can create estimates naturally
- ✅ Voice agent can add parts with simple commands
- ✅ Error messages guide user to fix issues
- ✅ Currency displays properly ($XX.XX format)

---

### Documentation

- ✅ All tools documented with examples
- ✅ Migration instructions clear
- ✅ Voice agent integration examples provided
- ✅ Test scenarios comprehensive

---

## Failure Protocol

If any test fails:

### 1. Document the Failure

```markdown
## Test Failure Report

**Test ID:** EST-008
**Test Name:** Convert Accepted Estimate to Job
**Date:** 2025-11-27
**Severity:** P0 (Blocker)

**Expected:**
- Job created with status "scheduled"
- 3 materials copied to job_materials

**Actual:**
- Job created but materials not copied
- job_materials table has 0 records

**Error Message:**
```
Error: Cannot read property 'map' of undefined
```

**Steps to Reproduce:**
1. Create estimate with 3 items
2. Update status to "accepted"
3. Call convert_estimate_to_job
4. Check job_materials table

**Root Cause:**
`estimate_items` is stored as JSONB but not being parsed correctly

**Assigned To:** Agent-1 (Parts Management)
```

### 2. Categorize Severity

- **P0 (Blocker):** Core feature broken, blocks Phase 3 completion
- **P1 (Critical):** Feature works but has errors, workaround exists
- **P2 (Important):** Edge case or minor issue
- **P3 (Nice-to-fix):** Cosmetic or non-critical

### 3. Re-Test After Fix

- [ ] Fix implemented
- [ ] Test re-executed
- [ ] Test passes
- [ ] No new regressions introduced

---

## Performance Benchmarks

### Acceptable Performance:

- Create estimate: < 1 second
- Update estimate status: < 500ms
- Convert estimate to job: < 2 seconds
- Add single part: < 500ms
- Add 10 parts in bulk: < 1 second
- List parts (50 items): < 500ms
- Update part: < 500ms
- Remove part: < 500ms
- Email parts list: < 5 seconds

**Measurement Tool:** Use browser DevTools Network tab or `console.time()`

---

## Voice Agent Integration Examples

### Creating Estimates

**User:** "Create an estimate for John Smith. 2 hours of labor at $85 per hour and a new toilet for $350. Add 8% tax."

**Expected:** Tool creates estimate with 2 items, calculates totals correctly.

---

### Adding Parts

**User:** "Add parts to job 12345: 10 feet of PVC pipe at $12.50 per foot and 4 pipe fittings at $3.50 each."

**Expected:** Tool adds 2 parts with correct quantities and costs.

---

### Emailing Parts List

**User:** "Email the parts list for job 12345 to john@example.com"

**Expected:** Formatted email sent with all parts, totals, proper currency formatting.

---

## Test Coverage Summary

| Category | Test Count | Critical Tests | Edge Cases | Validation Tests |
|----------|------------|----------------|------------|------------------|
| Estimates | 12 | 8 | 2 | 2 |
| Parts | 14 | 8 | 1 | 5 |
| Email | 6 | 3 | 1 | 2 |
| **TOTAL** | **32** | **19** | **4** | **9** |

**Coverage Areas:**
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Calculations (subtotal, tax, total)
- ✅ Status workflows (pending → sent → accepted → converted)
- ✅ Data integrity (foreign keys, RLS, account isolation)
- ✅ Validation (negative values, missing data, invalid IDs)
- ✅ Edge cases (large numbers, decimals, zero tax)
- ✅ Email formatting (currency, HTML, error handling)
- ✅ Security (cross-account access prevention)

**Confidence Level Target:** 98%+

---

## Final Sign-Off

All tests must pass before marking Phase 3 as COMPLETE:

- [ ] **32/32 tests pass** (100% pass rate)
- [ ] Zero P0 blockers
- [ ] < 2 P1 issues (documented)
- [ ] All features functional end-to-end
- [ ] Voice agent integration tested
- [ ] Documentation complete
- [ ] Migration script verified in Supabase

**Status:** READY FOR EXECUTION

---

**Last Updated:** 2025-11-27
**Agent:** AGENT-3 (Testing & Validation)
**Review Status:** Pending execution
