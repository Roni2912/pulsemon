/**
 * Supabase Browser Client
 * Purpose: Client-side database operations in React components
 * This client runs in the browser and handles user authentication state
 * Used for: User interactions, real-time subscriptions, client-side queries
 */

import { createBrowserClient } from '@supabase/ssr'
// Create a singleton client for browser usage
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  // Return existing client if already created (singleton pattern)
  if (client) {
    return client
  }

  // Create new browser client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}

// Export the client for use in components
export const supabase = createClient()

// Type exports for better TypeScript support
export type SupabaseClient = typeof supabase