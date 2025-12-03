/**
 * Hero Image Component Reference
 * 
 * Use this as a template for implementing hero images in your landing page
 */

import Image from 'next/image'

// Import hero images (update paths once images are added)
// import heroTablet from '@/public/assets/hero/hero-tablet-holographic.jpg'
// import heroLaptop from '@/public/assets/hero/hero-laptop-circuit-overlay.jpg'

export function HeroImageTablet() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Hero Image - Tablet Holographic Version */}
      <Image
        src="/assets/hero/hero-tablet-holographic.jpg"
        alt="CRM AI Pro - AI-Native CRM for Service Businesses with voice-powered efficiency"
        fill
        priority
        className="object-cover"
        quality={90}
      />
      
      {/* Optional: Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      
      {/* Optional: Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            AI-Native CRM for Service Businesses
          </h1>
          <p className="text-xl md:text-2xl text-gray-200">
            Voice-powered efficiency. Professional-grade management. Transformative intelligence.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeroImageLaptop() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Hero Image - Laptop Circuit Overlay Version */}
      <Image
        src="/assets/hero/hero-laptop-circuit-overlay.jpg"
        alt="CRM AI Pro dashboard with AI-powered intelligence and voice commands"
        fill
        priority
        className="object-cover"
        quality={90}
      />
      
      {/* Optional: Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
      
      {/* Optional: Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            AI-Native CRM for Service Businesses
          </h1>
          <p className="text-xl md:text-2xl text-gray-200">
            Voice-powered efficiency. Professional-grade management. Transformative intelligence.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Responsive Hero Image Component
 * Automatically selects best image based on screen size
 */
export function ResponsiveHeroImage() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Mobile/Tablet: Use tablet version */}
      <Image
        src="/assets/hero/hero-tablet-holographic.jpg"
        alt="CRM AI Pro - AI-Native CRM for Service Businesses"
        fill
        priority
        className="object-cover md:hidden"
        quality={90}
      />
      
      {/* Desktop: Use laptop version */}
      <Image
        src="/assets/hero/hero-laptop-circuit-overlay.jpg"
        alt="CRM AI Pro - AI-Native CRM for Service Businesses"
        fill
        priority
        className="hidden md:block object-cover"
        quality={90}
      />
      
      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 drop-shadow-lg">
            AI-Native CRM for Service Businesses
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-200 drop-shadow-md">
            Voice-powered efficiency. Professional-grade management. Transformative intelligence.
          </p>
        </div>
      </div>
    </div>
  )
}
