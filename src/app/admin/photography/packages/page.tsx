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
  price: number
  duration: string
  features: string[]
  is_popular: boolean
  display_order: number
  is_active: boolean
  created_at: string
}

export default function AdminPackagesPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration: '',
    features: [''],
    is_popular: false,
    display_order: 0,
    is_active: true,
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('photography_packages')
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
    
    const filteredFeatures = formData.features.filter(f => f.trim() !== '')
    
    if (filteredFeatures.length === 0) {
      toast.error('Please add at least one feature')
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('photography_packages')
        .update({
          name: formData.name,
          price: formData.price,
          duration: formData.duration,
          features: filteredFeatures,
          is_popular: formData.is_popular,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', editingId)
      
      if (error) {
        console.error(error)
        toast.error('Failed to update package')
        return
      }
      toast.success('Package updated successfully')
    } else {
      const { error } = await supabase
        .from('photography_packages')
        .insert([{
          name: formData.name,
          price: formData.price,
          duration: formData.duration,
          features: filteredFeatures,
          is_popular: formData.is_popular,
          display_order: formData.display_order,
          is_active: formData.is_active,
        }])
      
      if (error) {
        console.error(error)
        toast.error('Failed to create package')
        return
      }
      toast.success('Package created successfully')
    }
    
    resetForm()
    await load()
  }

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setFormData({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      features: pkg.features.length > 0 ? pkg.features : [''],
      is_popular: pkg.is_popular,
      display_order: pkg.display_order,
      is_active: pkg.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) {
      return
    }
    
    const { error } = await supabase
      .from('photography_packages')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to delete package')
      return
    }
    
    toast.success('Package deleted successfully')
    await load()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('photography_packages')
      .update({ is_active: !currentStatus })
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to update package status')
      return
    }
    
    toast.success(currentStatus ? 'Package deactivated' : 'Package activated')
    await load()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      duration: '',
      features: [''],
      is_popular: false,
      display_order: 0,
      is_active: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] })
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

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
              <Link href="/admin/photography" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
                ← Back to Photography Dashboard
              </Link>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Manage Pricing Packages</h1>
              <p className="mt-2 text-sm text-gray-700">Create and manage photography pricing packages</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : '+ Add Package'}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Package' : 'Add New Package'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Package Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price (N$) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration *</label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 2 hours, Half day, Full day"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features *</label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter a feature"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_popular}
                        onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">Mark as "Most Popular"</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {editingId ? 'Update Package' : 'Create Package'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Packages List */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No packages yet. Click "Add Package" to create one.
              </div>
            ) : (
              packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl p-6 transition-all ${
                    pkg.is_popular
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl'
                      : 'bg-white shadow-xl'
                  }`}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-xs font-bold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={`text-xl font-bold mb-2 ${pkg.is_popular ? 'text-white' : 'text-gray-900'}`}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={`text-4xl font-bold ${pkg.is_popular ? 'text-white' : 'text-indigo-600'}`}>
                        N${pkg.price}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${pkg.is_popular ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {pkg.duration}
                    </p>
                    <p className={`text-xs mt-1 ${pkg.is_popular ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {pkg.is_active ? 'Active' : 'Inactive'} • Order: {pkg.display_order}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6 min-h-[150px]">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <svg
                          className={`w-5 h-5 mr-2 flex-shrink-0 ${
                            pkg.is_popular ? 'text-yellow-400' : 'text-indigo-600'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={pkg.is_popular ? 'text-white' : 'text-gray-700'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pkg.is_popular
                          ? 'bg-white text-indigo-600 hover:bg-gray-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(pkg.id, pkg.is_active)}
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300"
                    >
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
