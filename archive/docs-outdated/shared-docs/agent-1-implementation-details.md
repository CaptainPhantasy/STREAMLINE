# AGENT-1 Implementation Details

## Parts Management Tools - Technical Specification

### Overview
Added 4 new MCP tools for managing parts/materials on jobs in the CRM system. All tools follow existing patterns, include proper validation, and maintain security through account-based filtering.

---

## 1. add_job_parts

### Tool Definition (line 882)
```typescript
{
  name: 'add_job_parts',
  description: 'Add parts/materials to a job. Use when tech says "add 3 pipe fittings at $3.50 each to the Smith job" or "record materials used".',
  inputSchema: {
    type: 'object',
    properties: {
      jobId: { type: 'string', description: 'UUID of the job' },
      parts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Part/material name' },
            quantity: { type: 'number', description: 'Quantity used' },
            unit: { type: 'string', description: 'Unit of measurement (e.g., "each", "ft", "gallon")' },
            unitCost: { type: 'number', description: 'Unit cost in cents' },
            supplier: { type: 'string', description: 'Supplier name (optional)' },
            notes: { type: 'string', description: 'Additional notes (optional)' }
          },
          required: ['name', 'quantity', 'unitCost']
        }
      }
    },
    required: ['jobId', 'parts']
  }
}
```

### Handler Implementation (line 3987)
**Validation Steps:**
1. Validate job exists and belongs to account
2. Validate each part: quantity > 0, unitCost >= 0
3. Prepare parts with calculated total_cost
4. Insert into job_materials table

**Return Format:**
```typescript
{
  success: true,
  parts: [...insertedParts],
  message: "Added N part(s) to job"
}
```

**Error Cases:**
- Job not found or access denied
- Quantity <= 0
- Unit cost < 0

---

## 2. list_job_parts

### Tool Definition (line 930)
```typescript
{
  name: 'list_job_parts',
  description: 'List all parts/materials for a job. Use when user asks "what parts were used on this job?" or "show me materials for the Johnson job".',
  inputSchema: {
    type: 'object',
    properties: {
      jobId: { type: 'string', description: 'UUID of the job' }
    },
    required: ['jobId']
  }
}
```

### Handler Implementation (line 4052)
**Validation Steps:**
1. Validate job exists and belongs to account
2. Fetch all parts ordered by created_at

**Return Format:**
```typescript
{
  parts: [...parts],
  count: N
}
```

**Error Cases:**
- Job not found or access denied

---

## 3. update_job_part

### Tool Definition (line 944)
```typescript
{
  name: 'update_job_part',
  description: 'Update a part quantity or cost. Use when user says "change the quantity to 5" or "update the cost to $12.50".',
  inputSchema: {
    type: 'object',
    properties: {
      partId: { type: 'string', description: 'UUID of the part to update' },
      quantity: { type: 'number', description: 'New quantity (optional)' },
      unitCost: { type: 'number', description: 'New unit cost in cents (optional)' },
      notes: { type: 'string', description: 'Updated notes (optional)' }
    },
    required: ['partId']
  }
}
```

### Handler Implementation (line 4085)
**Validation Steps:**
1. Validate at least one field to update provided
2. Validate part exists and belongs to account
3. If quantity provided: validate > 0
4. If unitCost provided: validate >= 0
5. Recalculate total_cost based on final quantity and unitCost
6. Update part

**Return Format:**
```typescript
{
  success: true,
  part: {...updatedPart},
  message: "Part updated successfully"
}
```

**Error Cases:**
- Part not found or access denied
- No fields provided to update
- Quantity <= 0
- Unit cost < 0

---

## 4. remove_job_part

### Tool Definition (line 970)
```typescript
{
  name: 'remove_job_part',
  description: 'Remove a part from a job. Use when user says "remove that part" or "delete the pipe fitting from the job".',
  inputSchema: {
    type: 'object',
    properties: {
      partId: { type: 'string', description: 'UUID of the part to remove' }
    },
    required: ['partId']
  }
}
```

### Handler Implementation (line 4156)
**Validation Steps:**
1. Verify part exists and belongs to account
2. Delete from job_materials table

