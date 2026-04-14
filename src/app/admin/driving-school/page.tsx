'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalPackages: number
  activePackages: number
  totalBookings: number
  pendingBookings: number
}

export default function AdminDrivingSchoolPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalPackages: 0,
    activePackages: 0,
    totalBookings: 0,
    pendingBookings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: packagesData } = await supabase
          .from('driving_school_packages')
          .select('is_active')
        const totalPackages = packagesData?.length ?? 0
        const activePackages = (packagesData ?? []).filter((p: { is_active: boolean }) => p.is_active).length

        const { data: bookingsData } = await supabase
          .from('driving_school_bookings')
          .select('status')
        const totalBookings = bookingsData?.length ?? 0
        const pendingBookings = (bookingsData ?? []).filter((b: { status: string }) => b.status === 'pending').length

        setStats({
          totalPackages,
          activePackages,
          totalBookings,
          pendingBookings,
        })
      } catch (error) {
        console.error('Error fetching driving school stats:', error)
        toast.error('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }
    fetchStats()
  }, [userRole, authLoading])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Driving School</h1>
          <p className="mt-2 text-gray-600">Manage packages and bookings</p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Packages</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalPackages}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Active Packages</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activePackages}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Bookings</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalBookings}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Pending Bookings</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingBookings}</dd>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link
              href="/admin/driving-school/packages"
              className="relative block rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="mt-2 block text-sm font-semibold text-gray-900">Manage Packages</span>
            </Link>
            <Link
              href="/admin/driving-school/bookings"
              className="relative block rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="mt-2 block text-sm font-semibold text-gray-900">Manage Bookings</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
