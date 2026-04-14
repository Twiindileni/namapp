'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface AppItem {
  id: string
  name: string
  description: string
  status: string
  downloads: number
  created_at: string
  developer_email: string
}

export default function AdminAppsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [apps, setApps] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const { data, error } = await supabase
          .from('apps')
          .select('id, name, description, status, downloads, created_at, developer_email')
          .order('created_at', { ascending: false })
        if (error) throw error
        setApps((data || []) as AppItem[])
      } catch (error) {
        console.error('Error fetching apps:', error)
        toast.error('Failed to load apps')
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

    fetchApps()
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
                Manage Apps
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Review and manage all submitted applications.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h2 className="text-base font-semibold leading-6 text-gray-900">All Apps</h2>
              </div>
            </div>
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Developer Email</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Downloads</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {apps.map((app) => (
                          <tr key={app.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{app.name}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.developer_email}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{app.status}</span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.downloads || 0}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <a href={`/admin/apps/${app.id}`} className="text-indigo-600 hover:text-indigo-900">View</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 