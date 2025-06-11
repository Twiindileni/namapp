'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'
import { App } from '@/types/app'

const categories = [
  'All',
  'Education',
  'Games',
  'Business',
  'Entertainment',
  'Social',
  'Utilities',
  'Health & Fitness',
  'Travel',
  'Food & Drink',
  'Other'
]

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const appsQuery = query(
      collection(db, 'apps'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(appsQuery, 
      (snapshot) => {
        const appsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as App[]
        setApps(appsData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching apps:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredApps = apps.filter(app => {
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Discover Apps</h1>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No apps found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApps.map(app => (
                <Link
                  key={app.id}
                  href={`/apps/${app.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
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
                      <span className="text-sm text-gray-500">
                        {app.downloads} downloads
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 