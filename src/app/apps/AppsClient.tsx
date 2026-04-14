'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { App } from '@/types/app'
import { supabase } from '@/lib/supabase'

const categories = [
  'all',
  'education',
  'games',
  'business',
  'entertainment',
  'social',
  'utilities',
  'health & fitness',
  'travel',
  'food & drink',
  'other'
]

export default function AppsClient() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadApps = async () => {
      setLoading(true)
      try {
        const { data: appsData, error: appsError } = await supabase
          .from('apps')
          .select('id, name, description, category, version, apk_url, developer_email, downloads, status, created_at, updated_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        if (appsError) {
          console.error('Error fetching apps:', appsError)
          setLoading(false)
          return
        }

        if (!appsData || appsData.length === 0) {
          setApps([])
          setLoading(false)
          return
        }

        const appsWithScreenshots = await Promise.all(
          appsData.map(async (app) => {
            const { data: screenshotsData } = await supabase
              .from('app_screenshots')
              .select('url')
              .eq('app_id', app.id)
              .order('uploaded_at', { ascending: true })

            return {
              id: app.id,
              name: app.name,
              description: app.description,
              category: app.category,
              version: app.version,
              apkUrl: app.apk_url,
              screenshotUrls: (screenshotsData || []).map((s: any) => s.url),
              developerEmail: app.developer_email,
              downloads: app.downloads,
              status: app.status,
              createdAt: app.created_at,
              updatedAt: app.updated_at
            }
          })
        )

        setApps(appsWithScreenshots)
      } catch (error) {
        console.error('Error loading apps:', error)
      } finally {
        setLoading(false)
      }
    }

    loadApps()
  }, [])

  const filteredApps = apps.filter(app => {
    const matchesCategory = selectedCategory === 'all' || app.category.toLowerCase() === selectedCategory.toLowerCase()
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
                    {category.charAt(0).toUpperCase() + category.slice(1)}
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

