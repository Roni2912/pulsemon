/**
 * Supabase Server Client
 * Purpose: Server-side database operations in API routes and server components
 * This client runs on the server and can access user sessions via cookies
 * Used for: Server actions, API routes, server-side rendering with auth
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../../types/supabase'

export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get authenticated user from server context
 * Returns null if user is not authenticated
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in getUser:', error)
    return null
  }
}

/**
 * Get user profile with subscription information
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getUserProfile() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  
  if (!user) {
    return null
  }
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Error getting user profile:', error.message)
      return null
    }
    
    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

/**
 * Check if user has permission for a specific action based on their plan
 */
export async function checkUserPermission(action: 'create_monitor' | 'create_status_page' | 'create_alert') {
  const profile = await getUserProfile()
  
  if (!profile) {
    return { allowed: false, reason: 'User not authenticated' }
  }
  
  switch (action) {
    case 'create_monitor':
      // This will be checked by database trigger, but we can pre-validate
      return { allowed: true, reason: 'Will be validated by database' }
    
    case 'create_status_page':
      return { allowed: true, reason: 'Will be validated by database' }
    
    case 'create_alert':
      return { allowed: true, reason: 'Will be validated by database' }
    
    default:
      return { allowed: false, reason: 'Unknown action' }
  }
}

// Type exports
export type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>
export type { Database } from '../../types/supabase'