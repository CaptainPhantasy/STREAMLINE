# GUI vs NLUI Workflow Comparison
## CRM-AI PRO - 317 Plumber Full Day Journey

**Last Updated:** Nov 26, 2025

This document shows how each step in a typical workday can be accomplished via:
- **GUI** (Graphical User Interface) - clicking, tapping, typing
- **NLUI** (Natural Language User Interface) - voice commands to the AI agent

---

## MORNING ROUTINE (7:00 AM - 8:00 AM)

### Step 1: Login & Dashboard Review

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open app → Enter email/password → Click "Sign In" | "Hey, open the CRM" (agent handles auth via saved session) |
| Navigate to Jobs dashboard | "What's on my schedule today?" |
| Click through each job to see details | "Brief me on today's jobs" |

**NLUI Implementation:**
```typescript
// MCP Tool: get_morning_briefing
{
  name: 'get_morning_briefing',
  description: 'Get overview of today\'s schedule, pending tasks, and alerts',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
}

// Voice command triggers this, agent responds with:
// "Good morning! You have 3 jobs today:
//  - 8:30 AM: Mike Henderson - kitchen faucet repair
//  - 11:00 AM: Robert Chen - water heater installation
//  - 2:00 PM: James Wilson - sewer line inspection
//  You also have 2 unread messages."
```

---

### Step 2: Check Messages/Inbox

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Click "Inbox" in sidebar | "Do I have any new messages?" |
| Scroll through conversation list | "Read my unread messages" |
| Click on conversation to read | "What did Amanda Torres say?" |
| Type reply, click Send | "Reply to Amanda: We'll send the invoice today" |

**NLUI Implementation:**
```typescript
// MCP Tool: get_unread_messages
case 'get_unread_messages': {
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, subject, status, contact:contacts(first_name, last_name),
      messages(body_text, direction, created_at)
    `)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })
    .limit(5)
  
  return formatMessagesForVoice(conversations)
}

// MCP Tool: send_reply
case 'send_reply': {
  const { contactName, message } = args
  // Find contact, find/create conversation, send message
  await createMessage(conversationId, message, 'outbound')
  return `Message sent to ${contactName}`
}
```

---

## FIRST JOB: Kitchen Faucet Repair (8:30 AM)

### Step 3: Navigate to Job Site

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open Jobs → Find job → Click "Get Directions" | "Navigate to my first job" |
| Click address to open Maps app | "Take me to Mike Henderson's place" |
| Manually mark as "En Route" | "I'm heading to the Henderson job now" |

**NLUI Implementation:**
```typescript
// MCP Tool: start_navigation
case 'start_navigation': {
  const { jobId, contactName } = args
  
  // Find job by ID or contact name
  const job = await findJob(jobId, contactName)
  
  // Update job status
  await supabase.from('jobs')
    .update({ status: 'en_route' })
    .eq('id', job.id)
  
  // Log GPS
  await logGPS(userId, job.id, 'departure')
  
  // Return directions URL
  const mapsUrl = `https://maps.google.com/?daddr=${encodeURIComponent(job.contact.address)}`
  
  return {
    message: `Heading to ${job.contact.first_name}'s. Opening directions.`,
    action: 'open_url',
    url: mapsUrl
  }
}
```

---

### Step 4: Arrive at Job Site (Gate 1)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open app → Go to current job → Tap "I've Arrived" | "I'm here" or "I've arrived" |
| GPS logs automatically | GPS logs automatically |
| See customer details on screen | "Remind me about this customer" |

**NLUI Implementation:**
```typescript
// Voice command: "I'm here" / "I've arrived"
// Webhook parses intent, calls MCP tool

case 'log_arrival': {
  const { jobId } = args
  
  // Get current location
  const position = await getCurrentPosition()
  
  // Log arrival in gps_logs
  await supabase.from('gps_logs').insert({
    job_id: jobId,
    user_id: userId,
    latitude: position.latitude,
    longitude: position.longitude,
    event_type: 'arrival'
  })
  
  // Update job status
  await supabase.from('jobs')
    .update({ status: 'in_progress' })
    .eq('id', jobId)
  
  // Complete the arrival gate
  await supabase.from('job_gates').insert({
    job_id: jobId,
    stage_name: 'arrival',
    status: 'completed',
    completed_by: userId
  })
  
  return "Arrival logged. Time to take before photos."
}
```

---

### Step 5: Take Before Photos (Gate 2)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Tap "Take Photo" button | "Take a before photo" |
| Phone camera opens | Phone camera opens |
| Take photo, it uploads automatically | Take photo, it uploads automatically |
| Tap "Continue" when done | "I'm done with before photos" |

**NLUI Implementation:**
```typescript
// The photo capture itself still uses the camera (can't voice that)
// But the flow control is voice-enabled:

