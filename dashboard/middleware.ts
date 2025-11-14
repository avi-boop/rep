import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/health', '/']

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/api/auth/me', '/api/auth/logout', '/api/auth/refresh']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    // Allow API routes and other routes by default (you can make this stricter)
    return NextResponse.next()
  }

  // Check for access token
  const accessToken = request.cookies.get('accessToken')?.value

  if (!accessToken) {
    // Redirect to login page for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Return 401 for API routes
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Verify token
  const user = verifyAccessToken(accessToken)

  if (!user) {
    // Token is invalid or expired
    if (pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      url.searchParams.set('reason', 'session-expired')
      return NextResponse.redirect(url)
    }

    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  // Token is valid - allow request
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
