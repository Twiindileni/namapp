'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminTable from '@/components/admin/AdminTable'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore'
import { App } from '@/types/app'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [pendingApps, setPendingApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const { userRole } = useAuth()

  useEffect(() => {
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      return
    }

    const appsRef = collection(db, 'apps')
    const q = query(
      appsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const apps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as App[]
        setPendingApps(apps)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching apps:', error)
        toast.error('Failed to load pending apps')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Review and manage app submissions
                </p>
              </div>
              <div className="mt-4 flex md:ml-4 md:mt-0">
                <button
                  type="button"
                  className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={() => window.location.href = '/admin/users'}
                >
                  Manage Users
                </button>
              </div>
            </div>

            <div className="mt-8">
              {pendingApps.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No pending apps</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by reviewing new app submissions.</p>
                </div>
              ) : (
                <AdminTable initialApps={pendingApps} />
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 