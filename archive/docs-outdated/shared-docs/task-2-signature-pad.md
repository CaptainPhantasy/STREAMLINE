# Task 2: Signature Pad Interactive Drawing

**Agent:** B (UI/UX Developer)
**Priority:** CRITICAL
**Duration:** 1-2 hours
**Dependencies:** None
**Confidence:** 100%

---

## 🎯 **Objective**

Implement interactive signature capture on the tech job workflow. Currently shows a placeholder canvas with no drawing functionality.

---

## 📋 **Current State**

**Location:** `/app/m/tech/job/[id]/page.tsx`

**Problem (Line 238-240):**
```typescript
const handleSignature = async () => {
  // In production, implement actual signature capture
  const signatureData = 'signature_placeholder'  // ← PLACEHOLDER!
```

**Canvas Exists But Not Interactive (Lines 496-503):**
```tsx
<div className="bg-white rounded-xl h-48 relative">
  <canvas
    ref={canvasRef}
    className="w-full h-full rounded-xl"
  />
  <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
    Sign here
  </div>
</div>
```

---

## ✅ **Solution Approach**

Use **react-signature-canvas** library (industry standard, 800k+ weekly downloads).

### **Why This Library:**
- ✅ Mobile-optimized (touch + mouse)
- ✅ TypeScript support
- ✅ Small bundle size (~15KB)
- ✅ Widely used in production
- ✅ Export as data URL or base64

---

## 🔧 **Implementation Steps**

### **Step 1: Install Dependency**

```bash
npm install --legacy-peer-deps react-signature-canvas
npm install --legacy-peer-deps --save-dev @types/react-signature-canvas
```

### **Step 2: Clear Cache (CRITICAL)**

```bash
rm -rf .next
```

### **Step 3: Update Tech Job Page**

**File:** `/app/m/tech/job/[id]/page.tsx`

**Add Import (after line 10):**
```typescript
import SignatureCanvas from 'react-signature-canvas'
```

**Replace canvas ref (line 65):**
```typescript
// OLD:
const canvasRef = useRef<HTMLCanvasElement>(null)

// NEW:
const signatureRef = useRef<SignatureCanvas>(null)
```

**Add state for signature (after line 62):**
```typescript
const [hasSignature, setHasSignature] = useState(false)
```

**Replace handleSignature function (lines 238-267):**
```typescript
const handleSignature = async () => {
  if (!signatureRef.current || signatureRef.current.isEmpty()) {
    alert('Please provide a signature first')
    return
  }

  setIsProcessing(true)
  try {
    // Get signature as data URL
    const signatureData = signatureRef.current.toDataURL('image/png')

    // Upload signature as image
    const blob = await (await fetch(signatureData)).blob()
    const formData = new FormData()
    formData.append('photo', blob, 'signature.png')
    formData.append('jobId', jobId)
    formData.append('type', 'signature')

    const photoRes = await fetch('/api/photos', {
      method: 'POST',
      body: formData,
    })

    if (!photoRes.ok) {
      throw new Error('Failed to upload signature')
    }

    const photoData = await photoRes.json()

    // Log GPS departure
    await gpsTracker.logDeparture(jobId, { stage: 'completion' })

    // Complete gate with signature URL
    await fetch('/api/tech/gates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        stageName: 'signature',
        metadata: {
          signatureUrl: photoData.url,
          signedAt: new Date().toISOString()
        },
      }),
    })

    // Mark job complete
    await fetch(`/api/tech/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })

    setGateState(prev => ({ ...prev, signatureData: signatureData }))
    setCurrentStage('done')
  } catch (error) {
    console.error('Signature error:', error)
    alert('Failed to save signature. Please try again.')
  } finally {
    setIsProcessing(false)
  }
}

