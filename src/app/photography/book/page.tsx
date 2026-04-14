'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  CalendarDaysIcon, 
  UserCircleIcon, 
  PhotoIcon,
  CheckBadgeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Package {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  is_popular: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

function BookPhotoshootContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const packageParam = searchParams.get('package')

  const [packages, setPackages] = useState<Package[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_type: categoryParam || '',
    event_date: '',
    event_location: '',
    package_id: packageParam || '',
    guest_count: '',
    special_requests: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: packagesData } = await supabase
          .from('photography_packages')
          .select('*')
          .eq('is_active', true)
          .order('display_order')

        if (packagesData) setPackages(packagesData)

        const { data: categoriesData } = await supabase
          .from('photography_categories')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('display_order')

        if (categoriesData) setCategories(categoriesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let preferredPackageName = ''
      if (formData.package_id) {
        const selectedPackage = packages.find(p => p.id === formData.package_id)
        if (selectedPackage) {
          preferredPackageName = selectedPackage.name
        }
      }

      const bookingData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        event_type: formData.event_type,
        event_date: formData.event_date,
        event_location: formData.event_location || null,
        package_id: formData.package_id || null,
        preferred_package_name: preferredPackageName || null,
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
        special_requests: formData.special_requests || null,
        status: 'pending'
      }

      const { error } = await supabase
        .from('photography_bookings')
        .insert([bookingData])

      if (error) throw error

      toast.success('Strategy configured! Our vision team will contact you shortly.')

      setTimeout(() => {
        router.push('/categories?booking=success')
      }, 2000)
    } catch (error) {
      console.error('Error submitting booking:', error)
      toast.error('Initialization failed. Please verify your data.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b1a]">
        <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-medium text-[#5a9ef5] hover:text-white transition-colors mb-8 group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Return to Photography
          </Link>

          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Session Initiation</span>
            <h1 className="hero-title !text-4xl md:!text-5xl mt-4 mb-4">Book Your <span className="gradient-text">Production</span></h1>
            <p className="text-lg text-[#8baed4] leading-relaxed max-w-2xl">
              Complete the configuration below to initialize your photoshoot. Our creative engineers will synchronize with your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="glass-card p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-10">
                  
                  {/* Part 1: Identity */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                       <UserCircleIcon className="w-5 h-5 text-[#5a9ef5]" />
                       <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Client Identity</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">Full Designation</label>
                        <input
                          type="text"
                          required
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          className="w-full"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">E-Mail Address</label>
                        <input
                          type="email"
                          required
                          value={formData.customer_email}
                          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                          className="w-full"
                          placeholder="e.g. contact@domain.com"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">Contact Terminal (Phone)</label>
                        <input
                          type="tel"
                          required
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          className="w-full"
                          placeholder="+264 81 000 0000"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Part 2: Mission Details */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                       <PhotoIcon className="w-5 h-5 text-[#5a9ef5]" />
                       <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Mission Parameters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">Service Category</label>
                        <select
                          required
                          value={formData.event_type}
                          onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                          className="w-full"
                        >
                          <option value="">Select category...</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                          <option value="Custom Vision">Custom Vision</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">Execution Date</label>
                        <input
                          type="date"
                          required
                          value={formData.event_date}
                          onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">Target Location</label>
                        <input
                          type="text"
                          value={formData.event_location}
                          onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                          className="w-full"
                          placeholder="e.g. Windhoek Waterfront"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1">Subject Count (Approx)</label>
                        <input
                          type="number"
                          value={formData.guest_count}
                          onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                          className="w-full"
                          placeholder="1-100"
                          min="1"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Part 3: Configuration Selection */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                       <SparklesIcon className="w-5 h-5 text-[#5a9ef5]" />
                       <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Module Selection</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          onClick={() => setFormData({ ...formData, package_id: pkg.id })}
                          className={`relative cursor-pointer glass-card !p-5 transition-all group ${
                            formData.package_id === pkg.id
                              ? 'glow-blue-sm !border-[#1a72f0]/50 bg-[#003580]/10'
                              : 'hover:border-[rgba(0,85,204,0.3)]'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-bold text-white group-hover:text-[#5a9ef5] transition-colors">{pkg.name}</h3>
                               <p className="text-[10px] text-[#4a6a90] mt-1 uppercase tracking-widest font-bold">{pkg.duration}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[#5a9ef5] font-extrabold">N${pkg.price}</p>
                            </div>
                          </div>
                          {formData.package_id === pkg.id && (
                             <div className="absolute -top-2 -right-2">
                                <CheckBadgeIcon className="w-6 h-6 text-[#1a72f0]" />
                             </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Part 4: Special Comms */}
                  <section>
                    <label className="text-xs font-bold text-[#4a6a90] uppercase tracking-widest ml-1 block mb-2">Technical Notes / Special Requests</label>
                    <textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      rows={4}
                      className="w-full"
                      placeholder="Describe your creative vision or list specific technical requirements..."
                    />
                  </section>

                  {/* Submission Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="btn-outline flex-1 justify-center"
                    >
                      Abort Session
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary flex-1 justify-center"
                    >
                      {submitting ? 'Initializing...' : 'Confirm Session Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="lg:col-span-1 space-y-6">
               <div className="glass-card p-6">
                  <h3 className="text-white font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Process Synchronization</h3>
                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(0,85,204,0.1)] flex items-center justify-center flex-shrink-0 text-[#5a9ef5] font-bold text-xs border border-[rgba(0,85,204,0.2)]">01</div>
                        <div>
                           <p className="text-sm font-bold text-white">Transmission</p>
                           <p className="text-xs text-[#4a6a90] mt-1">Submit your parameters to our creative core.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(0,85,204,0.1)] flex items-center justify-center flex-shrink-0 text-[#5a9ef5] font-bold text-xs border border-[rgba(0,85,204,0.2)]">02</div>
                        <div>
                           <p className="text-sm font-bold text-white">Handshake</p>
                           <p className="text-xs text-[#4a6a90] mt-1">Our vision lead will contact you within 24 standard hours.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(0,85,204,0.1)] flex items-center justify-center flex-shrink-0 text-[#5a9ef5] font-bold text-xs border border-[rgba(0,85,204,0.2)]">03</div>
                        <div>
                           <p className="text-sm font-bold text-white">Execution</p>
                           <p className="text-xs text-[#4a6a90] mt-1">On-site high-resolution session performance.</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="glass-card p-6 border-[#5a9ef5]/20 bg-[#1a72f0]/5">
                  <h3 className="text-white font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Secure Verification</h3>
                  <p className="text-xs text-[#8baed4] leading-relaxed">
                     All booking meta-data is encrypted and verified by our synchronization team. No immediate payment is required for initialization.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function BookPhotoshootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#020b1a]">
        <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin"></div>
      </div>
    }>
      <BookPhotoshootContent />
    </Suspense>
  )
}
