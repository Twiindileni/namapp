'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageLoader from '@/components/ui/PageLoader'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  CameraIcon, 
  SparklesIcon, 
  CheckIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  RectangleGroupIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline'

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

  const defaultPackages: PricingPackage[] = [
    {
      id: 'default-1',
      name: 'Essential Spark',
      price: 500,
      duration: '2 hours',
      features: [
        '2 hours of high-precision photography',
        '50 meticulously edited high-res photos',
        'Secure individual online gallery',
        '1 primary location',
        'Direct cloud delivery',
      ],
      is_popular: false,
    },
    {
      id: 'default-2',
      name: 'Dynamic Story',
      price: 1200,
      duration: '4 hours',
      features: [
        '4 hours of professional coverage',
        '150 artistic high-res digital assets',
        'Premium password-protected gallery',
        'Up to 2 cinematic locations',
        'Instant digital download link',
        '10 metallic print photos (5x7)',
        'Personal pre-event creative consult',
      ],
      is_popular: true,
    },
    {
      id: 'default-3',
      name: 'Ultimate Vision',
      price: 2500,
      duration: 'Full day',
      features: [
        'Full day elite coverage (8+ hours)',
        '300+ signature edited photos',
        'Elite custom online portfolio',
        'Unlimited location access',
        'Secure 4K cloud delivery',
        '30 mixed size premium prints',
        'Handcrafted 20-page photo book',
        'Comprehensive creative consults',
        'Second professional photographer',
      ],
      is_popular: false,
    },
  ]

  const [packages, setPackages] = useState<PricingPackage[]>([])

  useEffect(() => {
    document.title = 'Photography — Passion Captured | Purpose'

    const loadData = async () => {
      try {
        const { data: slidesData } = await supabase
          .from('photography_hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        const { data: categoriesData } = await supabase
          .from('photography_categories')
          .select(`
            *,
            photography_photos:photography_photos(id, image_url, title, is_featured)
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        const { data: packagesData } = await supabase
          .from('photography_packages')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        setHeroSlides(slidesData || [])

        const processedCategories = (categoriesData || []).map(cat => {
          const photos = (cat.photography_photos || []) as Photo[]
          return {
            ...cat,
            photos: photos.filter(p => p.is_featured).slice(0, 3)
          }
        })
        setCategories(processedCategories)

        if (packagesData && packagesData.length > 0) {
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

  useEffect(() => {
    if (heroSlides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
      }, 6000)
      return () => clearInterval(timer)
    }
  }, [heroSlides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % (heroSlides.length || 1))
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + (heroSlides.length || 1)) % (heroSlides.length || 1))

  if (loading) {
    return (
      <PageLoader 
        icon={<CameraIcon className="w-8 h-8" />}
        message="Initializing Vision..."
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-16">
        
        {/* ═══════════════════════════════════════
            HERO SLIDER
        ════════════════════════════════════════ */}
        <section className="relative h-[85vh] overflow-hidden">
          <div className="absolute inset-0">
            {heroSlides.length > 0 ? (
              heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#020b1a] via-[#020b1a]/70 to-transparent z-10" />
                  <div className="absolute inset-0 bg-[#020b1a]/20 z-10 backdrop-grayscale-[0.2]" />
                  <img
                    src={slide.image_url}
                    alt={slide.title || `Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="absolute inset-0 animate-gradient-flow-2 opacity-30"></div>
            )}
          </div>

          {/* Grid Overlay for Tech feel */}
          <div className="absolute inset-0 z-15 pointer-events-none opacity-20" 
               style={{ backgroundImage: 'radial-gradient(#0055cc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

          {/* Hero Content */}
          <div className="relative z-20 h-full flex items-center px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-[rgba(0,85,204,0.1)] border border-[rgba(0,85,204,0.25)] text-[#5a9ef5] text-xs font-semibold tracking-widest uppercase fade-in-up">
                <SparklesIcon className="w-3.5 h-3.5" />
                Visual Artistry
              </span>
              
              <h1 className="hero-title mb-6 leading-tight fade-in-up fade-in-up-delay-1">
                {heroSlides[currentSlide]?.title || 'Capturing the'}<br />
                <span className="gradient-text">Infinite Essence</span>
              </h1>
              
              <p className="text-xl mb-10 max-w-xl leading-relaxed text-[#8baed4] fade-in-up fade-in-up-delay-2">
                {heroSlides[currentSlide]?.subtitle || "We don't just take photographs; we engineer visual memories that resonate with emotion and timeless precision."}
              </p>
              
              <div className="flex flex-wrap gap-4 fade-in-up fade-in-up-delay-3">
                <Link href="#gallery" className="btn-primary">
                  <RectangleGroupIcon className="w-5 h-5" />
                  <span>Explore Portfolios</span>
                </Link>
                <Link href="#pricing" className="btn-outline">
                  <span>View Packages</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Slider Controls */}
          {heroSlides.length > 1 && (
            <>
              <div className="absolute bottom-12 right-12 z-30 flex items-center gap-6">
                <div className="flex items-baseline gap-2 font-mono text-sm text-[#4a6a90]">
                  <span className="text-[#e8f0ff] font-bold text-lg">{(currentSlide + 1).toString().padStart(2, '0')}</span>
                  <span>/</span>
                  <span>{heroSlides.length.toString().padStart(2, '0')}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={prevSlide}
                    className="p-3 glass-effect rounded-xl hover:bg-[rgba(0,53,128,0.3)] text-white transition-all"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-3 glass-effect rounded-xl hover:bg-[rgba(0,53,128,0.3)] text-white transition-all"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-[#1a72f0]/30 w-full z-30">
                <div 
                  className="h-full bg-[#1a72f0] transition-all duration-300 ease-linear shadow-[0_0_10px_#1a72f0]"
                  style={{ width: `${((currentSlide + 1) / heroSlides.length) * 100}%` }}
                />
              </div>
            </>
          )}
        </section>

        {/* ═══════════════════════════════════════
            GALLERY CATEGORIES
        ════════════════════════════════════════ */}
        <section id="gallery" className="py-32 px-4 sm:px-6 lg:px-8 bg-[rgba(2,11,26,0.3)]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Curated Portfolios
                </span>
                <h2 className="section-title mt-4">Discover Our Specialized <span className="gradient-text">Mastery</span></h2>
                <p className="mt-6 text-lg text-[#8baed4]">
                  From deep emotional portraits to architectural technicality, explore our diverse photography divisions.
                </p>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <span className="text-sm font-semibold text-[#5a9ef5]">Explore All Collections</span>
                <ChevronRightIcon className="w-4 h-4 text-[#5a9ef5] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {categories.length === 0 ? (
                /* No categories fallback */
                [1,2,3].map(i => (
                  <div key={i} className="glass-card h-96 animate-pulse opacity-50"></div>
                ))
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="glass-card group flex flex-col overflow-hidden"
                  >
                    {/* Cover Image */}
                    <div className="relative h-[280px] overflow-hidden">
                      {category.cover_image_url ? (
                        <img
                          src={category.cover_image_url}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#0d2040] flex items-center justify-center">
                          <PhotoIcon className="w-16 h-16 text-[#003580]" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020b1a] via-[#020b1a]/20 to-transparent" />
                      
                      {/* Floating Category Label */}
                      <div className="absolute top-4 left-4">
                        <span className="badge-blue backdrop-blur-md">
                          <PhotoIcon className="w-3.5 h-3.5 mr-1" />
                          {category.photos?.length || 0} Assets
                        </span>
                      </div>

                      {/* Title & Desc on Image */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white group-hover:text-[#5a9ef5] transition-colors"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {category.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                      <p className="text-sm leading-relaxed text-[#8baed4] mb-8 line-clamp-2">
                        {category.description}
                      </p>

                      {/* Mini Preview Gallery */}
                      {category.photos && category.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-8">
                          {category.photos.map((photo) => (
                            <div key={photo.id} className="h-16 rounded-lg overflow-hidden border border-[rgba(0,85,204,0.15)] hover:border-[#0055cc] transition-colors">
                              <img
                                src={photo.image_url}
                                alt={photo.title || category.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <Link
                          href={`/photography/${category.slug}`}
                          className="btn-outline !py-2 !px-0 flex justify-center text-xs"
                        >
                          View Gallery
                        </Link>
                        <Link
                          href={`/photography/book?category=${encodeURIComponent(category.name)}`}
                          className="btn-primary !py-2 !px-0 flex justify-center text-xs"
                        >
                          <HandRaisedIcon className="w-4 h-4 mr-1" />
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            PRICING PACKAGES
        ════════════════════════════════════════ */}
        <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">
                Investment Plans
              </span>
              <h2 className="section-title mt-4">Precision <span className="gradient-text">Pricing</span></h2>
              <p className="mt-4 text-[#8baed4] max-w-xl mx-auto">
                Select a configuration that fits your project scope. All packages include premium digital delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`glass-card relative p-10 flex flex-col transition-all duration-500 ${
                    pkg.is_popular ? 'glow-blue-md !border-[#0055cc]/50 scale-[1.02] z-10' : ''
                  }`}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#003580] to-[#1a72f0] rounded-full text-[10px] uppercase font-bold tracking-widest text-white shadow-lg">
                      Recommended Profile
                    </div>
                  )}

                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-sm text-[#4a6a90]">N$</span>
                      <span className="text-5xl font-extrabold text-[#e8f0ff]">{pkg.price}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="w-2 h-2 rounded-full bg-[#5a9ef5]"></span>
                       <span className="text-xs font-semibold text-[#8baed4] uppercase tracking-wider">{pkg.duration} Session</span>
                    </div>
                  </div>

                  <div className="section-divider mb-8 opacity-20" />

                  <ul className="space-y-4 mb-12 flex-grow">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-4 h-4 rounded-full bg-[rgba(0,85,204,0.15)] flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-2.5 h-2.5 text-[#5a9ef5]" />
                        </div>
                        <span className="text-sm text-[#8baed4] leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/photography/book?package=${pkg.id}`}
                    className={pkg.is_popular ? 'btn-primary w-full justify-center py-4' : 'btn-outline w-full justify-center py-4'}
                  >
                    Initialize Booking
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            CTA
        ════════════════════════════════════════ */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 border-t border-[rgba(0,53,128,0.15)]">
          <div className="max-w-5xl mx-auto glass-card overflow-hidden p-12 lg:p-20 relative text-center">
             {/* Decorative circles */}
             <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 bg-[#0055cc] blur-[80px]" />
             <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-10 bg-[#1a72f0] blur-[80px]" />

             <div className="relative z-10">
                <h2 className="hero-title !text-4xl md:!text-5xl mb-8">Ready to <span className="gradient-text">Immortalize</span> Your Moment?</h2>
                <p className="text-lg text-[#8baed4] mb-12 max-w-2xl mx-auto">
                   Connect with our creative engineering team to discuss your visual requirements and custom configurations.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                   <Link href="/contact" className="btn-primary px-10">
                      <EnvelopeIcon className="w-5 h-5" />
                      <span>Request Consultation</span>
                   </Link>
                   <a href="tel:+264817854573" className="flex items-center gap-3 group">
                      <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center group-hover:border-[#5a9ef5]/40 transition-all">
                        <PhoneIcon className="w-5 h-5 text-[#5a9ef5]" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase tracking-widest text-[#4a6a90]">Call Direct</p>
                        <p className="text-sm font-bold text-white group-hover:text-[#5a9ef5] transition-colors">+264 81 785 4573</p>
                      </div>
                   </a>
                </div>
             </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
