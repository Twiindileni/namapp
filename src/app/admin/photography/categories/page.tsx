'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  cover_image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export default function AdminPhotoCategoriesPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    cover_image_url: '',
    display_order: 0,
    is_active: true,
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('photography_categories')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      console.error(error)
      toast.error('Failed to load categories')
      setLoading(false)
      return
    }
    setCategories((data || []) as Category[])
    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `category-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `photography/categories/${fileName}`

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload file: ' + error.message)
        return null
      }

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
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
    
    let coverImageUrl = formData.cover_image_url

    // Upload file if selected
    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile)
      if (!uploadedUrl) return
      coverImageUrl = uploadedUrl
    }
    
    if (editingId) {
      // Update existing category
      const { error } = await supabase
        .from('photography_categories')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          cover_image_url: coverImageUrl || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', editingId)
      
      if (error) {
        console.error(error)
        toast.error('Failed to update category')
        return
      }
      toast.success('Category updated successfully')
    } else {
      // Create new category
      const { error } = await supabase
        .from('photography_categories')
        .insert([{
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          cover_image_url: coverImageUrl || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        }])
      
      if (error) {
        console.error(error)
        toast.error('Failed to create category')
        return
      }
      toast.success('Category created successfully')
    }
    
    resetForm()
    await load()
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      cover_image_url: category.cover_image_url || '',
      display_order: category.display_order,
      is_active: category.is_active,
    })
    setPreviewUrl(category.cover_image_url || null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all photos in this category.')) {
      return
    }
    
    const { error } = await supabase
      .from('photography_categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to delete category')
      return
    }
    
    toast.success('Category deleted successfully')
    await load()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('photography_categories')
      .update({ is_active: !currentStatus })
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to update category status')
      return
    }
    
    toast.success(currentStatus ? 'Category deactivated' : 'Category activated')
    await load()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      cover_image_url: '',
      display_order: 0,
      is_active: true,
    })
    setEditingId(null)
    setShowForm(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Manage Photography Categories</h1>
              <p className="mt-2 text-sm text-gray-700">Create and manage your photography portfolio categories</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : '+ Add Category'}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (!editingId) {
                          setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })
                        }
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (Optional)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                    <div className="space-y-1 text-center">
                      {previewUrl ? (
                        <div className="mb-4">
                          <img src={previewUrl} alt="Preview" className="mx-auto h-32 w-auto rounded" />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(null)
                              setSelectedFile(null)
                              setFormData({ ...formData, cover_image_url: '' })
                            }}
                            className="mt-2 text-sm text-red-600 hover:text-red-700"
                          >
                            Remove image
                          </button>
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                          <span>Upload a file</span>
                          <input 
                            type="file" 
                            className="sr-only" 
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                  {uploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all w-1/2"></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Tip: Upload photos in the Photos section and mark them as featured to display in this category
                  </p>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {editingId ? 'Update Category' : 'Create Category'}
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

          {/* Categories List */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No categories yet. Click "Add Category" to create one.
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {category.cover_image_url ? (
                    <img 
                      src={category.cover_image_url} 
                      alt={category.name} 
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                      No cover image
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                    <p className="text-xs text-gray-400 mb-4">Order: {category.display_order}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(category.id, category.is_active)}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300"
                      >
                        {category.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
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
