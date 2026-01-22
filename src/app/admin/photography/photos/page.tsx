'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Photo {
  id: string
  category_id: string
  title: string | null
  description: string | null
  image_url: string
  thumbnail_url: string | null
  is_featured: boolean
  display_order: number
  created_at: string
  photography_categories?: {
    name: string
  }
}

interface Category {
  id: string
  name: string
}

export default function AdminPhotosPage() {
  const { userRole, loading: authLoading, user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    image_url: '',
    is_featured: false,
    display_order: 0,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const load = async () => {
    setLoading(true)
    
    // Load categories
    const { data: categoriesData } = await supabase
      .from('photography_categories')
      .select('id, name')
      .order('name', { ascending: true })
    setCategories((categoriesData || []) as Category[])

    // Load photos
    const { data, error } = await supabase
      .from('photography_photos')
      .select(`
        *,
        photography_categories (name)
      `)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error(error)
      toast.error('Failed to load photos')
      setLoading(false)
      return
    }
    setPhotos((data || []) as Photo[])
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
      setUploadProgress(0)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `photography/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('photos') // Make sure this bucket exists in your Supabase project
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload file: ' + error.message)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      setUploadProgress(100)
      return urlData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let imageUrl = formData.image_url

    // Upload file if selected
    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile)
      if (!uploadedUrl) {
        return
      }
      imageUrl = uploadedUrl
    }

    if (!imageUrl) {
      toast.error('Please upload an image file')
      return
    }

    if (editingId) {
      // Update existing photo
      const { error } = await supabase
        .from('photography_photos')
        .update({
          category_id: formData.category_id,
          title: formData.title || null,
          description: formData.description || null,
          image_url: imageUrl,
          is_featured: formData.is_featured,
          display_order: formData.display_order,
        })
        .eq('id', editingId)
      
      if (error) {
        console.error(error)
        toast.error('Failed to update photo')
        return
      }
      toast.success('Photo updated successfully')
    } else {
      // Create new photo
      const { error } = await supabase
        .from('photography_photos')
        .insert([{
          category_id: formData.category_id,
          title: formData.title || null,
          description: formData.description || null,
          image_url: imageUrl,
          is_featured: formData.is_featured,
          display_order: formData.display_order,
          uploaded_by: user?.id || null,
        }])
      
      if (error) {
        console.error(error)
        toast.error('Failed to add photo')
        return
      }
      toast.success('Photo added successfully')
    }
    
    resetForm()
    await load()
  }

  const handleEdit = (photo: Photo) => {
    setEditingId(photo.id)
    setFormData({
      category_id: photo.category_id,
      title: photo.title || '',
      description: photo.description || '',
      image_url: photo.image_url,
      is_featured: photo.is_featured,
      display_order: photo.display_order,
    })
    setPreviewUrl(photo.image_url)
    setShowForm(true)
  }

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }
    
    // Try to delete from storage if it's stored there
    try {
      const urlParts = imageUrl.split('/photography/')
      if (urlParts.length > 1) {
        const filePath = `photography/${urlParts[1]}`
        await supabase.storage.from('photos').remove([filePath])
      }
    } catch (error) {
      console.log('Could not delete from storage (might be external URL):', error)
    }

    const { error } = await supabase
      .from('photography_photos')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to delete photo')
      return
    }
    
    toast.success('Photo deleted successfully')
    await load()
  }

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('photography_photos')
      .update({ is_featured: !currentStatus })
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to update photo')
      return
    }
    
    toast.success(currentStatus ? 'Removed from featured' : 'Added to featured')
    await load()
  }

  const resetForm = () => {
    setFormData({
      category_id: '',
      title: '',
      description: '',
      image_url: '',
      is_featured: false,
      display_order: 0,
    })
    setEditingId(null)
    setShowForm(false)
    setSelectedFile(null)
    setPreviewUrl(null)
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
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Manage Photos</h1>
              <p className="mt-2 text-sm text-gray-700">Upload and manage your photography portfolio</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : '+ Upload Photo'}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Photo' : 'Upload New Photo'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image *</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                    <div className="space-y-1 text-center">
                      {previewUrl ? (
                        <div className="mb-4">
                          <img src={previewUrl} alt="Preview" className="mx-auto h-48 w-auto rounded" />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(null)
                              setSelectedFile(null)
                              setFormData({ ...formData, image_url: '' })
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
                            required={!editingId && !formData.image_url}
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
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title (optional)</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Mark as featured
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : editingId ? 'Update Photo' : 'Add Photo'}
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

          {/* Photos Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {photos.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No photos yet. Click "Upload Photo" to add some.
              </div>
            ) : (
              photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden group relative">
                  <div className="relative h-48">
                    <img 
                      src={photo.image_url} 
                      alt={photo.title || 'Photo'} 
                      className="w-full h-full object-cover"
                    />
                    {photo.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                        ⭐ Featured
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {photo.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {photo.photography_categories?.name || 'No category'}
                    </p>
                    <div className="mt-3 flex gap-1 flex-wrap">
                      <button
                        onClick={() => handleEdit(photo)}
                        className="px-2 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                        className="px-2 py-1 rounded bg-yellow-500 text-white text-xs hover:bg-yellow-600"
                      >
                        {photo.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id, photo.image_url)}
                        className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
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
