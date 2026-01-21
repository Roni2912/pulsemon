/**
 * Next.js Middleware
 * Purpose: Global request interceptor for authentication and route protection
 * This middleware runs on every request to handle authentication state and protect routes
 * Handles: Route protection, auth redirects, cron job security, API authentication
 */

import { NextRequest } from 'next/server'
import { 
  handleAuthMiddleware, 
  validateCronSecret, 
  createErrorResponse,
  getRouteType 
} from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
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