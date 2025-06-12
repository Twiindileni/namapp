'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  RecaptchaVerifier,
  AuthError
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role)
        } else {
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signup = async (email: string, password: string, name: string) => {
    try {
      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        role: 'developer'
      })

      // Send verification email
      await sendEmailVerification(user)

      setUser(user)
      return user
    } catch (error) {
      console.error('Signup error:', error)
      const authError = error as AuthError
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          throw new Error('This email is already registered. Please use a different email or try logging in.')
        case 'auth/invalid-email':
          throw new Error('Please enter a valid email address.')
        case 'auth/weak-password':
          throw new Error('Password should be at least 6 characters long.')
        case 'auth/operation-not-allowed':
          throw new Error('Email/password accounts are not enabled. Please contact support.')
        default:
          throw new Error(authError.message || 'Failed to sign up')
      }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      
      // If email is not verified, redirect to verification page
      if (!userCredential.user.emailVerified) {
        router.push('/verify-email')
        return
      }
      
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login')
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
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
      isEmailVerified: user?.emailVerified || false,
      userRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 