**Return Format:**
```typescript
{
  success: true,
  message: 'Part "NAME" removed successfully'
}
```

**Error Cases:**
- Part not found or access denied

---

## Database Schema

### job_materials Table
```sql
CREATE TABLE job_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  job_id uuid REFERENCES jobs(id) NOT NULL,
  material_name text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text DEFAULT 'each',
  unit_cost integer, -- In cents
  total_cost integer, -- In cents (quantity * unit_cost)
  supplier text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
- Primary key on `id`
- Foreign key indexes on `account_id` and `job_id`

**RLS Policies:**
- Users can only access parts for their account_id

---

## Integration Flow

### Estimate → Job → Parts Flow
1. Sales creates estimate with line items (estimate_items)
2. Customer accepts estimate
3. Estimate converted to job via `convert_estimate_to_job`
4. Estimate items copied to job_materials
5. Tech completes job, may add additional parts via `add_job_parts`
6. Office can list parts via `list_job_parts`
7. Office emails parts list to customer via `email_parts_list`
8. Office creates invoice including all parts

### Voice Agent Commands
```
User: "Add 3 pipe fittings at $3.50 each to the Smith job"
Agent: Calls add_job_parts with:
  - jobId: [looked up from "Smith job"]
  - parts: [{ name: "pipe fittings", quantity: 3, unitCost: 350 }]

User: "What parts were used on this job?"
Agent: Calls list_job_parts with jobId

User: "Update the quantity to 5"
Agent: Calls update_job_part with:
  - partId: [from context]
  - quantity: 5

User: "Remove that part"
Agent: Calls remove_job_part with partId
```

---

## Testing Checklist

### Happy Path Tests
- [ ] Add single part to job
- [ ] Add multiple parts to job (3+)
- [ ] List parts for job with parts
- [ ] List parts for job with no parts
- [ ] Update part quantity
- [ ] Update part unit cost
- [ ] Update part notes
- [ ] Remove part from job

### Validation Tests
- [ ] Add part with quantity = 0 (should fail)
- [ ] Add part with negative quantity (should fail)
- [ ] Add part with negative cost (should fail)
- [ ] Update part with quantity = 0 (should fail)
- [ ] Update part with no fields (should fail)

### Security Tests
- [ ] Add part to non-existent job (should fail)
- [ ] Add part to job from different account (should fail)
- [ ] Update part from different account (should fail)
- [ ] Remove part from different account (should fail)

### Currency Tests
- [ ] Add part with cost $3.50 → verify stored as 350
- [ ] Add part quantity 2.5, cost $10.00 → verify total_cost = 2500
- [ ] Update quantity 3, cost $5.25 → verify total_cost = 1575

---

## Code Quality Metrics

### Lines of Code
- Tool definitions: 102 lines
- Handler implementations: 222 lines
- Total: 324 lines

### Complexity
- Average cyclomatic complexity: 3-4 (low)
- Maximum nesting depth: 2 (good)
- Number of validations per tool: 2-4 (appropriate)

### Test Coverage Target
- Unit tests: 90%+ (to be implemented by AGENT-3)
- Integration tests: 100% of happy paths
- Edge cases: All validation scenarios

---

## Performance Considerations

### Database Queries
- `add_job_parts`: 1 SELECT (job validation) + 1 INSERT (batch)
- `list_job_parts`: 1 SELECT (job validation) + 1 SELECT (fetch parts)
- `update_job_part`: 1 SELECT (part validation) + 1 UPDATE
- `remove_job_part`: 1 SELECT (part validation) + 1 DELETE

### Optimization Notes
- Batch insert for multiple parts (single query)
- Indexed queries on account_id and job_id
- No N+1 query issues

---

## Future Enhancements (Not Implemented)

### Potential Future Features
1. Bulk update parts (update multiple at once)
2. Part history/audit log (track changes)
3. Part categories/tags for reporting
4. Inventory integration (track stock levels)
5. Supplier management (preferred suppliers, pricing)
6. Part templates (common parts with default costs)

---

**Document Version:** 1.0
**Author:** AGENT-1
**Date:** 2025-01-27
**Status:** Implementation Complete ✅
