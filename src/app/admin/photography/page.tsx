'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface PhotoStats {
  totalCategories: number
  activeCategories: number
  totalPhotos: number
  featuredPhotos: number
  totalPackages: number
  activePackages: number
  totalHeroSlides: number
  activeHeroSlides: number
  totalBookings: number
  pendingBookings: number
}

export default function AdminPhotographyPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<PhotoStats>({
    totalCategories: 0,
    activeCategories: 0,
    totalPhotos: 0,
    featuredPhotos: 0,
    totalPackages: 0,
    activePackages: 0,
    totalHeroSlides: 0,
    activeHeroSlides: 0,
    totalBookings: 0,
    pendingBookings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Categories
        const { data: categoriesData } = await supabase
          .from('photography_categories')
          .select('is_active')
        const totalCategories = categoriesData?.length || 0
        const activeCategories = categoriesData?.filter(c => c.is_active).length || 0

        // Photos
        const { data: photosData } = await supabase
          .from('photography_photos')
          .select('is_featured')
        const totalPhotos = photosData?.length || 0
        const featuredPhotos = photosData?.filter(p => p.is_featured).length || 0

        // Packages
        const { data: packagesData } = await supabase
          .from('photography_packages')
          .select('is_active')
        const totalPackages = packagesData?.length || 0
        const activePackages = packagesData?.filter(p => p.is_active).length || 0

        // Hero Slides
        const { data: slidesData } = await supabase
          .from('photography_hero_slides')
          .select('is_active')
        const totalHeroSlides = slidesData?.length || 0
        const activeHeroSlides = slidesData?.filter(s => s.is_active).length || 0

        // Bookings
        const { data: bookingsData } = await supabase
          .from('photography_bookings')
          .select('status')
        const totalBookings = bookingsData?.length || 0
        const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0

        setStats({
          totalCategories,
          activeCategories,
          totalPhotos,
          featuredPhotos,
          totalPackages,
          activePackages,
          totalHeroSlides,
          activeHeroSlides,
          totalBookings,
          pendingBookings,
        })
      } catch (error) {
        console.error('Error fetching photography stats:', error)
        toast.error('Failed to load photography stats')
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
                Photography Management
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage your photography portfolio, categories, pricing, bookings and hero slides
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href="/categories"
                target="_blank"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Live Site
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Categories</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats.activeCategories} / {stats.totalCategories}
              </dd>
              <p className="text-xs text-gray-500 mt-1">Active / Total</p>
            </div>

            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Photos</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats.totalPhotos}
              </dd>
              <p className="text-xs text-gray-500 mt-1">{stats.featuredPhotos} featured</p>
            </div>

            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Packages</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats.activePackages} / {stats.totalPackages}
              </dd>
              <p className="text-xs text-gray-500 mt-1">Active / Total</p>
            </div>

            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Hero Slides</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats.activeHeroSlides} / {stats.totalHeroSlides}
              </dd>
              <p className="text-xs text-gray-500 mt-1">Active / Total</p>
            </div>

            <div className="overflow-hidden rounded-lg bg-yellow-50 px-4 py-5 shadow sm:p-6 border-2 border-yellow-200">
              <dt className="truncate text-sm font-medium text-yellow-800">Bookings</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-900">
                {stats.totalBookings}
              </dd>
              <p className="text-xs text-yellow-700 mt-1">{stats.pendingBookings} pending</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-base font-semibold leading-6 text-gray-900">Management Tools</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              
              <Link 
                href="/admin/photography/categories" 
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:bg-indigo-50"
              >
                <svg className="mx-auto h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Photography Categories</span>
                <p className="text-xs text-gray-500 mt-1">Manage photo categories</p>
              </Link>

              <Link 
                href="/admin/photography/photos" 
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:bg-indigo-50"
              >
                <svg className="mx-auto h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Photos</span>
                <p className="text-xs text-gray-500 mt-1">Upload & manage photos</p>
              </Link>

              <Link 
                href="/admin/photography/packages" 
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:bg-indigo-50"
              >
                <svg className="mx-auto h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Pricing Packages</span>
                <p className="text-xs text-gray-500 mt-1">Manage pricing tiers</p>
              </Link>

              <Link 
                href="/admin/photography/hero-slides" 
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:bg-indigo-50"
              >
                <svg className="mx-auto h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Hero Slides</span>
                <p className="text-xs text-gray-500 mt-1">Manage homepage slider</p>
              </Link>

              <Link 
                href="/admin/photography/bookings" 
                className="relative block w-full rounded-lg border-2 border-dashed border-yellow-300 p-12 text-center hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all hover:bg-yellow-50"
              >
                {stats.pendingBookings > 0 && (
                  <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-yellow-500 rounded-full">
                    {stats.pendingBookings}
                  </span>
                )}
                <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Bookings</span>
                <p className="text-xs text-gray-500 mt-1">View customer requests</p>
              </Link>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