// Voice: "Take a before photo"
// Agent: Opens camera intent with metadata { type: 'before', jobId }

// Voice: "I'm done with before photos"
case 'complete_photo_gate': {
  const { jobId, photoType } = args
  
  // Check photos exist
  const { data: photos } = await supabase
    .from('job_photos')
    .select('id')
    .eq('job_id', jobId)
    .eq('metadata->>type', photoType)
  
  if (!photos || photos.length === 0) {
    return "You need to take at least one before photo first."
  }
  
  // Complete the gate
  await supabase.from('job_gates').insert({
    job_id: jobId,
    stage_name: `${photoType}_photos`,
    status: 'completed',
    metadata: { photoCount: photos.length }
  })
  
  return `${photos.length} before photo(s) saved. You can start working now.`
}
```

---

### Step 6: Do the Work

| GUI Approach | NLUI Approach |
|--------------|---------------|
| (Physical work - no UI needed) | (Physical work - no UI needed) |
| Optional: Add notes in app | "Add note: Found corroded supply lines, replacing both" |
| Optional: Log materials used | "I used a Moen faucet model 7594 and new supply lines" |

**NLUI Implementation:**
```typescript
// Voice: "Add note: Found corroded supply lines"
case 'add_job_note': {
  const { jobId, note } = args
  
  // Append to job notes
  const { data: job } = await supabase
    .from('jobs')
    .select('notes')
    .eq('id', jobId)
    .single()
  
  const updatedNotes = job.notes 
    ? `${job.notes}\n\n[${new Date().toLocaleTimeString()}] ${note}`
    : `[${new Date().toLocaleTimeString()}] ${note}`
  
  await supabase.from('jobs')
    .update({ notes: updatedNotes })
    .eq('id', jobId)
  
  return "Note added."
}

