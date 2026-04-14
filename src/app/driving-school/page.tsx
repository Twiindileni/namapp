'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { 
  IdentificationIcon, 
  MapIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface Package {
  id: string
  name: string
  description: string | null
  hours: number
  price_nad: number
  display_order: number
  is_active: boolean
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80'

export default function DrivingSchoolPage() {
  const { user } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    package_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    preferred_date: '',
    preferred_time: '',
    preferred_dates: '',
    message: '',
  })

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customer_name: user.user_metadata?.name ?? f.customer_name,
        customer_email: user.email ?? f.customer_email,
      }))
    }
  }, [user])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('driving_school_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (error) {
        console.error(error)
        toast.error('Failed to load packages')
        setLoading(false)
        return
      }
      setPackages((data ?? []) as Package[])
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.customer_email || !form.customer_phone) {
      toast.error('Please verify identity fields')
      return
    }
    setFormLoading(true)
    const { error } = await supabase.from('driving_school_bookings').insert({
      package_id: form.package_id || null,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time || null,
      preferred_dates: form.preferred_dates || null,
      message: form.message || null,
      user_id: user?.id ?? null,
    })
    setFormLoading(false)
    if (error) {
      console.error(error)
      toast.error('Transmission failed. Retry initialization.')
      return
    }
    toast.success('Inquiry synchronized! We will contact you shortly.')
    setForm({
      package_id: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      preferred_date: '',
      preferred_time: '',
      preferred_dates: '',
      message: '',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-16">
        
        {/* ═══════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════ */}
        <section className="relative h-[70vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={HERO_IMAGE}
              alt="Driving school"
              fill
              className="object-cover transition-transform duration-1000 scale-105"
              priority
              sizes="100vw"
            />
            {/* Cinematic tech overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#020b1a] via-[#020b1a]/70 to-transparent z-10" />
            <div className="absolute inset-0 bg-[#020b1a]/20 z-10 backdrop-blur-[1px]" />
            <div className="absolute inset-0 z-15 pointer-events-none opacity-20" 
                 style={{ backgroundImage: 'radial-gradient(#0055cc 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-[rgba(0,85,204,0.1)] border border-[rgba(0,85,204,0.25)] text-[#5a9ef5] text-xs font-semibold tracking-widest uppercase fade-in-up">
                <AcademicCapIcon className="w-3.5 h-3.5" />
                Digital Learning Portal
              </span>
              <h1 className="hero-title mb-6 fade-in-up fade-in-up-delay-1">
                Master the Road with<br />
                <span className="gradient-text">Precision Driving</span>
              </h1>
              <p className="text-xl mb-10 text-[#8baed4] leading-relaxed fade-in-up fade-in-up-delay-2">
                Professional instruction powered by digital progress tracking. Premium lessons at N$130/hour. Your journey to independence starts here.
              </p>
              <div className="flex flex-wrap gap-4 fade-in-up fade-in-up-delay-3">
                <a href="#packages" className="btn-primary">
                  <span>Explore Packages</span>
                </a>
                <a href="#book" className="btn-outline">
                  <span>Inquire Now</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            PACKAGES GRID
        ════════════════════════════════════════ */}
        <section id="packages" className="py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 fade-in-up">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Curriculum Modules</span>
              <h2 className="section-title mt-4">Professional <span className="gradient-text">Packages</span></h2>
              <p className="mt-4 text-[#8baed4] max-w-2xl mx-auto">
                Select a training configuration that fits your experience level. Each package includes real-time telemetry tracking.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                {packages.map((pkg, idx) => (
                  <div
                    key={pkg.id}
                    className="glass-card group flex flex-col p-8 transition-all duration-500 hover:scale-[1.02] fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-8">
                       <div className="w-12 h-12 rounded-2xl bg-[rgba(0,53,128,0.2)] flex items-center justify-center border border-[rgba(0,85,204,0.15)] group-hover:border-[#5a9ef5]/50 transition-colors">
                          <IdentificationIcon className="w-6 h-6 text-[#5a9ef5]" />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Module Code</p>
                          <p className="text-xs font-mono text-white/50">DS-{pkg.hours}H</p>
                       </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {pkg.name}
                    </h3>
                    
                    {pkg.description && (
                      <p className="text-sm text-[#8baed4] leading-relaxed mb-8 flex-grow">
                        {pkg.description}
                      </p>
                    )}

                    <div className="space-y-4 mb-10">
                       <div className="flex items-center gap-3 text-sm text-[#4a6a90]">
                          <ClockIcon className="w-4 h-4 text-[#5a9ef5]" />
                          <span>{pkg.hours} Hours Technical Training</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-[#4a6a90]">
                          <MapIcon className="w-4 h-4 text-[#5a9ef5]" />
                          <span>Road Safety & Signs included</span>
                       </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-[rgba(0,53,128,0.15)]">
                       <div className="flex items-baseline gap-1">
                          <span className="text-[10px] font-bold text-[#4a6a90] uppercase">N$</span>
                          <span className="text-3xl font-extrabold text-white">{Number(pkg.price_nad).toFixed(0)}</span>
                       </div>
                       <p className="text-[10px] text-[#4a6a90] mt-1 font-semibold uppercase tracking-wider">
                          N$ {(Number(pkg.price_nad) / pkg.hours).toFixed(0)} / Standard Hour
                       </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inquire Form Section */}
            <div id="book" className="max-w-4xl mx-auto glass-card p-8 md:p-12 relative overflow-hidden fade-in-up">
               {/* Decorative bloom */}
               <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 bg-[#0055cc] blur-[100px]" />
               
               <div className="relative z-10 grid lg:grid-cols-5 gap-12">
                  <div className="lg:col-span-2">
                     <span className="text-xs font-bold uppercase tracking-widest text-[#5a9ef5]">Session Initialization</span>
                     <h2 className="text-3xl font-bold text-white mt-4 mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Book or Inquire</h2>
                     <p className="text-[#8baed4] mb-8 leading-relaxed">
                        Configure your training session. Pick your preferred synchronization date and time.
                     </p>
                     
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 text-sm">
                           <div className="w-10 h-10 rounded-xl bg-[#003580]/30 border border-[#0055cc]/30 flex items-center justify-center">
                              <SparklesIcon className="w-5 h-5 text-[#5a9ef5]" />
                           </div>
                           <div className="text-[#8baed4]">Certified Instructors</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                           <div className="w-10 h-10 rounded-xl bg-[#003580]/30 border border-[#0055cc]/30 flex items-center justify-center">
                              <MapIcon className="w-5 h-5 text-[#5a9ef5]" />
                           </div>
                           <div className="text-[#8baed4]">Multiple Route Options</div>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Module Selection</label>
                             <select
                                value={form.package_id}
                                onChange={(e) => setForm((f) => ({ ...f, package_id: e.target.value }))}
                                className="w-full"
                             >
                                <option value="">Custom Inquery</option>
                                {packages.map((p) => (
                                   <option key={p.id} value={p.id}>
                                      {p.name} (N$ {Number(p.price_nad).toFixed(0)})
                                   </option>
                                ))}
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Full Designation</label>
                             <input
                                value={form.customer_name}
                                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                                required
                                placeholder="John Doe"
                                className="w-full"
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">E-Mail Address</label>
                             <input
                                type="email"
                                value={form.customer_email}
                                onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                                required
                                placeholder="contact@domain.com"
                                className="w-full"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Terminal (Phone)</label>
                             <input
                                type="tel"
                                value={form.customer_phone}
                                onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                                required
                                placeholder="+264 81..."
                                className="w-full"
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Target Date</label>
                             <input
                                type="date"
                                value={form.preferred_date}
                                onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                                min={new Date().toISOString().slice(0, 10)}
                                className="w-full"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Target Time</label>
                             <input
                                type="time"
                                value={form.preferred_time}
                                onChange={(e) => setForm((f) => ({ ...f, preferred_time: e.target.value }))}
                                className="w-full"
                             />
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Technical Notes / Requests</label>
                          <textarea
                             value={form.message}
                             onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                             rows={3}
                             placeholder="Special requirements or theme preferences..."
                             className="w-full"
                          />
                       </div>

                       <button
                          type="submit"
                          disabled={formLoading}
                          className="btn-primary w-full justify-center group"
                       >
                          <span>{formLoading ? 'Synchronizing...' : 'Initialize Session'}</span>
                          <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                       </button>
                    </form>
                  </div>
               </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