const clearSignature = () => {
  signatureRef.current?.clear()
  setHasSignature(false)
}
```

**Replace signature UI (lines 487-514):**
```tsx
{/* GATE 7: Signature */}
{currentStage === 'signature' && (
  <div className="space-y-6">
    <div className="text-center py-4">
      <PenTool className="w-16 h-16 mx-auto text-blue-400 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Customer Signature</h2>
      <p className="text-gray-400">Please sign to confirm work completion</p>
    </div>

    <div className="bg-white rounded-xl overflow-hidden">
      <SignatureCanvas
        ref={signatureRef}
        canvasProps={{
          className: 'w-full h-48 touch-none',
          style: { touchAction: 'none' }
        }}
        backgroundColor="white"
        penColor="black"
        minWidth={1}
        maxWidth={3}
        onEnd={() => setHasSignature(true)}
      />
    </div>

    {hasSignature && (
      <button
        onClick={clearSignature}
        className="w-full py-2 text-gray-400 text-sm underline"
      >
        Clear Signature
      </button>
    )}

    <BigButtonGrid columns={1}>
      <BigButton
        icon={CheckCircle}
        label="COMPLETE JOB"
        sublabel={hasSignature ? "Signature captured" : "Sign above to continue"}
        variant="success"
        onClick={handleSignature}
        disabled={isProcessing || !hasSignature}
      />
    </BigButtonGrid>
  </div>
)}
```

---

## 🧪 **Testing**

### **Test Plan:**

1. **Start Dev Server:**
   ```bash
   rm -rf .next
   PORT=3002 npm run dev
   ```

2. **Navigate to Tech Job:**
   - Go to: http://localhost:3002/m/tech/dashboard
   - Click any job
   - Complete all gates until signature gate

3. **Test Signature Capture:**
   - [ ] Canvas allows drawing with mouse
   - [ ] Canvas allows drawing with touch (on mobile/tablet)
   - [ ] "Sign here" placeholder disappears when drawing starts
   - [ ] Clear button appears after drawing
   - [ ] Clear button resets canvas
   - [ ] "COMPLETE JOB" button is disabled until signature exists
   - [ ] Button becomes enabled after drawing

4. **Test Signature Submit:**
   - [ ] Draw a signature
   - [ ] Click "COMPLETE JOB"
   - [ ] Verify loading state shows
   - [ ] Verify signature uploads as photo
   - [ ] Verify gate completion succeeds
   - [ ] Verify job status changes to "completed"
   - [ ] Verify "done" screen appears

5. **Test Edge Cases:**
   - [ ] Try submitting empty signature (should show alert)
   - [ ] Draw, clear, draw again (should work)
   - [ ] Verify signature image appears in job_photos table

---

## ✅ **Acceptance Criteria**

- [ ] Canvas is interactive (not placeholder)
- [ ] Touch and mouse drawing both work
- [ ] Signature exports as PNG data URL
- [ ] Signature uploads to storage successfully
- [ ] Gate completion includes signature URL
- [ ] Job completes end-to-end
- [ ] No TypeScript errors
- [ ] No runtime errors in console
- [ ] Mobile-optimized (60px+ touch targets)

---

## 🚨 **Troubleshooting**

### **If canvas doesn't draw:**
```tsx
// Add these canvas props:
canvasProps={{
  style: {
    touchAction: 'none',  // ← Prevents scroll on touch
    cursor: 'crosshair'
  }
}}
```

### **If TypeScript errors:**
```bash
# Reinstall types
npm install --legacy-peer-deps --save-dev @types/react-signature-canvas
rm -rf .next
```

### **If drawing is laggy:**
```tsx
// Reduce points:
minDistance={5}  // Add this prop
```

---

## 📊 **Success Metrics**

- ✅ Signature capture works on desktop
- ✅ Signature capture works on mobile
- ✅ Signature saves as real image (not placeholder)
- ✅ End-to-end tech workflow completes
- ✅ Zero regressions in other gates

---

## 🎨 **UI/UX Notes**

**Design matches existing patterns:**
- White background (like existing forms)
- Rounded corners (rounded-xl)
- BigButton for submission
- Gray placeholder text
- Touch-optimized (h-48 = 192px = good size)

---

## 📝 **Code Quality Checklist**

- [ ] Follows existing component patterns
- [ ] Uses existing BigButton component
- [ ] Maintains TypeScript strict mode
- [ ] No console.logs left in code
- [ ] Error handling included
- [ ] Loading states handled
- [ ] Accessibility: Focus states work

---

## ⏱️ **Time Breakdown**

- Install dependencies: 5 min
- Code implementation: 30-45 min
- Testing on desktop: 15 min
- Testing on mobile: 15 min
- Bug fixes (if any): 15-30 min
- **Total: 1-2 hours**

---

## 🔗 **Related Files**

- `/app/m/tech/job/[id]/page.tsx` - Main file to edit
- `/app/api/photos/route.ts` - Photo upload API (already works)
- `/components/mobile/big-button.tsx` - UI component (reference)

---

## 📚 **References**

- react-signature-canvas: https://www.npmjs.com/package/react-signature-canvas
- Existing photo upload: `/app/api/photos/route.ts:24-89`
- Existing canvas ref: `/app/m/tech/job/[id]/page.tsx:65`

---

**Status:** Ready for execution ✅
