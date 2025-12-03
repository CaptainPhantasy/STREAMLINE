# Hero Images - Splash Screen Assets

## Image Files

### 1. `hero-tablet-holographic.jpg` (or `.png`)
**Description:** Tablet with holographic CRM interface, voice command waveform, floating data panels, service technician and van in blurred background.

**Use Case:** Primary hero image for landing page, main splash screen

**Key Features:**
- Tablet device with semi-transparent screen
- Active voice command with waveform visualization
- Holographic floating panels (technicians, HVAC units, growth charts)
- Glowing teal/orange connection lines
- Blurred service technician and van in background
- Tagline: "AI-Native CRM for Service Businesses"

**Dimensions:** Recommended 1920x1080px or higher (16:9 aspect ratio)

---

### 2. `hero-laptop-circuit-overlay.jpg` (or `.png`)
**Description:** Laptop displaying CRM AI Pro dashboard with golden circuit lines overlay, service professionals in blurred background.

**Use Case:** Alternative hero image, product showcase, feature pages

**Key Features:**
- Silver laptop on wooden surface
- CRM AI Pro dashboard interface visible
- Golden glowing circuit lines overlay (AI integration visualization)
- Voice command section with waveform
- Dashboard sections: Upcoming Jobs, Smart AI Suggestions, Revenue Growth, Customer Satisfaction
- Blurred service professionals and white service van in background
- Tagline: "Voice-powered efficiency. Professional-grade management. Transformative intelligence."

**Dimensions:** Recommended 1920x1080px or higher (16:9 aspect ratio)

---

## File Naming Convention

- **Format:** `hero-{device/feature}-{key-visual-element}.{ext}`
- **Examples:**
  - `hero-tablet-holographic.jpg`
  - `hero-laptop-circuit-overlay.jpg`
  - `hero-mobile-voice-command.jpg` (if adding more)

## Usage in Code

```tsx
// In your landing page or hero component
import heroTablet from '@/public/assets/hero/hero-tablet-holographic.jpg'
import heroLaptop from '@/public/assets/hero/hero-laptop-circuit-overlay.jpg'

// Use as background or image element
<Image src={heroTablet} alt="CRM AI Pro - AI-Native CRM for Service Businesses" />
```

## Optimization

- **Format:** Use WebP for best compression, JPG/PNG as fallback
- **Sizes:** Provide multiple sizes (1920px, 1280px, 768px) for responsive loading
- **Lazy Loading:** Implement lazy loading for hero images
- **Alt Text:** Always include descriptive alt text for accessibility

## Color Palette Reference

**Hero Tablet Image:**
- Teal accents (#0F766E)
- Orange/bronze accents (#EA580C)
- Dark UI elements
- Light background

**Hero Laptop Image:**
- Golden circuit lines (#FFD700 or similar)
- Light gray/white UI
- Brown/orange accents
- Wooden surface tones

Both align with the Warm "Latte" theme color palette.
