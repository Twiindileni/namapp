'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuthContext } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { App } from '@/types/app'

export default function MyAppsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    const fetchMyApps = async () => {
      if (!user) return

      try {
        const appsQuery = query(
          collection(db, 'apps'),
          where('developerId', '==', user.uid)
        )
        const snapshot = await getDocs(appsQuery)
        const appsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as App[]
        setApps(appsData)
      } catch (error) {
        console.error('Error fetching apps:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyApps()
  }, [user])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                  My Apps
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Manage your uploaded applications
                </p>
              </div>
              <div className="mt-4 flex md:ml-4 md:mt-0">
                <Link
                  href="/dashboard/upload"
                  className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Upload New App
                </Link>
              </div>
            </div>

            <div className="mt-8">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : apps.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No apps uploaded</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by uploading your first app.</p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/upload"
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Upload New App
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {apps.map(app => (
                    <div key={app.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="aspect-w-16 aspect-h-9 mb-4">
                          {app.screenshotUrls && app.screenshotUrls.length > 0 ? (
                            <img
                              src={app.screenshotUrls[0]}
                              alt={app.name}
                              className="object-cover rounded-lg w-full h-48"
                            />
                          ) : (
                            <div className="bg-gray-200 rounded-lg w-full h-48 flex items-center justify-center">
                              <span className="text-gray-400">No screenshot available</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{app.name}</h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{app.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {app.category}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {app.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <Link
                            href={`/apps/${app.id}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 