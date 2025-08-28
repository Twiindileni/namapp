'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { App } from '@/types/app'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export default function FeaturedApps() {
  const [featuredApps, setFeaturedApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApps = async () => {
      try {
        // Fetch approved apps ordered by downloads
        const { data: appsData, error: appsError } = await supabase
          .from('apps')
          .select('id, name, description, category, version, apk_url, developer_email, downloads, status, created_at, updated_at')
          .eq('status', 'approved')
          .order('downloads', { ascending: false })
          .limit(4)

        if (appsError) throw appsError
        const baseApps = (appsData || []).map((row: any) => ({
          id: row.id,
          name: row.name || '',
          description: row.description || '',
          category: row.category || '',
          version: row.version || '',
          apkUrl: row.apk_url || '',
          screenshotUrls: [] as string[],
          status: row.status || 'pending',
          downloads: row.downloads || 0,
          createdAt: row.created_at || new Date().toISOString(),
          developerEmail: row.developer_email || ''
        })) as App[]

        if (baseApps.length === 0) {
          setFeaturedApps([])
          return
        }

        // Fetch screenshots for these apps
        const appIds = baseApps.map(a => a.id)
        const { data: screenshotsData, error: ssError } = await supabase
          .from('app_screenshots')
          .select('app_id, url')
          .in('app_id', appIds)
        if (ssError) {
          // Log but continue to show apps without screenshots
          console.error('Error loading screenshots:', ssError)
          setFeaturedApps(baseApps)
          return
        }

        const appIdToScreens: Record<string, string[]> = {}
        for (const row of screenshotsData || []) {
          if (!appIdToScreens[row.app_id]) appIdToScreens[row.app_id] = []
          appIdToScreens[row.app_id].push(row.url)
        }

        const merged = baseApps.map(app => ({
          ...app,
          screenshotUrls: appIdToScreens[app.id] || []
        }))

        setFeaturedApps(merged)
      } catch (error) {
        console.error('Error loading featured apps:', error)
        toast.error('Failed to load featured apps')
      } finally {
        setLoading(false)
      }
    }

    fetchApps()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Featured Apps</h2>
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="group relative glass-effect rounded-lg p-4 hover-lift">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200">
                <div className="h-48 w-full bg-gray-200 shimmer" />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Loading...
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">Loading...</p>
                </div>
                <p className="text-sm font-medium text-gray-900">Loading...</p>
              </div>
            </div>
          ))}
        </div>
      ) : featuredApps.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No featured apps yet</h3>
          <p className="mt-1 text-sm text-gray-500">Check back soon for new apps!</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {featuredApps.map((app) => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="group relative glass-effect rounded-lg p-4 hover-lift"
            >
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200">
                {app.screenshotUrls && app.screenshotUrls.length > 0 ? (
                  <img
                    src={app.screenshotUrls[0]}
                    alt={app.name}
                    className="h-48 w-full object-cover object-center"
                  />
                ) : (
                  <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No screenshot available</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {app.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{app.developerEmail}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">{app.category}</p>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {app.downloads} downloads
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 