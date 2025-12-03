# Task 4: Meeting AI Processing

**Agent:** D (AI Integration Specialist)
**Priority:** IMPORTANT
**Duration:** 4-6 hours
**Dependencies:** None
**Confidence:** 100%

---

## 🎯 **Objective**

Add AI-powered summary and action item extraction to sales meeting transcripts using Anthropic Claude API.

---

## 📋 **Current State**

**What EXISTS:**
- ✅ Meeting transcription (app/m/sales/meeting/[id]/page.tsx)
- ✅ Web Speech API integration
- ✅ Transcript saves to `meetings` table
- ✅ Meetings table has `summary`, `action_items`, `extracted_data` columns
- ⚠️ AI processing: NOT IMPLEMENTED (transcripts save but no AI processing)

**Current Flow:**
1. Sales rep records meeting → transcript captured ✅
2. Transcript saves to DB → works ✅
3. AI analyzes transcript → ❌ MISSING
4. Summary/action items shown → ❌ MISSING

**Existing Code:**
```typescript
// app/m/sales/meeting/[id]/page.tsx:136-150
const response = await fetch('/api/meetings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contactId: contact?.id,
    transcript,  // ← Saves transcript but no AI processing
    meetingType: 'in_person',
    durationMinutes: Math.ceil(duration / 60),
  }),
})
```

---

## ✅ **Solution Approach**

Create `/api/meetings/analyze/route.ts` that:
1. Takes transcript as input
2. Sends to Claude API for analysis
3. Extracts: summary, action items, sentiment, key points
4. Returns structured data

---

## 🔧 **Implementation Steps**

### **Step 1: Check for Existing Anthropic Configuration**

```bash
# Check if API key exists
grep ANTHROPIC_API_KEY .env.local
```

If missing, get from: https://console.anthropic.com/

**Add to `.env.local`:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### **Step 2: Install Anthropic SDK**

```bash
npm install --legacy-peer-deps @anthropic-ai/sdk
rm -rf .next  # CRITICAL!
```

---

### **Step 3: Create AI Analysis API Route**

**File:** `/app/api/meetings/analyze/route.ts` (NEW FILE)

