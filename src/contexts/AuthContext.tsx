'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { withTimeout } from '@/lib/promise-timeout'

/** Prevents getSession / profile fetch from hanging forever after tab sleep or bad storage. */
const AUTH_NETWORK_TIMEOUT_MS = 12_000
const AUTH_INIT_FALLBACK_MS = 20_000

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string, newsletterSubscribed?: boolean) => Promise<User>
  isEmailVerified: boolean
  userRole: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  signup: async () => { throw new Error('Not implemented') },
  isEmailVerified: false,
  userRole: null,
})

const ROLE_CACHE_KEY = 'pt_user_role'

function getCachedRole(): string | null {
  try { return sessionStorage.getItem(ROLE_CACHE_KEY) } catch { return null }
}
function setCachedRole(role: string | null) {
  try {
    if (role) sessionStorage.setItem(ROLE_CACHE_KEY, role)
    else sessionStorage.removeItem(ROLE_CACHE_KEY)
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Seed from cache so admin pages don't flash "unauthorized" on hot reload / refresh
  const [userRole, setUserRole] = useState<string | null>(() => getCachedRole())
  const router = useRouter()

  /** Wrapper so the cache always stays in sync with state */
  const applyRole = (role: string | null) => {
    setCachedRole(role)
    setUserRole(role)
  }

  const ensureUserRow = async (currentUser: User) => {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .maybeSingle()
    if (error) return { role: null as string | null }
    if (!userRow) {
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({ id: currentUser.id, email: currentUser.email, role: 'developer', name: null })
        .select('role')
        .single()
      if (insertError) return { role: null as string | null }
      return { role: inserted?.role ?? 'developer' }
    }
    return { role: userRow.role ?? null }
  }

  useEffect(() => {
    const init = async () => {
      let didSettle = false
      const fallbackTimer = setTimeout(() => {
        if (!didSettle) {
          // Fail-soft: unblock the UI instead of spinning forever.
          setLoading(false)
          console.warn('Auth init fallback reached; continuing without blocking UI.')
        }
      }, AUTH_INIT_FALLBACK_MS)

      try {
        const { data } = await supabase.auth.getSession()
        const currentUser = data.session?.user ?? null
        setUser(currentUser ?? null)
        if (currentUser) {
          try {
            const { role } = await withTimeout(
              ensureUserRow(currentUser),
              AUTH_NETWORK_TIMEOUT_MS,
              'ensureUserRow'
            )
            applyRole(role)
          } catch (roleErr: unknown) {
            const roleMsg = roleErr instanceof Error ? roleErr.message : String(roleErr)
            console.warn('Auth role lookup delayed — keeping cached role:', roleMsg)
            // If we have a cached role from sessionStorage, keep using it.
            // Only wipe it if there's genuinely no cache (fresh browser).
            if (!getCachedRole()) applyRole(null)
          }
        } else {
          applyRole(null)
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn('Auth init recovered:', message)
        setUser(null)
        applyRole(null)
      } finally {
        didSettle = true
        clearTimeout(fallbackTimer)
        setLoading(false)
      }
    }

    init()

    try {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          const nextUser = session?.user ?? null
          if (!nextUser) {
            setUser(null)
            applyRole(null)
            return
          }
          setUser(nextUser)

          // TOKEN_REFRESHED just means Supabase silently rotated the JWT.
          // We already know this user's role — skip the DB round-trip entirely
          // to avoid momentarily wiping userRole and triggering admin redirects.
          if (event === 'TOKEN_REFRESHED') {
            return
          }

          try {
            const { role } = await withTimeout(
              ensureUserRow(nextUser),
              AUTH_NETWORK_TIMEOUT_MS,
              'ensureUserRow(auth listener)'
            )
            applyRole(role)
          } catch (inner: unknown) {
            const msg = inner instanceof Error ? inner.message : String(inner)
            console.warn('Auth listener role lookup delayed — keeping existing role:', msg)
            // Do NOT clear userRole here; the user is still authenticated and
            // their role hasn't changed — a slow DB round-trip is not a sign-out.
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          console.error('Error in auth state change:', message)
          setUser(null)
          applyRole(null)
        } finally {
          setLoading(false)
        }
      })

      return () => {
        listener?.subscription?.unsubscribe()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Error setting up auth listener:', message)
      setLoading(false)
      return () => {}
    }
  }, [])

  const signup = async (
    email: string,
    password: string,
    name: string,
    newsletterSubscribed: boolean = true
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      const newUser = data.user
      if (!newUser) throw new Error('Signup failed')

      // Create user record in public.users table
      await supabase
        .from('users')
        .insert({
          id: newUser.id,
          email: newUser.email,
          name,
          role: 'developer',
          newsletter_subscribed: newsletterSubscribed,
          welcome_email_sent: false,
          created_at: new Date().toISOString(),
        })

      setUser(newUser)

      // If email confirmation is required, route to verify page
      if (!newUser.email_confirmed_at) {
        router.push('/verify-email')
      } else {
        router.push('/')
      }

      return newUser
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up')
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const sessionUser = data.user
      if (!sessionUser) throw new Error('Login failed')
      setUser(sessionUser)

      if (!sessionUser.email_confirmed_at) {
        router.push('/verify-email')
        return
      }

      // After login, land on home instead of dashboard
      router.push('/')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login')
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      applyRole(null)
      router.push('/')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout')
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      signup,
      isEmailVerified: !!(user?.email_confirmed_at),
      userRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 