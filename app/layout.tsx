import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
// import { VoiceAgentOverlay } from "@/components/voice-agent-overlay"; // DISABLED - replaced by React SDK
import { ConditionalVoiceNavigationBridge } from "@/components/conditional-voice-navigation-bridge";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRM-AI PRO",
  description: "AI-Native Business Operating System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CRM-AI PRO",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme-preference') || 'light';
                  const root = document.documentElement;
                  
                  // Apply theme immediately
                  root.setAttribute('data-theme', theme);
                  root.classList.add('theme-' + theme);
                  
                  // Update meta theme-color
                  const darkThemes = ['dark'];
                  const isDark = darkThemes.includes(theme) || 
                    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                  if (metaThemeColor) {
                    metaThemeColor.setAttribute('content', isDark ? 'hsl(220, 30%, 8%)' : 'hsl(0, 0%, 100%)');
                  } else {
                    const meta = document.createElement('meta');
                    meta.name = 'theme-color';
                    meta.content = isDark ? 'hsl(220, 30%, 8%)' : 'hsl(0, 0%, 100%)';
                    document.head.appendChild(meta);
                  }
                } catch (e) {
                  // Silently fail if localStorage is not available
                }
              })();
            `,
          }}
        />
        {/* Remove old ElevenLabs embed widget if it exists */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove old widget container
                const oldWidget = document.getElementById('elevenlabs-voice-widget-root');
                if (oldWidget) {
                  oldWidget.remove();
                }
                // Remove any elevenlabs-convai elements
                const convaiElements = document.querySelectorAll('elevenlabs-convai');
                convaiElements.forEach(el => el.remove());
                // Remove embed script
                const embedScript = document.querySelector('script[src*="elevenlabs"][src*="convai-widget-embed"]');
                if (embedScript) {
                  embedScript.remove();
                }
              })();
            `,
          }}
        />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('SW registered:', reg.scope))
                    .catch((err) => console.log('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
          {/* Conditional Voice Navigation Bridge - Only when voice enabled */}
          <ConditionalVoiceNavigationBridge />
        </Providers>
        {/* Old embed widget cleanup - DISABLED - replaced by React SDK */}
        {/* <VoiceAgentOverlay /> */}
      </body>
    </html>
  );
}