```typescript
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json()

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcript too short for analysis' },
        { status: 400 }
      )
    }

    // Analyze transcript with Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Analyze this sales meeting transcript and extract:

1. A concise summary (2-3 sentences)
2. Action items (list of specific tasks)
3. Sentiment (positive/neutral/negative)
4. Key points discussed
5. Next steps

Transcript:
"""
${transcript}
"""

Respond in this exact JSON format:
{
  "summary": "...",
  "action_items": ["Task 1", "Task 2"],
  "sentiment": "positive|neutral|negative",
  "key_points": ["Point 1", "Point 2"],
  "next_steps": "..."
}`,
        },
      ],
    })

    // Extract JSON from Claude's response
    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    const analysis = JSON.parse(content.text)

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        actionItems: analysis.action_items,
        sentiment: analysis.sentiment,
        keyPoints: analysis.key_points,
        nextSteps: analysis.next_steps,
      },
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze transcript', details: (error as Error).message },
      { status: 500 }
    )
  }
}
```

---

### **Step 4: Update Meetings API to Use AI Analysis**

**File:** `/app/api/meetings/route.ts`

**Find the POST handler** and update to include AI analysis:

```typescript
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { contactId, transcript, meetingType, durationMinutes, scheduledAt } = body

  // Get user's account
  const { data: userData } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Analyze transcript with AI if transcript exists
  let aiAnalysis = null
  if (transcript && transcript.length > 50) {
    try {
      const analysisRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3002'}/api/meetings/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })

      if (analysisRes.ok) {
        const data = await analysisRes.json()
        aiAnalysis = data.analysis
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
      // Continue without AI analysis if it fails
    }
  }

  // Create meeting record
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      account_id: userData.account_id,
      contact_id: contactId,
      user_id: user.id,
      meeting_type: meetingType || 'in_person',
      transcript,
      duration_minutes: durationMinutes,
      scheduled_at: scheduledAt || new Date().toISOString(),
      summary: aiAnalysis?.summary,
      action_items: aiAnalysis?.actionItems || [],
      sentiment: aiAnalysis?.sentiment,
      extracted_data: aiAnalysis ? {
        keyPoints: aiAnalysis.keyPoints,
        nextSteps: aiAnalysis.nextSteps,
      } : {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    meeting,
    aiAnalysis,
  })
}
```

---

### **Step 5: Update Meeting UI to Show AI Results**

**File:** `/app/m/sales/meeting/[id]/page.tsx`

**After save succeeds (around line 150), show AI results:**

```typescript
if (response.ok) {
  const data = await response.json()

  // Show AI-generated insights
  if (data.aiAnalysis) {
    alert(`✅ Meeting saved!\n\nSummary: ${data.aiAnalysis.summary}\n\nAction Items:\n${data.aiAnalysis.actionItems.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}`)
  } else {
    alert('Meeting saved successfully!')
  }

  router.push('/m/sales/dashboard')
}
```

**Better: Create a results modal/screen instead of alert**

---

## 🧪 **Testing**

### **Test Plan:**

1. **Test AI Analysis API Directly:**
   ```bash
   curl -X POST http://localhost:3002/api/meetings/analyze \
     -H "Content-Type: application/json" \
     -d '{
       "transcript": "We discussed the HVAC installation project. Customer wants 3 new units installed by next Friday. They mentioned budget concerns but agreed to payment plan. Follow up with quote tomorrow."
     }'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "analysis": {
       "summary": "Discussion about HVAC installation...",
       "actionItems": ["Send quote tomorrow", "Confirm installation date"],
       "sentiment": "positive",
       "keyPoints": ["3 units needed", "Budget concerns", "Payment plan agreed"],
       "nextSteps": "Follow up with quote tomorrow"
     }
   }
   ```

2. **Test End-to-End:**
   - [ ] Navigate to: http://localhost:3002/m/sales/meeting/new
   - [ ] Start recording (or type transcript manually)
   - [ ] Enter sample sales conversation
   - [ ] Save meeting
   - [ ] Verify AI analysis appears in response
   - [ ] Check database `meetings` table has summary/action_items
   - [ ] Verify no errors in console

3. **Test Error Cases:**
   - [ ] Save meeting with empty transcript (should work, no AI)
   - [ ] Save with very short transcript (< 50 chars, no AI)
   - [ ] Test with invalid API key (should save meeting but skip AI)

---

## ✅ **Acceptance Criteria**

- [ ] AI analysis extracts summary
- [ ] Action items listed as array
- [ ] Sentiment detected (positive/neutral/negative)
- [ ] Key points identified
- [ ] Next steps extracted
- [ ] Meeting saves even if AI fails (graceful degradation)
- [ ] UI shows AI results to user
- [ ] No breaking changes to existing functionality

---

## 🎨 **Sample Prompts for Testing**

**Good Sales Call:**
```
Customer loved our demo! They want to move forward with the premium package. Discussed implementation timeline - aiming for March 1st start. Need to send contract by end of week. They asked about training, confirmed we provide 2 days onsite. Budget approved at $50k.
```

**Challenging Call:**
```
Customer has concerns about pricing compared to competitors. They're evaluating 3 vendors. Want to see case studies from similar companies. Follow up needed on ROI analysis. Decision timeline is end of quarter.
```

**Follow-up Call:**
```
Quick check-in call. Project on track. Customer happy with progress. Minor issue with permissions - IT working on it. Next milestone review scheduled for Friday. No action items at this time.
```

---

## 📊 **Success Metrics**

- ✅ 90%+ of transcripts get analyzed
- ✅ Summary quality is readable and accurate
- ✅ Action items are specific and actionable
- ✅ Sentiment detection >80% accurate
- ✅ Response time < 5 seconds for typical transcript

---

## 🚨 **Cost Monitoring**

**Anthropic Pricing (Claude 3.5 Sonnet):**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Estimated Cost per Meeting:**
- Average transcript: 1000 words ≈ 1300 tokens
- Response: 300 tokens
- Cost: ~$0.006 per meeting (less than 1 cent!)

**100 meetings/day = $0.60/day = $18/month** ✅ Very affordable

---

## ⏱️ **Time Breakdown**

- API route creation: 1 hour
- Integration with meetings API: 1.5 hours
- UI updates: 1 hour
- Testing with various transcripts: 1 hour
- Error handling and edge cases: 30-60 min
- **Total: 4-6 hours**

---

## 🔗 **Related Files**

- `/app/m/sales/meeting/[id]/page.tsx` - Meeting UI
- `/app/api/meetings/route.ts` - Meetings API (needs update)
- `/app/api/meetings/analyze/route.ts` - NEW FILE
- Anthropic SDK: https://github.com/anthropics/anthropic-sdk-typescript

---

## 📚 **Alternative: Use OpenAI Instead**

If you prefer OpenAI GPT-4:

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
})
```

**Cost:** ~$0.03 per meeting (5x more expensive than Claude)

---

**Status:** Ready for execution ✅