// Voice: "I used a Moen faucet model 7594"
case 'log_materials': {
  const { jobId, materials } = args
  
  // AI extracts material info from natural speech
  // "Moen faucet model 7594" → { name: "Moen Faucet", model: "7594" }
  
  await supabase.from('job_materials').insert({
    job_id: jobId,
    material_name: materials.name,
    notes: materials.model
  })
  
  return "Material logged."
}
```

---

### Step 7: Mark Work Complete (Gate 3)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Tap "Work Complete" button | "I'm done with the work" or "Work is finished" |

**NLUI Implementation:**
```typescript
// Voice: "I'm done with the work"
case 'complete_work': {
  const { jobId } = args
  
  // Verify before photos were taken
  const { data: beforeGate } = await supabase
    .from('job_gates')
    .select('id')
    .eq('job_id', jobId)
    .eq('stage_name', 'before_photos')
    .eq('status', 'completed')
    .single()
  
  if (!beforeGate) {
    return "You need to complete before photos first."
  }
  
  await supabase.from('job_gates').insert({
    job_id: jobId,
    stage_name: 'work_complete',
    status: 'completed'
  })
  
  return "Work marked complete. Time for after photos."
}
```

---

### Step 8: Take After Photos (Gate 4)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Tap "Take Photo" | "Take an after photo" |
| Camera opens, take photos | Camera opens, take photos |
| Tap "Continue" | "Done with after photos" |

(Same implementation pattern as before photos)

---

### Step 9: Customer Satisfaction Rating (Gate 5)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Show customer the tablet/phone | "How would you rate our service today? 1 to 5?" |
| Customer taps 1-5 stars | Tech enters rating verbally: "Customer gave us a 5" |
| If 1-3: Escalates to office | If 1-3: "Alerting the office about the low rating" |

**NLUI Implementation:**
```typescript
// Voice: "Customer gave us a 5" or "They rated us 4"
case 'record_satisfaction': {
  const { jobId, rating } = args
  
  await supabase.from('job_gates').insert({
    job_id: jobId,
    stage_name: 'satisfaction',
    status: rating <= 3 ? 'pending' : 'completed',
    satisfaction_rating: rating,
    requires_exception: rating <= 3
  })
  
  if (rating <= 3) {
    // Notify office
    await createEscalationNotification(jobId, rating)
    return `Rating recorded. I've notified the office about the ${rating}-star rating. They'll follow up with the customer.`
  }
  
  return `Great! ${rating} stars recorded. Would you like to ask about a Google review?`
}
```

---

### Step 10: Review Request (Gate 6)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Screen shows "Would you like to leave a review for 5% off?" | "Would they like to leave a Google review for 5% off?" |
| Customer taps Yes/No | Tech: "Yes, they'll do the review" |
| If Yes: Shows QR code to Google Reviews | "Showing the review link now" |

**NLUI Implementation:**
```typescript
// Voice: "Yes, they'll do the review"
case 'request_review': {
  const { jobId, accepted } = args
  
  await supabase.from('job_gates').insert({
    job_id: jobId,
    stage_name: 'review_request',
    status: 'completed',
    review_requested: accepted,
    discount_applied: accepted ? 5 : null
  })
  
  if (accepted) {
    // Get Google review link
    const { data: account } = await supabase
      .from('accounts')
      .select('google_review_link')
      .single()
    
    return {
      message: "Showing the Google review page. 5% discount applied.",
      action: 'open_url',
      url: account.google_review_link
    }
  }
  
  return "No problem. Moving to signature."
}
```

---

### Step 11: Get Customer Signature (Gate 7)

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Show signature pad on screen | "Ready for signature" |
| Customer signs with finger | Customer signs with finger |
| Tap "Complete Job" | "Job complete" |
| GPS departure logged | GPS departure logged |

**NLUI Implementation:**
```typescript
// Voice: "Job complete"
case 'complete_job': {
  const { jobId } = args
  
  // Verify all gates completed
  const gates = await verifyAllGatesComplete(jobId)
  if (!gates.allComplete) {
    return `Missing steps: ${gates.missing.join(', ')}`
  }
  
  // Log departure GPS
  await logGPS(userId, jobId, 'departure')
  
  // Update job status
  await supabase.from('jobs')
    .update({ status: 'completed' })
    .eq('id', jobId)
  
  return "Job complete! GPS logged. Ready for your next job?"
}
```

---

## BETWEEN JOBS (11:00 AM)

### Step 12: Quick Voice Note

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open Notes app, type | "Note to self: Henderson's water heater is 15 years old, might need it soon" |
| Save manually | Auto-saved and linked to contact |

**NLUI Implementation:**
```typescript
// Voice: "Note to self: Henderson's water heater..."
case 'quick_note': {
  const { contactName, note } = args
  
  // Find contact
  const contact = await findContactByName(contactName)
  
  // Add to contact profile
  const profile = contact.profile || {}
  profile.notes = profile.notes 
    ? `${profile.notes}\n[${new Date().toLocaleDateString()}] ${note}`
    : `[${new Date().toLocaleDateString()}] ${note}`
  
  await supabase.from('contacts')
    .update({ profile })
    .eq('id', contact.id)
  
  return `Note saved to ${contact.first_name}'s profile.`
}
```

---

## SALES MEETING (1:00 PM)

### Step 13: Pre-Meeting Briefing

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open Contacts → Search name → View profile | "Brief me on Jennifer Walsh" |
| Read through history, notes, past jobs | Agent summarizes everything verbally |
| Memorize key details | Agent reminds: "She was referred by Mike Henderson, prefers text updates" |

**NLUI Implementation:**
```typescript
// Voice: "Brief me on Jennifer Walsh"
case 'get_sales_briefing': {
  const { contactName } = args
  
  const contact = await findContactByName(contactName)
  const jobs = await getContactJobs(contact.id)
  const meetings = await getContactMeetings(contact.id)
  const conversations = await getContactConversations(contact.id)
  
  // Build voice-friendly briefing
  const briefing = `
    ${contact.first_name} ${contact.last_name}.
    ${contact.profile?.notes || 'No personal notes.'}
    
    ${jobs.length > 0 
      ? `They've had ${jobs.length} jobs with us, totaling $${totalSpent}.`
      : 'This is a new customer.'}
    
    ${contact.lead_source === 'referral' 
      ? `Referred by ${contact.lead_source_detail}.`
      : `Found us through ${contact.lead_source}.`}
    
    ${contact.profile?.preferences || ''}
  `
  
  return briefing.trim()
}
```

---

### Step 14: Meeting Transcription

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open Sales app → Start Meeting → Tap Record | "Start recording the meeting" |
| Phone transcribes in real-time | Phone transcribes in real-time |
| Tap Stop when done | "Stop recording" |
| Tap Save | "Save and analyze the meeting" |

