'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  CameraIcon, 
  ArrowLeftIcon, 
  XMarkIcon, 
  ChevronRightIcon,
  CalendarIcon,
  TicketIcon
} from '@heroicons/react/24/outline'

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020b1a]">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#003580] animate-spin"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center glass-card p-12">
            <h1 className="text-4xl font-bold text-white mb-6">Collection Not Found</h1>
            <Link href="/categories" className="btn-outline">
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Photography</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Cinematic Header */}
      <section className="relative h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
           {category.cover_image_url ? (
             <>
               <img
                 src={category.cover_image_url}
                 alt={category.name}
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#020b1a] via-[#020b1a]/40 to-transparent z-10" />
               <div className="absolute inset-0 backdrop-blur-[2px] z-5" />
             </>
           ) : (
             <div className="absolute inset-0 bg-[#0d2040]" />
           )}
        </div>
        
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-medium text-[#5a9ef5] hover:text-white transition-colors mb-6 group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Discovery
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="hero-title !text-4xl md:!text-6xl mb-4 leading-none">
                {category.name}
              </h1>
              <p className="text-lg text-[#8baed4] max-w-2xl leading-relaxed">
                {category.description}
              </p>
            </div>
            
            <div className="flex gap-4">
              <Link
                href={`/photography/book?category=${encodeURIComponent(category.name)}`}
                className="btn-primary"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Book This Style</span>
              </Link>
              <Link
                href="/categories#pricing"
                className="btn-outline"
              >
                <TicketIcon className="w-5 h-5" />
                <span>Pricing</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Subtle bottom line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgba(0,85,204,0.3)] to-transparent z-20" />
      </section>

      {/* Photo Gallery Grid */}
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {photos.length === 0 ? (
            <div className="text-center py-32 glass-card">
              <CameraIcon className="mx-auto h-16 w-16 text-[#003580] mb-4" />
              <p className="text-xl text-white font-semibold">Empty Collection</p>
              <p className="text-[#4a6a90] mt-2">Check back soon as we curate this gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative cursor-pointer fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl glass-card border-[rgba(0,85,204,0.1)] group-hover:border-[rgba(0,85,204,0.3)] transition-all">
                    <img
                      src={photo.image_url}
                      alt={photo.title || 'Collection item'}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    
                    {/* Hover Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020b1a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {photo.title || 'Untitled Work'}
                      </h3>
                      {photo.description && (
                        <p className="text-sm text-[#8baed4] line-clamp-2">{photo.description}</p>
                      )}
                      
                      <div className="mt-4 flex items-center gap-2 text-[10px] text-[#5a9ef5] font-bold uppercase tracking-wider">
                         <span>View High Res</span>
                         <ChevronRightIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cinematic Modal (Lightbox) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-[#020b1a]/95 z-[60] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-8 right-8 text-[#5a9ef5] hover:text-white transition-colors z-[70] p-2 glass-effect rounded-full"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          
          <div className="max-w-6xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full flex items-center justify-center p-4">
               <img
                 src={selectedPhoto.image_url}
                 alt={selectedPhoto.title || 'Collection item'}
                 className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]"
               />
            </div>
            
            {(selectedPhoto.title || selectedPhoto.description) && (
              <div className="mt-8 text-center max-w-2xl px-6 animate-in slide-in-from-bottom-4 duration-500">
                {selectedPhoto.title && (
                  <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {selectedPhoto.title}
                  </h3>
                )}
                {selectedPhoto.description && (
                  <p className="text-[#8baed4] leading-relaxed">{selectedPhoto.description}</p>
                )}
              </div>
            )}
            
            <div className="mt-8">
               <button 
                 onClick={() => setSelectedPhoto(null)}
                 className="btn-outline !rounded-full !py-2 !px-8 text-xs"
               >
                 Close Detail
               </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
