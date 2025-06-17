'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore'
import { App } from '@/types/app'
import toast from 'react-hot-toast'

export default function FeaturedApps() {
  const [featuredApps, setFeaturedApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const fetchApps = async () => {
      try {
        console.log('Setting up apps query...')
        const appsRef = collection(db, 'apps')
        
        // First, try to get all approved apps
        const q = query(
          appsRef,
          where('status', '==', 'approved')
        )
        
        const snapshot = await getDocs(q)
        console.log('Found approved apps:', snapshot.size)
        
        // Then set up the real-time listener
        const appsQuery = query(
          appsRef,
          where('status', '==', 'approved'),
          orderBy('downloads', 'desc'),
          limit(4)
        )

        console.log('Starting onSnapshot listener...')
        unsubscribe = onSnapshot(appsQuery, 
          (snapshot) => {
            try {
              console.log('Snapshot received, empty:', snapshot.empty)
              console.log('Number of docs:', snapshot.docs.length)
              
              const apps = snapshot.docs.map(doc => {
                const data = doc.data()
                console.log('App data:', { id: doc.id, ...data })
                return {
                  id: doc.id,
                  name: data.name || '',
                  description: data.description || '',
                  category: data.category || '',
                  version: data.version || '',
                  apkUrl: data.apkUrl || '',
                  screenshotUrls: data.screenshotUrls || [],
                  status: data.status || 'pending',
                  downloads: data.downloads || 0,
                  createdAt: data.createdAt || new Date().toISOString(),
                  developerEmail: data.developerEmail || ''
                } as App
              })
              
              console.log('Processed apps:', apps)
              setFeaturedApps(apps)
            } catch (error) {
              console.error('Error processing apps data:', error)
              toast.error('Error processing apps data')
            } finally {
              setLoading(false)
            }
          },
          (error) => {
            console.error('Error in onSnapshot:', error)
            console.error('Error code:', error.code)
            console.error('Error message:', error.message)
            toast.error('Failed to load featured apps')
            setLoading(false)
          }
        )
      } catch (error) {
        console.error('Error setting up apps query:', error)
        toast.error('Error setting up apps query')
        setLoading(false)
      }
    }

    fetchApps()

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up onSnapshot listener...')
        unsubscribe()
      }
    }
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