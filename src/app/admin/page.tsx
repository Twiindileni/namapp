'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Stats {
  totalUsers: number
  totalApps: number
  pendingApps: number
  totalDownloads: number
}

export default function AdminDashboardPage() {
  const { userRole } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalApps: 0,
    pendingApps: 0,
    totalDownloads: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      return
    }

    const fetchStats = async () => {
      try {
        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnapshot.size

        // Fetch apps stats
        const appsSnapshot = await getDocs(collection(db, 'apps'))
        const apps = appsSnapshot.docs.map(doc => doc.data())
        const totalApps = apps.length
        const pendingApps = apps.filter(app => app.status === 'pending').length
        const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0)

        setStats({
          totalUsers,
          totalApps,
          pendingApps,
          totalDownloads
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error('Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
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
                Overview of your platform's performance and management tools
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.totalUsers}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Apps</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.totalApps}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Pending Reviews</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.pendingApps}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Downloads</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.totalDownloads}</dd>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-base font-semibold leading-6 text-gray-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admin/users"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Manage Users</span>
              </Link>

              <Link
                href="/admin/apps"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Manage Apps</span>
              </Link>

              <Link
                href="/admin/categories"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Manage Categories</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 