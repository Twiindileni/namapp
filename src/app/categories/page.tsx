'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PageLoader from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase'
import { CameraIcon } from '@heroicons/react/24/outline'

interface PhotographyCategory {
  id: string
  name: string
  slug: string
  description: string
  cover_image_url: string | null
  photos?: Photo[]
}

interface Photo {
  id: string
  image_url: string
  title: string | null
  is_featured?: boolean
}

interface PricingPackage {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  is_popular: boolean
}

interface HeroSlide {
  id: string
  title: string | null
  subtitle: string | null
  image_url: string
  display_order: number
}

export default function PhotographyPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [categories, setCategories] = useState<PhotographyCategory[]>([])
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)

  // Default packages (fallback if database is empty)
  const defaultPackages: PricingPackage[] = [
    {
      id: 'default-1',
      name: 'Basic Package',
      price: 500,
      duration: '2 hours',
      features: [
        '2 hours of photography',
        '50 edited high-resolution photos',
        'Online gallery',
        '1 location',
        'Digital download',
      ],
      is_popular: false,
    },
    {
      id: 'default-2',
      name: 'Standard Package',
      price: 1200,
      duration: '4 hours',
      features: [
        '4 hours of photography',
        '150 edited high-resolution photos',
        'Online gallery',
        'Up to 2 locations',
        'Digital download',
        '10 printed photos (5x7)',
        'Pre-event consultation',
      ],
      is_popular: true,
    },
    {
      id: 'default-3',
      name: 'Premium Package',
      price: 2500,
      duration: 'Full day',
      features: [
        'Full day coverage (8+ hours)',
        '300+ edited high-resolution photos',
        'Premium online gallery',
        'Unlimited locations',
        'Digital download',
        '30 printed photos (various sizes)',
        'Photo album (20 pages)',
        'Pre & post-event consultation',
        'Second photographer available',
      ],
      is_popular: false,
    },
  ]

  const [packages, setPackages] = useState<PricingPackage[]>([])

  useEffect(() => {
    // Set page title
    document.title = 'Photography | Purpose Technology'

    const loadData = async () => {
      try {
        // Load hero slides
        const { data: slidesData } = await supabase
          .from('photography_hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        // Load categories with photos
        const { data: categoriesData } = await supabase
          .from('photography_categories')
          .select(`
            *,
            photography_photos:photography_photos(id, image_url, title, is_featured)
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        // Load packages
        const { data: packagesData } = await supabase
          .from('photography_packages')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        setHeroSlides(slidesData || [])

        // Process categories with featured photos
        const processedCategories = (categoriesData || []).map(cat => {
          const photos = (cat.photography_photos || []) as Photo[]
          return {
            ...cat,
            photos: photos.filter(p => p.is_featured).slice(0, 3)
          }
        })
        setCategories(processedCategories)

        // Use database packages if available, otherwise use defaults
        if (packagesData && packagesData.length > 0) {
          // Deduplicate packages by name
          const uniquePackages = packagesData.filter((pkg, index, self) =>
            index === self.findIndex((p) => p.name === pkg.name)
          )
          setPackages(uniquePackages)
        } else {
          setPackages(defaultPackages)
        }
      } catch (error) {
        console.error('Error loading photography data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % (heroSlides.length || 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + (heroSlides.length || 1)) % (heroSlides.length || 1))
  }

  if (loading) {
    return (
      <PageLoader 
        icon={<CameraIcon className="w-8 h-8" />}
        message="Developing Vision..."
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Slider Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.length > 0 ? (
            heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10" />
                <img
                  src={slide.image_url}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex items-center justify-center text-white">
          <div className="text-center px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in shadow-sm">
              {heroSlides[currentSlide]?.title || 'Purpose Photography'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
              {heroSlides[currentSlide]?.subtitle || 'Capturing life\'s precious moments with artistry and passion'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="#gallery"
                className="px-8 py-3 bg-[#1a72f0] hover:bg-black text-white rounded-full font-bold uppercase tracking-widest text-xs transition-all transform hover:scale-105"
              >
                View Gallery
              </Link>
              <Link
                href="#pricing"
                className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold uppercase tracking-widest text-xs transition-all transform hover:scale-105"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slide Indicators */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Photography Categories Gallery */}
      <section id="gallery" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Our Photography Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From intimate portraits to grand celebrations, we capture every moment with care and creativity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No photography categories available yet.</p>
                <p className="text-sm mt-2">Check back soon for updates.</p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => router.push(`/photography/${category.slug}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-500 transform hover:-translate-y-2 bg-white"
                >
                  <div className="relative h-96 overflow-hidden">
                    {category.cover_image_url ? (
                      <img
                        src={category.cover_image_url}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
                        <CameraIcon className="w-24 h-24 text-indigo-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a9ef5] mb-2 block">Premium Session</span>
                      <h3 className="text-3xl font-bold mb-3 tracking-tight">{category.name}</h3>
                      <p className="text-sm text-gray-300 mb-6 line-clamp-2 leading-relaxed">{category.description}</p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#5a9ef5]">
                          {category.photos?.length || 0} Featured Works
                        </span>
                        <div className="flex gap-4">
                          <Link
                            href={`/photography/${category.slug}`}
                            className="px-4 h-12 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Gallery
                          </Link>
                          <Link
                            href={`/photography/book?category=${encodeURIComponent(category.name)}`}
                            className="w-12 h-12 rounded-2xl bg-[#1a72f0]/90 hover:bg-[#1a72f0] flex items-center justify-center transition-all group-hover:scale-110"
                            onClick={(e) => e.stopPropagation()}
                          >
                             <CameraIcon className="w-6 h-6 text-white" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Simplified Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Standard Packages
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-[32px] p-10 transition-all duration-300 transform hover:-translate-y-2 ${pkg.is_popular
                  ? 'bg-white shadow-2xl scale-105 border-2 border-[#1a72f0]/10'
                  : 'bg-white shadow-xl'
                  }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-[#1a72f0] text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Standard Choice
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-widest">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      N${pkg.price}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    {pkg.duration}
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#1a72f0]/10 flex items-center justify-center mr-3 shrink-0">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#1a72f0]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/photography/book?package=${pkg.id}`}
                  className={`block w-full py-4 px-6 text-center rounded-[20px] font-bold text-xs uppercase tracking-[0.2em] transition-all transform hover:scale-105 ${pkg.is_popular
                    ? 'bg-[#1a72f0] text-white hover:bg-black'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                >
                  Initiate Booking
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
