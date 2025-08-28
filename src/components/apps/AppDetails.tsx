'use client'

import { useState, useEffect } from 'react'
import { App } from '@/types/app'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon, UserIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface AppDetailsProps {
  appId: string
}

export default function AppDetails({ appId }: AppDetailsProps) {
  const [app, setApp] = useState<App | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [developerName, setDeveloperName] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('id, name, description, category, version, apk_url, developer_email, downloads, status, created_at, updated_at, developer_id, app_screenshots(url), users!apps_developer_id_fkey(name)')
        .eq('id', appId)
        .single()
      if (error) {
        console.error('Error fetching app:', error)
        toast.error('Failed to load app details')
        setLoading(false)
        return
      }
      const mapped: App = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        version: data.version,
        apkUrl: data.apk_url,
        screenshotUrls: (data.app_screenshots || []).map((s: any) => s.url),
        developerEmail: data.developer_email,
        downloads: data.downloads,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
      setApp(mapped)
      setDeveloperName(data.users?.name || data.developer_email || null)
      setLoading(false)
    }

    load()
  }, [appId])

  const handleDownload = async () => {
    if (!app) return

    try {
      setDownloading(true)

      // Update download count
      const { error } = await supabase
        .from('apps')
        .update({ downloads: (app.downloads || 0) + 1, last_downloaded_at: new Date().toISOString() })
        .eq('id', appId)
      if (error) throw error

      // Trigger the actual download
      const link = document.createElement('a')
      link.href = app.apkUrl
      link.download = `${app.name}.apk`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Download started!')
    } catch (error) {
      console.error('Error updating download count:', error)
      toast.error('Failed to update download count')
    } finally {
      setDownloading(false)
    }
  }

  const nextScreenshot = () => {
    if (!app?.screenshotUrls) return
    setCurrentScreenshotIndex((prev) => 
      prev === app.screenshotUrls.length - 1 ? 0 : prev + 1
    )
  }

  const prevScreenshot = () => {
    if (!app?.screenshotUrls) return
    setCurrentScreenshotIndex((prev) => 
      prev === 0 ? app.screenshotUrls.length - 1 : prev - 1
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">App not found</h1>
          <p className="mt-2 text-gray-600">The app you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
      <Navbar />
      <main className="flex-grow relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass-effect rounded-lg p-8 sm:p-10 lg:p-12 shadow-xl">
          {/* App Header */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
            {/* Screenshots Section */}
            <div className="mt-10 lg:mt-0">
              <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto">
                {app.screenshotUrls && app.screenshotUrls.length > 0 ? (
                  <>
                    <div className="absolute inset-0 rounded-[3rem] border-8 border-gray-800 bg-gray-900 shadow-xl overflow-hidden">
                      <img
                        src={app.screenshotUrls[currentScreenshotIndex]}
                        alt={`${app.name} screenshot ${currentScreenshotIndex + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {app.screenshotUrls.length > 1 && (
                      <>
                        <button
                          onClick={prevScreenshot}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white"
                        >
                          <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
                        </button>
                        <button
                          onClick={nextScreenshot}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white"
                        >
                          <ChevronRightIcon className="h-6 w-6 text-gray-800" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 rounded-[3rem] border-8 border-gray-800 bg-gray-900 shadow-xl flex items-center justify-center">
                    <span className="text-gray-400">No screenshots available</span>
                  </div>
                )}
              </div>
              {/* Screenshot Thumbnails */}
              {app.screenshotUrls && app.screenshotUrls.length > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  {app.screenshotUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentScreenshotIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        currentScreenshotIndex === index
                          ? 'border-indigo-600'
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* App Details */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{app.name}</h1>
              
              {/* App Metadata */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center text-sm text-gray-500">
                  <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                  <span>Version {app.version}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="h-5 w-5 mr-2" />
                  <span>Developer: {developerName || app.developerEmail}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>Last updated: {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  <span>Category: {app.category}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  <span>{app.downloads} downloads</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                <div className="mt-2 prose prose-sm text-gray-500">
                  <p>{app.description}</p>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-8">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  {downloading ? 'Downloading...' : 'Download APK'}
                </button>
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="mt-16">
            <div className="glass-effect rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Installation Instructions</h2>
              <div className="prose prose-sm text-gray-500">
                <ol className="space-y-4">
                  <li className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-medium mr-3">1</span>
                    <span>Download the APK file by clicking the "Download APK" button above.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-medium mr-3">2</span>
                    <span>On your Android device, go to Settings &gt; Security and enable "Unknown Sources" to allow installation of apps from sources other than the Play Store.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-medium mr-3">3</span>
                    <span>Open the downloaded APK file from your device's Downloads folder or notification panel.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-medium mr-3">4</span>
                    <span>Follow the on-screen instructions to complete the installation.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-medium mr-3">5</span>
                    <span>Once installed, you can find the app in your device's app drawer.</span>
                  </li>
                </ol>
                <p className="mt-4 text-sm text-red-500 font-medium">
                  Security Note: Enabling "Unknown Sources" may pose security risks. Only install APKs from trusted sources like NamApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 