**NLUI Implementation:**
```typescript
// The transcription uses Web Speech API (browser-native)
// NLUI controls the flow:

// Voice: "Start recording"
// → Sets isRecording = true, starts SpeechRecognition

// Voice: "Stop recording" 
// → Sets isRecording = false, stops SpeechRecognition

// Voice: "Save and analyze"
case 'save_meeting': {
  const { contactId, transcript } = args
  
  // Create meeting record
  const { data: meeting } = await supabase.from('meetings').insert({
    contact_id: contactId,
    transcript,
    meeting_type: 'in_person'
  }).select().single()
  
  // Call LLM to analyze
  const analysis = await analyzeMeetingTranscript(transcript)
  
  // Update with AI analysis
  await supabase.from('meetings')
    .update({
      summary: analysis.summary,
      action_items: analysis.actionItems,
      extracted_data: analysis.personalDetails
    })
    .eq('id', meeting.id)
  
  return `Meeting saved. Found ${analysis.actionItems.length} action items.`
}
```

---

## END OF DAY (5:00 PM)

### Step 15: Day Summary

| GUI Approach | NLUI Approach |
|--------------|---------------|
| Open Dashboard → View stats | "How did I do today?" |
| Scroll through completed jobs | Agent summarizes the day |
| Calculate revenue manually | "Total revenue: $2,725 from 3 jobs" |

**NLUI Implementation:**
```typescript
// Voice: "How did I do today?"
case 'get_day_summary': {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('tech_assigned_id', userId)
    .gte('scheduled_start', today.toISOString())
  
  const completed = jobs.filter(j => j.status === 'completed')
  const revenue = completed.reduce((sum, j) => sum + (j.total_amount || 0), 0)
  
  return `
    Today you completed ${completed.length} of ${jobs.length} jobs.
    Total revenue: $${(revenue / 100).toFixed(2)}.
    ${jobs.some(j => j.status === 'scheduled') 
      ? `You still have ${jobs.filter(j => j.status === 'scheduled').length} pending.`
      : 'All jobs done!'}
  `
}
```

---

## IMPLEMENTATION SUMMARY

### What's Needed for Full NLUI Support

| Component | Status | Implementation |
|-----------|--------|----------------|
| Voice Agent (ElevenLabs) | ✅ Done | Persistent widget in layout |
| MCP Tools | ✅ Many exist | `/lib/mcp/tools/crm-tools.ts` |
| Webhook Handler | ✅ Done | `/api/webhooks/elevenlabs/route.ts` |
| Intent Parsing | 🔶 Basic | Needs more patterns |
| GPS Logging | ✅ Done | `/lib/gps/tracker.ts` |
| Photo Capture | ✅ Done | Mobile camera API |
| Speech-to-Text | ✅ Done | Web Speech API |

### Key Files for NLUI:

```
/lib/mcp/tools/crm-tools.ts    - All MCP tool definitions
/mcp-server/index.ts           - MCP server implementation  
/api/webhooks/elevenlabs/       - Voice command webhook
/hooks/use-voice-navigation.ts - Frontend navigation listener
```

### Adding New Voice Commands:

1. **Add MCP Tool** in `crm-tools.ts`:
```typescript
{
  name: 'your_new_command',
  description: 'What it does - include trigger phrases',
  inputSchema: { ... }
}
```

2. **Add Handler** in the switch statement:
```typescript
case 'your_new_command': {
  // Implementation
  return result
}
```

3. **Test via Agent**: Just speak naturally - the LLM routes to the right tool.

---

## BENEFITS COMPARISON

| Aspect | GUI | NLUI |
|--------|-----|------|
| Learning curve | Higher (find buttons) | Lower (speak naturally) |
| Speed for simple tasks | Slower (tap, scroll) | Faster (just speak) |
| Speed for complex tasks | Can be faster (visual) | May need clarification |
| Hands-free operation | ❌ No | ✅ Yes |
| Works while driving | ❌ No | ✅ Yes |
| Works in loud environments | ✅ Yes | 🔶 Depends |
| Precise data entry | ✅ Better | 🔶 AI may mishear |
| Accessibility | 🔶 Varies | ✅ Great |

**Best Practice**: Support BOTH. Let users choose based on context.

---

*Document created: Nov 26, 2025*
*For 317 Plumber pilot implementation*

