/**
 * Supabase Middleware Helpers
 * Purpose: Authentication middleware utilities for Next.js
 * This file provides helpers for protecting routes and managing auth state
 * Used in: middleware.ts, route protection, auth state management
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '../../types/supabase'

/**
 * Create Supabase client for middleware
 * Handles cookie management in middleware context
 */
export async function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Check if user is authenticated
 * Returns user object if authenticated, null otherwise
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const { supabase } = await createMiddlewareClient(request)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export async function protectRoute(request: NextRequest, loginUrl = '/login') {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    const redirectUrl = new URL(loginUrl, request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  const { response } = await createMiddlewareClient(request)
  return response
}

/**
 * Redirect authenticated users away from auth pages
 * Useful for login/signup pages when user is already logged in
 */
export async function redirectIfAuthenticated(request: NextRequest, dashboardUrl = '/dashboard') {
  const user = await getAuthenticatedUser(request)
  
  if (user) {
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }
  
  const { response } = await createMiddlewareClient(request)
  return response
}

/**
 * Route configuration for different protection levels
 */
export const routeConfig = {
  // Public routes - no authentication required
  public: [
    '/',
    '/pricing',
    '/features',
    '/status/:path*', // Public status pages
  ],
  
  // Auth routes - redirect if already authenticated
  auth: [
    '/login',
    '/signup',
    '/reset-password',
  ],
  
  // Protected routes - require authentication
  protected: [
    '/dashboard/:path*',
    '/monitors/:path*',
    '/incidents/:path*',
    '/settings/:path*',
    '/status-pages/:path*',
  ],
  
  // API routes that require authentication
  apiProtected: [
    '/api/monitors/:path*',
    '/api/incidents/:path*',
    '/api/settings/:path*',
    '/api/status-pages/:path*',
  ],
  
  // Public API routes
  apiPublic: [
    '/api/auth/:path*',
    '/api/status/:path*', // Public status page API
    '/api/cron/:path*', // Cron jobs (protected by secret)
    '/api/webhooks/:path*', // Webhooks (protected by signature)
  ]
}

/**
 * Check if a path matches any pattern in an array
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/:\w+/g, '[^/]+')
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  })
}

/**
 * Get route type for a given path
 */
export function getRouteType(path: string): 'public' | 'auth' | 'protected' | 'apiProtected' | 'apiPublic' {
  if (matchesPattern(path, routeConfig.auth)) {
    return 'auth'
  }
  
  if (matchesPattern(path, routeConfig.protected)) {
    return 'protected'
  }
  
  if (matchesPattern(path, routeConfig.apiProtected)) {
    return 'apiProtected'
  }
  
  if (matchesPattern(path, routeConfig.apiPublic)) {
    return 'apiPublic'
  }
  
  // Default to public for marketing pages and status pages
  return 'public'
}

/**
 * Main middleware handler
 * Handles authentication for all route types
 */
export async function handleAuthMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const routeType = getRouteType(path)
  
  switch (routeType) {
    case 'auth':
      // Redirect if already authenticated
      return await redirectIfAuthenticated(request)
    
    case 'protected':
    case 'apiProtected':
      // Require authentication
      return await protectRoute(request)
    
    case 'public':
    case 'apiPublic':
    default:
      // Allow access, but refresh auth state
      const { response } = await createMiddlewareClient(request)
      return response
  }
}

/**
 * Validate cron secret for cron job endpoints
 */
export function validateCronSecret(request: NextRequest): boolean {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.error('CRON_SECRET environment variable not set')
    return false
  }
  
  return cronSecret === expectedSecret
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(message: string, status = 401) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

// Type exports
export type MiddlewareSupabaseClient = Awaited<ReturnType<typeof createMiddlewareClient>>['supabase']
export type { Database } from '../../types/supabase'