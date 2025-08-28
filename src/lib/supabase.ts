import { createClient } from '@supabase/supabase-js'

// Resolve env vars from both public (browser) and server environments
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string
const supabaseAnonKey = (
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.SUPABASE_ANON_KEY ||
	process.env.SUPABASE_KEY
) as string

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		detectSessionInUrl: true
	}
})