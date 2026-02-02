/**
 * Server-only Supabase client using the service role key.
 * Use ONLY in: API routes, Server Components, Server Actions.
 * NEVER expose this client or the service role key to the browser.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let serverClient: SupabaseClient | null = null

export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) return serverClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'Server Supabase client: set NEXT_PUBLIC_SUPABASE_URL in .env.local'
    )
  }
  if (!serviceRoleKey) {
    throw new Error(
      'Server Supabase client: add SUPABASE_SERVICE_ROLE_KEY to .env.local. ' +
      'Get it in Supabase Dashboard → Project Settings → API → service_role (secret). ' +
      'Never expose this key in the browser.'
    )
  }

  serverClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return serverClient
}
