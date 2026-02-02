'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

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
        // Don't show error toast, just use default data
        console.log('Using default packages')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
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
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              {heroSlides[currentSlide]?.title || 'Purpose Photography'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              {heroSlides[currentSlide]?.subtitle || 'Capturing life\'s precious moments with artistry and passion'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="#gallery"
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold transition-all transform hover:scale-105"
              >
                View Gallery
              </Link>
              <Link
                href="#pricing"
                className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-semibold transition-all transform hover:scale-105"
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Photography Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From intimate portraits to grand celebrations, we capture every moment with care and creativity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p className="text-lg">No photography categories available yet.</p>
                <p className="text-sm mt-2">Check back soon!</p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white"
                >
                  <div className="relative h-80 overflow-hidden">
                    {category.cover_image_url ? (
                      <img
                        src={category.cover_image_url}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
                        <svg className="w-24 h-24 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Category Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                      <p className="text-sm text-gray-200 mb-3">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          {category.photos?.length || 0} featured
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href={`/photography/${category.slug}`}
                            className="px-4 py-2 bg-white text-indigo-600 hover:bg-gray-100 rounded-full text-sm font-semibold transition-all transform group-hover:scale-105"
                          >
                            View Gallery
                          </Link>
                          <Link
                            href={`/photography/book?category=${encodeURIComponent(category.name)}`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-sm font-semibold transition-all transform group-hover:scale-105"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Featured Mini Gallery */}
                  {category.photos && category.photos.length > 0 && (
                    <div className="p-4 grid grid-cols-3 gap-2">
                      {category.photos.slice(0, 3).map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.image_url}
                          alt={photo.title || category.name}
                          className="w-full h-20 object-cover rounded-lg hover:opacity-75 transition-opacity cursor-pointer"
                        />
                      ))}
                      {/* Fill empty slots with placeholders */}
                      {[...Array(Math.max(0, 3 - category.photos.length))].map((_, idx) => (
                        <div key={`placeholder-${idx}`} className="w-full h-20 bg-gray-100 rounded-lg"></div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Photography Packages
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible packages designed to fit your needs and budget
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p className="text-lg">No pricing packages available yet.</p>
                <p className="text-sm mt-2">Contact us for custom pricing!</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 ${pkg.is_popular
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl scale-105'
                    : 'bg-white shadow-xl'
                    }`}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${pkg.is_popular ? 'text-white' : 'text-gray-900'}`}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={`text-5xl font-bold ${pkg.is_popular ? 'text-white' : 'text-indigo-600'}`}>
                        N${pkg.price}
                      </span>
                    </div>
                    <p className={`mt-2 ${pkg.is_popular ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {pkg.duration}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg
                          className={`w-6 h-6 mr-3 flex-shrink-0 ${pkg.is_popular ? 'text-yellow-400' : 'text-indigo-600'
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

                  <Link
                    href={`/photography/book?package=${pkg.id}`}
                    className={`block w-full py-3 px-6 text-center rounded-full font-semibold transition-all transform hover:scale-105 ${pkg.is_popular
                      ? 'bg-white text-indigo-600 hover:bg-gray-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                  >
                    Book Now
                  </Link>
                </div>
              ))
            )}
          </div>

          <p className="text-center text-gray-600 mt-12 text-sm">
            * Custom packages available. Contact us to discuss your specific needs.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Capture Your Special Moments?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's create beautiful memories together. Get in touch to discuss your photography needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </Link>
            <a
              href="tel:+264817854573"
              className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-semibold transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +264 81 785 4573
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
