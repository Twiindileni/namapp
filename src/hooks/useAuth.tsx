'use client'

import { useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role)
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Store additional user information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role: 'developer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      return user
    } catch (error) {
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const role = userDoc.data().role
        if (role === 'admin') {
          router.push('/admin')
        } else if (role === 'developer') {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      }
      return user
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      throw error
    }
  }

  const createAdminUser = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Store admin information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: ['manage_users', 'manage_apps', 'view_analytics']
      })

      return user
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    loading,
    userRole,
    signup,
    login,
    logout,
    createAdminUser
  }
} 