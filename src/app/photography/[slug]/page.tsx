'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Photo {
  id: string
  title: string | null
  description: string | null
  image_url: string
  display_order: number
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  cover_image_url: string | null
}

export default function CategoryGalleryPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [category, setCategory] = useState<Category | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load category
        const { data: categoryData, error: categoryError } = await supabase
          .from('photography_categories')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (categoryError || !categoryData) {
          toast.error('Category not found')
          setLoading(false)
          return
        }

        setCategory(categoryData)

        // Load photos for this category
        const { data: photosData, error: photosError } = await supabase
          .from('photography_photos')
          .select('*')
          .eq('category_id', categoryData.id)
          .order('display_order', { ascending: true })

        if (!photosError) {
          setPhotos(photosData || [])
        }
      } catch (error) {
        console.error('Error loading gallery:', error)
        toast.error('Failed to load gallery')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <Link href="/categories" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Photography
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/categories" className="text-indigo-200 hover:text-white mb-4 inline-block">
            ← Back to Photography
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
          <p className="text-xl text-indigo-100 max-w-3xl">{category.description}</p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:bg-gray-100 transition-all"
            >
              Book a Session
            </Link>
          </div>
        </div>
      </div>

      {/* Photos Gallery */}
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-lg text-gray-600">No photos in this gallery yet.</p>
              <p className="text-sm text-gray-500 mt-2">Check back soon for stunning photos!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative h-72">
                    <img
                      src={photo.image_url}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {photo.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-semibold text-lg">{photo.title}</h3>
                        {photo.description && (
                          <p className="text-sm text-gray-200 mt-1 line-clamp-2">{photo.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.title || 'Photo'}
              className="w-full h-full object-contain"
            />
            {(selectedPhoto.title || selectedPhoto.description) && (
              <div className="mt-4 text-white text-center">
                {selectedPhoto.title && (
                  <h3 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h3>
                )}
                {selectedPhoto.description && (
                  <p className="text-gray-300">{selectedPhoto.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
