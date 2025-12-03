'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function LoadingScreen() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setMounted(true)
    
    // Show loading screen for 7 seconds, then always redirect to login
    const timer = setTimeout(() => {
      router.replace('/login')
    }, 7000)

    return () => clearTimeout(timer)
  }, [router])

  useEffect(() => {
    if (mounted && videoRef.current) {
      // Ensure video is unmuted and volume is set
      videoRef.current.muted = false
      videoRef.current.volume = 1.0
      
      // Try to play with sound first
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // If autoplay with sound fails (browser policy), try muted play as fallback
          // Most browsers require user interaction for unmuted autoplay
          console.warn('Unmuted autoplay blocked by browser policy, trying muted:', error)
          if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.play().catch(() => {
              // Ignore play errors
            })
          }
        })
      }
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-secondary" />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#c9920a' }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        preload="auto"
        muted={false}
        className="w-full h-full object-cover"
        aria-label="Loading CRM-AI PRO"
        onError={(e) => {
          console.error('Video loading error:', e)
        }}
        onLoadedData={() => {
          // Video loaded successfully - ensure unmuted and play with sound
          if (videoRef.current) {
            videoRef.current.muted = false
            videoRef.current.volume = 1.0
            videoRef.current.play().catch((error) => {
              // If autoplay with sound fails (browser policy), try muted play
              // Most browsers require user interaction for unmuted autoplay
              console.warn('Unmuted autoplay failed, trying muted:', error)
              if (videoRef.current) {
                videoRef.current.muted = true
                videoRef.current.play().catch(() => {
                  // Ignore play errors
                })
              }
            })
          }
        }}
      >
        <source
          src="/assets/hero/splashvideo.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

