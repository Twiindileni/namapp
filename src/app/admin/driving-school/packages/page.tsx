'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Package {
  id: string
  name: string
  description: string | null
  hours: number
  price_nad: number
  display_order: number
  is_active: boolean
  created_at: string
}

export default function AdminDrivingSchoolPackagesPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hours: 5,
    price_nad: 650,
    display_order: 0,
    is_active: true,
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('driving_school_packages')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      console.error(error)
      toast.error('Failed to load packages')
      setLoading(false)
      return
    }
    setPackages((data || []) as Package[])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }
    load()
  }, [userRole, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      description: formData.description || null,
      hours: formData.hours,
      price_nad: formData.price_nad,
      display_order: formData.display_order,
      is_active: formData.is_active,
    }
    if (editingId) {
      const { error } = await supabase
        .from('driving_school_packages')
        .update(payload)
        .eq('id', editingId)
      if (error) {
        console.error(error)
        toast.error('Failed to update package')
        return
      }
      toast.success('Package updated')
    } else {
      const { error } = await supabase.from('driving_school_packages').insert([payload])
      if (error) {
        console.error(error)
        toast.error('Failed to create package')
        return
      }
      toast.success('Package created')
    }
    resetForm()
    await load()
  }

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setFormData({
      name: pkg.name,
      description: pkg.description ?? '',
      hours: pkg.hours,
      price_nad: Number(pkg.price_nad),
      display_order: pkg.display_order,
      is_active: pkg.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return
    const { error } = await supabase.from('driving_school_packages').delete().eq('id', id)
    if (error) {
      console.error(error)
      toast.error('Failed to delete')
      return
    }
    toast.success('Package deleted')
    await load()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('driving_school_packages')
      .update({ is_active: !current })
      .eq('id', id)
    if (error) {
      toast.error('Failed to update status')
      return
    }
    toast.success(current ? 'Package deactivated' : 'Package activated')
    await load()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      hours: 5,
      price_nad: 650,
      display_order: 0,
      is_active: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading && packages.length === 0) {
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
          <Link href="/admin/driving-school" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
            ← Back to Driving School
          </Link>
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driving School Packages</h1>
              <p className="mt-2 text-sm text-gray-600">N$130/hour base rate</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {showForm ? 'Cancel' : '+ Add Package'}
            </button>
          </div>

          {showForm && (
            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Package' : 'New Package'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hours *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value, 10) || 0 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price (N$) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      value={formData.price_nad}
                      onChange={(e) => setFormData({ ...formData, price_nad: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active (visible on public page)</label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={resetForm} className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {packages.map((pkg) => (
                <li key={pkg.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                    <p className="text-sm text-gray-500">{pkg.hours} hours · N$ {Number(pkg.price_nad).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(pkg.id, pkg.is_active)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" onClick={() => handleEdit(pkg)} className="text-sm text-indigo-600 hover:text-indigo-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(pkg.id)} className="text-sm text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {packages.length === 0 && !loading && (
              <p className="px-4 py-8 text-center text-gray-500">No packages yet. Add one above.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
