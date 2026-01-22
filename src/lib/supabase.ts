import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let initializationError: Error | null = null

// Validate that we have actual values (not placeholders)
const isPlaceholder = (value: string) => {
	return !value || 
		value.includes('your_') || 
		value.includes('YOUR_') ||
		value.trim() === ''
}

function getSupabaseClient(): SupabaseClient {
	// Return cached instance if already created
	if (supabaseInstance) {
		return supabaseInstance
	}

	// If we already tried and failed, throw the cached error
	if (initializationError) {
		throw initializationError
	}

	// Resolve env vars from both public (browser) and server environments
	const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string
	const supabaseAnonKey = (
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.SUPABASE_ANON_KEY ||
		process.env.SUPABASE_KEY
	) as string

	if (!supabaseUrl || !supabaseAnonKey) {
		initializationError = new Error(
			'Missing Supabase environment variables.\n\n' +
			'Please set the following in your .env.local file:\n' +
			'- NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url\n' +
			'- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
			'Get these values from: https://app.supabase.com → Your Project → Settings → API\n\n' +
			'For local development, start Docker Desktop and run: npx supabase start'
		)
		throw initializationError
	}

	if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
		initializationError = new Error(
			'Invalid Supabase configuration detected.\n\n' +
			'Please update your .env.local file with actual Supabase credentials:\n' +
			'- NEXT_PUBLIC_SUPABASE_URL should be your Supabase project URL (e.g., https://xxxxx.supabase.co)\n' +
			'- NEXT_PUBLIC_SUPABASE_ANON_KEY should be your Supabase anonymous key\n\n' +
			'Get these values from: https://app.supabase.com → Your Project → Settings → API\n\n' +
			'For local development:\n' +
			'1. Start Docker Desktop\n' +
			'2. Run: npx supabase start\n' +
			'3. Copy the API URL and anon key from the output to .env.local'
		)
		throw initializationError
	}

	// Validate URL format
	try {
		new URL(supabaseUrl)
	} catch (e) {
		initializationError = new Error(
			`Invalid Supabase URL format: "${supabaseUrl}"\n\n` +
			'Please ensure NEXT_PUBLIC_SUPABASE_URL is a valid URL (e.g., https://xxxxx.supabase.co)'
		)
		throw initializationError
	}

	// Create and cache the client
	supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: true,
			detectSessionInUrl: true
		}
	})

	return supabaseInstance
}

// Create a chainable query builder stub that throws when executed
function createQueryBuilderStub(): any {
	const errorMessage = 'Supabase is not configured. Cannot execute database query.\n\n' +
		'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.\n\n' +
		'For local development:\n' +
		'1. Start Docker Desktop\n' +
		'2. Run: npx supabase start\n' +
		'3. Copy the API URL and anon key to .env.local'

	// Create a rejected promise for when queries are executed
	const rejectedPromise = Promise.reject(new Error(errorMessage))

	// Create a chainable stub object that is also thenable (can be awaited)
	const chainableStub = new Proxy({}, {
		get(_target, methodName) {
			// Make it thenable - when awaited, it rejects
			if (methodName === 'then') {
				return (onFulfilled: any, onRejected: any) => {
					return rejectedPromise.then(onFulfilled, onRejected)
				}
			}
			if (methodName === 'catch') {
				return (onRejected: any) => rejectedPromise.catch(onRejected)
			}
			if (methodName === Symbol.toPrimitive) {
				return undefined
			}
			// Methods that execute the query (called at the end)
			if (methodName === 'single' || methodName === 'maybeSingle' || methodName === 'count') {
				return function(...methodArgs: any[]) {
					return rejectedPromise
				}
			}
			// All chainable methods (select, eq, order, limit, insert, update, delete, upsert, etc.)
			// return the stub itself so chaining works
			return function(...methodArgs: any[]) {
				return chainableStub
			}
		}
	})

	// from() is a function that returns the chainable stub
	return function(...args: any[]) {
		return chainableStub
	}
}

// Create a safe stub for auth, storage, etc.
function createSafeStub(propName: string): any {
	return new Proxy({}, {
		get(_target, methodName) {
			if (methodName === 'then' || methodName === Symbol.toPrimitive) {
				return undefined
			}
			return function(...args: any[]) {
				throw new Error(
					`Supabase is not configured. Cannot call ${String(propName)}.${String(methodName)}()\n\n` +
					'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.\n\n' +
					'For local development:\n' +
					'1. Start Docker Desktop\n' +
					'2. Run: npx supabase start\n' +
					'3. Copy the API URL and anon key to .env.local'
				)
			}
		}
	})
}

// Export a getter function that lazily initializes
// Only validates when methods are actually called, not during property inspection
export const supabase = new Proxy({} as SupabaseClient, {
	get(_target, prop) {
		// Handle common property access that might happen during module inspection
		if (prop === 'then' || prop === Symbol.toPrimitive || prop === 'constructor') {
			return undefined
		}

		// Try to get the client, but don't throw if it fails
		let client: SupabaseClient | null = null
		try {
			client = getSupabaseClient()
		} catch (e) {
			// If client creation fails, return a safe stub
			if (prop === 'from') {
				// from() returns a query builder, so return a function that returns a chainable stub
				return createQueryBuilderStub()
			} else if (prop === 'auth' || prop === 'storage' || prop === 'functions') {
				return createSafeStub(String(prop))
			}
			// For other properties, return a function that throws when called
			return function(...args: any[]) {
				throw e
			}
		}

		// If we have a valid client, return the property
		const value = (client as any)[prop]
		return typeof value === 'function' ? value.bind(client) : value
	}
})