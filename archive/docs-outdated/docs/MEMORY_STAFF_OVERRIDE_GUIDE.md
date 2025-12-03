# Memory Protocol - Staff-Only Implementation Guide

**Document Type:** Internal Implementation Guide
**Classification:** Staff-Only Overrides
**Date:** November 28, 2025
**Purpose:** Optimize memory protocol for speed/recovery, not conversational pleasantries

---

## Executive Summary

The standard memory protocol has been modified with staff-specific overrides to optimize for operational efficiency. The system now prioritizes rapid recovery from dropped calls rather than conversational continuity for completed jobs.

## Key Changes

### 1. Intent-Based Filtering

**Intent Values:**
- `in_progress` = Active conversation that was interrupted
- `completed` = Job successfully finished, do not reference again
- Other values = Tracking purposes (job_creation, scheduling, etc.)

### 2. Selective Memory Recall

**Rule:** Only trigger "Welcome Back" for `in_progress` conversations
- **Rationale:** Completed jobs don't need acknowledgment
- **Benefit:** Reduces confusion and speeds up new interactions
- **Implementation:** Check intent field before greeting

### 3. Streamlined Recovery

**Before:** "Welcome back. I see we were discussing..."
**After:** "Welcome back. Resuming where we left off."

**Why:**
- Faster acknowledgment
- Direct to action
- Assumes user wants to continue

## Implementation Logic

### Handshake Flow
```python
memory = read_agent_memory(phoneNumber)

if not memory.found:
    # New caller
    greet_standard()
elif memory.intent == "completed":
    # Previous job done, treat as new
    greet_standard()
elif memory.intent == "in_progress":
    # Dropped call, recover
    greet_welcome_back(memory.summary)
    resume_conversation(memory.stagingData)
```

### Checkpoint Triggers

**Save State When:**
- User provides address
- User describes issue
- User gives contact name
- Any critical job detail is captured

**Always set intent to "in_progress" during checkpoints**

### Completion Protocol

**When job is created:**
```javascript
update_agent_memory({
    phoneNumber,
    summary: "Job successfully created",
    intent: "completed"
})
```

## Example Scenarios

### Scenario 1: Dropped Call Recovery
```
First call disconnects while getting address
Memory: { intent: "in_progress", summary: "User needs heater repair" }

Second call:
Agent: "Welcome back. Resuming where we left off. You needed a heater repair. What's the address?"
```

### Scenario 2: Previous Completed Job
```
Yesterday: User created job, it was completed
Memory: { intent: "completed", summary: "Job #12345 created" }

Today's call:
Agent: "Thank you for calling. How can I help you today?"  # No mention of yesterday
```

### Scenario 3: Same Day Follow-up
```
Morning: User inquired about pricing, no job created
Memory: { intent: "scheduling", summary: "User asking about availability" }

Afternoon call:
Agent: "Welcome back. I see we were discussing availability. Are you ready to schedule?"
```

## Performance Benefits

1. **Reduced Confusion:** Users aren't reminded of completed jobs
2. **Faster Resolution:** Direct recovery for dropped calls
3. **Clean State:** Each completed job creates a clean slate
4. **Staff Efficiency:** Less unnecessary conversation context

## Edge Cases

### Multiple Jobs Same Day
- Only the most recent memory is retained
- Completed intent prevents confusion between jobs
- New inquiries always start fresh

### Quick Call Backs
- If user calls back within minutes with completed intent:
  - System treats as new call
  - Staff can still access job history if needed

### System Outages
- Memory persists across server restarts
- 72-hour window handles extended outages
- Intent-based recovery remains consistent

## Monitoring

### Metrics to Track
1. Recovery Rate: % of dropped calls successfully resumed
2. Completion Rate: Jobs marked as completed vs. abandoned
3. Call Duration: Impact on average call time
4. User Satisfaction: Feedback on recovery experience

### Alerts
- High rate of "in_progress" → "completed" conversion
- Low memory retrieval success
- Extended "in_progress" duration (>4 hours)

## Conclusion

These staff-only overrides transform the memory feature from a general conversational aid into a targeted recovery tool. By focusing on operational efficiency, we reduce call times while maintaining the critical capability to resume interrupted conversations.

---

**Implementation Status:** ✅ ACTIVE
**Next Review:** 30 days after deployment