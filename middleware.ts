import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_SPLIT_REGEX = /,(?=[^;,]+=)/g

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isStaticAsset = /\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|mp3|wav|ogg|css|js|json|txt|xml|webmanifest|woff2?)$/i.test(pathname)

  // Don't redirect root path - let it show loading screen
  // The loading screen component will handle redirect after 6 seconds
  if (
    pathname === '/' ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    isStaticAsset
  ) {
    return NextResponse.next()
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({
      request: {
        headers: req.headers,
      },
    })
  }

  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  try {
    const sessionUrl = new URL('/api/auth/session', req.url)
    const sessionResponse = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    const sessionHeaders = sessionResponse.headers as Headers & {
      getSetCookie?: () => string[]
    }

    const setCookieValues =
      typeof sessionHeaders.getSetCookie === 'function'
        ? sessionHeaders.getSetCookie()
        : null

    if (setCookieValues && setCookieValues.length > 0) {
      setCookieValues.forEach(cookieValue => {
        response.headers.append('set-cookie', cookieValue)
      })
    } else {
      const setCookieHeader = sessionHeaders.get('set-cookie')
      if (setCookieHeader) {
        const cookiesToSet = setCookieHeader.split(COOKIE_SPLIT_REGEX)
        cookiesToSet.forEach(cookieValue => {
          if (cookieValue.trim().length > 0) {
            response.headers.append('set-cookie', cookieValue)
          }
        })
      }
    }
  } catch (error) {
    // If Supabase session fetch fails, just continue without blocking navigation
    console.error('Middleware session fetch error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
