# Hero Image File Names

## Place Your Images Here:

### 1. Primary Hero Image (Tablet/Holographic)
**File Name:** `hero-tablet-holographic.jpg` (or `.png`, `.webp`)

**Location:** `/public/assets/hero/hero-tablet-holographic.jpg`

**Description:** 
- Tablet device with holographic CRM interface
- Voice command waveform active
- Floating data panels (technicians, HVAC units, charts)
- Service technician and van in blurred background
- Teal/orange glowing connection lines

---

### 2. Secondary Hero Image (Laptop/Circuit)
**File Name:** `hero-laptop-circuit-overlay.jpg` (or `.png`, `.webp`)

**Location:** `/public/assets/hero/hero-laptop-circuit-overlay.jpg`

**Description:**
- Silver laptop on wooden surface
- CRM AI Pro dashboard visible
- Golden circuit lines overlay
- Voice command section with waveform
- Service professionals in blurred background

---

## Quick Copy-Paste Paths:

```
/public/assets/hero/hero-tablet-holographic.jpg
/public/assets/hero/hero-laptop-circuit-overlay.jpg
```

## Usage in Code:

```tsx
// Direct path (Next.js public folder)
<Image src="/assets/hero/hero-tablet-holographic.jpg" ... />

// Or import
import heroTablet from '@/public/assets/hero/hero-tablet-holographic.jpg'
```

## File Format Recommendations:

- **Best:** `.webp` (smallest file size, best quality)
- **Fallback:** `.jpg` (universal support)
- **If transparency needed:** `.png`

## Image Specifications:

- **Aspect Ratio:** 16:9 (1920x1080px minimum)
- **File Size:** Optimize to < 500KB if possible
- **Quality:** High quality (90%+) for hero images
- **Responsive:** Consider providing multiple sizes:
  - Desktop: 1920x1080px
  - Tablet: 1280x720px  
  - Mobile: 768x432px
