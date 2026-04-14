'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { App } from '@/types/app'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { DevicePhoneMobileIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function FeaturedApps() {
  const [featuredApps, setFeaturedApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const { data: appsData, error: appsError } = await supabase
          .from('apps')
          .select('id, name, description, category, version, apk_url, developer_email, downloads, status, created_at, updated_at')
          .eq('status', 'approved')
          .order('downloads', { ascending: false })
          .limit(4)

        if (appsError) throw appsError
        const baseApps = (appsData || []).map((row: unknown) => {
          const r = row as Record<string, unknown>
          return {
            id: r.id as string,
            name: (r.name as string) || '',
            description: (r.description as string) || '',
            category: (r.category as string) || '',
            version: (r.version as string) || '',
            apkUrl: (r.apk_url as string) || '',
            screenshotUrls: [] as string[],
            status: (r.status as string) || 'pending',
            downloads: (r.downloads as number) || 0,
            createdAt: (r.created_at as string) || new Date().toISOString(),
            developerEmail: (r.developer_email as string) || '',
          }
        }) as App[]

        if (baseApps.length === 0) {
          setFeaturedApps([])
          return
        }

        const appIds = baseApps.map(a => a.id)
        const { data: screenshotsData, error: ssError } = await supabase
          .from('app_screenshots')
          .select('app_id, url')
          .in('app_id', appIds)

        if (ssError) {
          setFeaturedApps(baseApps)
          return
        }

        const appIdToScreens: Record<string, string[]> = {}
        for (const row of screenshotsData || []) {
          const r = row as { app_id: string; url: string }
          if (!appIdToScreens[r.app_id]) appIdToScreens[r.app_id] = []
          appIdToScreens[r.app_id].push(r.url)
        }

        setFeaturedApps(baseApps.map(app => ({
          ...app,
          screenshotUrls: appIdToScreens[app.id] || [],
        })))
      } catch (error) {
        console.error('Error loading featured apps:', error)
        toast.error('Failed to load featured apps')
      } finally {
        setLoading(false)
      }
    }

    fetchApps()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(9, 24, 48, 0.6)',
              border: '1px solid rgba(0, 71, 168, 0.15)',
            }}
          >
            <div className="h-44 shimmer" />
            <div className="p-4 space-y-2">
              <div className="h-4 rounded shimmer" style={{ width: '70%', background: 'rgba(0, 85, 204, 0.1)' }} />
              <div className="h-3 rounded shimmer" style={{ width: '50%', background: 'rgba(0, 85, 204, 0.05)' }} />
              <div className="h-5 rounded-full shimmer w-24 mt-3" style={{ background: 'rgba(0, 85, 204, 0.1)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (featuredApps.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-2xl"
        style={{
          background: 'rgba(9, 24, 48, 0.4)',
          border: '1px dashed rgba(0, 53, 128, 0.3)',
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,53,128,0.2)] flex items-center justify-center border border-[rgba(0,85,204,0.15)]">
            <DevicePhoneMobileIcon className="w-8 h-8 text-[#5a9ef5]" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No featured apps yet</h3>
        <p className="text-sm" style={{ color: '#4a6a90' }}>Check back soon for new apps!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {featuredApps.map((app) => (
        <Link
          key={app.id}
          href={`/apps/${app.id}`}
          className="group rounded-2xl overflow-hidden app-card"
          style={{
            background: 'rgba(9, 24, 48, 0.7)',
            border: '1px solid rgba(0, 71, 168, 0.15)',
          }}
        >
          {/* App screenshot */}
          <div className="relative h-44 overflow-hidden">
            {app.screenshotUrls && app.screenshotUrls.length > 0 ? (
              <img
                src={app.screenshotUrls[0]}
                alt={app.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-2"
                style={{ background: 'rgba(0, 53, 128, 0.12)' }}
              >
                <DevicePhoneMobileIcon className="w-10 h-10 text-[#5a9ef5]/50" />
                <span className="text-xs" style={{ color: '#4a6a90' }}>No preview</span>
              </div>
            )}
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(2,11,26,0.75) 0%, transparent 60%)',
              }}
            />
            {/* Category badge */}
            <span
              className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(0, 53, 128, 0.7)',
                border: '1px solid rgba(0, 85, 204, 0.4)',
                color: '#5a9ef5',
                backdropFilter: 'blur(8px)',
              }}
            >
              {app.category}
            </span>
          </div>

          {/* App info */}
          <div className="p-4">
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#5a9ef5] transition-colors">{app.name}</h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#4a6a90' }}>
              {app.developerEmail}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(0, 85, 204, 0.1)',
                  border: '1px solid rgba(0, 85, 204, 0.25)',
                  color: '#5a9ef5',
                }}
              >
                ⬇ {app.downloads.toLocaleString()} dls
              </span>
              <span
                className="text-xs font-medium transition-all group-hover:translate-x-1"
                style={{ color: '#5a9ef5' }}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}