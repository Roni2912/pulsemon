/**
 * Next.js Middleware
 * Purpose: Global request interceptor for authentication and route protection
 * This middleware runs on every request to handle authentication state and protect routes
 * Handles: Route protection, auth redirects, cron job security, API authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleAuthMiddleware,
  validateCronSecret,
  createErrorResponse,
  getRouteType
} from './lib/supabase/middleware'

function stripPort(h: string): string {
  return h.split(':')[0].toLowerCase()
}

const APP_HOST = stripPort(
  process.env.NEXT_PUBLIC_APP_HOST
    || process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '')
    || ''
)

const KNOWN_APP_HOSTS = new Set(
  [APP_HOST, 'localhost', '127.0.0.1'].filter(Boolean)
)

function isCustomDomain(host: string): boolean {
  if (!host) return false
  if (KNOWN_APP_HOSTS.has(host)) return false
  if (host.endsWith('.vercel.app')) return false
  return true
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const host = stripPort(request.headers.get('host') ?? '')

  // Custom domains: any host that isn't the app host gets rewritten to
  // /status/by-domain so the page can resolve the matching status page.
  // Skip api/_next so route handlers and assets still work normally.
  if (
    isCustomDomain(host) &&
    !path.startsWith('/api') &&
    !path.startsWith('/_next') &&
    path !== '/favicon.ico'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/status/by-domain'
    return NextResponse.rewrite(url)
  }

  // Handle cron job endpoints with secret validation
  if (path.startsWith('/api/cron/')) {
    if (!validateCronSecret(request)) {
      return createErrorResponse('Unauthorized: Invalid cron secret', 401)
    }
    // Allow cron jobs to proceed without auth
    return
  }

  // Handle webhook endpoints (they have their own validation)
  if (path.startsWith('/api/webhooks/')) {
    // Webhooks handle their own authentication via signatures
    return
  }

  // Handle all other routes with authentication middleware
  return await handleAuthMiddleware(request)
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}