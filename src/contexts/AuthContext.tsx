'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<User>
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
  userRole: null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

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
      try {
        const { data } = await supabase.auth.getSession()
        const currentUser = data.session?.user ?? null
        setUser(currentUser ?? null)
        if (currentUser) {
          const { role } = await ensureUserRow(currentUser)
          setUserRole(role)
        } else {
          setUserRole(null)
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error.message)
        // Supabase not configured - continue without auth
        setUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    init()

    try {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
          const nextUser = session?.user ?? null
          setUser(nextUser)
          if (nextUser) {
            const { role } = await ensureUserRow(nextUser)
            setUserRole(role)
          } else {
            setUserRole(null)
          }
        } catch (error: any) {
          console.error('Error in auth state change:', error.message)
          setUser(null)
          setUserRole(null)
        } finally {
          setLoading(false)
        }
      })

      return () => {
        listener?.subscription?.unsubscribe()
      }
    } catch (error: any) {
      console.error('Error setting up auth listener:', error.message)
      // Supabase not configured - no listener needed
      return () => {}
    }
  }, [])

  const signup = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
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
          created_at: new Date().toISOString()
        })

      setUser(newUser)

      // If email confirmation is required, route to verify page
      if (!newUser.email_confirmed_at) {
        router.push('/verify-email')
      } else {
        // After successful signup for already-confirmed emails, land on home
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