'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface HeroSlide {
  id: string
  title: string | null
  subtitle: string | null
  image_url: string
  display_order: number
  is_active: boolean
  created_at: string
}

export default function AdminHeroSlidesPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('photography_hero_slides')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      console.error(error)
      toast.error('Failed to load slides')
      setLoading(false)
      return
    }
    setSlides((data || []) as HeroSlide[])
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

      const fileExt = file.name.split('.').pop()
      const fileName = `hero-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `photography/hero/${fileName}`

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let imageUrl = formData.image_url

    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile)
      if (!uploadedUrl) return
      imageUrl = uploadedUrl
    }

    if (!imageUrl) {
      toast.error('Please upload an image file')
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('photography_hero_slides')
        .update({
          title: formData.title || null,
          subtitle: formData.subtitle || null,
          image_url: imageUrl,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', editingId)
      
      if (error) {
        console.error(error)
        toast.error('Failed to update slide')
        return
      }
      toast.success('Slide updated successfully')
    } else {
      const { error } = await supabase
        .from('photography_hero_slides')
        .insert([{
          title: formData.title || null,
          subtitle: formData.subtitle || null,
          image_url: imageUrl,
          display_order: formData.display_order,
          is_active: formData.is_active,
        }])
      
      if (error) {
        console.error(error)
        toast.error('Failed to create slide')
        return
      }
      toast.success('Slide created successfully')
    }
    
    resetForm()
    await load()
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingId(slide.id)
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      display_order: slide.display_order,
      is_active: slide.is_active,
    })
    setPreviewUrl(slide.image_url)
    setShowForm(true)
  }

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) {
      return
    }
    
    try {
      const urlParts = imageUrl.split('/photography/hero/')
      if (urlParts.length > 1) {
        const filePath = `photography/hero/${urlParts[1]}`
        await supabase.storage.from('photos').remove([filePath])
      }
    } catch (error) {
      console.log('Could not delete from storage:', error)
    }

    const { error } = await supabase
      .from('photography_hero_slides')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to delete slide')
      return
    }
    
    toast.success('Slide deleted successfully')
    await load()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('photography_hero_slides')
      .update({ is_active: !currentStatus })
      .eq('id', id)
    
    if (error) {
      console.error(error)
      toast.error('Failed to update slide status')
      return
    }
    
    toast.success(currentStatus ? 'Slide deactivated' : 'Slide activated')
    await load()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      display_order: 0,
      is_active: true,
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
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Manage Hero Slides</h1>
              <p className="mt-2 text-sm text-gray-700">Manage the homepage hero slider images</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : '+ Add Slide'}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Hero Slide' : 'Add New Hero Slide'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image * (1200x600 recommended)</label>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Title (optional)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Purpose Photography"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subtitle (optional)</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g., Capturing life's precious moments"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
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

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : editingId ? 'Update Slide' : 'Create Slide'}
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

          {/* Slides List */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slides.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No slides yet. Click "Add Slide" to create one.
              </div>
            ) : (
              slides.map((slide) => (
                <div key={slide.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative h-48">
                    <img 
                      src={slide.image_url} 
                      alt={slide.title || 'Hero slide'} 
                      className="w-full h-full object-cover"
                    />
                    {!slide.is_active && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold">INACTIVE</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {slide.title || 'No title'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{slide.subtitle || 'No subtitle'}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${slide.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {slide.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-400">Order: {slide.display_order}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(slide)}
                        className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(slide.id, slide.is_active)}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300"
                      >
                        {slide.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id, slide.image_url)}
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
