'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { use } from 'react'

interface App {
  id: string
  name: string
  description: string
  category: string
  version: string
  apk_url: string
  status: 'pending' | 'approved' | 'rejected'
  downloads: number
  created_at: string
  developer_email: string
}

interface AppScreenshot {
  id: string
  url: string
  file_name: string
}

export default function AdminAppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { userRole, loading: authLoading } = useAuth()
  const router = useRouter()
  const [app, setApp] = useState<App | null>(null)
  const [screenshots, setScreenshots] = useState<AppScreenshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/admin')
      return
    }

    const fetchApp = async () => {
      try {
        // Fetch app details
        const { data: appData, error: appError } = await supabase
          .from('apps')
          .select('*')
          .eq('id', id)
          .single()

        if (appError) {
          console.error('Error fetching app details:', appError)
          toast.error('Failed to load app details.')
          router.push('/admin/apps')
          return
        }

        if (appData) {
          setApp(appData as App)
          
          // Fetch screenshots for this app
          const { data: screenshotData, error: screenshotError } = await supabase
            .from('app_screenshots')
            .select('id, url, file_name')
            .eq('app_id', id)
            .order('uploaded_at', { ascending: true })

          if (screenshotError) {
            console.error('Error fetching screenshots:', screenshotError)
            // Don't fail the whole request if screenshots fail
          } else {
            setScreenshots(screenshotData || [])
          }
        } else {
          toast.error('App not found.')
          router.push('/admin/apps')
        }
      } catch (error) {
        console.error('Error fetching app details:', error)
        toast.error('Failed to load app details.')
      } finally {
        setLoading(false)
      }
    }

    fetchApp()
  }, [id, userRole, router, authLoading])

  const updateAppStatus = async (newStatus: 'approved' | 'rejected') => {
    if (!app) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('apps')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', app.id)

      if (error) {
        console.error(`Error ${newStatus} app:`, error)
        toast.error(`Failed to ${newStatus} app.`)
        return
      }

      console.log(`App ${app.id} status updated to ${newStatus}`)

      setApp(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success(`App ${newStatus} successfully!`) 
    } catch (error) {
      console.error(`Error ${newStatus} app:`, error)
      toast.error(`Failed to ${newStatus} app.`) 
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!app) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                App Details: {app.name}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Review and manage this application.
              </p>
            </div>
            <div className="mt-4 flex flex-shrink-0 md:ml-4 md:mt-0">
              {app.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => updateAppStatus('rejected')}
                    className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAppStatus('approved')}
                    className="ml-3 inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    Approve
                  </button>
                </>
              )}
              {app.status === 'approved' && (
                <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                  Approved
                </span>
              )}
              {app.status === 'rejected' && (
                <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-800">
                  Rejected
                </span>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="overflow-hidden bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">Application Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the submitted app.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">App Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.name}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.description}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.category}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Version</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.version}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Developer Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.developer_email}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.status}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Downloads</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{app.downloads}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{new Date(app.created_at).toLocaleString()}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">APK File</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <a href={app.apk_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        Download APK
                      </a>
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Screenshots</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {screenshots.length > 0 ? (
                        <ul role="list" className="divide-y divide-gray-200 rounded-md border border-gray-200">
                          {screenshots.map((screenshot, index) => (
                            <li key={screenshot.id} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                              <div className="flex w-0 flex-1 items-center">
                                <svg className="h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0L9.293 6.464a1 1 0 01-1.414 0L6.464 5.05a3 3 0 10-4.242 4.242l.707.707a1 1 0 010 1.414l-.707.707a3 3 0 104.242 4.242L8.586 13.536a1 1 0 011.414 0l1.414 1.414a3 3 0 104.242-4.242l-.707-.707a1 1 0 010-1.414l.707-.707a3 3 0 100-4.242z" clipRule="evenodd" />
                                </svg>
                                <span className="ml-2 w-0 flex-1 truncate">{screenshot.file_name}</span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <a href={screenshot.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-900">
                                  View
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No screenshots uploaded</p>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 