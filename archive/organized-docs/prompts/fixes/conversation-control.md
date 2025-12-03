# Conversation Flow Control Improvements

## Problem Statement
The agent currently exhibits poor conversation flow control:
1. Asks "Are you still there?" too frequently (every 10 seconds)
2. Repeats the same questions multiple times
3. Interrupts user responses mid-sentence
4. Doesn't track conversation state properly

## Solution: Improved Flow Control

### 1. **Silence Detection Adjustment**

```
Current: 10 seconds → Too aggressive
Improved: 30-45 seconds → Reasonable wait time

Additional logic:
- Don't interrupt if user is typing (detect input field focus)
- Wait longer after asking a complex question
- Shorter wait only for simple yes/no questions
```

### 2. **Question Tracking System**

```typescript
// Track questions to prevent repetition
interface QuestionState {
  lastQuestionAsked: string | null
  questionAttempts: number
  maxAttempts: number
  waitingForResponse: boolean
  questionTimestamp: number
}

const questionState: QuestionState = {
  lastQuestionAsked: null,
  questionAttempts: 0,
  maxAttempts: 2,
  waitingForResponse: false,
  questionTimestamp: 0
}
```

### 3. **Smart Re-prompting Logic**

```
Before asking a question:
1. Check if this question was already asked
2. If yes → Re-phrase or offer alternatives
3. If no → Proceed with new question

Example repetition handling:
Attempt 1: "What's the technician's name?"
No response after 45s →
Attempt 2: "Could you tell me which technician you'd like to assign?"
No response after 45s →
Alternative: "Here are the available technicians: [list]. Type a number or name."
```

### 4. **Conversation State Management**

```typescript
// Track conversation context
interface ConversationContext {
  currentTask: string | null
  lastCompletedAction: string | null
  pendingInformation: string[]
  userIntent: string
  stepNumber: number
}

const context: ConversationContext = {
  currentTask: "assign_technician",
  lastCompletedAction: "found_job",
  pendingInformation: ["technician_name"],
  userIntent: "assign_technician_to_job",
  stepNumber: 2
}
```

### 5. **Interrupt Detection**

```
Rules before interrupting:
1. Has the user been typing in the last 5 seconds?
2. Is there incomplete input in the text field?
3. Did the user start responding but pause mid-thought?
4. Is this a complex question requiring thought?

If any are true → Wait longer
If none are true → Proceed with gentle follow-up
```

### 6. **Improved Follow-up Prompts**

Instead of "Are you still there?":

```
Context-aware alternatives:
- "Just checking - are we still working on [task]?"
- "Let me know if you need help with [specific question]"
- "We were discussing [topic]. Would you like to continue or try something else?"
- "No rush, take your time. I'm here when you're ready"
```

### 7. **Specific Flow Patterns**

#### For Multi-step Processes:
```
Step 1: "I'll help you assign a technician."
Step 2: "What's the job number?"
[Wait for response]
Step 3: "Which technician should I assign?"
[Wait with alternatives ready]
Step 4: "Confirming: Assign [Tech] to Job #123?"
```

#### When User Pauses:
```
If user stops responding mid-process:
1. Summarize what we've accomplished so far
2. List what information is still needed
3. Offer to save progress and continue later
4. Provide option to start over with different approach
```

#### For Recovery:
```
If conversation gets stuck:
"Let me recap what we're trying to do:
[Summary of task and current status]

We can:
1. Continue where we left off
2. Try a different approach
3. Save this and come back later
4. Start fresh with a new task

What would work best for you?"
```

### 8. **Implementation Prompts**

Add to system prompt:
```
Conversation Rules:
1. Track all questions asked - don't repeat within 5 minutes
2. Wait 45 seconds for responses (not 10)
3. Don't interrupt if user might be typing
4. If no response, rephrase or offer alternatives
5. Keep conversation context in memory
6. Summarize progress when user returns
7. Never say "Are you still there?" - use contextual follow-ups

State Management:
- Remember: last question, task, step, pending info
- Detect: typing, partial input, user focus
- Adapt: timing based on question complexity
- Recover: gracefully when conversation stalls
```

### 9. **Testing Scenarios**

1. User types slowly → Shouldn't be interrupted
2. User pauses to look up information → Agent waits patiently
3. User doesn't respond to first question → Agent rephrases
4. User returns after 5 minutes → Agent summarizes context
5. User abandons task → Agent offers to save progress
6. Agent repeats question → Should be prevented

### 10. **Success Metrics**

- Zero "Are you still there?" interruptions
- No repeated questions within 5 minutes
- Conversations can be resumed after breaks
- Users never lose context during long pauses
- Smooth multi-step task completion

### 11. **Code Example for Implementation**

```typescript
class ConversationManager {
  private questionHistory: Map<string, number> = new Map()
  private lastActivity: number = Date.now()
  private userIsTyping: boolean = false

  askQuestion(question: string, type: 'simple' | 'complex' = 'simple') {
    // Check if asked recently
    const attempts = this.questionHistory.get(question) || 0
    if (attempts >= 2) {
      return this.offerAlternative(question)
    }

    // Record question
    this.questionHistory.set(question, attempts + 1)
    this.lastActivity = Date.now()

    // Set timeout based on type
    const timeout = type === 'simple' ? 30000 : 45000

    setTimeout(() => {
      if (!this.userIsTyping && Date.now() - this.lastActivity > timeout) {
        this.gentleFollowUp()
      }
    }, timeout)
  }

  private gentleFollowUp() {
    // Context-aware follow-up instead of "Are you still there?"
    const context = this.getCurrentContext()
    return `Just checking - we were ${context}. Would you like to continue?`
  }
}
```

This system will create a much more natural conversation flow that respects user pace and maintains context throughout interactions.